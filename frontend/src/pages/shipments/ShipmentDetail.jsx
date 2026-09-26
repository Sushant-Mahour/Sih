import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Truck,
  MapPin,
  Clock,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Route,
  ArrowLeft,
  AlertTriangle,
  Radio,
  FileText,
  Navigation
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusPill } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { shipmentService } from '../../services/domainServices';
import { formatDate } from '../../utils/formatters';

export function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: shipmentRes, isLoading } = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => shipmentService.getShipmentById(id)
  });

  const shipment = shipmentRes?.data;

  if (isLoading) {
    return (
      <PageShell title="Loading Consignment Manifest...">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </PageShell>
    );
  }

  if (!shipment) {
    return (
      <PageShell title="Consignment Not Found">
        <EmptyState
          icon={Package}
          title="Consignment Manifest Not Found"
          description={`No consignment records registered under identifier: ${id}`}
          actionLabel="Back to Consignment Manifest"
          onAction={() => navigate('/shipments')}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`Consignment: ${shipment.shipmentId}`}
      subtitle={`${shipment.title} • Priority: ${shipment.priority?.toUpperCase()}`}
      breadcrumbs={['Dashboard', 'Consignments', shipment.shipmentId]}
      actionSlot={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/shipments')} icon={ArrowLeft}>
            All Consignments
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/routes?origin=${shipment.originDistrictId}&dest=${shipment.destinationDistrictId}`)}
            icon={Route}
          >
            Compute Bypass Route
          </Button>
        </div>
      }
    >
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Cargo Type & Mass"
          value={shipment.cargoType}
          subtitle={`Payload: ${shipment.weightKg || 850} kg`}
          icon={Package}
          variant="primary"
        />
        <StatCard
          title="Cold Chain Telemetry"
          value={shipment.currentTempC || '3.8°C'}
          subtitle={`Required: ${shipment.tempRequirementC || 'Ambient'}`}
          icon={Thermometer}
          variant={shipment.tempRequirementC && shipment.tempRequirementC.includes('2°C') ? 'safe' : 'primary'}
        />
        <StatCard
          title="Assigned Fleet Unit"
          value={shipment.assignedVehicleId || 'NER-CONVOY-101'}
          subtitle="Tata 4x4 High-Terrain"
          icon={Truck}
          variant="primary"
        />
        <StatCard
          title="Consignment Status"
          value={shipment.status?.replace('_', ' ').toUpperCase()}
          subtitle="GPS Live Tracking Active"
          icon={Radio}
          variant={shipment.status === 'rerouted' ? 'warning' : 'safe'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Transit Milestones (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card title="Transit Chain of Custody & Waypoint Milestones">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5" style={{ '--tw-before-bg': 'var(--border-subtle)' }}>
              <div className="absolute left-2.5 top-3 bottom-3 w-0.5" style={{ background: 'var(--border-subtle)' }} />
              {shipment.milestones?.map((m, i) => (
                <div key={i} className="relative flex items-start justify-between">
                  <div
                    className="absolute -left-6 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border"
                    style={{
                      background: m.completed ? 'var(--safe)' : 'var(--bg-subtle)',
                      borderColor: m.completed ? 'var(--safe)' : 'var(--border-subtle)',
                      color: m.completed ? '#FFFFFF' : 'var(--text-muted)'
                    }}
                  >
                    {m.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-2 h-2 fill-current" />}
                  </div>

                  <div className="ml-2">
                    <h4 className="text-sm font-semibold" style={{ color: m.completed ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {m.name}
                    </h4>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {m.completed ? 'Checkpoint Passed & Verified' : 'Pending Convoy Arrival'}
                    </p>
                  </div>

                  <span className="text-xs font-mono font-semibold" style={{ color: m.completed ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {m.time}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Info: Routing Endpoints & Reroute History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card title="Origin & Staging Logistics">
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-lg border space-y-1" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}>
                <span className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Origin Logistics Hub:
                </span>
                <b className="text-sm font-sans" style={{ color: 'var(--text-primary)' }}>{shipment.originName}</b>
              </div>
              <div className="p-3 rounded-lg border space-y-1" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}>
                <span className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Destination Receiving Bay:
                </span>
                <b className="text-sm font-sans text-emerald-600 dark:text-emerald-400">{shipment.destinationName}</b>
              </div>
            </div>
          </Card>

          {/* Dynamic Reroute Audit Log */}
          <Card title="Dynamic Reroute Audit Log">
            {(!shipment.rerouteHistory || shipment.rerouteHistory.length === 0) ? (
              <p className="text-xs py-2 text-center" style={{ color: 'var(--text-muted)' }}>
                No reroutes triggered. Convoy progressing along primary schedule.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {shipment.rerouteHistory.map((rh, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border space-y-1"
                    style={{
                      background: 'var(--warning-bg)',
                      borderColor: 'var(--warning)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      <span>REROUTE EVENT</span>
                      <span>{formatDate(rh.timestamp)}</span>
                    </div>
                    <p className="font-semibold text-xs leading-relaxed">{rh.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
