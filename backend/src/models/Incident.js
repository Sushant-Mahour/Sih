const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  clientUuid: { type: String, required: true, unique: true, index: true },
  incidentType: { 
    type: String, 
    enum: ['landslide', 'road_blockage', 'flood', 'bridge_damage', 'vehicle_breakdown', 'civil_unrest', 'severe_weather'],
    required: true 
  },
  severity: { type: Number, required: true, min: 1, max: 5 }, // 1 (Minor) to 5 (Critical Emergency)
  title: { type: String, required: true },
  description: { type: String, required: true },
  districtId: { type: String, required: true },
  districtName: { type: String, required: true },
  roadSegmentId: { type: String, default: null },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },
  status: { 
    type: String, 
    enum: ['reported', 'pending_verification', 'verified', 'rejected', 'need_info', 'crew_dispatched', 'resolved', 'escalated_to_emergency'],
    default: 'reported'
  },
  photoUrl: { type: String, default: null },
  photoBase64: { type: String, default: null },
  audioDataUrl: { type: String, default: null },
  audioDurationSec: { type: Number, default: 0 },
  rejectionReason: { type: String, default: '' },
  clarificationQuery: { type: String, default: '' },
  reporterRole: { type: String, default: 'field_agent' },
  reporterName: { type: String, default: 'Field Agent' },
  reporterPhone: { type: String, default: '' },
  capturedAt: { type: Date, default: Date.now },
  receivedAt: { type: Date, default: Date.now },
  originalLanguage: { type: String, default: 'en' },
  translations: {
    type: Map,
    of: String,
    default: {}
  },
  aiClassification: {
    incidentType: { type: String, default: '' },
    severity: { type: Number, default: 3 },
    confidence: { type: Number, default: 0.9 },
    shortDescription: { type: String, default: '' }
  },
  resolutionNotes: { type: String, default: '' },
  resolvedAt: { type: Date, default: null },
  isOfflineSynced: { type: Boolean, default: false }
}, {
  timestamps: true
});

IncidentSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Incident', IncidentSchema);
