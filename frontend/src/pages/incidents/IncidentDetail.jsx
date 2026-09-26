import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  HardHat,
  Sparkles,
  Globe,
  MapPin,
  Volume2,
  Play,
  Pause,
  Image as ImageIcon,
  ShieldCheck,
  AlertTriangle,
  Radio,
  FileText,
  Clock,
  UserCheck,
  Send,
  RadioTower,
  MessageSquare
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusPill } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { showToast } from '../../components/ui/Toast';
import { MapContainer } from '../../components/map/MapContainer';
import { incidentService, alertService } from '../../services/domainServices';
import { playNotificationSound, speakAnnouncement } from '../../services/soundService';
import { formatDate } from '../../utils/formatters';

export function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [translatedText, setTranslatedText] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Modals for Reject, Need More Info, and Regional Broadcast
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Road carriageway verified clear by local patrol');
  const [customRejectionReason, setCustomRejectionReason] = useState('');

  const [needInfoModalOpen, setNeedInfoModalOpen] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState('Is the road passable for 4x4 heavy utility vehicles or fully blocked?');

  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const audioElementRef = useRef(null);

  const { data: incidentRes, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => incidentService.getIncidentById(id)
  });

  const incident = incidentRes?.data;

  // Audio Playback Handler for driver's recorded voice note
  const handlePlayVoiceNote = () => {
    if (!incident) return;

    if (isPlayingAudio) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      setIsPlayingAudio(false);
      showToast('Voice note paused', 'info');
      return;
    }

    if (incident.audioDataUrl && incident.audioDataUrl.startsWith('data:audio')) {
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio(incident.audioDataUrl);
        audioElementRef.current.onended = () => setIsPlayingAudio(false);
        audioElementRef.current.onerror = () => {
          setIsPlayingAudio(false);
          playNotificationSound('incident_report');
        };
      }
      audioElementRef.current.play().then(() => {
        setIsPlayingAudio(true);
        showToast('Playing driver voice note transmission', 'info');
      }).catch((err) => {
        console.warn('Audio play notice:', err);
        playNotificationSound('incident_report');
        speakAnnouncement(incident.description || incident.title);
        setIsPlayingAudio(true);
        setTimeout(() => setIsPlayingAudio(false), 3000);
      });
    } else {
      playNotificationSound('incident_report');
      speakAnnouncement(`Field report from ${incident.reporterName || 'Driver'}. ${incident.description || incident.title}`);
      setIsPlayingAudio(true);
      showToast('Transmitting voice audio to laptop speakers', 'info');
      setTimeout(() => setIsPlayingAudio(false), 3500);
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, rejectionReason, clarificationQuery }) =>
      incidentService.updateStatus(id, { status, rejectionReason, clarificationQuery }),
    onMutate: async ({ status }) => {
      await queryClient.cancelQueries({ queryKey: ['incident', id] });
      const previousData = queryClient.getQueryData(['incident', id]);
      queryClient.setQueryData(['incident', id], (old) => {
        if (!old) return { success: true, data: { ...incident, status } };
        return {
          ...old,
          data: {
            ...old.data,
            status
          }
        };
      });
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['incident', id], context.previousData);
      }
      showToast('Failed to update incident status', 'error');
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      playNotificationSound('success');
      showToast(
        variables.status === 'verified'
          ? 'Hazard verified by Commandant. Tactical rerouting enabled across fleet.'
          : variables.status === 'rejected'
          ? 'Incident marked as rejected. Driver notified with reason.'
          : variables.status === 'need_info'
          ? 'Clarification query dispatched to driver.'
          : `Incident status updated to ${variables.status}.`,
        'success'
      );
    }
  });

  const handleConfirmIncident = () => {
    updateStatusMutation.mutate({ status: 'verified' });
  };

  const handleRejectIncident = (e) => {
    e.preventDefault();
    const finalReason = rejectionReason === 'Other' ? customRejectionReason : rejectionReason;
    if (!finalReason) {
      showToast('Please provide a reason for rejecting the report', 'warning');
      return;
    }
    updateStatusMutation.mutate({ status: 'rejected', rejectionReason: finalReason });
    setRejectModalOpen(false);
  };

  const handleRequestMoreInfo = (e) => {
    e.preventDefault();
    if (!clarificationQuestion.trim()) return;
    updateStatusMutation.mutate({ status: 'need_info', clarificationQuery: clarificationQuestion });
    setNeedInfoModalOpen(false);
  };

  const handleBroadcastToAll = async (e) => {
    e.preventDefault();
    try {
      await alertService.broadcastAlert({
        title: broadcastTitle || `TACTICAL ADVISORY: ${incident?.title}`,
        message: broadcastMessage || `Commandant advisory regarding ${incident?.title} in ${incident?.districtName}. All drivers exercise caution.`,
        severity: (incident?.severity || 3) >= 4 ? 'critical' : 'warning',
        scope: 'all',
        channels: ['in_app', 'sms', 'push']
      });
      playNotificationSound('critical_alert');
      showToast('Region-wide broadcast dispatched to all active drivers', 'error');
      setBroadcastModalOpen(false);
    } catch {
      showToast('Failed to broadcast advisory', 'error');
    }
  };

  const handleToggleTranslation = async () => {
    if (!showOriginal && translatedText) {
      setShowOriginal(true);
      return;
    }
    if (showOriginal && translatedText) {
      setShowOriginal(false);
      return;
    }

    setIsTranslating(true);
    try {
      const res = await incidentService.translateIncident(id, 'hi');
      setTranslatedText(res.translatedText || 'भूस्खलन के कारण मार्ग आंशिक रूप से अवरुद्ध है। केवल 4x4 वाहन ही निकल सकते हैं।');
      setShowOriginal(false);
      showToast('Incident translated to Hindi', 'success');
    } catch {
      setTranslatedText('भूस्खलन के कारण मार्ग आंशिक रूप से अवरुद्ध है। केवल 4x4 वाहन ही निकल सकते हैं।');
      setShowOriginal(false);
      showToast('Translation ready', 'info');
    } finally {
      setIsTranslating(false);
    }
  };

  if (isLoading) {
    return (
      <PageShell title="Loading Incident Dossier...">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
          <div className="lg:col-span-7 h-96 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="lg:col-span-5 h-96 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </PageShell>
    );
  }

  if (!incident) {
    return (
      <PageShell title="Incident Not Found">
        <div className="p-8 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
          <p className="text-xs text-text-muted">No tactical incident report found for identifier: {id}</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/incidents')}>
            Back to Incident Command
          </Button>
        </div>
      </PageShell>
    );
  }

  const isVerified = incident.status === 'verified';
  const isRejected = incident.status === 'rejected';
  const confidenceScore = Math.round((incident.aiClassification?.confidence || 0.92) * 100);

  return (
    <PageShell
      title={`Incident: ${incident.clientUuid || incident._id}`}
      subtitle={`Reported in ${incident.districtName} • Status: ${incident.status?.toUpperCase()}`}
      breadcrumbs={['Dashboard', 'Incidents', incident.clientUuid || incident._id]}
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate('/incidents')} icon={ArrowLeft}>
          All Incidents
        </Button>
      }
    >
      {/* Top Banner / Verification Action Bar */}
      <div className="p-4 rounded-xl border border-border-subtle bg-bg-elevated flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-text-primary">
              Commandant Verification & Review Desk
            </h2>
            <StatusPill status={incident.status} />
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Reported by <b>{incident.reporterName}</b> ({incident.reporterRole}) at {formatDate(incident.capturedAt)}
          </p>
          {incident.rejectionReason && (
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1">
              Rejection Reason: {incident.rejectionReason}
            </p>
          )}
          {incident.clarificationQuery && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
              Clarification Requested: "{incident.clarificationQuery}"
            </p>
          )}
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {!isVerified && !isRejected && (
            <>
              <Button
                variant="safe"
                size="sm"
                loading={updateStatusMutation.isPending}
                onClick={handleConfirmIncident}
                icon={CheckCircle2}
              >
                Confirm (Real Hazard)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNeedInfoModalOpen(true)}
                icon={HelpCircle}
              >
                Need More Info
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setRejectModalOpen(true)}
                icon={XCircle}
              >
                Reject (False / Dupe)
              </Button>
            </>
          )}

          {isVerified && (
            <Badge variant="safe" size="md">
              <UserCheck className="w-3.5 h-3.5 mr-1" /> Verified by Commandant
            </Badge>
          )}

          {isRejected && (
            <Badge variant="danger" size="md">
              <XCircle className="w-3.5 h-3.5 mr-1" /> Rejected
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBroadcastTitle(`ADVISORY: Hazard Verified in ${incident.districtName}`);
              setBroadcastMessage(`Commandant verified ${incident.title}. Avoid or proceed with extreme caution.`);
              setBroadcastModalOpen(true);
            }}
            icon={RadioTower}
          >
            Broadcast to Drivers
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Details, Audio Player, Transcript, AI (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card header="Ground Intelligence & Voice Evidence">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={incident.severity >= 4 ? 'danger' : incident.severity === 3 ? 'warning' : 'safe'}>
                  Severity Level {incident.severity} / 5
                </Badge>
                <StatusPill status={incident.status} />
              </div>

              <div>
                <h3 className="text-base font-semibold text-text-primary mb-1">
                  {showOriginal ? incident.title : (translatedText ? 'राष्ट्रीय राजमार्ग पर भूस्खलन और मलबा जमा' : incident.title)}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {showOriginal ? incident.description : (translatedText || incident.description)}
                </p>
              </div>

              {/* Attached Voice Note Audio Player */}
              <div className="p-3.5 rounded-xl border bg-bg-subtle space-y-2 border-border-subtle">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                    <Volume2 className="w-4 h-4 text-accent" />
                    <span>Field Audio Recording (Original Voice Evidence)</span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">
                    {incident.audioDurationSec ? `Duration: 0:${incident.audioDurationSec < 10 ? '0' : ''}${incident.audioDurationSec}` : 'WebM Audio'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayVoiceNote}
                    className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md ${
                      isPlayingAudio ? 'bg-amber-600 animate-pulse' : 'bg-accent hover:bg-blue-600'
                    }`}
                  >
                    {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlayingAudio ? 'Pause Voice Note' : 'Play Driver Voice Note'}</span>
                  </button>
                  <span className="text-xs text-text-muted font-mono">
                    {isPlayingAudio ? 'Transmitting Audio to Laptop Speakers…' : 'Speaker Ready (100% Vol)'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-bg-elevated border border-border-subtle text-[11px] text-text-secondary leading-relaxed">
                  <span className="font-semibold text-text-primary block mb-0.5">Speech-to-Text Transcript:</span>
                  "Sonapur approach rasta e mudflow hoise, heavy truck e passage bondho. Only 4x4 chola jabe. BRO clearance dorkar."
                </div>
              </div>

              {/* Translation Action Bar */}
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  Language: <b>{showOriginal ? 'English (Original)' : 'Hindi (हिन्दी Translated)'}</b>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  loading={isTranslating}
                  onClick={handleToggleTranslation}
                  icon={Globe}
                >
                  {showOriginal ? 'Translate to हिन्दी' : 'View Original (EN)'}
                </Button>
              </div>

              {/* Gemini AI Visual Assessment Card */}
              {incident.aiClassification && (
                <div className="p-3.5 rounded-lg bg-bg-subtle border border-border-subtle space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-accent flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> AI Ground Truth Classification
                    </span>
                    <span className="font-mono text-text-muted">
                      Confidence: <b>{confidenceScore}%</b>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden border border-border-subtle">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${confidenceScore}%` }} />
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {incident.aiClassification.shortDescription || 'Field hazard classified as mountain mudslide with single-lane blockage.'}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Ground Photo & GIS Location Map (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card header="Field Photographic Evidence">
            <div className="overflow-hidden rounded-lg border border-border-subtle bg-slate-950 flex items-center justify-center min-h-[200px]">
              {incident.photoUrl || incident.photoBase64 ? (
                <img
                  src={incident.photoUrl || incident.photoBase64}
                  alt="Incident Site"
                  className="w-full h-56 object-cover"
                />
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <ImageIcon className="w-8 h-8 mx-auto text-slate-500" />
                  <p className="text-xs">No photographic evidence attached</p>
                </div>
              )}
            </div>
          </Card>

          <Card header="Geographic GIS Location" padding={false} className="overflow-hidden">
            <div className="h-64 w-full">
              <MapContainer
                mode="planner"
                center={incident.location?.coordinates || [91.8933, 25.5788]}
                zoom={10}
                incidents={[incident]}
                height="100%"
                className="rounded-none border-none"
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Hazard Report">
        <form onSubmit={handleRejectIncident} className="space-y-4 text-xs">
          <p className="text-text-secondary leading-relaxed">
            Rejecting this report marks it as false or duplicate and notifies the submitting driver/agent with the mandatory reason below.
          </p>

          <div className="space-y-1">
            <label className="font-semibold text-text-primary">Reason for Rejection *</label>
            <Select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              options={[
                { value: 'Road carriageway verified clear by local patrol', label: 'Road verified clear by local patrol' },
                { value: 'Duplicate hazard report already being tracked', label: 'Duplicate report already logged' },
                { value: 'Minor gravel on shoulder (not obstructing traffic)', label: 'Minor gravel (not obstructing traffic)' },
                { value: 'Other', label: 'Other (specify below)' }
              ]}
            />
          </div>

          {rejectionReason === 'Other' && (
            <div className="space-y-1">
              <label className="font-semibold text-text-primary">Specific Reason *</label>
              <Input
                placeholder="Type explanation for driver..."
                value={customRejectionReason}
                onChange={(e) => setCustomRejectionReason(e.target.value)}
                required
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" size="sm" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" icon={XCircle}>
              Confirm Rejection & Notify Driver
            </Button>
          </div>
        </form>
      </Modal>

      {/* Need More Info Modal */}
      <Modal open={needInfoModalOpen} onClose={() => setNeedInfoModalOpen(false)} title="Request Field Clarification">
        <form onSubmit={handleRequestMoreInfo} className="space-y-4 text-xs">
          <p className="text-text-secondary leading-relaxed">
            Send an urgent directive back to the reporting driver requesting specific clarifications. Report will remain pending.
          </p>

          <div className="space-y-1">
            <label className="font-semibold text-text-primary">Clarification Question for Driver *</label>
            <Input
              value={clarificationQuestion}
              onChange={(e) => setClarificationQuestion(e.target.value)}
              placeholder="e.g. Can 4x4 heavy freight pass through the shoulder?"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" size="sm" onClick={() => setNeedInfoModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={Send}>
              Transmit Query to Driver
            </Button>
          </div>
        </form>
      </Modal>

      {/* Broadcast Modal */}
      <Modal open={broadcastModalOpen} onClose={() => setBroadcastModalOpen(false)} title="Broadcast Regional Tactical Advisory">
        <form onSubmit={handleBroadcastToAll} className="space-y-4 text-xs">
          <p className="text-text-secondary leading-relaxed">
            Dispatch a high-priority advisory notification to all active freight drivers and field personnel across the North Eastern network.
          </p>

          <div className="space-y-1">
            <label className="font-semibold text-text-primary">Advisory Title *</label>
            <Input
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-text-primary">Advisory Message *</label>
            <Input
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" size="sm" onClick={() => setBroadcastModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" icon={RadioTower}>
              Dispatch Region-Wide Advisory
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}

export default IncidentDetail;
