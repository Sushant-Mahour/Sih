import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Route,
  User,
  Phone,
  Package,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Compass,
  Zap,
  ShieldCheck,
  Fuel,
  Gauge
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { Badge, StatusPill } from '../../components/ui/Badge';
import { MapContainer } from '../../components/map/MapContainer';
import { vehicleService } from '../../services/domainServices';

export function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: vehicleRes, isLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehicleService.getVehicleById(id)
  });

  const vehicle = vehicleRes?.data;
  const shipment = vehicle?.activeShipment;

  if (isLoading) {
    return (
      <PageShell title="Loading Telemetry Feed…" breadcrumbs={['Dashboard', 'Live Map', id]}>
        <div className="py-20 text-center text-text-muted">Loading convoy telemetry…</div>
      </PageShell>
    );
  }

  if (!vehicle) {
    return (
      <PageShell title="Convoy Not Found" breadcrumbs={['Dashboard', 'Live Map']}>
        <Card className="text-center py-12 space-y-3">
          <p className="text-text-muted">No telemetry records found for convoy ID: {id}</p>
          <Button variant="primary" onClick={() => navigate('/map')} icon={ArrowLeft}>
            Return to Fleet Map
          </Button>
        </Card>
      </PageShell>
    );
  }

  // Calculate route crossed progress
  const routeCoords = vehicle.routeCoordinates || vehicle.pathCoordinates || [];
  const curCoords = vehicle.currentLocation?.coordinates || [91.8150, 25.8850];
  let closestIdx = 0;
  let minDistanceSq = Infinity;

  routeCoords.forEach((coord, idx) => {
    const distSq = Math.pow(coord[0] - curCoords[0], 2) + Math.pow(coord[1] - curCoords[1], 2);
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closestIdx = idx;
    }
  });

  const progressPct = routeCoords.length > 1 ? Math.min(100, Math.max(10, Math.round((closestIdx / (routeCoords.length - 1)) * 100))) : 65;
  const totalKm = 104.0;
  const traversedKm = Number(((progressPct / 100) * totalKm).toFixed(1));
  const remainingKm = Number((totalKm - traversedKm).toFixed(1));

  return (
    <PageShell
      title={`Telemetry: ${vehicle.vehicleId}`}
      description={`${vehicle.model || vehicle.type} • Registration: ${vehicle.registrationNumber}`}
      breadcrumbs={['Dashboard', 'Live Map', vehicle.vehicleId]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/map')} icon={ArrowLeft}>
            Fleet Map
          </Button>
          <Button
            variant="warning"
            size="sm"
            onClick={() => navigate(`/routes/planner?origin=${vehicle.activeShipment?.originDistrictId || 'AS-KAM'}&destination=${vehicle.activeShipment?.destinationDistrictId || 'ML-EKH'}`)}
            icon={Route}
          >
            Dynamic Reroute
          </Button>
        </div>
      }
    >
      {/* 4 StatCards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Current Speed"
          value={`${vehicle.speedKmph || 0} km/h`}
          subtitle={`Heading: ${vehicle.heading || 145}° SE`}
        />
        <StatCard
          title="Barometric Altitude"
          value={`${vehicle.altitudeM || 850} m`}
          subtitle="Mountain Slope Gauge"
        />
        <StatCard
          title="Fuel Reserve"
          value={`${vehicle.fuelLevelPct || 85}%`}
          subtitle="Diesel Payload"
          trend={{ isPositive: true, text: 'Optimal' }}
        />
        <StatCard
          title="Engine Temperature"
          value={`${vehicle.engineTempC || 84}°C`}
          subtitle="Nominal: 80–92°C"
          trend={{ isPositive: (vehicle.engineTempC || 84) < 90, text: 'Nominal' }}
        />
      </div>

      {/* Traversed Journey Progress Banner */}
      <Card className="p-4 bg-bg-surface border-border-subtle space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-accent" />
            <span className="text-text-primary text-sm font-bold">
              Highway Journey Progress: <b className="text-success">{progressPct}% Crossed</b>
            </span>
          </div>
          <span className="font-mono text-text-muted">
            <b className="text-text-primary">{traversedKm} km</b> traversed • <b className="text-text-secondary">{remainingKm} km</b> remaining to staging depot
          </span>
        </div>

        <div className="w-full h-2.5 bg-bg-subtle rounded-full overflow-hidden border border-border-subtle">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-accent to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Focused Coordinates Map (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card header="GPS Pinpoint & Heading Telemetry" padding={false} className="overflow-hidden">
            <div className="h-[440px] w-full">
              <MapContainer
                mode="convoys"
                center={vehicle.currentLocation?.coordinates || [91.8150, 25.8850]}
                vehicles={[vehicle]}
                selectedVehicleId={vehicle.vehicleId}
                height="100%"
                className="rounded-none border-none"
              />
            </div>
          </Card>
        </div>

        {/* Driver Profile & Active Consignment (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Driver Card */}
          <Card header="Assigned Convoy Lead">
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent text-white font-bold text-base flex items-center justify-center shadow-md">
                  {vehicle.driver?.name?.[0] || 'D'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">{vehicle.driver?.name}</h4>
                  <p className="text-text-muted">{vehicle.driver?.experienceYears || 12} Years Mountain Driving Experience</p>
                </div>
              </div>

              <div className="pt-2 border-t border-border-subtle space-y-2">
                <div className="flex items-center justify-between text-text-secondary">
                  <span className="text-text-muted">Direct Phone:</span>
                  <a href={`tel:${vehicle.driver?.phone}`} className="font-mono text-accent hover:underline font-semibold">
                    {vehicle.driver?.phone}
                  </a>
                </div>
                <div className="flex items-center justify-between text-text-secondary">
                  <span className="text-text-muted">License / Badge:</span>
                  <span className="font-mono text-text-primary">{vehicle.driver?.license || 'AS-COMM-8821'}</span>
                </div>
                <div className="flex items-center justify-between text-text-secondary">
                  <span className="text-text-muted">Safety Rating:</span>
                  <span className="font-semibold text-text-primary">★ {vehicle.driver?.rating || 4.9} / 5.0</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Shipment Card */}
          <Card header="Active Consignment Manifest">
            {shipment ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <Badge variant="primary">{shipment.cargoType}</Badge>
                  <StatusPill status={shipment.priority === 'critical' ? 'critical' : 'in_transit'} label={shipment.priority?.toUpperCase()} />
                </div>
                <h4 className="font-bold text-text-primary text-sm">{shipment.title}</h4>
                <div className="p-3 rounded-xl bg-bg-subtle border border-border-subtle space-y-1 font-mono text-text-secondary">
                  <div>Origin: <b className="text-text-primary">{shipment.originName}</b></div>
                  <div>Destination: <b className="text-text-primary">{shipment.destinationName}</b></div>
                  <div>Payload Weight: <b className="text-text-primary">{shipment.weightKg} kg</b></div>
                  <div>Temperature Target: <b className="text-accent">{shipment.tempRequirementC}</b></div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/shipments/${shipment.shipmentId}`)}
                >
                  View Consignment Details
                </Button>
              </div>
            ) : (
              <p className="text-xs text-text-muted py-4 text-center">No active consignment assigned to this unit.</p>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

export default VehicleDetail;
