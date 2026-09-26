import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Truck,
  ChevronRight,
  Package,
  Gauge,
  Navigation,
  RefreshCw,
  Play,
  Pause,
  MapPin,
  Compass,
  Fuel,
  Phone,
  ShieldCheck,
  Zap,
  Layers,
  X
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { MapContainer } from '../../components/map/MapContainer';
import { StatusPill } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { vehicleService, districtService, roadService, incidentService } from '../../services/domainServices';
import { showToast } from '../../components/ui/Toast';

export function LiveMap() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isSimulating, setIsSimulating] = useState(true);

  const { data: vehiclesData, refetch: refetchVehicles, isFetching } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleService.getVehicles(),
    refetchInterval: isSimulating ? 3000 : false
  });

  const { data: districtsData } = useQuery({
    queryKey: ['districts'],
    queryFn: () => districtService.getDistricts()
  });

  const { data: roadsData } = useQuery({
    queryKey: ['roads'],
    queryFn: () => roadService.getRoadSegments()
  });

  const { data: incidentsData } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => incidentService.getIncidents()
  });

  const rawVehicles = vehiclesData?.data || [];
  const districts = districtsData?.data || [];
  const roadSegments = roadsData?.data || [];
  const incidents = incidentsData?.data || [];

  // Live Convoy Movement Simulation along authentic road coordinates
  const [simStep, setSimStep] = useState(0);

  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setSimStep((prev) => prev + 1);
    }, 1800);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Interpolate vehicle positions smoothly along their assigned road coordinates
  const vehicles = rawVehicles.map((v, vIdx) => {
    const coords = v.routeCoordinates || v.pathCoordinates || [];
    if (coords.length > 2) {
      const stepIdx = (simStep * 2 + vIdx * 8) % coords.length;
      const targetCoord = coords[stepIdx];
      const nextCoord = coords[(stepIdx + 1) % coords.length];
      const heading = nextCoord
        ? Math.round((Math.atan2(nextCoord[0] - targetCoord[0], nextCoord[1] - targetCoord[1]) * 180) / Math.PI)
        : v.heading || 90;

      return {
        ...v,
        currentLocation: { coordinates: targetCoord },
        heading: (heading + 360) % 360,
        speedKmph: v.status === 'idle' ? 0 : 38 + ((simStep + vIdx) % 12)
      };
    }
    return v;
  });

  // Keep selectedVehicle in sync with moving telemetry
  const activeVehicle = selectedVehicle
    ? vehicles.find((v) => v.vehicleId === selectedVehicle.vehicleId) || selectedVehicle
    : null;

  const filteredVehicles = vehicles.filter((v) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      v.vehicleId?.toLowerCase().includes(q) ||
      v.registrationNumber?.toLowerCase().includes(q) ||
      v.driver?.name?.toLowerCase().includes(q) ||
      v.activeShipment?.title?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    showToast(`Focused GPS tracking on ${vehicle.vehicleId}`, 'info');
  };

  // Calculate detailed journey stats for active selected vehicle
  let activeVehicleProgress = null;
  if (activeVehicle) {
    const routeCoords = activeVehicle.routeCoordinates || activeVehicle.pathCoordinates || [];
    const curCoords = activeVehicle.currentLocation?.coordinates || [91.7362, 26.1445];
    let closestIdx = 0;
    let minDistanceSq = Infinity;

    routeCoords.forEach((coord, idx) => {
      const distSq = Math.pow(coord[0] - curCoords[0], 2) + Math.pow(coord[1] - curCoords[1], 2);
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closestIdx = idx;
      }
    });

    const progressPct = routeCoords.length > 1 ? Math.min(100, Math.max(5, Math.round((closestIdx / (routeCoords.length - 1)) * 100))) : 50;
    const totalKm = 104.0;
    const traversedKm = Number(((progressPct / 100) * totalKm).toFixed(1));
    const remainingKm = Number((totalKm - traversedKm).toFixed(1));

    activeVehicleProgress = {
      progressPct,
      traversedKm,
      remainingKm,
      totalKm,
      closestIdx
    };
  }

  return (
    <PageShell
      title="Live Fleet & Corridor Telemetry"
      description="Real-time GPS positioning, traversed mountain corridor tracking, and active convoy telemetry across the North Eastern Region"
      breadcrumbs={['Dashboard', 'Live Map']}
      fluid
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant={isSimulating ? 'safe' : 'outline'}
            size="sm"
            onClick={() => {
              setIsSimulating(!isSimulating);
              showToast(isSimulating ? 'Live simulation paused' : 'Live convoy movement simulation active', 'info');
            }}
            icon={isSimulating ? Pause : Play}
          >
            {isSimulating ? 'Simulation: Live Moving' : 'Resume Simulation'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchVehicles()}
            loading={isFetching}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      }
    >
      <div className="relative w-full h-[calc(100vh-210px)] min-h-[550px] rounded-xl overflow-hidden border border-border-subtle bg-bg-subtle flex">
        {/* Full-width Interactive Map Container */}
        <div className="absolute inset-0">
          <MapContainer
            mode="convoys"
            center={activeVehicle?.currentLocation?.coordinates || [92.50, 26.00]}
            vehicles={vehicles}
            roadSegments={roadSegments}
            districts={districts}
            incidents={incidents}
            onVehicleClick={handleSelectVehicle}
            selectedVehicleId={activeVehicle?.vehicleId}
            height="100%"
            className="rounded-none border-none"
          />
        </div>

        {/* Floating Left Overlay Panel (Fleet Roster) */}
        <div className="relative z-10 m-3 w-80 max-w-[calc(100%-24px)] flex flex-col bg-bg-elevated border border-border-subtle rounded-xl shadow-xl overflow-hidden pointer-events-auto">
          {/* Panel Header */}
          <div className="p-3 border-b border-border-subtle bg-bg-subtle/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isSimulating ? 'bg-success animate-pulse' : 'bg-amber-500'}`} />
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Fleet Roster ({filteredVehicles.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-text-muted">
              {isSimulating ? 'Live Movement 3s' : 'Paused'}
            </span>
          </div>

          {/* Search & Filter Chips */}
          <div className="p-3 border-b border-border-subtle space-y-2 bg-bg-base">
            <Input
              placeholder="Search ID, driver, cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
              className="py-1 text-xs"
            />
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px]">
              {[
                { id: 'all', label: 'All' },
                { id: 'in_transit', label: 'In Transit' },
                { id: 'caution_zone', label: 'Caution' },
                { id: 'idle', label: 'Idle' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-accent text-white shadow-xs'
                      : 'bg-bg-subtle text-text-secondary hover:text-text-primary border border-border-subtle'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y divide-border-subtle/40">
            {filteredVehicles.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-muted">
                No vehicles matching "{search}"
              </div>
            ) : (
              filteredVehicles.map((v) => {
                const isSelected = activeVehicle?.vehicleId === v.vehicleId;
                return (
                  <div
                    key={v.vehicleId}
                    onClick={() => handleSelectVehicle(v)}
                    className={`p-3 rounded-xl transition cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-accent-subtle/80 border-2 border-accent shadow-sm'
                        : 'hover:bg-bg-subtle border border-border-subtle/40 bg-bg-elevated/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-text-primary">
                          {v.vehicleId}
                        </span>
                        <span className="text-xs text-text-secondary truncate max-w-[100px]">
                          {v.driver?.name}
                        </span>
                      </div>
                      <StatusPill status={v.status} />
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono text-text-secondary bg-bg-subtle/80 p-2 rounded-lg border border-border-subtle/50">
                      <div>
                        <span className="text-text-muted text-[10px] block font-sans font-semibold">SPEED</span>
                        <b className="text-text-primary">{v.speedKmph || 0} km/h</b>
                      </div>
                      <div>
                        <span className="text-text-muted text-[10px] block font-sans font-semibold">ALTITUDE</span>
                        <b>{v.altitudeM || 850}m</b>
                      </div>
                      <div>
                        <span className="text-text-muted text-[10px] block font-sans font-semibold">FUEL</span>
                        <b className="text-success">{v.fuelLevelPct || 85}%</b>
                      </div>
                    </div>

                    {v.activeShipment && (
                      <p className="text-[11px] text-text-muted truncate flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="truncate">{v.activeShipment.title}</span>
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-text-muted font-mono">{v.registrationNumber}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/map/vehicle/${v.vehicleId}`);
                        }}
                        className="text-accent hover:text-accent-hover font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        Telemetry <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Floating Bottom-Right Vehicle Journey & Telemetry HUD Card (When Vehicle is Selected) */}
        {activeVehicle && activeVehicleProgress && (
          <div className="absolute bottom-4 left-86 right-4 sm:right-auto sm:w-96 z-20 bg-bg-elevated/95 backdrop-blur-md border border-accent/40 rounded-xl shadow-2xl p-4 space-y-3 pointer-events-auto animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <span>{activeVehicle.vehicleId}</span>
                    <span className="text-[11px] text-text-muted font-normal">• {activeVehicle.driver?.name}</span>
                  </h4>
                  <p className="text-[10px] text-accent font-mono">
                    GPS: {activeVehicle.currentLocation?.coordinates?.[1]?.toFixed(4)}°N, {activeVehicle.currentLocation?.coordinates?.[0]?.toFixed(4)}°E
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-subtle transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Traversed Distance & Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-text-primary flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-accent" />
                  Route Crossed: <b className="text-success">{activeVehicleProgress.progressPct}%</b>
                </span>
                <span className="font-mono text-text-muted text-[11px]">
                  {activeVehicleProgress.traversedKm} km done / {activeVehicleProgress.remainingKm} km left
                </span>
              </div>

              <div className="w-full h-2 bg-bg-subtle rounded-full overflow-hidden border border-border-subtle">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${activeVehicleProgress.progressPct}%` }}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
              <span className="text-[11px] text-text-muted">
                Speed: <b className="text-text-primary">{activeVehicle.speedKmph || 0} km/h</b>
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/map/vehicle/${activeVehicle.vehicleId}`)}
                icon={ChevronRight}
              >
                Full Dossier
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

export default LiveMap;
