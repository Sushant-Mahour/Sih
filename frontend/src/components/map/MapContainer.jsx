import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  MapPin,
  Truck,
  AlertTriangle,
  Radio,
  Eye,
  EyeOff,
  Crosshair,
  ShieldAlert,
  CheckCircle2,
  Navigation,
  Lock,
  Unlock,
  Sparkles,
  Info,
  ExternalLink,
  Ban
} from 'lucide-react';
import { useUIStore } from '../../features/useUIStore';

// Exact NER Bounding Box: [87.5, 21.5, 97.6, 29.6]
export const NER_BOUNDS = [
  [21.5, 87.5], // South-West (lat, lng)
  [29.6, 97.6]  // North-East (lat, lng)
];

// Helper to calculate approximate path length and closest point along polyline
function calculatePolylineProgress(coordinates, currentPoint) {
  if (!coordinates || coordinates.length < 2 || !currentPoint) {
    return { progressPct: 0, traversedCoords: [], remainingCoords: coordinates || [] };
  }

  const curLng = currentPoint[0] ?? currentPoint.lng;
  const curLat = currentPoint[1] ?? currentPoint.lat;

  let closestIdx = 0;
  let minDistanceSq = Infinity;

  coordinates.forEach((coord, idx) => {
    const lng = coord[0];
    const lat = coord[1];
    const distSq = Math.pow(lng - curLng, 2) + Math.pow(lat - curLat, 2);
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closestIdx = idx;
    }
  });

  const progressPct = Math.min(100, Math.max(0, Math.round((closestIdx / (coordinates.length - 1)) * 100)));
  const traversedCoords = coordinates.slice(0, closestIdx + 1);
  const remainingCoords = coordinates.slice(closestIdx);

  return { progressPct, traversedCoords, remainingCoords, closestIdx };
}

// Fix Leaflet marker icons in bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Markers
function createVehicleIcon(vehicle, isSelected = false, heading = 0) {
  const isCaution = vehicle.status === 'caution_zone' || vehicle.status === 'stale';
  const color = isSelected ? '#8B5CF6' : isCaution ? '#F59E0B' : '#10B981';
  const bg = isSelected ? 'rgba(139, 92, 246, 0.28)' : isCaution ? 'rgba(245, 158, 11, 0.28)' : 'rgba(16, 185, 129, 0.28)';
  const effectiveHeading = heading || vehicle.heading || 0;
  const speed = vehicle.speedKmph || (vehicle.status === 'idle' ? 0 : 38);

  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: ${color};">
        <!-- Live Radar Pulse Wave -->
        <div class="vehicle-radar-ripple" style="border-color: ${color};"></div>
        
        <!-- Outer Glowing Ring -->
        <div style="position: absolute; inset: 4px; border-radius: 9999px; background: ${bg}; border: 1.5px solid ${color}; ${isSelected ? 'box-shadow: 0 0 12px #8B5CF6;' : ''}"></div>
        
        <!-- Directional Pointer (Rotates towards heading) -->
        <div style="position: absolute; inset: 0; display: flex; align-items: flex-start; justify-content: center; transform: rotate(${effectiveHeading}deg); pointer-events: none; transition: transform 0.4s ease;">
          <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 7px solid ${color}; transform: translateY(-3px); filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6));"></div>
        </div>

        <!-- Vehicle Center Core -->
        <div class="vehicle-marker-core" style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background: #0F172A; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; color: ${color}; box-shadow: 0 0 8px ${bg}, 0 2px 6px rgba(0,0,0,0.6);">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
        </div>

        <!-- Mini Speed / Status Pill -->
        <div style="position: absolute; bottom: -6px; background: rgba(15, 23, 42, 0.92); color: ${color}; border: 1px solid ${color}; border-radius: 4px; padding: 0 3px; font-size: 8px; font-weight: 800; font-family: monospace; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.4); pointer-events: none;">
          ${speed > 0 ? `${speed}k` : 'LIVE'}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  });
}

function createIncidentIcon(incident) {
  const isCritical = (incident.severity || 3) >= 4;
  const color = isCritical ? '#EF4444' : '#F59E0B';
  const bg = isCritical ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)';

  return L.divIcon({
    className: 'custom-incident-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: absolute; inset: 2px; border-radius: 8px; background: ${bg}; border: 1.5px solid ${color};"></div>
        <div style="position: relative; width: 22px; height: 22px; border-radius: 6px; background: #0F172A; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; color: ${color}; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}

function createHubIcon(label, isDestination = false) {
  const color = isDestination ? '#10B981' : '#3B82F6';
  return L.divIcon({
    className: 'custom-hub-marker',
    html: `
      <div style="display: flex; align-items: center; gap: 4px; pointer-events: auto;">
        <div style="width: 12px; height: 12px; border-radius: 9999px; background: ${color}; border: 2px solid #FFFFFF; box-shadow: 0 1px 6px rgba(0,0,0,0.4);"></div>
        <span style="font-size: 11px; font-weight: 700; color: #0F172A; background: rgba(255,255,255,0.92); padding: 2px 6px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.15); white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">${label}</span>
      </div>
    `,
    iconSize: [100, 24],
    iconAnchor: [6, 6]
  });
}

function createPathfindingNodeIcon(label, side = 'forward', isMeeting = false) {
  const color = isMeeting ? '#8B5CF6' : side === 'forward' ? '#3B82F6' : '#10B981';
  return L.divIcon({
    className: 'custom-search-node-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; gap: 4px;">
        <div style="width: ${isMeeting ? '16px' : '10px'}; height: ${isMeeting ? '16px' : '10px'}; border-radius: 9999px; background: ${color}; border: 2px solid #FFFFFF; box-shadow: 0 0 10px ${color};"></div>
        ${isMeeting ? `<span style="font-size: 10px; font-weight: 800; color: #FFFFFF; background: #7C3AED; padding: 2px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">CONVERGENCE NODE</span>` : ''}
      </div>
    `,
    iconSize: [80, 20],
    iconAnchor: [isMeeting ? 8 : 5, isMeeting ? 8 : 5]
  });
}

function createBlockedRoadIcon() {
  return L.divIcon({
    className: 'custom-blockage-marker',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(239, 68, 68, 0.3); border: 2px solid #EF4444; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 22px; height: 22px; border-radius: 9999px; background: #DC2626; border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; color: #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
}

export function MapContainer({
  mode = 'planner', // 'planner' | 'convoys' | 'driver' | 'emergency'
  center,
  zoom = 7,
  vehicles = [],
  incidents = [],
  highlightedRoute = null,
  candidateRoutes = [],
  selectedRouteIndex = 0,
  roadSegments = [],
  districts = [],
  showCorridors = false,
  fitTo = 'auto',
  height = '520px',
  onVehicleClick,
  onIncidentClick,
  selectedVehicleId,
  animationStep = null, // Step data for 2-sided pathfinding animation
  selectingOnMap = false,
  onMapSelectSegment = null,
  className = ''
}) {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const boundaryLayerRef = useRef(null);
  const hasFittedInitialBoundsRef = useRef(false);
  const lastSelectedVehicleIdRef = useRef(null);
  const lastCandidateCountRef = useRef(0);
  const animStateRef = useRef(new Map());

  // Dedicated named LayerGroups for clean lifecycle management
  const layerGroupsRef = useRef({
    boundaries: null,
    corridors: null,
    routes: null,
    traversed: null,
    alternatives: null,
    convoys: null,
    incidents: null,
    blockages: null,
    markers: null,
    animation: null
  });

  const { sidebarOpen } = useUIStore();
  const [basemapMode, setBasemapMode] = useState('street');
  const [legendOpen, setLegendOpen] = useState(false);
  const [autoFollow, setAutoFollow] = useState(false);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(zoom);

  // User opt-in layer toggles
  const [layerVisibility, setLayerVisibility] = useState({
    corridors: showCorridors,
    convoys: true,
    incidents: true,
    routes: true,
    boundaries: true
  });

  const toggleLayer = (layerKey) => {
    setLayerVisibility(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Helper to construct robust tile layer matching local downloaded zoom tiers
  const getTileLayerForMode = (bMode) => {
    const isTerrain = bMode === 'terrain';
    return L.tileLayer(isTerrain ? '/tiles/terrain/{z}/{x}/{y}.png' : '/tiles/osm/{z}/{x}/{y}.png', {
      minZoom: 5,
      maxZoom: 18,
      // OSM tiles exist for z5-9; Terrain tiles exist for z5-8. Leaflet oversamples native zoom seamlessly without 404s!
      maxNativeZoom: isTerrain ? 8 : 9,
      bounds: NER_BOUNDS,
      errorTileUrl: '/tiles/blank.png',
      fadeAnimation: false,        // eliminates the fade-transition gap
      zoomAnimation: true,
      updateWhenZooming: false,    // wait until zoom settles before requesting new tiles
      keepBuffer: 4,                // keep more off-screen tiles cached so panning/zooming back doesn't re-fetch
      attribution: isTerrain ? '© OpenTopoMap contributors | NIDAN' : '© OpenStreetMap contributors | NIDAN'
    });
  };

  // 1. Initialize Map Instance with NER Bounding Box
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter = center
      ? [center[1] || center.lat || 26.1445, center[0] || center.lng || 91.7362]
      : [26.1445, 91.7362];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: zoom,
      minZoom: 5,
      maxZoom: 18,
      scrollWheelZoom: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      fadeAnimation: false,
      zoomAnimation: true,
      zoomControl: false // Explicitly placed via L.control.zoom
    });

    // Add Leaflet zoom control explicitly in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial Tile Layer with correct maxNativeZoom & errorTileUrl
    const tileLayer = getTileLayerForMode('street').addTo(map);
    tileLayerRef.current = tileLayer;

    // Initialize named layer groups and attach to map
    layerGroupsRef.current = {
      boundaries: L.layerGroup().addTo(map),
      corridors: L.layerGroup().addTo(map),
      routes: L.layerGroup().addTo(map),
      traversed: L.layerGroup().addTo(map),
      alternatives: L.layerGroup().addTo(map),
      convoys: L.layerGroup().addTo(map),
      incidents: L.layerGroup().addTo(map),
      blockages: L.layerGroup().addTo(map),
      markers: L.layerGroup().addTo(map),
      animation: L.layerGroup().addTo(map)
    };

    // Zoom listener for detail indicator
    map.on('zoomend', () => {
      setCurrentZoomLevel(map.getZoom());
    });

    // Load GeoJSON administrative district boundaries overlay
    fetch('/data/ner-districts.geojson')
      .then(res => res.json())
      .then(geoData => {
        if (layerGroupsRef.current?.boundaries) {
          L.geoJSON(geoData, {
            style: {
              color: '#3B82F6',
              weight: 1.2,
              opacity: 0.35,
              fillColor: '#3B82F6',
              fillOpacity: 0.03,
              dashArray: '4, 4'
            },
            onEachFeature: (feature, layer) => {
              const p = feature.properties;
              if (p && p.name) {
                layer.bindTooltip(`<b>${p.name}</b> (${p.state || 'NER'})`, {
                  permanent: false,
                  direction: 'center',
                  className: 'district-boundary-tooltip text-[10px]'
                });
              }
            }
          }).addTo(layerGroupsRef.current.boundaries);
        }
      })
      .catch(err => console.warn('[MapContainer] GeoJSON boundary load notice:', err));

    mapInstanceRef.current = map;

    // ResizeObserver on the container to call invalidateSize({ animate: false }) smoothly before redraw
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ animate: false });
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Handle Basemap Switcher (Street / Terrain)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTileLayer = getTileLayerForMode(basemapMode).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
  }, [basemapMode]);

  // 3. Handle Sidebar resize invalidation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ animate: false });
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  // 4. Handle Map Click in Road Block Selection Mode
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleMapClick = (e) => {
      if (selectingOnMap && onMapSelectSegment) {
        const { lat, lng } = e.latlng;
        onMapSelectSegment({ lat, lng });
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [selectingOnMap, onMapSelectSegment]);

  // 5. CONTEXTUAL OVERLAY RENDERING
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const groups = layerGroupsRef.current;
    if (!groups || !groups.routes) return;

    // Clear active layer groups cleanly before redraw (keep boundaries)
    groups.routes.clearLayers();
    groups.traversed.clearLayers();
    groups.alternatives.clearLayers();
    groups.convoys.clearLayers();
    groups.incidents.clearLayers();
    groups.corridors.clearLayers();
    groups.blockages.clearLayers();
    groups.markers.clearLayers();
    groups.animation.clearLayers();
    
    // Preserve old animation state so vehicles don't jump randomly on socket updates
    const oldAnimState = new Map(animStateRef.current);
    animStateRef.current.clear();

    const map = mapInstanceRef.current;
    let boundsToFit = [];

    // --- CONTEXT 1: ROUTE PLANNER MODE ---
    if (mode === 'planner') {
      const activeCandidates = candidateRoutes.length > 0
        ? candidateRoutes
        : highlightedRoute
          ? [highlightedRoute]
          : [];

      if (activeCandidates.length > 0) {
        activeCandidates.forEach((cand, idx) => {
          const isSelected = idx === selectedRouteIndex;
          let rawCoords = cand.pathCoordinates || cand.coordinates || [];
          let latLngs = rawCoords.map(c => [c[1], c[0]]);

          if (latLngs.length > 1) {
            latLngs.forEach(ll => boundsToFit.push(ll));

            if (isSelected) {
              const polyline = L.polyline(latLngs, {
                color: '#2563EB',
                weight: 5.5,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round'
              });
              polyline.bindPopup(`
                <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
                  <b style="color: #1D4ED8;">${cand.title || 'Optimal Primary Corridor'}</b>
                  <div style="color: #64748B; margin-top: 4px;">Distance: <b>${cand.totalDistanceKm || cand.distanceKm} km</b> • Time: <b>${cand.totalTimeMin || cand.durationMin || 0} min</b></div>
                  <div style="color: #059669; font-weight: 600; margin-top: 2px;">Risk Rating: ${cand.overallRiskScore || 15}/100</div>
                  <div style="color: #475569; font-size: 11px; margin-top: 4px;">${cand.aiReasoning || ''}</div>
                </div>
              `);
              polyline.addTo(groups.routes);
            } else {
              const polyline = L.polyline(latLngs, {
                color: '#64748B',
                weight: 3.5,
                opacity: 0.45,
                dashArray: '8, 6',
                lineCap: 'round'
              });
              polyline.bindPopup(`
                <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
                  <b>${cand.title || `Alternative Route #${idx + 1}`}</b>
                  <div style="color: #64748B; margin-top: 2px;">Distance: ${cand.totalDistanceKm || cand.distanceKm} km • Risk: ${cand.overallRiskScore || 25}/100</div>
                </div>
              `);
              polyline.addTo(groups.alternatives);
            }
          }
        });

        // Origin and Destination Markers
        const primary = activeCandidates[0];
        const primaryCoords = primary.pathCoordinates || primary.coordinates;
        if (primaryCoords && primaryCoords.length > 1) {
          const originCoord = primaryCoords[0];
          const destCoord = primaryCoords[primaryCoords.length - 1];

          L.marker([originCoord[1], originCoord[0]], {
            icon: createHubIcon(primary.originName || 'Origin Hub', false),
            zIndexOffset: 500
          }).addTo(groups.markers);

          L.marker([destCoord[1], destCoord[0]], {
            icon: createHubIcon(primary.destinationName || 'Destination Hub', true),
            zIndexOffset: 500
          }).addTo(groups.markers);
        }

        // Draw active 2-Sided Pathfinding Animation step if active
        if (animationStep) {
          const { currentCoords, meetingNode, side } = animationStep;

          if (currentCoords && currentCoords.length >= 2) {
            L.circleMarker([currentCoords[1], currentCoords[0]], {
              radius: 12,
              color: side === 'forward' ? '#3B82F6' : '#10B981',
              fillColor: side === 'forward' ? '#60A5FA' : '#34D399',
              fillOpacity: 0.6,
              weight: 2
            }).addTo(groups.animation);
          }

          if (meetingNode) {
            const meetingPos = primaryCoords[Math.floor(primaryCoords.length / 2)] || originCoord;
            L.marker([meetingPos[1], meetingPos[0]], {
              icon: createPathfindingNodeIcon('Convergence', 'meeting', true),
              zIndexOffset: 1200
            }).addTo(groups.animation);
          }
        }

        // Draw incidents within active corridor
        if (layerVisibility.incidents && incidents && incidents.length > 0) {
          incidents.forEach(inc => {
            const coords = inc.coordinates || (inc.location && inc.location.coordinates);
            if (!coords || coords.length < 2) return;
            const lat = coords[1];
            const lng = coords[0];

            const marker = L.marker([lat, lng], {
              icon: createIncidentIcon(inc),
              zIndexOffset: 400
            });
            if (onIncidentClick) marker.on('click', () => onIncidentClick(inc));
            marker.bindPopup(`<b>${inc.title || 'Field Incident'}</b><br/>Severity: Level ${inc.severity || 3}`);
            marker.addTo(groups.incidents);
          });
        }

        // Only fit bounds when candidates newly change, NOT continuously
        const candidateCountChanged = candidateRoutes.length !== lastCandidateCountRef.current;
        lastCandidateCountRef.current = candidateRoutes.length;

        if (boundsToFit.length > 0 && (candidateCountChanged || !hasFittedInitialBoundsRef.current)) {
          map.fitBounds(L.latLngBounds(boundsToFit), { padding: [40, 40] });
          hasFittedInitialBoundsRef.current = true;
        }
      }
    }

    // --- CONTEXT 2: CONVOYS / OVERVIEW LIVE FLEET GPS TRACKING MODE ---
    else if (mode === 'convoys') {
      // 1. Draw road segments if enabled
      if (layerVisibility.corridors && roadSegments && roadSegments.length > 0) {
        roadSegments.forEach(seg => {
          const rawCoords = seg.coordinates || seg.pathCoordinates || (seg.geometry && seg.geometry.coordinates) || [];
          if (rawCoords.length > 1) {
            const latLngs = rawCoords.map(c => [c[1], c[0]]);
            const isBlocked = seg.isBlocked || seg.status === 'blocked';
            const isCaution = seg.status === 'caution' || seg.riskBand === 'high';
            const color = isBlocked ? '#EF4444' : isCaution ? '#F59E0B' : '#10B981';

            const polyline = L.polyline(latLngs, {
              color,
              weight: isBlocked ? 4.5 : 3,
              opacity: isBlocked ? 0.9 : 0.65,
              dashArray: isBlocked ? '6, 6' : undefined,
              lineCap: 'round',
              lineJoin: 'round'
            });
            polyline.bindPopup(`
              <div style="font-family: sans-serif; font-size: 12px;">
                <b style="color: ${color};">${seg.name || seg.segmentId || 'Corridor'}</b><br/>
                Status: <b>${(seg.status || (isBlocked ? 'Blocked' : 'Clear')).toUpperCase()}</b><br/>
                Risk: ${seg.currentRiskScore || 20}/100
                ${isBlocked && seg.blockageReason ? `<div style="color: #DC2626; margin-top: 4px; font-size: 11px;">Cause: ${seg.blockageReason}</div>` : ''}
              </div>
            `);
            polyline.addTo(isBlocked ? groups.blockages : groups.corridors);

            if (isBlocked) {
              const midCoord = latLngs[Math.floor(latLngs.length / 2)];
              L.marker(midCoord, { icon: createBlockedRoadIcon(), zIndexOffset: 800 }).bindPopup(`<b>ROAD BLOCK DECLARED</b><br/>${seg.name}`).addTo(groups.blockages);
            }
          }
        });
      }

      // 2. Draw in-transit convoy routes WITH moving vehicle markers (Priority 2 Fix 1)
      const inTransitVehicles = vehicles.filter(v => ['in_transit', 'caution_zone'].includes(v.status) || v.status === undefined);

      if (layerVisibility.convoys && inTransitVehicles.length > 0) {
        inTransitVehicles.forEach(v => {
          const coords = v.currentLocation?.coordinates || v.coordinates;
          if (!coords || coords.length < 2) return;
          const lat = coords[1];
          const lng = coords[0];
          const isSelected = selectedVehicleId === v.vehicleId;

          // Route line color determined by active route risk level: Green (Low) / Amber (Med) / Red (High)
          const riskScore = v.riskScore || (v.status === 'caution_zone' ? 68 : 22);
          const routeColor = riskScore >= 60 ? '#EF4444' : riskScore >= 40 ? '#F59E0B' : '#10B981';

          // Draw full active convoy route line
          const routeCoords = v.activeRoutePolyline || v.routeCoordinates || v.pathCoordinates;
          if (routeCoords && routeCoords.length > 1) {
            const latLngs = routeCoords.map(c => [c[1], c[0]]);

            const routeLine = L.polyline(latLngs, {
              color: routeColor,
              weight: isSelected ? 4.5 : 3,
              opacity: isSelected ? 0.95 : 0.8,
              lineCap: 'round',
              lineJoin: 'round'
            });

            routeLine.bindPopup(`
              <div style="font-family: sans-serif; font-size: 12px; min-width: 180px;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">
                  <b style="color: #1D4ED8;">Convoy ${v.vehicleId}</b>
                  <span style="font-size: 10px; font-weight: 700; color: ${routeColor};">RISK: ${riskScore}/100</span>
                </div>
                <div style="margin-top: 4px;">Driver: <b>${v.driver?.name || 'Convoy Lead'}</b></div>
                <div>Cargo: <b>${v.activeShipment?.title || v.activeShipment?.cargoType || 'Life-Saving Supplies'}</b></div>
                <div>ETA: <b>${v.eta || '45 mins'}</b></div>
                <div style="margin-top: 6px; text-align: right;">
                  <a href="/map/vehicle/${v.vehicleId}" style="color: #2563EB; font-weight: 700; text-decoration: none; font-size: 11px;">
                    View Full Details →
                  </a>
                </div>
              </div>
            `);

            routeLine.addTo(groups.routes);
          }

          // Live Vehicle GPS Marker
          const marker = L.marker([lat, lng], {
            icon: createVehicleIcon(v, isSelected),
            zIndexOffset: isSelected ? 1000 : 300
          });

          if (onVehicleClick) {
            marker.on('click', () => onVehicleClick(v));
          } else {
            marker.on('click', () => navigate(`/map/vehicle/${v.vehicleId}`));
          }

          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 190px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">
                <b style="color: #1D4ED8; font-size: 13px;">${v.vehicleId}</b>
                <span style="font-size: 10px; font-weight: 700; color: ${v.status === 'caution_zone' ? '#D97706' : '#059669'};">${(v.status || 'in_transit').toUpperCase()}</span>
              </div>
              <div style="color: #0F172A; font-weight: 600; margin-top: 4px;">Driver: ${v.driver?.name || 'Convoy Lead'}</div>
              <div style="font-size: 11px; color: #64748B; margin-top: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                <div>Speed: <b style="color: #0F172A;">${v.speedKmph || 38} km/h</b></div>
                <div>Fuel: <b style="color: #059669;">${v.fuelLevelPct || 85}%</b></div>
              </div>
              ${v.activeShipment ? `<div style="font-size: 11px; color: #334155; margin-top: 6px; border-top: 1px solid #E2E8F0; padding-top: 4px;">Cargo: <b>${v.activeShipment.title || v.activeShipment.cargoType}</b></div>` : ''}
              <div style="margin-top: 6px; text-align: right;">
                <a href="/map/vehicle/${v.vehicleId}" style="color: #2563EB; font-weight: 700; text-decoration: none; font-size: 11px;">
                  View Full Details →
                </a>
              </div>
            </div>
          `);

          marker.addTo(groups.convoys);
          boundsToFit.push([lat, lng]);

          // Register in active moving vehicle animation tracker
          const assignedCoords = routeCoords && routeCoords.length > 1
            ? routeCoords
            : [[lng, lat], [lng + 0.04, lat + 0.03], [lng + 0.08, lat + 0.01]];

          const oldState = oldAnimState.get(v.vehicleId);
          const currentStep = oldState !== undefined ? oldState.step : Math.floor(Math.random() * (assignedCoords.length * 4));

          animStateRef.current.set(v.vehicleId, {
            marker,
            routeCoords: assignedCoords,
            vehicleData: v,
            step: currentStep,
            speed: v.status === 'idle' ? 0 : 1
          });
        });
      }

      // Draw incidents
      if (layerVisibility.incidents && incidents && incidents.length > 0) {
        incidents.forEach(inc => {
          const coords = inc.coordinates || (inc.location && inc.location.coordinates);
          if (!coords || coords.length < 2) return;
          const marker = L.marker([coords[1], coords[0]], { icon: createIncidentIcon(inc) });
          if (onIncidentClick) marker.on('click', () => onIncidentClick(inc));
          marker.bindPopup(`<b>${inc.title || 'Field Incident'}</b><br/>Status: ${(inc.status || 'Reported').toUpperCase()}`);
          marker.addTo(groups.incidents);
          boundsToFit.push([coords[1], coords[0]]);
        });
      }

      // Non-aggressive recentering
      const selectedVehicleChanged = selectedVehicleId && selectedVehicleId !== lastSelectedVehicleIdRef.current;
      lastSelectedVehicleIdRef.current = selectedVehicleId;

      if (!hasFittedInitialBoundsRef.current && boundsToFit.length > 0) {
        map.fitBounds(L.latLngBounds(boundsToFit), { padding: [40, 40], maxZoom: 10 });
        hasFittedInitialBoundsRef.current = true;
      } else if (selectedVehicleChanged || autoFollow) {
        const selVeh = vehicles.find(v => v.vehicleId === selectedVehicleId);
        if (selVeh?.currentLocation?.coordinates) {
          const c = selVeh.currentLocation.coordinates;
          map.panTo([c[1], c[0]], { animate: true, duration: 0.6 });
        }
      }
    }

    // --- CONTEXT 3: DRIVER MOBILE MAP MODE ---
    else if (mode === 'driver') {
      const activeCandidates = candidateRoutes.length > 0
        ? candidateRoutes
        : highlightedRoute
          ? [highlightedRoute]
          : [];

      if (activeCandidates.length > 0) {
        const cand = activeCandidates[0];
        const rawCoords = cand.pathCoordinates || cand.coordinates || [];
        if (rawCoords.length > 1) {
          const latLngs = rawCoords.map(c => [c[1], c[0]]);
          latLngs.forEach(ll => boundsToFit.push(ll));

          L.polyline(latLngs, {
            color: '#10B981',
            weight: 5.5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(groups.routes);

          const originCoord = rawCoords[0];
          const destCoord = rawCoords[rawCoords.length - 1];

          L.marker([originCoord[1], originCoord[0]], {
            icon: createHubIcon(cand.originName || 'Origin Terminal', false),
            zIndexOffset: 500
          }).addTo(groups.markers);

          L.marker([destCoord[1], destCoord[0]], {
            icon: createHubIcon(cand.destinationName || 'Destination Depot', true),
            zIndexOffset: 500
          }).addTo(groups.markers);
        }
      }

      if (vehicles && vehicles.length > 0) {
        const v = vehicles[0];
        const coords = v.currentLocation?.coordinates || v.coordinates || center;
        if (coords && coords.length >= 2) {
          const lat = coords[1] || coords.lat;
          const lng = coords[0] || coords.lng;

          const dMarker = L.marker([lat, lng], {
            icon: createVehicleIcon(v, true),
            zIndexOffset: 1000
          }).bindPopup(`<b>${v.vehicleId || 'My Convoy'}</b><br/>Speed: ${v.speedKmph || 0} km/h`).addTo(groups.convoys);
          boundsToFit.push([lat, lng]);

          const cand = activeCandidates[0];
          const driverRouteCoords = cand?.pathCoordinates || cand?.coordinates || v.routeCoordinates || v.pathCoordinates;
          if (driverRouteCoords && driverRouteCoords.length > 1) {
            animStateRef.current.set(v.vehicleId || 'my-convoy', {
              marker: dMarker,
              routeCoords: driverRouteCoords,
              vehicleData: v,
              step: 0,
              speed: 1
            });
          }
        }
      }

      if (!hasFittedInitialBoundsRef.current && boundsToFit.length > 0) {
        map.fitBounds(L.latLngBounds(boundsToFit), { padding: [30, 30], maxZoom: 12 });
        hasFittedInitialBoundsRef.current = true;
      }
    }

    // --- CONTEXT 4: EMERGENCY COMMAND MODE ---
    else if (mode === 'emergency') {
      if (roadSegments && roadSegments.length > 0) {
        roadSegments.forEach(seg => {
          const rawCoords = seg.coordinates || seg.pathCoordinates || (seg.geometry && seg.geometry.coordinates) || [];
          if (rawCoords.length > 1) {
            const latLngs = rawCoords.map(c => [c[1], c[0]]);
            latLngs.forEach(ll => boundsToFit.push(ll));

            const isBlocked = seg.isBlocked || seg.status === 'blocked';
            const polyline = L.polyline(latLngs, {
              color: isBlocked ? '#EF4444' : '#10B981',
              weight: isBlocked ? 6 : 4,
              opacity: 0.95,
              dashArray: isBlocked ? '8, 6' : undefined,
              lineCap: 'round',
              lineJoin: 'round'
            });

            polyline.bindPopup(`
              <div style="font-family: sans-serif; font-size: 12px;">
                <b style="color: ${isBlocked ? '#DC2626' : '#059669'};">${seg.name || seg.segmentId}</b><br/>
                Status: <b>${isBlocked ? 'BLOCKED / IMPASSABLE' : 'OPEN'}</b>
                ${isBlocked && seg.blockageReason ? `<br/>Reason: ${seg.blockageReason}` : ''}
              </div>
            `);

            polyline.addTo(isBlocked ? groups.blockages : groups.corridors);

            if (isBlocked) {
              const mid = latLngs[Math.floor(latLngs.length / 2)];
              L.marker(mid, { icon: createBlockedRoadIcon() }).bindPopup(`<b>ROAD BLOCK: ${seg.name}</b>`).addTo(groups.blockages);
            }
          }
        });
      }

      if (incidents && incidents.length > 0) {
        incidents.forEach(inc => {
          const coords = inc.coordinates || (inc.location && inc.location.coordinates);
          if (!coords || coords.length < 2) return;
          L.marker([coords[1], coords[0]], { icon: createIncidentIcon(inc) }).addTo(groups.incidents);
          boundsToFit.push([coords[1], coords[0]]);
        });
      }

      if (!hasFittedInitialBoundsRef.current && boundsToFit.length > 0) {
        map.fitBounds(L.latLngBounds(boundsToFit), { padding: [35, 35], maxZoom: 10 });
        hasFittedInitialBoundsRef.current = true;
      }
    }
  }, [
    mode,
    candidateRoutes,
    highlightedRoute,
    selectedRouteIndex,
    vehicles,
    incidents,
    roadSegments,
    layerVisibility,
    selectedVehicleId,
    animationStep,
    autoFollow
  ]);

  // 6. Smooth Continuous Vehicle Motion Animation Loop (Keeps vehicles moving)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (mode !== 'convoys' && mode !== 'driver') return;
    if (!layerVisibility.convoys) return;

    const interval = setInterval(() => {
      if (!animStateRef.current || animStateRef.current.size === 0) return;

      animStateRef.current.forEach((state, vehicleId) => {
        const { marker, routeCoords, vehicleData } = state;
        if (!marker || !routeCoords || routeCoords.length < 2 || state.speed === 0) return;

        // Advance progression step along polyline
        state.step = (state.step + 1) % (routeCoords.length * 10);
        const floatIdx = (state.step / 10) % (routeCoords.length - 1);
        const idx = Math.floor(floatIdx);
        const frac = floatIdx - idx;

        const p1 = routeCoords[idx];
        const p2 = routeCoords[Math.min(idx + 1, routeCoords.length - 1)];

        if (!p1 || !p2) return;

        const curLng = p1[0] + (p2[0] - p1[0]) * frac;
        const curLat = p1[1] + (p2[1] - p1[1]) * frac;

        // Calculate heading/bearing
        const dy = p2[1] - p1[1];
        const dx = p2[0] - p1[0];
        const heading = (Math.round((Math.atan2(dx, dy) * 180) / Math.PI) + 360) % 360;

        marker.setLatLng([curLat, curLng]);
        const isSelected = selectedVehicleId === vehicleId;
        const speedKmph = vehicleData.speedKmph || (38 + (state.step % 8));
        marker.setIcon(createVehicleIcon({ ...vehicleData, heading, speedKmph }, isSelected, heading));
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [mode, layerVisibility.convoys, selectedVehicleId]);

  const handleRecenterNER = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(NER_BOUNDS), { padding: [20, 20] });
    }
  };

  const isPlannerEmpty = mode === 'planner' && (!candidateRoutes || candidateRoutes.length === 0) && !highlightedRoute;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border ${selectingOnMap ? 'cursor-crosshair' : ''} ${className}`}
      style={{
        height,
        minHeight: '340px',
        borderColor: 'var(--border-subtle)',
        background: 'var(--bg-subtle)'
      }}
    >
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: '340px' }} />

      {/* Select on Map Mode Banner */}
      {selectingOnMap && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[450] bg-red-600 text-white px-4 py-1.5 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 animate-bounce">
          <Crosshair className="w-4 h-4" />
          <span>Click anywhere on the map to place road blockage coordinates</span>
        </div>
      )}

      {/* High-Zoom Detail Indicator (subtle helper when oversampling beyond native tier) */}
      {currentZoomLevel > 11 && (
        <div className="absolute bottom-3 left-3 z-[390] bg-slate-900/80 text-slate-300 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-mono border border-slate-700/60 pointer-events-none flex items-center gap-1.5">
          <Info className="w-3 h-3 text-blue-400" />
          <span>Deep corridor view (oversampled offline coverage)</span>
        </div>
      )}

      {/* Empty State Overlay for Route Planner before search */}
      {isPlannerEmpty && (
        <div className="absolute inset-0 z-[390] pointer-events-none flex items-center justify-center p-4">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-300 dark:border-slate-700 shadow-md max-w-sm text-center space-y-1">
            <div className="w-8 h-8 mx-auto rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mb-1">
              <Navigation className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Select origin and destination to compute corridor
            </p>
            <p className="text-[11px] text-slate-500">
              Deterministic 2-sided Dijkstra's pathfinding & risk evaluation.
            </p>
          </div>
        </div>
      )}

      {/* Top Left Unified Toolbar: Basemap Mode, Auto-Follow Lock & Recenter NER */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs text-xs font-semibold">
        <div className="flex items-center rounded-md bg-slate-100 dark:bg-slate-800 p-0.5">
          <button
            onClick={() => setBasemapMode('street')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${basemapMode === 'street'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-blue-600'
              }`}
          >
            Street
          </button>
          <button
            onClick={() => setBasemapMode('terrain')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${basemapMode === 'terrain'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-blue-600'
              }`}
          >
            Terrain
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        <button
          onClick={handleRecenterNER}
          className="px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition cursor-pointer"
          title="Fit Full NER Region"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Recenter</span>
        </button>

        {mode === 'convoys' && (
          <button
            onClick={() => setAutoFollow(!autoFollow)}
            className={`px-2 py-1 rounded flex items-center gap-1 transition cursor-pointer ${autoFollow
              ? 'bg-emerald-600 text-white'
              : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            title={autoFollow ? 'Lock to active vehicle is ON' : 'Lock to active vehicle is OFF'}
          >
            {autoFollow ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[11px]">{autoFollow ? 'Locked' : 'Free View'}</span>
          </button>
        )}
      </div>

      {/* Bottom Right: Interactive Layer Legend */}
      {mode !== 'driver' && (
        <div className="absolute bottom-3 right-3 z-[400] max-w-xs">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-300 dark:border-slate-700 shadow-lg overflow-hidden text-xs">
            <button
              onClick={() => setLegendOpen(!legendOpen)}
              className="w-full px-3 py-2 flex items-center justify-between font-bold border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Map Layers
              </span>
              <span className="text-[10px] text-slate-500">{legendOpen ? 'Hide' : 'Show'}</span>
            </button>

            {legendOpen && (
              <div className="p-2.5 space-y-1.5">
                <div
                  onClick={() => toggleLayer('incidents')}
                  className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-600 border border-white"></div>
                    <span className="text-slate-700 dark:text-slate-300">Hazard Incidents</span>
                  </div>
                  {layerVisibility.incidents ? (
                    <Eye className="w-3.5 h-3.5 text-red-600" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>

                {mode === 'convoys' && (
                  <div
                    onClick={() => toggleLayer('convoys')}
                    className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-slate-900"></div>
                      <span className="text-slate-700 dark:text-slate-300">Fleet Convoys & Routes</span>
                    </div>
                    {layerVisibility.convoys ? (
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MapContainer;
