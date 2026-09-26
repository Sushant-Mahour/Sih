/**
 * Tactical Real-Time Event Bus & Broadcast Sync
 * Guarantees instantaneous, zero-latency synchronization across tabs and between
 * Driver and Commandant panels even when running locally on localhost.
 */

import { playNotificationSound, speakAnnouncement } from './soundService';
import { useNotificationStore } from '../features/useNotificationStore';

const CHANNEL_NAME = 'ner_tactical_telemetry_bus';
let broadcastChannel = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn('[TacticalSync] BroadcastChannel not supported in this environment', e);
}

const listeners = new Set();

export function emitTacticalEvent(eventType, payload) {
  const event = {
    type: eventType,
    payload,
    timestamp: Date.now()
  };

  // 1. Dispatch locally in current window
  window.dispatchEvent(new CustomEvent('ner_tactical_event', { detail: event }));

  // 2. Broadcast across tabs via BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event);
    } catch (err) {
      console.warn('[TacticalSync] Broadcast postMessage error:', err);
    }
  }

  // 3. Fallback sync via localStorage storage event
  try {
    localStorage.setItem('ner_last_event', JSON.stringify(event));
  } catch (err) {
    // Ignore storage quota errors
  }
}

export function subscribeTacticalEvents(callback) {
  listeners.add(callback);

  const handleCustomEvent = (e) => {
    if (e.detail) callback(e.detail);
  };

  const handleBroadcastMessage = (e) => {
    if (e.data) callback(e.data);
  };

  const handleStorageEvent = (e) => {
    if (e.key === 'ner_last_event' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        callback(parsed);
      } catch (err) {}
    }
  };

  window.addEventListener('ner_tactical_event', handleCustomEvent);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    listeners.delete(callback);
    window.removeEventListener('ner_tactical_event', handleCustomEvent);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
    window.removeEventListener('storage', handleStorageEvent);
  };
}

/**
 * Initialize global live listeners for audio alerts & query cache invalidation
 */
export function initGlobalTacticalSync(queryClient) {
  return subscribeTacticalEvents((event) => {
    const { type, payload } = event;

    if (type === 'incident:new' || type === 'driver_report_submitted') {
      // Play loud audible alert chime on laptop speaker
      playNotificationSound('incident_report');
      if (payload?.reporterName) {
        speakAnnouncement(`New incident report from ${payload.reporterName}`);
      }
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      if (payload) {
        useNotificationStore.getState().addNotification({
          type: 'incident_pending',
          title: `Field Incident: ${payload.title || 'Hazard Reported'}`,
          message: payload.description || `Reported in ${payload.districtName || 'NER Sector'}`,
          hasVoiceNote: Boolean(payload.audioDataUrl || payload.hasAudio),
          audioDataUrl: payload.audioDataUrl || null,
          audioDuration: payload.audioDurationSec ? `0:${payload.audioDurationSec < 10 ? '0' : ''}${payload.audioDurationSec}` : '0:20',
          incidentId: payload.clientUuid || payload._id,
          targetPath: `/incidents/${payload.clientUuid || payload._id || ''}`,
          severity: payload.severity || 3
        });
      }
    } else if (type === 'alert:broadcast' || type === 'critical_alert') {
      playNotificationSound('critical_alert');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      if (payload) {
        useNotificationStore.getState().addNotification({
          type: 'alert_critical',
          title: payload.title || 'CRITICAL ADVISORY',
          message: payload.message || 'Severe weather or corridor blockage reported.',
          severity: payload.severity === 'critical' ? 5 : 4,
          targetPath: '/alerts'
        });
      }
    } else if (type === 'vehicle:update') {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      if (payload?.vehicleId) {
        queryClient.invalidateQueries({ queryKey: ['vehicle', payload.vehicleId] });
      }
    } else if (type === 'road:update') {
      queryClient.invalidateQueries({ queryKey: ['roads'] });
    } else if (type === 'district:update') {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
    } else if (type === 'shipment:update') {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    } else if (type === 'crud:sync') {
      // Invalidate all main data tables
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['roads'] });
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });
}

export default {
  emitTacticalEvent,
  subscribeTacticalEvents,
  initGlobalTacticalSync
};
