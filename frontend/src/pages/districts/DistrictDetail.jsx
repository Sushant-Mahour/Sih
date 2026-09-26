import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  MapPin,
  Truck,
  CloudRain,
  Phone,
  ShieldCheck,
  ArrowLeft,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Mountain,
  Droplets,
  Radio,
  FileText
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { MapContainer } from '../../components/map/MapContainer';
import { districtService } from '../../services/domainServices';

export function DistrictDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: districtRes, isLoading } = useQuery({
    queryKey: ['district', id],
    queryFn: () => districtService.getDistrictById(id)
  });

  const district = districtRes?.data;

  if (isLoading) {
    return (
      <PageShell title="Loading District Dossier...">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </PageShell>
    );
  }

  if (!district) {
    return (
      <PageShell title="District Record Not Found">
        <EmptyState
          icon={Building2}
          title="District Not Found"
          description={`No operational records found for identifier: ${id}`}
          actionLabel="Back to District Directory"
          onAction={() => navigate('/districts')}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`District Command: ${district.name}`}
      subtitle={`${district.state} • Headquarters: ${district.hq} • Code: ${district.districtId}`}
      breadcrumbs={['Dashboard', 'Districts', district.name]}
      actionSlot={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/districts')} icon={ArrowLeft}>
            All Districts
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/routes?dest=${district.districtId}`)}
            icon={Navigation}
          >
            Plan Route Here
          </Button>
        </div>
      }
    >
      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Accessibility Index"
          value={`${district.currentAccessibilityScore || 0} / 100`}
          subtitle="Real-time road viability"
          icon={ShieldCheck}
          variant={district.currentAccessibilityScore >= 80 ? 'safe' : district.currentAccessibilityScore >= 60 ? 'warning' : 'danger'}
        />
        <StatCard
          title="Mean Elevation & Slope"
          value={`${district.elevationM || 500} m`}
          subtitle={`Average incline: ${district.avgSlopeDeg || 15}°`}
          icon={Mountain}
          variant="primary"
        />
        <StatCard
          title="Atmospheric Condition"
          value={`${district.weather?.tempC || 24}°C`}
          subtitle={district.weather?.condition || 'Monsoon Mist'}
          icon={CloudRain}
          variant="primary"
        />
        <StatCard
          title="Active Convoys"
          value={district.activeVehicles?.length || 0}
          subtitle="Monitored within boundary"
          icon={Truck}
          variant="safe"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: District Profile & Disaster Cell Contacts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Geographic & Risk Profile Card */}
          <Card title="Geographic & Risk Profile">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>State Administration</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{district.state}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>District Headquarters</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{district.hq}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Centroid Coordinates</span>
                <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                  {district.centroid ? `${district.centroid[1].toFixed(4)}°N, ${district.centroid[0].toFixed(4)}°E` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Landslide Susceptibility</span>
                <Badge variant={district.landslideSusceptibility === 'critical' ? 'danger' : 'warning'} size="sm">
                  {district.landslideSusceptibility}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Flood Inundation Risk</span>
                <Badge variant={district.floodSusceptibility === 'critical' ? 'danger' : 'safe'} size="sm">
                  {district.floodSusceptibility}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderColor: 'var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Rainfall Accumulation (24h)</span>
                <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{district.weather?.rainfallMm || 0} mm</span>
              </div>
            </div>
          </Card>

          {/* Emergency Operations & BRO Roster */}
          <Card title="District Disaster Cell & BRO Contacts">
            {(!district.emergencyContacts || district.emergencyContacts.length === 0) ? (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>No emergency contacts registered.</p>
            ) : (
              <div className="space-y-2.5">
                {district.emergencyContacts.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border flex items-center justify-between transition-colors"
                    style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                        {c.title}
                      </span>
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                    </div>
                    <a
                      href={`tel:${c.phone}`}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      style={{ color: 'var(--accent)', borderColor: 'var(--border-subtle)' }}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{c.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: District Interactive Map & Checkpoints (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* District Map */}
          <Card title="District Boundary & Road Network Topology" className="p-0 overflow-hidden">
            <div className="p-4 border-b text-xs flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                Displaying localized telemetry for <b>{district.name}</b> node
              </span>
              <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                Live GPS Vector Feed
              </span>
            </div>
            <MapContainer
              mode="convoys"
              center={district.centroid}
              zoom={9.5}
              districts={[district]}
              roadSegments={district.roadSegments || []}
              vehicles={district.activeVehicles || []}
              height="420px"
            />
          </Card>

          {/* Strategic Highway Checkpoints */}
          <Card title="Strategic Highway Checkpoints & Gateways">
            {(!district.checkpoints || district.checkpoints.length === 0) ? (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>No checkpoints recorded in this district sector.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {district.checkpoints.map((cp, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border flex items-center justify-between"
                    style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{cp.name}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>24/7 Monitored</div>
                      </div>
                    </div>
                    <Badge variant={cp.status === 'CLOSED' ? 'danger' : 'safe'} size="sm">
                      {cp.status || 'OPEN'}
                    </Badge>
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
