import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Route,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  MapPin,
  Shuffle
} from 'lucide-react';
import { DriverShell } from '../../components/driver/DriverShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { showToast } from '../../components/ui/Toast';
import { MapContainer } from '../../components/map/MapContainer';
import { NER_EDGES } from '../../lib/routing/nerGraphData';

export function DriverAlternativeRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedRouteKey, setSelectedRouteKey] = useState('approved'); // 'approved' | 'original' | 'unapproved'

  // Extract real road coordinates
  const primaryEdge = NER_EDGES.find(e => e.from === 'AS-KAM' && e.to === 'ML-EKH');
  const passEdge = NER_EDGES.find(e => e.id === 'EDGE-AS-KAM-ML-EKH-ALT-PASS') || primaryEdge;
  const localEdge = NER_EDGES.find(e => e.id === 'EDGE-AS-KAM-ML-EKH-ALT-LOCAL') || primaryEdge;

  const routes = {
    original: {
      name: 'Primary NH-6 Expressway (Guwahati → Shillong)',
      distanceKm: 98.4,
      etaHours: '2h 15m',
      status: 'blocked',
      reason: 'Sonapur tunnel approach blocked by heavy monsoon mudflow (45m span). Impassable to commercial logistics.',
      coordinates: primaryEdge ? primaryEdge.coordinates : [[91.7362, 26.1445], [91.8150, 25.8850], [91.8933, 25.5788]]
    },
    approved: {
      name: 'Rani & Umsning Ridge Mountain Bypass (Approved Alternative)',
      distanceKm: 114.0,
      etaHours: '3h 10m',
      extraTime: '+55 minutes',
      approvedBy: 'Commandant R. K. Sharma',
      approvedTime: '14:32 IST',
      roadCondition: 'Cleared by Border Roads Organization Taskforce 77. All bridges inspected and open.',
      coordinates: passEdge ? passEdge.coordinates : [[91.7362, 26.1445], [92.2000, 26.1500], [92.5500, 25.8500], [91.8933, 25.5788]]
    },
    unapproved: {
      name: 'Garo Foothills Valley Trail (Unpaved)',
      distanceKm: 126.0,
      etaHours: '3h 45m',
      status: 'unapproved',
      warning: 'High landslide susceptibility and steep 38° slope. NOT authorized for heavy vaccine carriers.',
      coordinates: localEdge ? localEdge.coordinates : [[91.7362, 26.1445], [91.6800, 25.9500], [91.7500, 25.7800], [91.8933, 25.5788]]
    }
  };

  const candidateMapRoutes = [
    {
      title: routes.approved.name,
      originName: 'Guwahati Terminal',
      destinationName: 'Shillong Depot',
      distanceKm: routes.approved.distanceKm,
      totalDistanceKm: routes.approved.distanceKm,
      coordinates: routes.approved.coordinates,
      pathCoordinates: routes.approved.coordinates,
      type: 'approved'
    }
  ];

  const handleAcceptRoute = () => {
    showToast('Accepted Commandant-Approved Route. Telemetry stream updated.', 'success');
    navigate('/driver');
  };

  return (
    <DriverShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/driver')}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary p-2 rounded-lg hover:bg-bg-subtle transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Route</span>
          </button>
          <span className="text-xs font-mono font-bold text-accent">NER-CONVOY-101</span>
        </div>

        <div>
          <h1 className="text-xl font-black text-text-primary">Alternative Route Options</h1>
          <p className="text-xs text-text-muted">Review Commandant authorization before proceeding along alternate corridor</p>
        </div>

        {/* Interactive Map Comparing Routes */}
        <div className="relative rounded-2xl overflow-hidden border shadow-sm" style={{ borderColor: 'var(--border-subtle)' }}>
          <MapContainer
            mode="driver"
            center={[91.8150, 25.8850]}
            zoom={10}
            showCorridors={false}
            candidateRoutes={candidateMapRoutes}
            vehicles={[
              {
                vehicleId: 'NER-CONVOY-101',
                status: 'caution_zone',
                speedKmph: 28,
                coordinates: [91.8150, 25.8850],
                driver: { name: 'Bikash Borah' }
              }
            ]}
            incidents={[
              {
                title: 'Blocked Sector: Sonapur Tunnel Landslide',
                coordinates: [92.3500, 25.2800],
                severity: 5
              }
            ]}
            height="280px"
          />
        </div>

        {/* 1. ORIGINAL ROUTE (Blocked) */}
        <div className="p-4 rounded-2xl border border-red-500/50 bg-red-50 dark:bg-red-950/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> {t('driver.originalRoute', 'Your Original Route (BLOCKED)')}
            </span>
            <Badge variant="danger" size="sm">IMPASSABLE</Badge>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{routes.original.name}</h3>
          <p className="text-xs text-red-700 dark:text-red-300 font-medium leading-relaxed">
            {routes.original.reason}
          </p>
          <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
            Distance: {routes.original.distanceKm} km • Expected: {routes.original.etaHours}
          </div>
        </div>

        {/* 2. COMMANDANT-APPROVED ROUTE (Primary Recommended Option) */}
        <div
          className="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-md space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {t('driver.approvedRoute', 'Commandant-Approved Route')}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider">
              OFFICIAL CLEARANCE
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
            {routes.approved.name}
          </h2>

          {/* Commandant Approval Stamp Box */}
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-400 text-xs font-mono space-y-1">
            <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Approved by {routes.approved.approvedBy}</span>
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-[11px]">
              Timestamp: {routes.approved.approvedTime} • Extra transit delay: <b className="text-amber-600 dark:text-amber-400">{routes.approved.extraTime}</b>
            </div>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            {routes.approved.roadCondition}
          </p>

          {/* Large Acceptance Button */}
          <button
            onClick={handleAcceptRoute}
            className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg active:scale-[0.98] transition-all cursor-pointer mt-2"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span>{t('driver.acceptRoute', 'Accept & Start this Approved Route')}</span>
          </button>
        </div>

        {/* 3. OTHER UNAPPROVED OPTIONS */}
        <div className="p-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 space-y-2 opacity-80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t('driver.otherOptions', 'Other Options')}
            </span>
            <Badge variant="warning" size="sm">NOT APPROVED — DO NOT TAKE</Badge>
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{routes.unapproved.name}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {routes.unapproved.warning}
          </p>
        </div>
      </div>
    </DriverShell>
  );
}

export default DriverAlternativeRoute;
