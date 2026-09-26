const Alert = require('../models/Alert');
const { dispatchNotification } = require('../services/notification.service');
const { broadcastAlert: broadcastAlertSocket } = require('../sockets/liveTracking.socket');

// GET /api/v1/alerts
async function getAlerts(req, res, next) {
  try {
    const { severity, isActive, limit = 50 } = req.query;
    const query = {};

    if (severity && severity !== 'all') query.severity = severity;
    if (isActive !== undefined && isActive !== 'all') query.isActive = isActive === 'true';

    const alerts = await Alert.find(query).limit(Number(limit)).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/alerts/:id
async function getAlertById(req, res, next) {
  try {
    const alert = await Alert.findOne({
      $or: [{ alertId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }]
    });

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found.' });
    }

    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/alerts/broadcast
async function broadcastAlert(req, res, next) {
  try {
    const {
      title,
      message,
      severity = 'warning',
      scope = 'district',
      affectedDistricts = [],
      affectedCorridors = [],
      channels = ['in_app', 'sms', 'push'],
      targetLanguages = ['as', 'bn', 'hi']
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Alert title and message are required.' });
    }

    const alertId = `ALT-${Date.now().toString().slice(-6)}`;

    const alert = await Alert.create({
      alertId,
      severity,
      scope,
      title,
      message,
      affectedDistricts,
      affectedCorridors,
      channels,
      broadcastBy: req.user?.name || 'NER Disaster Operations Command',
      isActive: true
    });

    // Trigger multi-channel dispatch
    const dispatchReport = await dispatchNotification({
      alertId,
      severity,
      title,
      message,
      affectedDistricts,
      channels
    });

    // Emit live WebSocket event
    broadcastAlertSocket(alert);

    res.status(201).json({
      success: true,
      message: 'Alert broadcast dispatched across tactical network.',
      data: alert,
      dispatchReport
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/alerts/:id/status
async function updateAlertStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    const alert = await Alert.findOneAndUpdate(
      { $or: [{ alertId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }] },
      { $set: { isActive: Boolean(isActive) } },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Alert status updated.',
      data: alert
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAlerts,
  getAlertById,
  broadcastAlert,
  updateAlertStatus
};
