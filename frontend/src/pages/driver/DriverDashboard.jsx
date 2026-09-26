import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Phone,
  Mic,
  Clock,
  Navigation,
  Crosshair,
  Volume2,
  Radio,
  Package,
  Fuel,
  Gauge,
  ArrowRight,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  Shuffle
} from 'lucide-react';
import { DriverShell } from '../../components/driver/DriverShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { showToast } from '../../components/ui/Toast';
import { MapContainer } from '../../components/map/MapContainer';
import { NER_EDGES } from '../../lib/routing/nerGraphData';
import { getSocket } from '../../services/socket';

export function DriverDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);

  // Dynamic driver state
  const [routeStatus, setRouteStatus] = useState('caution');
  const [statusMessage, setStatusMessage] = useState('Monsoon mist and slow heavy-vehicle traffic ahead near Nongpoh. Speed cap: 40 km/h.');
  const [activeBlockage, setActiveBlockage] = useState(null);

  useEffect(() => {
    const socket = getSocket();

    const handleRoadBlocked = (blockage) => {
      setActiveBlockage(blockage);
      setRouteStatus('blocked');
      setStatusMessage(`ROAD IMPASSABLE: ${blockage.corridorName || blockage.segmentName || 'NH-6 segment'} blocked due to ${blockage.reason || 'landslide'}. Recalculating alternative route.`);
      setAcknowledged(false);
      showToast('CRITICAL: Road block detected on your corridor! Alternative route available.', 'error');
    };

    const handleDriverNotif = (notif) => {
      if (notif.status) setRouteStatus(notif.status);
      if (notif.message) setStatusMessage(notif.message);
      showToast('Directive received from Joint Command Center', 'info');
    };

    socket.on('road:blocked', handleRoadBlocked);
    socket.on('driver:notification', handleDriverNotif);

    return () => {
      socket.off('road:blocked', handleRoadBlocked);
      socket.off('driver:notification', handleDriverNotif);
    };
  }, []);

  // Driver telemetry and route state
  const driverData = {
    driverName: 'Bikash Borah',
    driverPhone: '+91 94351 22891',
    vehicleId: 'NER-CONVOY-101',
    regPlate: 'AS-01-EC-4412',
    cargoType: 'Life-Saving Pediatric Vaccines',
    cargoCategory: 'Medicines',
    origin: 'Guwahati Central Logistics Hub',
    originDistrict: 'Kamrup Metropolitan, Assam',
    destination: 'Shillong Staging Depot',
    destinationDistrict: 'East Khasi Hills, Meghalaya',
    corridorName: 'NH-6 Mountain Corridor',
    routeStatus: routeStatus,
    statusMessage: statusMessage,
    hasAlternativeApproved: true,
    eta: '1h 25m (16:15 IST)',
    distanceRemainingKm: 42.5,
    totalDistanceKm: 98.4,
    speedKmph: 38,
    fuelPct: 84,
    altitudeM: 1120,
    nextCheckpoint: 'Nongpoh Transit Barrier (ETA: 15:40 IST)',
    coordinates: [91.8150, 25.8850]
  };

  // Extract authentic curving road geometry from NER_EDGES
  const primaryEdge = NER_EDGES.find(e => e.from === 'AS-KAM' && e.to === 'ML-EKH');
  const driverRoute = {
    title: 'NH-6 Guwahati-Shillong Expressway',
    originName: 'Guwahati Terminal',
    destinationName: 'Shillong Depot',
    distanceKm: 98.4,
    totalDistanceKm: 98.4,
    coordinates: primaryEdge ? primaryEdge.coordinates : [[91.7362, 26.1445], [91.8150, 25.8850], [91.8933, 25.5788]],
    pathCoordinates: primaryEdge ? primaryEdge.coordinates : [[91.7362, 26.1445], [91.8150, 25.8850], [91.8933, 25.5788]],
    type: 'approved'
  };

  const handleAcknowledge = () => {
    setAcknowledged(true);
    showToast('Acknowledgement transmitted to Joint Command Center', 'success');
  };

  const handleRecenter = () => {
    setRecenterKey(prev => prev + 1);
    showToast('Map recentered on your vehicle position', 'info');
  };

  const statusBg =
    driverData.routeStatus === 'clear'
      ? 'bg-emerald-600 text-white'
      : driverData.routeStatus === 'caution'
        ? 'bg-amber-500 text-slate-950'
        : 'bg-red-600 text-white';

  const statusIcon =
    driverData.routeStatus === 'clear' ? (
      <CheckCircle2 className="w-7 h-7 shrink-0" />
    ) : driverData.routeStatus === 'caution' ? (
      <AlertTriangle className="w-7 h-7 shrink-0" />
    ) : (
      <ShieldAlert className="w-7 h-7 shrink-0" />
    );

  return (
    <DriverShell vehicleId={driverData.vehicleId}>
      <div className="space-y-3">
        {/* 1. TOP ROUTE STATUS BANNER */}
        <div className={`p-4 rounded-2xl shadow-md space-y-2 transition-all ${statusBg}`}>
          <div className="flex items-center gap-3">
            {statusIcon}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 block">
                {t('driver.routeStatus', 'My Route Status')}
              </span>
              <h2 className="text-base sm:text-lg font-black leading-tight truncate">
                {driverData.routeStatus === 'clear'
                  ? t('driver.routeClear', 'Route clear — proceed normally')
                  : driverData.routeStatus === 'caution'
                    ? t('driver.cautionAhead', 'Caution ahead — reduced speed advised')
                    : t('driver.routeBlocked', 'Route blocked — await instructions')}
              </h2>
            </div>
          </div>

          <p className="text-xs font-medium bg-black/15 p-2 rounded-xl leading-relaxed">
            {driverData.statusMessage}
          </p>
        </div>

        {/* 2. ACTIVE MISSION & TRIP MANIFEST WINDOW (FROM -> TO) */}
        <div className="p-4 rounded-2xl border bg-bg-elevated shadow-sm space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Active Mission Manifest</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent font-bold text-[11px]">
              {driverData.corridorName}
            </span>
          </div>

          {/* Origin to Destination Route Visual Box */}
          <div className="p-3.5 rounded-xl bg-bg-subtle/80 border border-border-subtle space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center pt-1">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                <div className="w-0.5 h-8 bg-border-strong my-0.5" />
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white shadow-sm" />
              </div>
              <div className="flex-1 space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-text-muted font-mono uppercase block font-semibold">FROM (ORIGIN)</span>
                  <div className="font-bold text-text-primary text-sm">{driverData.origin}</div>
                  <div className="text-[11px] text-text-muted">{driverData.originDistrict}</div>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-mono uppercase block font-semibold">TO (DESTINATION)</span>
                  <div className="font-bold text-text-primary text-sm">{driverData.destination}</div>
                  <div className="text-[11px] text-text-muted">{driverData.destinationDistrict}</div>
                </div>
              </div>
            </div>

            {/* Checkpoint Progress Line */}
            <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px]">
              <span className="text-text-muted">Next Checkpoint:</span>
              <span className="font-semibold text-text-primary">{driverData.nextCheckpoint}</span>
            </div>
          </div>

          {/* 4 Live Telemetry Badges: Speed, Fuel, Distance, ETA */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-bg-subtle border border-border-subtle flex items-center gap-2.5">
              <Gauge className="w-4 h-4 text-accent shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-text-muted block">Speed</span>
                <span className="font-bold font-mono text-text-primary truncate">{driverData.speedKmph} km/h</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-bg-subtle border border-border-subtle flex items-center gap-2.5">
              <Fuel className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-text-muted block">Fuel</span>
                <span className="font-bold font-mono text-text-primary truncate">{driverData.fuelPct}%</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-bg-subtle border border-border-subtle flex items-center gap-2.5">
              <Navigation className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-text-muted block">Remaining</span>
                <span className="font-bold font-mono text-text-primary truncate">{driverData.distanceRemainingKm} km</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-bg-subtle border border-border-subtle flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-purple-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-text-muted block">ETA</span>
                <span className="font-bold font-mono text-text-primary truncate">16:15 IST</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. FULL DRIVER MAP WITH REAL-ROAD ROUTE & FLOATING CONTROLS */}
        <div className="relative rounded-2xl overflow-hidden border shadow-sm" style={{ borderColor: 'var(--border-subtle)' }}>
          <MapContainer
            key={recenterKey}
            mode="driver"
            center={driverData.coordinates}
            zoom={10}
            showCorridors={false}
            candidateRoutes={[driverRoute]}
            vehicles={[
              {
                vehicleId: driverData.vehicleId,
                status: 'in_transit',
                speedKmph: driverData.speedKmph,
                coordinates: driverData.coordinates,
                driver: { name: driverData.driverName }
              }
            ]}
            incidents={[
              {
                title: 'Monsoon Mist Caution near Nongpoh',
                coordinates: [91.8400, 25.7500],
                severity: 3
              }
            ]}
            height="380px"
          />

          {/* Floating Action Buttons Over Map */}
          <div className="absolute bottom-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none">
            {/* Left: Recenter Target Button */}
            <button
              onClick={handleRecenter}
              className="pointer-events-auto w-12 h-12 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-slate-700 shadow-lg text-slate-800 dark:text-slate-100 flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer"
              title="Recenter Map on My Vehicle"
            >
              <Crosshair className="w-5 h-5 text-accent" />
            </button>

            {/* Center: Large Floating Voice Report Button */}
            <button
              onClick={() => navigate('/driver/report')}
              className="pointer-events-auto h-13 px-5 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <Mic className="w-5 h-5" />
              <span>{t('driver.voiceReport', 'Voice Report')}</span>
            </button>

            {/* Right: Alternative Route Button (If Approved) */}
            {driverData.hasAlternativeApproved && (
              <button
                onClick={() => navigate('/driver/alternative-route')}
                className="pointer-events-auto h-13 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition cursor-pointer animate-pulse"
              >
                <Shuffle className="w-4 h-4" />
                <span>Alt Route</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. EXPANDABLE BOTTOM SHEET (Telemetry & Checkpoints) */}
        <Card className="p-3.5 space-y-3">
          <button
            onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold text-text-primary cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-accent" />
              <span>{driverData.vehicleId} • {driverData.driverName}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-text-muted">
              <span>{bottomSheetExpanded ? 'Collapse' : 'Expand Details'}</span>
              {bottomSheetExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </button>

          {/* Collapsed summary strip */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="p-2 rounded-xl bg-bg-subtle border border-border-subtle">
              <span className="text-[10px] text-text-muted block font-sans">SPEED</span>
              <b className="text-text-primary">{driverData.speedKmph} km/h</b>
            </div>
            <div className="p-2 rounded-xl bg-bg-subtle border border-border-subtle">
              <span className="text-[10px] text-text-muted block font-sans">REMAINING</span>
              <b className="text-text-primary">{driverData.distanceRemainingKm} km</b>
            </div>
            <div className="p-2 rounded-xl bg-bg-subtle border border-border-subtle">
              <span className="text-[10px] text-text-muted block font-sans">FUEL</span>
              <b className="text-amber-500">{driverData.fuelPct}%</b>
            </div>
          </div>

          {/* Expanded full details */}
          {bottomSheetExpanded && (
            <div className="pt-2 border-t space-y-2.5 text-xs animate-in fade-in" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="p-2.5 rounded-xl bg-bg-subtle border border-border-subtle space-y-1">
                <span className="text-[10px] font-bold uppercase text-accent tracking-wider block">Assigned Cargo</span>
                <p className="font-semibold text-text-primary">{driverData.cargoType}</p>
                <p className="text-[11px] text-text-muted">Cold Chain Target: 2°C to 8°C (Monitored)</p>
              </div>

              <div className="p-2.5 rounded-xl bg-bg-subtle border border-border-subtle flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent shrink-0" />
                <span className="text-text-secondary truncate">{driverData.nextCheckpoint}</span>
              </div>

              <button
                onClick={handleAcknowledge}
                className={`w-full h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${acknowledged
                    ? 'bg-emerald-600 text-white'
                    : 'bg-bg-elevated border border-border-subtle text-text-primary hover:bg-bg-subtle'
                  }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{acknowledged ? 'Condition Acknowledged ✓' : t('driver.confirmedUpdate', "Confirm I've seen the update")}</span>
              </button>
            </div>
          )}
        </Card>
      </div>
    </DriverShell>
  );
}

export default DriverDashboard;
