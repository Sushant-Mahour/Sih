import { create } from 'zustand';
import { playNotificationSound, speakAnnouncement } from '../services/soundService';
import { showToast } from '../components/ui/Toast';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'incident_pending',
    title: 'New Incident: Mudslide on NH-6 Sonapur Sector',
    message: 'Field Agent J. Lyngdoh submitted photo and voice evidence of 4x4 passage obstruction.',
    time: '2 min ago',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    isRead: false,
    hasVoiceNote: true,
    audioDuration: '0:22',
    targetPath: '/incidents',
    incidentId: 'INC-2026-001',
    severity: 4
  },
  {
    id: 'notif-2',
    type: 'alert_critical',
    title: 'RED ALERT: Heavy Rainfall Runoff across East Khasi Hills',
    message: 'SDMA advisory issued for high-risk waterlogging and slow freight convoy movement.',
    time: '12 min ago',
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    isRead: false,
    targetPath: '/alerts',
    severity: 5
  },
  {
    id: 'notif-3',
    type: 'road_block',
    title: 'Road Blockage Declared: NH-13 Sela Pass West Approach',
    message: 'Rockfall reported by BRO engineering reconnaissance unit. Alternate route suggested.',
    time: '25 min ago',
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
    isRead: true,
    targetPath: '/emergency',
    severity: 4
  }
];

export const useNotificationStore = create((set, get) => ({
  notifications: INITIAL_NOTIFICATIONS,
  isMuted: localStorage.getItem('ner_audio_muted') === 'true',

  get unreadCount() {
    return get().notifications.filter(n => !n.isRead).length;
  },

  toggleMute: () => {
    const nextMuted = !get().isMuted;
    localStorage.setItem('ner_audio_muted', String(nextMuted));
    set({ isMuted: nextMuted });
    showToast(nextMuted ? 'Notification audio muted' : 'Notification chime unmuted', 'info');
    if (!nextMuted) {
      playNotificationSound('click');
    }
  },

  addNotification: (notif) => {
    const id = notif.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newEntry = {
      id,
      type: notif.type || 'incident_pending',
      title: notif.title || 'Tactical Incident Report',
      message: notif.message || 'New field status update received.',
      time: 'Just now',
      timestamp: new Date(),
      isRead: false,
      hasVoiceNote: Boolean(notif.hasVoiceNote || notif.audioDataUrl),
      audioDuration: notif.audioDuration || '0:18',
      targetPath: notif.targetPath || '/incidents',
      incidentId: notif.incidentId || notif.clientUuid || notif._id,
      severity: notif.severity || 3,
      ...notif
    };

    set((state) => ({
      notifications: [newEntry, ...state.notifications]
    }));

    // Play synthesized audible notification if not muted
    if (!get().isMuted) {
      if (newEntry.severity >= 4 || newEntry.type === 'alert_critical') {
        playNotificationSound('critical_alert');
      } else {
        playNotificationSound('incident_report');
      }
    }

    showToast(newEntry.title, newEntry.severity >= 4 ? 'error' : 'info');
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true }))
    }));
    showToast('All notifications marked as read', 'info');
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  }
}));

export default useNotificationStore;
