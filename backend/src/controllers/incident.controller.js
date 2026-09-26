const Incident = require('../models/Incident');
const RoadSegment = require('../models/RoadSegment');
const { classifyIncidentPhoto, translateAndSummarize } = require('../services/gemini.service');
const { broadcastIncidentCreated, broadcastIncidentStatus } = require('../sockets/liveTracking.socket');

// POST /api/v1/incidents (Idempotent upsert by clientUuid)
async function submitIncident(req, res, next) {
  try {
    const {
      clientUuid,
      incidentType = 'landslide',
      severity = 3,
      title,
      description,
      districtId,
      districtName,
      roadSegmentId,
      coordinates,
      photoBase64,
      photoUrl,
      audioDataUrl,
      audioDurationSec,
      capturedAt,
      originalLanguage = 'en'
    } = req.body;

    const uuid = clientUuid || `INC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // If photo is provided, trigger Gemini multimodal inspection
    let aiClassification = {
      incidentType,
      severity: Number(severity),
      confidence: 0.9,
      shortDescription: 'Field report verified.'
    };

    if (photoBase64) {
      try {
        const aiResult = await classifyIncidentPhoto(photoBase64);
        if (aiResult) {
          aiClassification = aiResult;
        }
      } catch (err) {
        console.warn('[Incident Controller] AI photo classification failed:', err.message);
      }
    }

    const payload = {
      clientUuid: uuid,
      incidentType: aiClassification.incidentType || incidentType,
      severity: aiClassification.severity || Number(severity),
      title: title || `${(aiClassification.incidentType || incidentType).replace('_', ' ').toUpperCase()} reported in ${districtName || 'NER sector'}`,
      description: description || 'Field agent hazard report submitted from mobile unit.',
      districtId: districtId || 'AS-KAM',
      districtName: districtName || 'Kamrup Metropolitan',
      roadSegmentId: roadSegmentId || null,
      location: {
        type: 'Point',
        coordinates: coordinates && coordinates.length === 2 ? coordinates : [91.8933, 25.5788]
      },
      photoBase64: photoBase64 || null,
      photoUrl: photoUrl || null,
      audioDataUrl: audioDataUrl || null,
      audioDurationSec: audioDurationSec ? Number(audioDurationSec) : 0,
      reporterRole: req.user?.role || 'field_agent',
      reporterName: req.user?.name || 'Field Agent Mobile Unit',
      reporterPhone: req.user?.phone || '+91 94350 00000',
      capturedAt: capturedAt ? new Date(capturedAt) : new Date(),
      receivedAt: new Date(),
      originalLanguage,
      aiClassification,
      status: 'pending_verification'
    };

    // If high severity, update road segment status to blocked/degraded
    if (roadSegmentId && (Number(severity) >= 4 || aiClassification.severity >= 4)) {
      await RoadSegment.findOneAndUpdate(
        { segmentId: roadSegmentId },
        { $set: { isBlocked: true, currentRiskScore: 92, riskBand: 'high' } }
      );
    }

    // Idempotent upsert on clientUuid
    const incident = await Incident.findOneAndUpdate(
      { clientUuid: uuid },
      { $set: payload },
      { upsert: true, new: true }
    );

    // Emit live WebSocket notification across command network
    broadcastIncidentCreated(incident);

    res.status(201).json({
      success: true,
      message: 'Incident recorded successfully with AI severity analysis.',
      data: incident
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/incidents
async function getIncidents(req, res, next) {
  try {
    const { status, severity, districtId, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (severity && severity !== 'all') query.severity = Number(severity);
    if (districtId && districtId !== 'all') query.districtId = districtId;

    const incidents = await Incident.find(query).limit(Number(limit)).sort({ capturedAt: -1 });

    res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/incidents/:id
async function getIncidentById(req, res, next) {
  try {
    const incident = await Incident.findOne({
      $or: [{ clientUuid: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }]
    });

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident report not found.' });
    }

    res.status(200).json({
      success: true,
      data: incident
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/incidents/:id/status
async function updateIncidentStatus(req, res, next) {
  try {
    const { status, resolutionNotes, rejectionReason, clarificationQuery } = req.body;

    const updateFields = { status };
    if (rejectionReason) updateFields.rejectionReason = rejectionReason;
    if (clarificationQuery) updateFields.clarificationQuery = clarificationQuery;

    if (status === 'resolved') {
      updateFields.resolvedAt = new Date();
      updateFields.resolutionNotes = resolutionNotes || 'Road cleared by Border Roads Organisation engineering team.';
    }

    const incident = await Incident.findOneAndUpdate(
      { $or: [{ clientUuid: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }] },
      { $set: updateFields },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found.' });
    }

    // If resolved and road segment was blocked, clear blockage
    if (status === 'resolved' && incident.roadSegmentId) {
      await RoadSegment.findOneAndUpdate(
        { segmentId: incident.roadSegmentId },
        { $set: { isBlocked: false, isDegraded: false, currentRiskScore: 35, riskBand: 'safe' } }
      );
    } else if (status === 'verified' && incident.roadSegmentId && incident.severity >= 3) {
      await RoadSegment.findOneAndUpdate(
        { segmentId: incident.roadSegmentId },
        { $set: { isBlocked: incident.severity >= 4, currentRiskScore: 90, riskBand: 'high' } }
      );
    }

    // Broadcast status change event via WebSocket to driver and command sessions
    broadcastIncidentStatus(incident);

    res.status(200).json({
      success: true,
      message: `Incident status updated to '${status}'.`,
      data: incident
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/incidents/:id/translate
async function translateIncident(req, res, next) {
  try {
    const { targetLang = 'hi' } = req.body;

    const incident = await Incident.findOne({
      $or: [{ clientUuid: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }]
    });

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found.' });
    }

    if (incident.translations && incident.translations.get(targetLang)) {
      return res.status(200).json({
        success: true,
        targetLang,
        translatedText: incident.translations.get(targetLang),
        isCached: true
      });
    }

    const textToTranslate = `${incident.title}. ${incident.description}`;
    const translatedText = await translateAndSummarize(textToTranslate, targetLang);

    if (!incident.translations) incident.translations = new Map();
    incident.translations.set(targetLang, translatedText);
    await incident.save();

    res.status(200).json({
      success: true,
      targetLang,
      translatedText,
      isCached: false
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  submitIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  translateIncident
};
