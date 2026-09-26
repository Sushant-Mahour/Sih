import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  Volume2,
  CheckCircle2,
  Send,
  Mic,
  MicOff,
  Clock,
  Shield,
  Radio,
  Square,
  AlertTriangle
} from 'lucide-react';
import { DriverShell } from '../../components/driver/DriverShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { showToast } from '../../components/ui/Toast';
import { getSocket } from '../../services/socket';

export function DriverMessages() {
  const { t } = useTranslation();
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState(new Set(['msg-1']));
  const [isRecordingReply, setIsRecordingReply] = useState(false);
  const [replyText, setReplyText] = useState('');

  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      sender: 'Commandant R. K. Sharma (HQ Command)',
      time: '14:20 IST',
      text: 'Green corridor priority active along NH-6. Maintain steady speed and log temperature check at Nongpoh barrier.',
      hasAudio: true,
      audioDuration: '0:24',
      acknowledged: true
    },
    {
      id: 'msg-2',
      sender: 'Disaster Cell Shillong (Sector Officer)',
      time: '14:05 IST',
      text: 'Heavy monsoon runoff reported near Umtrew bridge. Single-lane 4x4 escort unit is positioned at checkpoint 3.',
      hasAudio: false,
      acknowledged: false
    },
    {
      id: 'msg-3',
      sender: 'Joint Logistics Center Guwahati',
      time: '12:45 IST',
      text: 'Consignment manifest NER-MED-849 authorized for immediate dispatch. Critical cold chain vaccine priority.',
      hasAudio: true,
      audioDuration: '0:18',
      acknowledged: true
    }
  ]);

  useEffect(() => {
    const socket = getSocket();

    const handleDriverNotif = (notif) => {
      const newMsg = {
        id: `msg-${Date.now()}`,
        sender: notif.sender || 'Joint Command Center',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
        text: notif.message || notif.text || 'Urgent Command Directive',
        hasAudio: Boolean(notif.hasAudio),
        audioDuration: notif.audioDuration || '0:15',
        acknowledged: false
      };
      setMessages((prev) => [newMsg, ...prev]);
      showToast(`New Directive received: ${newMsg.text.slice(0, 40)}...`, 'info');
    };

    const handleRoadBlocked = (blockage) => {
      const blockMsg = {
        id: `block-${Date.now()}`,
        sender: 'NER Emergency Traffic Command',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
        text: `CRITICAL ROAD BLOCK: ${blockage.corridorName || blockage.segmentName || 'Corridor segment'} declared blocked due to ${blockage.reason || 'landslide'}. Alternative routing recommended.`,
        hasAudio: false,
        acknowledged: false
      };
      setMessages((prev) => [blockMsg, ...prev]);
      showToast('Urgent road block notification received!', 'warning');
    };

    socket.on('driver:notification', handleDriverNotif);
    socket.on('road:blocked', handleRoadBlocked);

    return () => {
      socket.off('driver:notification', handleDriverNotif);
      socket.off('road:blocked', handleRoadBlocked);
    };
  }, []);

  const handlePlayVoice = (id) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
      showToast('Playing voice directive from Command...', 'info');
      setTimeout(() => setPlayingAudioId(null), 4000);
    }
  };

  const handleAcknowledge = (id) => {
    setAcknowledgedIds((prev) => new Set(prev).add(id));
    const socket = getSocket();
    socket.emit('driver:acknowledge', {
      driverId: 'NER-DRV-0841',
      vehicleId: 'NER-CONVOY-101',
      alertId: id,
      timestamp: new Date().toISOString()
    });
    showToast('Acknowledgement transmitted to Command Center', 'success');
  };

  const handleSendVoiceReply = () => {
    if (!isRecordingReply) {
      setIsRecordingReply(true);
      showToast('Recording voice reply to Command...', 'info');
    } else {
      setIsRecordingReply(false);
      const socket = getSocket();
      socket.emit('driver:reply', {
        driverId: 'NER-DRV-0841',
        vehicleId: 'NER-CONVOY-101',
        type: 'voice',
        timestamp: new Date().toISOString()
      });
      showToast('Voice note transmitted to Commandant', 'success');
    }
  };

  const handleSendTextReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const socket = getSocket();
    socket.emit('driver:reply', {
      driverId: 'NER-DRV-0841',
      vehicleId: 'NER-CONVOY-101',
      type: 'text',
      message: replyText,
      timestamp: new Date().toISOString()
    });
    showToast('Reply dispatched to Control Room', 'success');
    setReplyText('');
  };

  return (
    <DriverShell>
      <div className="space-y-4">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
              {t('driver.messages', 'Command Directives')}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Official instructions from HQ Commandant and Sector Officers
            </p>
          </div>
          <Badge variant="primary" size="sm">
            {messages.filter(m => !acknowledgedIds.has(m.id)).length} UNACKNOWLEDGED
          </Badge>
        </div>

        {/* Message Feed */}
        <div className="space-y-3">
          {messages.map((m) => {
            const isAcked = acknowledgedIds.has(m.id);
            const isPlaying = playingAudioId === m.id;

            return (
              <Card
                key={m.id}
                className={`p-4 space-y-3 transition-all ${
                  !isAcked ? 'border-2 border-accent shadow-md' : 'border border-border-subtle'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
                    <Shield className="w-3.5 h-3.5" />
                    <span>{m.sender}</span>
                  </div>
                  <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    {m.time}
                  </span>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {m.text}
                </p>

                {/* Audio directive player if voice attached */}
                {m.hasAudio && (
                  <div className="p-2.5 rounded-xl border flex items-center justify-between" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center gap-2">
                      <Volume2 className={`w-4 h-4 text-accent ${isPlaying ? 'animate-bounce' : ''}`} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Voice Directive ({m.audioDuration})
                      </span>
                    </div>
                    <button
                      onClick={() => handlePlayVoice(m.id)}
                      className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent-hover transition cursor-pointer"
                    >
                      {isPlaying ? 'Pause' : 'Listen'}
                    </button>
                  </div>
                )}

                {/* Acknowledgment Action */}
                <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                  {isAcked ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Acknowledged by Driver
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(m.id)}
                      className="w-full h-11 rounded-xl bg-accent text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-accent-hover active:scale-[0.98] transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('driver.confirmSeen', 'Confirm & Acknowledge Directive')}</span>
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Voice / Text Reply Box to Command */}
        <Card className="p-4 space-y-3" title="Transmit Quick Reply to Commandant">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendVoiceReply}
              className={`flex-1 h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                isRecordingReply
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-600'
              }`}
            >
              {isRecordingReply ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isRecordingReply ? 'Stop & Send Voice Note' : 'Record Voice Note (Tap to speak)'}</span>
            </button>
          </div>

          <form onSubmit={handleSendTextReply} className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Or type brief acknowledgement message..."
              className="flex-1 bg-bg-base border border-border-subtle rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="px-4 rounded-xl bg-accent text-white font-bold text-xs hover:bg-accent-hover transition flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </Card>
      </div>
    </DriverShell>
  );
}

export default DriverMessages;
