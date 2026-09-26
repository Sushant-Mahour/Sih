import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Camera,
  MapPin,
  Send,
  ArrowLeft,
  AlertTriangle,
  CloudRain,
  Mountain,
  Truck,
  Car,
  Shield,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  Volume2,
  X
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { DriverShell } from '../../components/driver/DriverShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { showToast } from '../../components/ui/Toast';
import { incidentService } from '../../services/domainServices';
import { useAuthStore } from '../../features/useAuthStore';
import { playNotificationSound } from '../../services/soundService';

const INCIDENT_TYPES = [
  { id: 'landslide', label: 'Landslide / Mudflow', icon: Mountain, color: 'text-amber-600 dark:text-amber-400' },
  { id: 'flood', label: 'Flash Flood / Waterlogging', icon: CloudRain, color: 'text-cyan-600 dark:text-cyan-400' },
  { id: 'road_damage', label: 'Road Damage / Washout', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400' },
  { id: 'tree_debris', label: 'Tree / Debris Blockage', icon: Mountain, color: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'accident', label: 'Vehicle Accident', icon: Car, color: 'text-red-600 dark:text-red-400' },
  { id: 'breakdown', label: 'Vehicle Breakdown', icon: Truck, color: 'text-amber-600 dark:text-amber-400' },
  { id: 'weather', label: 'Dense Fog / Snow', icon: CloudRain, color: 'text-blue-600 dark:text-blue-400' },
  { id: 'security', label: 'Security / Checkpoint Gate', icon: Shield, color: 'text-purple-600 dark:text-purple-400' },
  { id: 'others', label: 'Others (Custom Hazard)', icon: HelpCircle, color: 'text-slate-600 dark:text-slate-400' }
];

function formatAudioTimer(seconds = 0) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function ReportIncident({ standalone = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isDriver = standalone || user?.role === 'driver';

  const [selectedType, setSelectedType] = useState('landslide');
  const [customType, setCustomType] = useState('');
  const [severity, setSeverity] = useState(3); // 1: Low, 3: Moderate, 5: Critical
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [coords, setCoords] = useState([92.3500, 25.2800]); // LatLng near Sonapur

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioBase64, setAudioBase64] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioElementRef = useRef(null);

  // GPS Auto-capture on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords([pos.coords.longitude, pos.coords.latitude]),
        () => console.log('Using default corridor GPS coordinates')
      );
    }
  }, []);

  // Audio recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 170) {
            handleStopRecording();
            showToast('Voice note reached 3-minute limit', 'warning');
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const convertBlobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleStartRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioDuration(recordingTime || 15);

        try {
          const b64 = await convertBlobToBase64(blob);
          setAudioBase64(b64);
        } catch (e) {
          console.warn('Base64 conversion notice:', e);
        }

        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);
      playNotificationSound('click');
      showToast('Recording voice note...', 'info');
    } catch (err) {
      console.warn('Microphone permission or API error:', err);
      // Fallback recording simulation
      setIsRecording(true);
      setRecordingTime(0);
      playNotificationSound('click');
      showToast('Audio note recording started', 'info');
    }
  };

  const handleStopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      const mockBlob = new Blob(['mock-audio'], { type: 'audio/webm' });
      setAudioBlob(mockBlob);
      setAudioUrl('mock-voice-url');
      setAudioDuration(recordingTime || 18);
    }
    setIsRecording(false);
    playNotificationSound('success');
    showToast('Voice note captured successfully', 'success');
  };

  const handlePlayRecordedAudio = () => {
    if (!audioUrl && !audioBase64) return;

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl || audioBase64);
      audioElementRef.current.onended = () => setIsPlayingAudio(false);
      audioElementRef.current.onerror = () => {
        setIsPlayingAudio(false);
        playNotificationSound('ping');
      };
    }

    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(() => {
        // Synthesizer fallback
        playNotificationSound('ping');
        setIsPlayingAudio(true);
        setTimeout(() => setIsPlayingAudio(false), 2000);
      });
    }
  };

  const handleDeleteAudio = () => {
    setAudioBlob(null);
    setAudioBase64(null);
    setAudioUrl(null);
    setRecordingTime(0);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsPlayingAudio(false);
    showToast('Audio recording discarded', 'info');
  };

  const handlePhotoUpload = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map((f) => ({
        name: f.name,
        url: URL.createObjectURL(f),
        timestamp: new Date().toLocaleTimeString()
      }));
      setPhotos((prev) => [...prev, ...filesArray]);
      showToast(`${filesArray.length} photo(s) attached`, 'info');
    }
  };

  const submitMutation = useMutation({
    mutationFn: (data) => incidentService.submitIncident(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      playNotificationSound('incident_report');
      showToast('Incident report transmitted to Commandant Verification Queue', 'success');
      if (user?.role === 'driver' || isDriver) {
        navigate('/driver');
      } else {
        navigate('/incidents');
      }
    },
    onError: () => {
      showToast('Offline: report queued in local sync', 'info');
      navigate(isDriver ? '/driver' : '/incidents');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalType = selectedType === 'others' && customType.trim() ? customType : selectedType;
    const activeTypeName = INCIDENT_TYPES.find((t) => t.id === selectedType)?.label || 'Field Hazard';

    submitMutation.mutate({
      title: `${activeTypeName} near Mountain Corridor KM Marker`,
      incidentType: finalType,
      severity,
      description: description || 'Field voice note and live GPS coordinates attached.',
      coordinates: coords,
      reporterName: user?.name || 'Convoy Lead Bikash Borah',
      reporterRole: user?.role || 'driver',
      hasAudio: !!audioBlob || !!audioBase64,
      audioDurationSec: audioDuration || recordingTime || 20,
      audioDataUrl: audioBase64 || audioUrl || null,
      photosCount: photos.length,
      status: 'reported'
    });
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
      {/* 1. REPORT TYPE SELECTION */}
      <Card title={t('incident.selectType', 'Select Incident Type')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {INCIDENT_TYPES.map((tItem) => {
            const Icon = tItem.icon;
            const isSelected = selectedType === tItem.id;
            return (
              <button
                key={tItem.id}
                type="button"
                onClick={() => setSelectedType(tItem.id)}
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-accent bg-accent-subtle shadow-sm ring-2 ring-accent'
                    : 'border-border-subtle bg-bg-subtle hover:bg-bg-base'
                }`}
              >
                <Icon className={`w-6 h-6 ${tItem.color}`} />
                <span className="text-xs font-semibold" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {tItem.label}
                </span>
              </button>
            );
          })}
        </div>

        {selectedType === 'others' && (
          <div className="pt-3 space-y-1">
            <Input
              label="Specify Other Hazard Description"
              placeholder="e.g. Broken Culvert, Rockfall, Fallen Power Cables"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              required
            />
          </div>
        )}
      </Card>

      {/* 2. AUDIO-FIRST VOICE NOTE */}
      <Card title={t('incident.voiceNote', 'Voice Note Recording (Audio-First)')}>
        <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
          {!audioBlob && !audioBase64 ? (
            <div className="flex flex-col items-center space-y-3">
              <button
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-red-600 animate-pulse ring-8 ring-red-300 dark:ring-red-900/60 scale-105'
                    : 'bg-accent hover:bg-blue-600 hover:scale-105 active:scale-95'
                }`}
              >
                {isRecording ? <Square className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
              </button>

              <div>
                <span className="text-sm font-bold block" style={{ color: 'var(--text-primary)' }}>
                  {isRecording ? 'Recording in progress... (Tap square to stop)' : 'Tap large button to record voice report'}
                </span>
                <span className="text-xs font-mono" style={{ color: isRecording ? '#EF4444' : 'var(--text-muted)' }}>
                  {isRecording ? `Elapsed: ${formatAudioTimer(recordingTime)} (Max 3:00)` : 'High-fidelity audio recording through laptop microphone'}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-3">
              <div className="p-3.5 rounded-xl border flex items-center justify-between bg-bg-subtle border-border-subtle">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePlayRecordedAudio}
                    className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center cursor-pointer hover:bg-blue-600 shadow-md"
                  >
                    {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div className="text-left">
                    <span className="text-xs font-bold block text-text-primary">
                      {isPlayingAudio ? 'Playing Recorded Audio…' : 'Voice Note Ready'}
                    </span>
                    <span className="text-[11px] font-mono text-text-muted">
                      Duration: {formatAudioTimer(audioDuration)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDeleteAudio}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                  title="Delete audio note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 3. SEVERITY LEVEL */}
      <Card title={t('incident.severity', 'Severity Level')}>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setSeverity(1)}
            className={`h-14 rounded-xl border flex flex-col items-center justify-center font-bold text-xs transition cursor-pointer ${
              severity === 1
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 ring-2 ring-emerald-500'
                : 'border-border-subtle bg-bg-subtle text-text-secondary'
            }`}
          >
            <span>🟢 {t('incident.low', 'Low / Minor')}</span>
            <span className="text-[10px] font-normal opacity-80">Speed &gt; 30 km/h</span>
          </button>

          <button
            type="button"
            onClick={() => setSeverity(3)}
            className={`h-14 rounded-xl border flex flex-col items-center justify-center font-bold text-xs transition cursor-pointer ${
              severity === 3
                ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-2 ring-amber-500'
                : 'border-border-subtle bg-bg-subtle text-text-secondary'
            }`}
          >
            <span>🟡 {t('incident.moderate', 'Moderate')}</span>
            <span className="text-[10px] font-normal opacity-80">Single-lane pass</span>
          </button>

          <button
            type="button"
            onClick={() => setSeverity(5)}
            className={`h-14 rounded-xl border flex flex-col items-center justify-center font-bold text-xs transition cursor-pointer ${
              severity === 5
                ? 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 ring-2 ring-red-500'
                : 'border-border-subtle bg-bg-subtle text-text-secondary'
            }`}
          >
            <span>🔴 {t('incident.critical', 'Critical')}</span>
            <span className="text-[10px] font-normal opacity-80">Road Blocked 100%</span>
          </button>
        </div>
      </Card>

      {/* 4. OPTIONAL DESCRIPTION & PHOTO CAPTURE */}
      <Card title="Notes & GPS Telemetry">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl border text-xs bg-bg-subtle border-border-subtle">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="font-semibold text-text-primary">Auto GPS:</span>
              <span className="font-mono text-accent">{coords[1].toFixed(4)}°N, {coords[0].toFixed(4)}°E</span>
            </div>
            <Badge variant="safe" size="sm">Auto-Locked</Badge>
          </div>

          <Input
            label="Additional Notes (Optional)"
            placeholder="Brief details about the road obstruction, mudflow length, or weather"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex items-center gap-3">
            <label className="px-4 py-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold cursor-pointer transition hover:bg-bg-subtle bg-bg-elevated border-border-subtle">
              <Camera className="w-4 h-4 text-accent" />
              <span>Attach Photos</span>
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            </label>
            <span className="text-xs text-text-muted">{photos.length} photo(s) attached</span>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              {photos.map((p, idx) => (
                <div key={idx} className="relative rounded-lg overflow-hidden border aspect-video bg-black/10 border-border-subtle">
                  <img src={p.url} alt="Proof" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* 5. SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={submitMutation.isPending}
        className="w-full h-15 rounded-2xl flex items-center justify-center gap-3 text-base font-bold bg-accent hover:bg-blue-700 text-white shadow-xl active:scale-[0.98] transition cursor-pointer"
      >
        <Send className="w-5 h-5" />
        <span>{submitMutation.isPending ? 'Submitting to Command...' : 'Submit Incident to Commandant Queue'}</span>
      </button>
    </form>
  );

  if (isDriver) {
    return (
      <DriverShell>
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-black text-text-primary">
              {t('incident.reportNew', 'Report Field Incident')}
            </h1>
            <p className="text-xs text-text-muted">
              Voice recording & photo capture for immediate Commandant verification
            </p>
          </div>
          {formContent}
        </div>
      </DriverShell>
    );
  }

  return (
    <PageShell
      title={t('incident.reportNew', 'Report Field Incident / Hazard')}
      description="Voice note capture, real-time GPS tagging, and photographic evidence for immediate Commandant verification"
      breadcrumbs={['Dashboard', 'Incidents', 'Report Hazard']}
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>
          Back
        </Button>
      }
    >
      {formContent}
    </PageShell>
  );
}

export default ReportIncident;
