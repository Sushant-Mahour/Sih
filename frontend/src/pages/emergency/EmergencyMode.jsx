import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  FileText,
  Sparkles,
  ShieldCheck,
  Truck,
  CheckCircle2,
  RefreshCw,
  Power,
  Layers,
  Send,
  Copy,
  Download,
  Check,
  Building,
  Plane,
  Cross,
  Ban,
  MapPin,
  Clock,
  Plus,
  RotateCcw,
  Unlock,
  HelpCircle,
  Crosshair
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusPill } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../../components/ui/Table';
import { showToast } from '../../components/ui/Toast';
import { MapContainer } from '../../components/map/MapContainer';
import { emergencyService, alertService, roadService } from '../../services/domainServices';
import { useEmergencyStore } from '../../features/useEmergencyStore';
import { useAuthStore } from '../../features/useAuthStore';
import { playNotificationSound } from '../../services/soundService';

const NER_DISTRICT_OPTIONS = [
  'East Khasi Hills (Meghalaya)',
  'Cachar (Assam)',
  'Papum Pare (Arunachal Pradesh)',
  'Tawang (Arunachal Pradesh)',
  'Kohima (Nagaland)',
  'Imphal West (Manipur)',
  'Aizawl (Mizoram)',
  'West Tripura (Tripura)',
  'East Sikkim (Sikkim)'
];

const KNOWN_CORRIDORS = [
  { id: 'SEG-NH6-01', name: 'NH-6 Guwahati to Sonapur Sector' },
  { id: 'SEG-NH6-02', name: 'NH-6 Sonapur to Shillong Pass' },
  { id: 'SEG-NH13-01', name: 'NH-13 Trans-Arunachal Sela Corridor' },
  { id: 'SEG-NH27-01', name: 'NH-27 Guwahati to Nagaon Trunk' },
  { id: 'SEG-NH29-01', name: 'NH-29 Dimapur to Kohima Mountain Road' },
  { id: 'SEG-NH8-01', name: 'NH-8 Silchar to Agartala Trunk' },
  { id: 'other', name: 'Other / Custom Map Location' }
];

const BLOCKAGE_REASONS = [
  'Landslide / Mudflow',
  'Flash Flood / Inundation',
  'Bridge Structural Failure',
  'Vehicle Rollover / Major Accident',
  'Security Impasse / Civil Curfew',
  'Heavy Road Construction / Blasting',
  'Other'
];

export function EmergencyMode() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const {
    isEmergencyActive,
    emergencyTitle,
    operationalSummary,
    toggleEmergency,
    sitRep,
    loadingSitRep,
    fetchSitRep,
    driverAcknowledgements
  } = useEmergencyStore();

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [roadBlockModalOpen, setRoadBlockModalOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectingOnMap, setSelectingOnMap] = useState(false);

  // Red Alert Activation form fields
  const [selectedDistricts, setSelectedDistricts] = useState(['East Khasi Hills (Meghalaya)', 'Tawang (Arunachal Pradesh)']);
  const [crisisReason, setCrisisReason] = useState('Severe monsoon runoff and NH-6 mudflow blocking medical logistics');
  const [typedPhrase, setTypedPhrase] = useState('');

  // Declare Road Block Form State
  const [blockForm, setBlockForm] = useState({
    corridorId: 'SEG-NH6-02',
    corridorName: 'NH-6 Sonapur to Shillong Pass',
    reason: 'Landslide / Mudflow',
    customReason: '',
    severity: 'full', // 'partial' | 'full'
    clearanceTime: '6_hours', // '2_hours' | '6_hours' | '24_hours' | 'unknown'
    coordinates: null,
    linkedIncidentId: ''
  });

  const { data: emergencyData, refetch } = useQuery({
    queryKey: ['emergencyStatus'],
    queryFn: () => emergencyService.getEmergencyStatus()
  });

  const { data: roadsData, refetch: refetchRoads } = useQuery({
    queryKey: ['roads'],
    queryFn: () => roadService.getRoadSegments()
  });

  const metrics = emergencyData?.metrics || {
    blockedCount: 2,
    safeCorridorCount: 8,
    criticalIncidentsCount: 3,
    priorityConvoysCount: 4
  };

  const blockedSegments = roadsData?.data?.filter(r => r.isBlocked || r.status === 'blocked') || emergencyData?.blockedSegments || [];
  const safeCorridors = emergencyData?.safeCorridors || [];
  const roadSegments = roadsData?.data || [];

  const handleToggleDistrict = (d) => {
    if (selectedDistricts.includes(d)) {
      setSelectedDistricts(selectedDistricts.filter(item => item !== d));
    } else {
      setSelectedDistricts([...selectedDistricts, d]);
    }
  };

  const handleConfirmToggle = async () => {
    if (!isEmergencyActive && typedPhrase.trim().toUpperCase() !== 'ACTIVATE RED ALERT') {
      showToast('Please type "ACTIVATE RED ALERT" to confirm', 'warning');
      return;
    }

    setToggling(true);
    try {
      const newTitle = isEmergencyActive
        ? 'REGIONAL DISASTER PROTOCOL (STANDBY)'
        : `RED ALERT PHASE 2: ${selectedDistricts.length} DISTRICTS ESCALATED`;
      const newSummary = isEmergencyActive
        ? 'Standard monitoring mode restored.'
        : crisisReason;

      await toggleEmergency(!isEmergencyActive, newTitle, newSummary);
      refetch();
      showToast(
        !isEmergencyActive ? 'RED ALERT: Emergency Protocol Activated' : 'Emergency Protocol Deactivated',
        !isEmergencyActive ? 'error' : 'info'
      );
      setConfirmModalOpen(false);
      setTypedPhrase('');
    } catch {
      showToast('Failed to update emergency state', 'error');
    } finally {
      setToggling(false);
    }
  };

  const handleSendSOSBroadcast = async () => {
    try {
      await alertService.broadcastAlert({
        title: 'EMERGENCY SOS: CLEAR CORRIDORS FOR RELIEF CONVOYS',
        message: 'All commercial transit halted on NH-6 & NH-13. Emergency Medical Convoys have absolute priority.',
        severity: 'critical',
        scope: 'all',
        channels: ['in_app', 'sms', 'push']
      });
      playNotificationSound('critical_alert');
      showToast('Emergency SOS Broadcast dispatched to all responders', 'error');
    } catch {
      showToast('Broadcast transmission failed', 'error');
    }
  };

  // Map Click Handler in Select-on-Map mode
  const handleMapSelect = (coords) => {
    setBlockForm(prev => ({
      ...prev,
      coordinates: [coords.lng, coords.lat],
      corridorName: `Map Point [${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}]`
    }));
    setSelectingOnMap(false);
    setRoadBlockModalOpen(true);
    showToast(`Captured map blockage coordinates: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`, 'success');
  };

  // Submit Road Block Declaration (Priority 9)
  const handleDeclareRoadBlock = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        segmentId: blockForm.corridorId !== 'other' ? blockForm.corridorId : undefined,
        corridorName: blockForm.corridorId !== 'other'
          ? KNOWN_CORRIDORS.find(c => c.id === blockForm.corridorId)?.name || blockForm.corridorName
          : blockForm.corridorName,
        reason: blockForm.reason,
        customReason: blockForm.reason === 'Other' ? blockForm.customReason : blockForm.reason,
        severity: blockForm.severity,
        coordinates: blockForm.coordinates,
        linkedIncidentId: blockForm.linkedIncidentId
      };

      await emergencyService.declareRoadBlock(payload);
      refetch();
      refetchRoads();
      queryClient.invalidateQueries({ queryKey: ['roads'] });
      queryClient.invalidateQueries({ queryKey: ['emergencyStatus'] });
      playNotificationSound('critical_alert');
      showToast(`Road block declared on ${payload.corridorName}. Dynamic routing avoidance active.`, 'error');
      setRoadBlockModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to declare road block', 'error');
    }
  };

  // Clear Road Block Action
  const handleClearBlock = async (segmentId) => {
    try {
      await emergencyService.clearRoadBlock(segmentId);
      refetch();
      refetchRoads();
      queryClient.invalidateQueries({ queryKey: ['roads'] });
      queryClient.invalidateQueries({ queryKey: ['emergencyStatus'] });
      playNotificationSound('success');
      showToast('Corridor blockage cleared and reopened to convoys.', 'success');
    } catch (err) {
      showToast('Failed to clear road block', 'error');
    }
  };

  return (
    <PageShell
      title="Emergency Command & Disaster Protocols"
      description="Inter-agency crisis escalation, red alert green-corridor enforcement, situation reports, and live road-block declarations"
      breadcrumbs={['Dashboard', 'Emergency']}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setRoadBlockModalOpen(true)}
            icon={Ban}
          >
            Declare Road Block
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSendSOSBroadcast}
            icon={Radio}
          >
            Dispatch SOS Broadcast
          </Button>

          <Button
            variant={isEmergencyActive ? 'danger' : 'outline'}
            size="sm"
            onClick={() => setConfirmModalOpen(true)}
            icon={Power}
          >
            {isEmergencyActive ? 'Deactivate Red Alert' : 'Activate Red Alert'}
          </Button>
        </div>
      }
    >
      {/* Top Banner indicating Active Crisis state */}
      {isEmergencyActive && (
        <div className="p-4 rounded-xl border-2 border-red-500 bg-red-500/10 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold animate-pulse shadow-md shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded bg-red-600 text-white">RED ALERT PHASE 2</span>
                <span className="text-xs font-mono text-red-700 dark:text-red-300 font-bold">EMERGENCY DIRECTIVE ACTIVE</span>
              </div>
              <p className="text-xs font-bold text-text-primary mt-0.5">{emergencyTitle}</p>
              <p className="text-[11px] text-text-secondary">{operationalSummary}</p>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={() => fetchSitRep()} loading={loadingSitRep} icon={Sparkles}>
            Regenerate AI SitRep
          </Button>
        </div>
      )}

      {/* 4 Emergency Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Blocked Highway Sectors"
          value={blockedSegments.length}
          subtitle="Impassable road impasses"
          variant="danger"
          icon={Ban}
        />
        <StatCard
          title="Enforced Green Corridors"
          value={metrics.safeCorridorCount}
          subtitle="Priority medical passages"
          variant="success"
          icon={ShieldCheck}
        />
        <StatCard
          title="Critical Field Hazards"
          value={metrics.criticalIncidentsCount}
          subtitle="Confirmed mudslides & floods"
          variant="warning"
          icon={AlertTriangle}
        />
        <StatCard
          title="Priority Relief Convoys"
          value={metrics.priorityConvoysCount}
          subtitle="Tracked emergency freight"
          variant="primary"
          icon={Truck}
        />
      </div>

      {/* Main Split: Emergency GIS Corridor Map + Road Blockages Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Emergency GIS Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-primary">Emergency Corridors & Road Blocks</span>
                  {selectingOnMap && (
                    <Badge variant="danger" size="sm" className="animate-pulse">
                      CLICK MAP TO SELECT LOCATION
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={selectingOnMap ? 'danger' : 'outline'}
                    size="xs"
                    onClick={() => setSelectingOnMap(!selectingOnMap)}
                    icon={Crosshair}
                  >
                    {selectingOnMap ? 'Cancel Map Select' : 'Select Block on Map'}
                  </Button>
                </div>
              </div>
            }
            padding={false}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 min-h-[420px]">
              <MapContainer
                mode="emergency"
                roadSegments={roadSegments}
                selectingOnMap={selectingOnMap}
                onMapSelectSegment={handleMapSelect}
                height="100%"
                className="rounded-none border-none"
              />
            </div>
            <div className="p-2.5 bg-bg-subtle/80 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted">
              <span>Red dashed lines indicate declared road blocks (AI routing dynamically avoids them).</span>
              <span className="font-mono text-[10px]">Auto-Repaint via ResizeObserver</span>
            </div>
          </Card>
        </div>

        {/* Active Blockages List & Clearance Table (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-text-primary">Active Road Blockages ({blockedSegments.length})</span>
                <Button variant="danger" size="xs" onClick={() => setRoadBlockModalOpen(true)} icon={Plus}>
                  Declare Block
                </Button>
              </div>
            }
            className="flex-1 flex flex-col"
          >
            {blockedSegments.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="font-bold text-text-primary">All Mountain Trunk Corridors Clear</p>
                <p>No active roadblocks declared. Convoys moving on standard optimal graph paths.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {blockedSegments.map((seg) => (
                  <div
                    key={seg.segmentId || seg._id}
                    className="p-3.5 rounded-xl border border-red-300 dark:border-red-900 bg-red-500/5 space-y-2 relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:bg-red-600 before:rounded-r"
                  >
                    <div className="flex items-start justify-between pl-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Ban className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <p className="text-xs font-bold text-text-primary">{seg.name || seg.segmentId}</p>
                        </div>
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-0.5">
                          Cause: {seg.blockageReason || 'Severe Mudslide Obstruction'}
                        </p>
                      </div>
                      <Badge variant="danger" size="sm">BLOCKED</Badge>
                    </div>

                    <div className="pl-2 text-[11px] text-text-muted flex items-center justify-between border-t border-border-subtle pt-2">
                      <span className="font-mono">Risk: {seg.currentRiskScore || 95}/100</span>
                      <button
                        onClick={() => handleClearBlock(seg.segmentId || seg._id)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-xs"
                      >
                        <Check className="w-3 h-3" /> Mark Cleared
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* AI Grounded Military-grade Situation Report (SitRep) */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="font-bold text-text-primary">Military-Grade Tactical Situation Report (SitRep)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  navigator.clipboard.writeText(sitRep);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  showToast('SitRep copied to clipboard', 'info');
                }}
                icon={copied ? Check : Copy}
              >
                {copied ? 'Copied' : 'Copy SitRep'}
              </Button>
              <Button
                variant="primary"
                size="xs"
                onClick={() => fetchSitRep()}
                loading={loadingSitRep}
                icon={RefreshCw}
              >
                Generate SitRep
              </Button>
            </div>
          </div>
        }
      >
        <div className="p-4 rounded-xl bg-bg-subtle border border-border-subtle font-mono text-xs text-text-primary leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
          {sitRep || 'Click "Generate SitRep" to compile live inter-agency ground intelligence across all 8 NER states.'}
        </div>
      </Card>

      {/* Declare Road Block Modal (Priority 9) */}
      <Modal
        open={roadBlockModalOpen}
        onClose={() => setRoadBlockModalOpen(false)}
        title="Declare Road Blockage & Dynamic Reroute Directive"
      >
        <form onSubmit={handleDeclareRoadBlock} className="space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            Declaring a road block immediately updates the shared routing graph so all convoy calculations bypass this segment, and alerts all affected drivers in real-time.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">Corridor / Highway Segment</label>
            <Select
              value={blockForm.corridorId}
              onChange={(e) => {
                const selected = KNOWN_CORRIDORS.find(c => c.id === e.target.value);
                setBlockForm({
                  ...blockForm,
                  corridorId: e.target.value,
                  corridorName: selected?.name || ''
                });
              }}
              options={KNOWN_CORRIDORS.map(c => ({ value: c.id, label: c.name }))}
            />
          </div>

          {blockForm.corridorId === 'other' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-primary">Custom Corridor Name / Location</label>
              <Input
                placeholder="e.g. NH-15 Banderdewa to Itanagar Approach"
                value={blockForm.corridorName}
                onChange={(e) => setBlockForm({ ...blockForm, corridorName: e.target.value })}
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">Cause / Hazard Reason</label>
            <Select
              value={blockForm.reason}
              onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
              options={BLOCKAGE_REASONS.map(r => ({ value: r, label: r }))}
            />
          </div>

          {blockForm.reason === 'Other' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-primary">Specify Cause Details</label>
              <Input
                placeholder="Describe reason for blockage..."
                value={blockForm.customReason}
                onChange={(e) => setBlockForm({ ...blockForm, customReason: e.target.value })}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-primary">Severity</label>
              <Select
                value={blockForm.severity}
                onChange={(e) => setBlockForm({ ...blockForm, severity: e.target.value })}
                options={[
                  { value: 'full', label: 'Full Impasse (Impassable)' },
                  { value: 'partial', label: 'Partial / Single-Lane (Heavy Caution)' }
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-primary">Estimated Clearance</label>
              <Select
                value={blockForm.clearanceTime}
                onChange={(e) => setBlockForm({ ...blockForm, clearanceTime: e.target.value })}
                options={[
                  { value: '2_hours', label: '~2 Hours (Rapid Crew)' },
                  { value: '6_hours', label: '~6 Hours (Standard Earthmovers)' },
                  { value: '24_hours', label: '24+ Hours (Major Engineering)' },
                  { value: 'unknown', label: 'Unknown / Ongoing Assessment' }
                ]}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRoadBlockModalOpen(false);
                setSelectingOnMap(true);
              }}
              icon={Crosshair}
            >
              Pick Exact Point on Map
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setRoadBlockModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm" icon={Ban}>
                Declare & Dispatch Reroute
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Red Alert Activation */}
      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title={isEmergencyActive ? 'Deactivate Red Alert Protocol' : 'AUTHORIZATION: Activate Red Alert Protocol'}
      >
        <div className="space-y-4 text-xs">
          {!isEmergencyActive ? (
            <>
              <p className="text-text-secondary leading-relaxed">
                Activating Red Alert enforces priority green corridors, halts non-essential heavy transport across chosen sectors, and authorizes emergency rerouting.
              </p>
              <div className="space-y-1">
                <label className="font-semibold text-text-primary">Escalated District Sectors</label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-bg-subtle border border-border-subtle max-h-36 overflow-y-auto">
                  {NER_DISTRICT_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleToggleDistrict(d)}
                      className={`px-2 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                        selectedDistricts.includes(d) ? 'bg-red-600 text-white' : 'bg-bg-elevated text-text-secondary hover:bg-bg-subtle'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-primary">Type "ACTIVATE RED ALERT" to confirm</label>
                <Input
                  value={typedPhrase}
                  onChange={(e) => setTypedPhrase(e.target.value)}
                  placeholder="ACTIVATE RED ALERT"
                  className="font-mono"
                />
              </div>
            </>
          ) : (
            <p className="text-text-secondary leading-relaxed">
              Deactivating will return the command system to standard monitoring mode and dismiss the green corridor restrictions.
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button variant="ghost" size="sm" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={isEmergencyActive ? 'outline' : 'danger'}
              size="sm"
              loading={toggling}
              onClick={handleConfirmToggle}
            >
              {isEmergencyActive ? 'Deactivate Protocol' : 'Confirm Red Alert'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}

export default EmergencyMode;
