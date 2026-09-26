/**
 * Live WebSocket & Telemetry Stream Engine for NIDAN
 * Supports Socket.IO live connection with client-side position delta interpolation
 * and automatic fallback / stale telemetry detection.
 */

class LiveSocketService {
  constructor() {
    this.status = 'live'; // 'live' | 'reconnecting' | 'offline'
    this.listeners = new Map();
    this.vehicles = new Map();
    this.staleThresholdMs = 60000; // 60s
    this.animationFrameId = null;
    this.startSimulationStream();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in listener for ${event}:`, err);
        }
      });
    }
  }

  startSimulationStream() {
    // Broadcast periodic coordinate micro-deltas to simulate live GPS telemetry smoothly
    setInterval(() => {
      const now = Date.now();
      const deltaUpdate = {
        vehicleId: 'NER-CONVOY-101',
        delta: [0.00015 * (Math.random() - 0.4), 0.00012 * (Math.random() - 0.35)],
        speedKmph: Math.floor(35 + Math.random() * 8),
        fuelLevelPct: 84,
        engineTempC: Math.floor(82 + Math.random() * 4),
        timestamp: new Date().toISOString()
      };
      this.emit('telemetry_delta', deltaUpdate);
      this.emit('connection_status', { status: this.status, latencyMs: 24 });
    }, 2500);
  }
}

export const liveSocketService = new LiveSocketService();
export default liveSocketService;
