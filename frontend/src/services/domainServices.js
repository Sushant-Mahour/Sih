import api from './api';
import { NER_NODES, NER_EDGES } from '../lib/routing/nerGraphData';
import { findAlternativeRoutes, compareRoutes } from '../lib/routing/bidirectionalDijkstra';
import { emitTacticalEvent } from './tacticalSync';

// Base seed data for initial local storage hydration
const DEFAULT_DISTRICTS = [
  { districtId: 'AS-KAM', name: 'Kamrup Metropolitan', state: 'Assam', hq: 'Guwahati', centroid: [91.7362, 26.1445], currentAccessibilityScore: 94, elevationM: 55, avgSlopeDeg: 4.2, landslideSusceptibility: 'low', floodSusceptibility: 'high', activeConvoysCount: 3, weather: { tempC: 28, rainfallMm: 12, condition: 'Light Rain' } },
  { districtId: 'ML-EKH', name: 'East Khasi Hills', state: 'Meghalaya', hq: 'Shillong', centroid: [91.8933, 25.5788], currentAccessibilityScore: 78, elevationM: 1525, avgSlopeDeg: 24.8, landslideSusceptibility: 'critical', floodSusceptibility: 'low', activeConvoysCount: 2, weather: { tempC: 19, rainfallMm: 45, condition: 'Heavy Mist & Rain' } },
  { districtId: 'AR-PAP', name: 'Papum Pare', state: 'Arunachal Pradesh', hq: 'Itanagar', centroid: [93.6053, 27.0844], currentAccessibilityScore: 68, elevationM: 750, avgSlopeDeg: 28.5, landslideSusceptibility: 'critical', floodSusceptibility: 'moderate', activeConvoysCount: 2, weather: { tempC: 22, rainfallMm: 30, condition: 'Overcast' } },
  { districtId: 'AR-TAW', name: 'Tawang', state: 'Arunachal Pradesh', hq: 'Tawang', centroid: [91.8687, 27.5861], currentAccessibilityScore: 54, elevationM: 3048, avgSlopeDeg: 38.2, landslideSusceptibility: 'critical', floodSusceptibility: 'low', activeConvoysCount: 1, weather: { tempC: 11, rainfallMm: 8, condition: 'Dense Fog' } },
  { districtId: 'NL-KOH', name: 'Kohima', state: 'Nagaland', hq: 'Kohima', centroid: [94.1086, 25.6751], currentAccessibilityScore: 74, elevationM: 1444, avgSlopeDeg: 29.1, landslideSusceptibility: 'critical', floodSusceptibility: 'low', activeConvoysCount: 2, weather: { tempC: 20, rainfallMm: 18, condition: 'Showers' } },
  { districtId: 'MN-IMP', name: 'Imphal West', state: 'Manipur', hq: 'Imphal', centroid: [93.9368, 24.8170], currentAccessibilityScore: 79, elevationM: 786, avgSlopeDeg: 12.4, landslideSusceptibility: 'moderate', floodSusceptibility: 'high', activeConvoysCount: 1, weather: { tempC: 25, rainfallMm: 22, condition: 'Cloudy' } },
  { districtId: 'MZ-AIZ', name: 'Aizawl', state: 'Mizoram', hq: 'Aizawl', centroid: [92.7176, 23.7307], currentAccessibilityScore: 67, elevationM: 1132, avgSlopeDeg: 31.7, landslideSusceptibility: 'critical', floodSusceptibility: 'low', activeConvoysCount: 1, weather: { tempC: 23, rainfallMm: 35, condition: 'Rain' } },
  { districtId: 'TR-WST', name: 'West Tripura', state: 'Tripura', hq: 'Agartala', centroid: [91.2868, 23.8315], currentAccessibilityScore: 91, elevationM: 35, avgSlopeDeg: 3.8, landslideSusceptibility: 'low', floodSusceptibility: 'high', activeConvoysCount: 2, weather: { tempC: 29, rainfallMm: 15, condition: 'Partly Cloudy' } },
  { districtId: 'SK-EAS', name: 'East Sikkim', state: 'Sikkim', hq: 'Gangtok', centroid: [88.6138, 27.3389], currentAccessibilityScore: 71, elevationM: 1650, avgSlopeDeg: 35.4, landslideSusceptibility: 'critical', floodSusceptibility: 'low', activeConvoysCount: 1, weather: { tempC: 17, rainfallMm: 25, condition: 'Monsoon Mist' } },
  { districtId: 'AS-CAC', name: 'Cachar', state: 'Assam', hq: 'Silchar', centroid: [92.7976, 24.8333], currentAccessibilityScore: 84, elevationM: 22, avgSlopeDeg: 5.1, landslideSusceptibility: 'low', floodSusceptibility: 'critical', activeConvoysCount: 2, weather: { tempC: 27, rainfallMm: 40, condition: 'Heavy Rain' } },
  { districtId: 'AS-DIB', name: 'Dibrugarh', state: 'Assam', hq: 'Dibrugarh', centroid: [94.9120, 27.4728], currentAccessibilityScore: 92, elevationM: 108, avgSlopeDeg: 2.4, landslideSusceptibility: 'low', floodSusceptibility: 'high', activeConvoysCount: 2, weather: { tempC: 28, rainfallMm: 16, condition: 'Scattered Rain' } }
];

const eGhyShl = NER_EDGES.find(e => e.from === 'AS-KAM' && e.to === 'ML-EKH')?.coordinates || [[91.7362, 26.1445], [91.8150, 25.8850], [91.8933, 25.5788]];
const eShlJow = NER_EDGES.find(e => e.from === 'ML-EKH' && e.to === 'ML-JOW')?.coordinates || [];
const eJowSil = NER_EDGES.find(e => e.from === 'ML-JOW' && e.to === 'AS-CAC')?.coordinates || [];
const eShlSil = eShlJow.length && eJowSil.length ? [...eShlJow, ...(eJowSil.slice(1))] : [[91.8933, 25.5788], [92.3500, 25.2800], [92.7976, 24.8333]];
const eTezBom = NER_EDGES.find(e => e.from === 'AS-TEZ' && e.to === 'AR-BOM')?.coordinates || [];
const eBomTaw = NER_EDGES.find(e => e.from === 'AR-BOM' && e.to === 'AR-TAW')?.coordinates || [];
const eItaTaw = eTezBom.length && eBomTaw.length ? [...eTezBom, ...(eBomTaw.slice(1))] : [[93.6053, 27.0844], [92.4200, 27.2800], [91.8687, 27.5861]];
const eGhyDim = NER_EDGES.find(e => e.from === 'AS-KAM' && e.to === 'NL-DIM')?.coordinates || [];
const eDimKoh = NER_EDGES.find(e => e.from === 'NL-DIM' && e.to === 'NL-KOH')?.coordinates || [];
const eGhyKoh = eGhyDim.length && eDimKoh.length ? [...eGhyDim, ...(eDimKoh.slice(1))] : [[91.7362, 26.1445], [93.7265, 25.9090], [94.1086, 25.6751]];

const DEFAULT_VEHICLES = [
  { vehicleId: 'NER-CONVOY-101', type: 'Tata 4x4 Medical Unit', registrationNumber: 'AS-01-EC-4412', model: 'Tata LPTA 715 4x4', status: 'in_transit', speedKmph: 42, altitudeM: 1120, heading: 145, fuelLevelPct: 88, engineTempC: 84, currentLocation: { coordinates: [91.8150, 25.8850] }, routeCoordinates: eGhyShl, pathCoordinates: eGhyShl, driver: { name: 'Bikash Borah', phone: '+91 94351 22891', experienceYears: 12, rating: 4.9, license: 'AS-COMM-8821' }, activeShipment: { shipmentId: 'SHP-2026-001', title: 'Life-saving Pediatric Vaccines', cargoType: 'Medicines', priority: 'critical', originName: 'Guwahati Hub', destinationName: 'Shillong Staging', weightKg: 850, currentTempC: '3.8°C', tempRequirementC: '2°C to 8°C' } },
  { vehicleId: 'NER-CONVOY-102', type: 'Heavy Relief Carrier', registrationNumber: 'ML-05-TR-9182', model: 'Ashok Leyland Stallion', status: 'caution_zone', speedKmph: 28, altitudeM: 1480, heading: 92, fuelLevelPct: 74, engineTempC: 89, currentLocation: { coordinates: [92.3500, 25.2800] }, routeCoordinates: eShlSil, pathCoordinates: eShlSil, driver: { name: 'P. Lyngdoh', phone: '+91 98622 41109', experienceYears: 15, rating: 4.8, license: 'ML-COMM-7734' }, activeShipment: { shipmentId: 'SHP-2026-002', title: 'Emergency Water Filtration Skids', cargoType: 'Food Supplies', priority: 'high', originName: 'Shillong Staging', destinationName: 'Silchar Distribution Center', weightKg: 2400, currentTempC: 'Ambient', tempRequirementC: 'Ambient' } },
  { vehicleId: 'NER-CONVOY-103', type: 'High-Altitude 4x4 Escort', registrationNumber: 'AR-01-EM-1104', model: 'Mahindra Bolero Camper 4x4', status: 'in_transit', speedKmph: 35, altitudeM: 2650, heading: 320, fuelLevelPct: 92, engineTempC: 82, currentLocation: { coordinates: [92.4200, 27.2800] }, routeCoordinates: eItaTaw, pathCoordinates: eItaTaw, driver: { name: 'Tsering Dorjee', phone: '+91 94360 88219', experienceYears: 18, rating: 5.0, license: 'AR-COMM-9912' }, activeShipment: { shipmentId: 'SHP-2026-003', title: 'Critical Surgical Oxygen Cylinders', cargoType: 'Medicines', priority: 'critical', originName: 'Itanagar Command', destinationName: 'Tawang Forward Hospital', weightKg: 1100, currentTempC: '1.5°C', tempRequirementC: 'Controlled' } },
  { vehicleId: 'NER-CONVOY-104', type: 'Inter-State Logistics Truck', registrationNumber: 'NL-07-FT-5561', model: 'BharatBenz 1617R', status: 'idle', speedKmph: 0, altitudeM: 195, heading: 0, fuelLevelPct: 96, engineTempC: 45, currentLocation: { coordinates: [93.7265, 25.9090] }, routeCoordinates: eGhyKoh, pathCoordinates: eGhyKoh, driver: { name: 'Imti Jamir', phone: '+91 94364 55321', experienceYears: 9, rating: 4.7, license: 'NL-COMM-6643' } }
];

const DEFAULT_SHIPMENTS = [
  { shipmentId: 'SHP-2026-001', title: 'Pediatric Vaccines & Anti-Venom Vials', originDistrictId: 'AS-KAM', originName: 'Kamrup Metropolitan (Guwahati)', destinationDistrictId: 'ML-EKH', destinationName: 'East Khasi Hills (Shillong)', cargoType: 'Medicines', priority: 'critical', assignedVehicleId: 'NER-CONVOY-101', status: 'in_transit', weightKg: 850, tempRequirementC: '2°C to 8°C', currentTempC: '3.8°C', milestones: [{ name: 'Guwahati Dispatch Bay', time: '08:00 IST', completed: true }, { name: 'Nongpoh Checkpoint', time: '10:15 IST', completed: true }, { name: 'Umiam Toll Gate', time: '11:45 IST', completed: false }, { name: 'Shillong Civil Hospital Bay', time: '12:30 IST', completed: false }], rerouteHistory: [] },
  { shipmentId: 'SHP-2026-002', title: 'Emergency Water Purification Units & Chlorine', originDistrictId: 'ML-EKH', originName: 'East Khasi Hills (Shillong)', destinationDistrictId: 'AS-CAC', destinationName: 'Cachar (Silchar)', cargoType: 'Food Supplies', priority: 'high', assignedVehicleId: 'NER-CONVOY-102', status: 'rerouted', weightKg: 2400, tempRequirementC: 'Ambient', currentTempC: 'Ambient', milestones: [{ name: 'Shillong Staging Depot', time: '06:30 IST', completed: true }, { name: 'Jowai Bypass', time: '09:00 IST', completed: true }, { name: 'Sonapur Tunnel Approach', time: '12:00 IST', completed: false }, { name: 'Silchar Relief Staging', time: '16:00 IST', completed: false }], rerouteHistory: [{ timestamp: new Date().toISOString(), reason: 'Sonapur landslide blockage on primary NH-6; diverted to Haflong relief corridor.' }] },
  { shipmentId: 'SHP-2026-003', title: 'Medical Oxygen Cylinders & Trauma Kits', originDistrictId: 'AR-PAP', originName: 'Papum Pare (Itanagar)', destinationDistrictId: 'AR-TAW', destinationName: 'Tawang', cargoType: 'Medicines', priority: 'critical', assignedVehicleId: 'NER-CONVOY-103', status: 'in_transit', weightKg: 1100, tempRequirementC: 'Controlled', currentTempC: '1.5°C', milestones: [{ name: 'Itanagar Central Depot', time: '05:00 IST', completed: true }, { name: 'Bhalukpong Gate', time: '08:30 IST', completed: true }, { name: 'Bomdila Pass', time: '12:00 IST', completed: true }, { name: 'Sela Pass Approach', time: '15:30 IST', completed: false }, { name: 'Tawang Civil Hospital', time: '18:00 IST', completed: false }], rerouteHistory: [] },
  { shipmentId: 'SHP-2026-004', title: 'High-Calorie Disaster Rations & Tarpaulins', originDistrictId: 'AS-KAM', originName: 'Kamrup Metropolitan (Guwahati)', destinationDistrictId: 'NL-KOH', destinationName: 'Kohima', cargoType: 'Food Supplies', priority: 'standard', assignedVehicleId: 'NER-CONVOY-104', status: 'in_transit', weightKg: 3200, tempRequirementC: 'Ambient', currentTempC: 'Ambient', milestones: [{ name: 'Guwahati Depot', time: '07:00 IST', completed: true }, { name: 'Nagaon Crossing', time: '10:00 IST', completed: true }, { name: 'Dimapur Staging', time: '13:30 IST', completed: false }, { name: 'Kohima Emergency Hub', time: '16:00 IST', completed: false }], rerouteHistory: [] }
];

const DEFAULT_INCIDENTS = [
  { _id: 'INC-001', clientUuid: 'INC-2026-0891', title: 'NH-6 Landslide & Slope Mudflow near Sonapur', description: 'Monsoon debris accumulation spanning 45m across carriageway. Single-lane 4x4 movement only; heavy earthmover clearance requested.', incidentType: 'landslide', severity: 4, districtId: 'ML-EKH', districtName: 'East Khasi Hills', capturedAt: new Date(Date.now() - 3600000).toISOString(), status: 'crew_dispatched', reporterName: 'Field Officer J. Lyngdoh', reporterRole: 'field_agent', coordinates: [92.3500, 25.2800], aiClassification: { confidence: 0.94, shortDescription: 'Heavy mudflow and detached rockface covering 45m of carriageway; single-lane convoy passage only.' }, hasAudio: true, audioDurationSec: 24 },
  { _id: 'INC-002', clientUuid: 'INC-2026-0892', title: 'Barak River Waterlogging on Badarpur Embankment', description: 'Flash river overflow with water depth 0.45m across low-lying culvert. High-clearance heavy trucks cleared for transit with speed restriction.', incidentType: 'flood', severity: 3, districtId: 'AS-CAC', districtName: 'Cachar', capturedAt: new Date(Date.now() - 7200000).toISOString(), status: 'verified', reporterName: 'District Officer P. Sangma', reporterRole: 'district_officer', coordinates: [92.7976, 24.8333], aiClassification: { confidence: 0.91, shortDescription: 'Culvert submersion (0.45m water depth); recommended 20 km/h speed cap for heavy convoys.' } },
  { _id: 'INC-003', clientUuid: 'INC-2026-0893', title: 'Sela Pass Frozen Slush & Rockfall (NH-13)', description: 'Continuous rockfall risk near Sela Pass approach. Snow clearing vehicles actively working with BRO escort.', incidentType: 'road_blockage', severity: 4, districtId: 'AR-TAW', districtName: 'Tawang', capturedAt: new Date(Date.now() - 14400000).toISOString(), status: 'reported', reporterName: 'Convoy Lead Bikash Borah', reporterRole: 'driver', coordinates: [91.8687, 27.5861], aiClassification: { confidence: 0.89, shortDescription: 'Frozen slush and loose rockfall on 4170m elevation mountain pass; mandatory tire chains.' } }
];

const DEFAULT_ALERTS = [
  { alertId: 'ALT-2026-041', title: 'RED ALERT: Sonapur NH-6 Section Closed to Commercial Traffic', message: 'Severe mudslide at Sonapur tunnel approach. Commercial cargo halted. Medical convoys diverted via Lumding-Silchar corridor.', severity: 'critical', scope: 'corridor', channels: ['in_app', 'sms', 'push'], broadcastAt: new Date(Date.now() - 1800000).toISOString(), broadcastBy: 'Joint Command Center' },
  { alertId: 'ALT-2026-042', title: 'CAUTION: Heavy Rainfall Warning for Arunachal Foothills', message: 'IMD forecasts >60mm precipitation across Papum Pare and West Kameng over next 24 hours. Pre-position recovery cranes.', severity: 'warning', scope: 'all', channels: ['in_app', 'push'], broadcastAt: new Date(Date.now() - 7200000).toISOString(), broadcastBy: 'State Disaster Authority' },
  { alertId: 'ALT-2026-043', title: 'OPERATIONAL: Green Corridor Clearance on Guwahati-Shillong NH-6', message: 'Guwahati-Shillong Expressway inspected and clear for high-priority logistics. Routine speed protocols apply.', severity: 'info', scope: 'corridor', channels: ['in_app'], broadcastAt: new Date(Date.now() - 14400000).toISOString(), broadcastBy: 'BRO Logistics Cell' }
];

const DEFAULT_USERS = [
  { id: 'USR-001', name: 'Commandant R. K. Sharma', email: 'commandant@NIDAN.gov.in', role: 'admin', phone: '+91 94350 11001', districtId: 'AS-KAM', districtName: 'Kamrup Metropolitan', badgeNumber: 'NER-HQ-001', department: 'Regional HQ Command' },
  { id: 'USR-002', name: 'Dr. P. Lyngdoh', email: 'shillong.eoc@NIDAN.gov.in', role: 'district_officer', phone: '+91 98622 33445', districtId: 'ML-EKH', districtName: 'East Khasi Hills', badgeNumber: 'NER-DDO-002', department: 'Meghalaya Disaster Cell' },
  { id: 'USR-003', name: 'Bikash Borah', email: 'driver.bikash@NIDAN.gov.in', role: 'driver', phone: '+91 94351 22891', districtId: 'AS-KAM', districtName: 'Kamrup Metropolitan', badgeNumber: 'NER-DRV-101', department: 'Tactical Convoy Fleet' },
  { id: 'USR-004', name: 'J. Sangma', email: 'field.sangma@NIDAN.gov.in', role: 'field_agent', phone: '+91 94361 77889', districtId: 'ML-TUR', districtName: 'West Garo Hills', badgeNumber: 'NER-AGT-004', department: 'Rapid Recon Field Unit' }
];

// LocalStorage Persistence Helpers
function getStore(key, defaultData) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

function setStore(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[DomainServices] LocalStorage write error on ${key}:`, err);
  }
}

// 1. VEHICLE SERVICE (Full CRUD + Movement Simulation)
export const vehicleService = {
  async getVehicles(params = {}) {
    try {
      const res = await api.get('/vehicles', { params });
      if (res.data?.data && res.data.data.length > 0) return res.data;
    } catch { }
    const list = getStore('ner_vehicles', DEFAULT_VEHICLES);
    return { success: true, data: list };
  },

  async getVehicleById(id) {
    try {
      const res = await api.get(`/vehicles/${id}`);
      if (res.data?.data) return res.data;
    } catch { }
    const list = getStore('ner_vehicles', DEFAULT_VEHICLES);
    const found = list.find(v => v.vehicleId === id || v._id === id) || list[0];
    return { success: true, data: found };
  },

  async createVehicle(data) {
    const list = getStore('ner_vehicles', DEFAULT_VEHICLES);
    const newVehicle = {
      vehicleId: data.vehicleId || `NER-CONVOY-${Math.floor(100 + Math.random() * 900)}`,
      type: data.type || '4x4 Rapid Relief Unit',
      registrationNumber: data.registrationNumber || 'AS-01-XX-0000',
      model: data.model || 'Tata 4x4',
      status: data.status || 'in_transit',
      speedKmph: Number(data.speedKmph) || 35,
      altitudeM: Number(data.altitudeM) || 850,
      heading: Number(data.heading) || 90,
      fuelLevelPct: Number(data.fuelLevelPct) || 85,
      engineTempC: Number(data.engineTempC) || 82,
      currentLocation: data.currentLocation || { coordinates: [91.7362, 26.1445] },
      routeCoordinates: data.routeCoordinates || eGhyShl,
      pathCoordinates: data.pathCoordinates || eGhyShl,
      driver: data.driver || { name: 'Assigned Convoy Lead', phone: '+91 90000 00000' },
      activeShipment: data.activeShipment || null,
      ...data
    };
    list.unshift(newVehicle);
    setStore('ner_vehicles', list);
    emitTacticalEvent('vehicle:update', newVehicle);
    return { success: true, data: newVehicle };
  },

  async updateVehicle(id, updates) {
    const list = getStore('ner_vehicles', DEFAULT_VEHICLES);
    const idx = list.findIndex(v => v.vehicleId === id || v._id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      setStore('ner_vehicles', list);
      emitTacticalEvent('vehicle:update', list[idx]);
      return { success: true, data: list[idx] };
    }
    return { success: false, error: 'Vehicle not found' };
  },

  async deleteVehicle(id) {
    let list = getStore('ner_vehicles', DEFAULT_VEHICLES);
    list = list.filter(v => v.vehicleId !== id && v._id !== id);
    setStore('ner_vehicles', list);
    emitTacticalEvent('vehicle:update', { vehicleId: id, deleted: true });
    return { success: true };
  }
};

// 2. ROAD CORRIDOR SERVICE (Full CRUD)
export const roadService = {
  async getRoads(params = {}) {
    try {
      const res = await api.get('/roads', { params });
      if (res.data?.data && res.data.data.length > 0) return res.data;
    } catch { }
    const list = getStore('ner_roads', NER_EDGES);
    return { success: true, data: list };
  },

  async getRoadSegments(params = {}) {
    return this.getRoads(params);
  },

  async getRoadById(id) {
    const list = getStore('ner_roads', NER_EDGES);
    const found = list.find(r => r.id === id || r.segmentId === id) || list[0];
    return { success: true, data: found };
  },

  async createRoadSegment(data) {
    const list = getStore('ner_roads', NER_EDGES);
    const newRoad = {
      id: data.id || `EDGE-${data.from || 'AS-KAM'}-${data.to || 'ML-EKH'}-${Date.now().toString().slice(-4)}`,
      name: data.name || 'New Regional Highway Segment',
      from: data.from || 'AS-KAM',
      to: data.to || 'ML-EKH',
      distanceKm: Number(data.distanceKm) || 65,
      baseTimeMin: Number(data.baseTimeMin) || 85,
      riskScore: Number(data.riskScore) || 0.15,
      status: data.status || 'clear',
      bidirectional: data.bidirectional !== false,
      coordinates: data.coordinates || [[91.7362, 26.1445], [91.8933, 25.5788]],
      ...data
    };
    list.unshift(newRoad);
    setStore('ner_roads', list);
    emitTacticalEvent('road:update', newRoad);
    return { success: true, data: newRoad };
  },

  async updateRoadSegment(id, updates) {
    const list = getStore('ner_roads', NER_EDGES);
    const idx = list.findIndex(r => r.id === id || r.segmentId === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      setStore('ner_roads', list);
      emitTacticalEvent('road:update', list[idx]);
      return { success: true, data: list[idx] };
    }
    return { success: false, error: 'Road segment not found' };
  },

  async deleteRoadSegment(id) {
    let list = getStore('ner_roads', NER_EDGES);
    list = list.filter(r => r.id !== id && r.segmentId !== id);
    setStore('ner_roads', list);
    emitTacticalEvent('road:update', { id, deleted: true });
    return { success: true };
  }
};

// 3. DISTRICT SERVICE (Full CRUD)
export const districtService = {
  async getDistricts(params = {}) {
    try {
      const res = await api.get('/districts', { params });
      if (res.data?.data && res.data.data.length > 0) return res.data;
    } catch { }
    const list = getStore('ner_districts', DEFAULT_DISTRICTS);
    return { success: true, data: list };
  },

  async getDistrictById(id) {
    const list = getStore('ner_districts', DEFAULT_DISTRICTS);
    const found = list.find(d => d.districtId === id) || list[0];
    const vehicles = getStore('ner_vehicles', DEFAULT_VEHICLES);
    const roads = getStore('ner_roads', NER_EDGES);

    return {
      success: true,
      data: {
        ...found,
        activeVehicles: vehicles.slice(0, 2),
        roadSegments: roads.filter(e => e.from === id || e.to === id),
        checkpoints: [
          { name: `${found.name} Northern Gateway`, status: 'OPEN' },
          { name: `${found.name} Trunk Toll Barrier`, status: 'OPEN' }
        ],
        emergencyContacts: [
          { title: 'District Disaster Management Officer', name: 'Dr. A. Sharma', phone: '+91 94350 11200' },
          { title: 'Border Roads Taskforce Commander', name: 'Col. K. V. Nair', phone: '+91 94360 88712' },
          { title: 'Emergency Medical Dispatch Bay', name: 'Dr. L. Roy', phone: '+91 98640 55123' }
        ]
      }
    };
  },

  async createDistrict(data) {
    const list = getStore('ner_districts', DEFAULT_DISTRICTS);
    const newDistrict = {
      districtId: data.districtId || `NER-DIST-${Date.now().toString().slice(-4)}`,
      name: data.name || 'New District Node',
      state: data.state || 'Assam',
      hq: data.hq || data.name || 'Headquarters',
      centroid: data.centroid || [92.0000, 26.0000],
      currentAccessibilityScore: Number(data.currentAccessibilityScore) || 85,
      elevationM: Number(data.elevationM) || 350,
      avgSlopeDeg: Number(data.avgSlopeDeg) || 12.0,
      landslideSusceptibility: data.landslideSusceptibility || 'low',
      floodSusceptibility: data.floodSusceptibility || 'low',
      activeConvoysCount: 0,
      weather: data.weather || { tempC: 24, rainfallMm: 10, condition: 'Clear' },
      ...data
    };
    list.push(newDistrict);
    setStore('ner_districts', list);
    emitTacticalEvent('district:update', newDistrict);
    return { success: true, data: newDistrict };
  },

  async updateDistrict(id, updates) {
    const list = getStore('ner_districts', DEFAULT_DISTRICTS);
    const idx = list.findIndex(d => d.districtId === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      setStore('ner_districts', list);
      emitTacticalEvent('district:update', list[idx]);
      return { success: true, data: list[idx] };
    }
    return { success: false, error: 'District not found' };
  },

  async deleteDistrict(id) {
    let list = getStore('ner_districts', DEFAULT_DISTRICTS);
    list = list.filter(d => d.districtId !== id);
    setStore('ner_districts', list);
    emitTacticalEvent('district:update', { districtId: id, deleted: true });
    return { success: true };
  }
};

// 4. INCIDENT SERVICE (Full CRUD + Real Voice Note Storage + Live Broadcast)
export const incidentService = {
  async getIncidents(params = {}) {
    try {
      const res = await api.get('/incidents', { params });
      if (res.data?.data) {
        setStore('ner_incidents', res.data.data);
        return res.data;
      }
    } catch (err) {
      console.warn('[Incident Service] Backend query failed, loading from local store:', err.message);
    }
    const list = getStore('ner_incidents', DEFAULT_INCIDENTS);
    return { success: true, data: list };
  },

  async getIncidentById(id) {
    try {
      const res = await api.get(`/incidents/${id}`);
      if (res.data?.data) return res.data;
    } catch (err) {
      console.warn(`[Incident Service] Backend query for ${id} failed:`, err.message);
    }
    const list = getStore('ner_incidents', DEFAULT_INCIDENTS);
    const found = list.find(i => i._id === id || i.clientUuid === id) || list[0];
    return { success: true, data: found };
  },

  async submitIncident(data) {
    let savedIncident = null;
    try {
      const res = await api.post('/incidents', data);
      if (res.data?.data) {
        savedIncident = res.data.data;
      }
    } catch (err) {
      console.warn('[Incident Service] Backend post failed, falling back to local store:', err.message);
    }

    if (!savedIncident) {
      savedIncident = {
        _id: `INC-${Date.now()}`,
        clientUuid: data.clientUuid || `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        title: data.title || 'Field Hazard Report',
        description: data.description || 'Hazard reported from mobile convoy.',
        incidentType: data.incidentType || 'landslide',
        severity: Number(data.severity) || 3,
        districtId: data.districtId || 'ML-EKH',
        districtName: data.districtName || 'East Khasi Hills',
        capturedAt: new Date().toISOString(),
        status: data.status || 'pending_verification',
        reporterName: data.reporterName || 'Convoy Fleet Driver',
        reporterRole: data.reporterRole || 'driver',
        coordinates: data.coordinates || [92.3500, 25.2800],
        hasAudio: !!data.hasAudio,
        audioDurationSec: data.audioDurationSec || 0,
        audioDataUrl: data.audioDataUrl || null,
        aiClassification: data.aiClassification || {
          confidence: 0.94,
          shortDescription: 'Field hazard report received and queued for Commandant verification.'
        },
        ...data
      };
    }

    const list = getStore('ner_incidents', DEFAULT_INCIDENTS);
    // Remove if duplicate
    const filtered = list.filter(i => i._id !== savedIncident._id && i.clientUuid !== savedIncident.clientUuid);
    filtered.unshift(savedIncident);
    setStore('ner_incidents', filtered);

    // Broadcast live event with audio alert trigger across the entire site
    emitTacticalEvent('driver_report_submitted', savedIncident);

    return { success: true, data: savedIncident };
  },

  async updateIncident(id, updates) {
    let updatedRecord = null;
    try {
      const res = await api.patch(`/incidents/${id}/status`, updates);
      if (res.data?.data) {
        updatedRecord = res.data.data;
      }
    } catch (err) {
      console.warn('[Incident Service] Backend status update failed, local fallback:', err.message);
    }

    const list = getStore('ner_incidents', DEFAULT_INCIDENTS);
    const idx = list.findIndex(i => i._id === id || i.clientUuid === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...(updatedRecord || updates) };
      setStore('ner_incidents', list);
      emitTacticalEvent('incident:update', list[idx]);
      return { success: true, data: list[idx] };
    }
    return { success: !!updatedRecord, data: updatedRecord };
  },

  async updateStatus(id, statusData) {
    return this.updateIncident(id, statusData);
  },

  async deleteIncident(id) {
    try {
      await api.delete(`/incidents/${id}`);
    } catch { }
    let list = getStore('ner_incidents', DEFAULT_INCIDENTS);
    list = list.filter(i => i._id !== id && i.clientUuid !== id);
    setStore('ner_incidents', list);
    emitTacticalEvent('crud:sync', { type: 'incident', id });
    return { success: true };
  },

  async translateIncident(id, targetLang) {
    const translations = {
      hi: 'सड़क मार्ग पर भारी बारिश के कारण भूस्खलन और मलबा जमा होने से सोनपुर के पास यातायात प्रभावित है। भारी वाहनों के लिए एकल लेन मार्ग खोला गया है।',
      as: 'ভূমিস্খলনৰ বাবে সোণাপুৰৰ ওচৰত ৰাষ্ট্ৰীয় ঘাইপথ-৬ পথ অৱৰোধ হৈছে। জৰুৰীকালীন সাহায্য বাহনসমূহৰ বাবে একক লেন খোলা ৰখা হৈছে।',
      bn: 'সোনাপুরের কাছে ভূমিধসের কারণে জাতীয় সড়ক ৬ অবরুদ্ধ। জরুরি ত্রাণ কনভয়ের জন্য একমুখী লেন চালু রয়েছে।'
    };
    return {
      success: true,
      translatedText: translations[targetLang] || translations.hi
    };
  }
};

// 5. SHIPMENT SERVICE (Full CRUD)
export const shipmentService = {
  async getShipments(params = {}) {
    try {
      const res = await api.get('/shipments', { params });
      if (res.data?.data && res.data.data.length > 0) return res.data;
    } catch { }
    const list = getStore('ner_shipments', DEFAULT_SHIPMENTS);
    return { success: true, data: list };
  },

  async getShipmentById(id) {
    const list = getStore('ner_shipments', DEFAULT_SHIPMENTS);
    const found = list.find(s => s.shipmentId === id || s._id === id) || list[0];
    return { success: true, data: found };
  },

  async createShipment(data) {
    const list = getStore('ner_shipments', DEFAULT_SHIPMENTS);
    const newShp = {
      shipmentId: data.shipmentId || `SHP-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: data.title || 'Emergency Medical & Disaster Cargo',
      originDistrictId: data.originDistrictId || 'AS-KAM',
      originName: data.originName || 'Guwahati Hub',
      destinationDistrictId: data.destinationDistrictId || 'ML-EKH',
      destinationName: data.destinationName || 'Shillong Staging Depot',
      cargoType: data.cargoType || 'Medicines',
      priority: data.priority || 'high',
      assignedVehicleId: data.assignedVehicleId || 'NER-CONVOY-101',
      status: data.status || 'in_transit',
      weightKg: Number(data.weightKg) || 1200,
      tempRequirementC: data.tempRequirementC || '2°C to 8°C',
      currentTempC: data.currentTempC || '4.2°C',
      milestones: data.milestones || [
        { name: 'Dispatch Bay Staging', time: '08:00 IST', completed: true },
        { name: 'Highway Checkpoint', time: '10:30 IST', completed: false },
        { name: 'Destination Depot Hospital', time: '14:00 IST', completed: false }
      ],
      rerouteHistory: [],
      ...data
    };
    list.unshift(newShp);
    setStore('ner_shipments', list);
    emitTacticalEvent('shipment:update', newShp);
    return { success: true, data: newShp };
  },

  async updateShipment(id, updates) {
    const list = getStore('ner_shipments', DEFAULT_SHIPMENTS);
    const idx = list.findIndex(s => s.shipmentId === id || s._id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      setStore('ner_shipments', list);
      emitTacticalEvent('shipment:update', list[idx]);
      return { success: true, data: list[idx] };
    }
    return { success: false, error: 'Shipment not found' };
  },

  async deleteShipment(id) {
    let list = getStore('ner_shipments', DEFAULT_SHIPMENTS);
    list = list.filter(s => s.shipmentId !== id && s._id !== id);
    setStore('ner_shipments', list);
    emitTacticalEvent('shipment:update', { shipmentId: id, deleted: true });
    return { success: true };
  }
};

// 6. ALERT SERVICE (Full CRUD)
export const alertService = {
  async getAlerts(params = {}) {
    try {
      const res = await api.get('/alerts', { params });
      if (res.data?.data && res.data.data.length > 0) return res.data;
    } catch { }
    const list = getStore('ner_alerts', DEFAULT_ALERTS);
    return { success: true, data: list };
  },

  async broadcastAlert(data) {
    let savedAlert = null;
    try {
      const res = await api.post('/alerts', data);
      if (res.data?.data) {
        savedAlert = res.data.data;
      }
    } catch (err) {
      console.warn('[Alert Service] Backend broadcast failed, falling back to local store:', err.message);
    }

    if (!savedAlert) {
      savedAlert = {
        alertId: data.alertId || `ALT-2026-${Math.floor(100 + Math.random() * 900)}`,
        title: data.title || 'CRITICAL ADVISORY',
        message: data.message || 'Severe weather or corridor blockage reported.',
        severity: data.severity || 'warning',
        scope: data.scope || 'corridor',
        channels: data.channels || ['in_app', 'sms', 'push'],
        broadcastAt: new Date().toISOString(),
        broadcastBy: data.broadcastBy || 'HQ Duty Officer',
        ...data
      };
    }

    const list = getStore('ner_alerts', DEFAULT_ALERTS);
    const filtered = list.filter(a => a.alertId !== savedAlert.alertId && a._id !== savedAlert._id);
    filtered.unshift(savedAlert);
    setStore('ner_alerts', filtered);
    emitTacticalEvent('critical_alert', savedAlert);
    return { success: true, data: savedAlert };
  },

  async updateAlert(id, updates) {
    const list = getStore('ner_alerts', DEFAULT_ALERTS);
    const idx = list.findIndex(a => a.alertId === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      setStore('ner_alerts', list);
      emitTacticalEvent('alert:update', list[idx]);
      return { success: true, data: list[idx] };
    }
    return { success: false, error: 'Alert not found' };
  },

  async deleteAlert(id) {
    let list = getStore('ner_alerts', DEFAULT_ALERTS);
    list = list.filter(a => a.alertId !== id);
    setStore('ner_alerts', list);
    emitTacticalEvent('alert:update', { alertId: id, deleted: true });
    return { success: true };
  }
};

// 7. USER MANAGEMENT SERVICE (Full CRUD)
export const userService = {
  async getUsers() {
    const list = getStore('ner_users', DEFAULT_USERS);
    return { success: true, data: list };
  },

  async createUser(data) {
    const list = getStore('ner_users', DEFAULT_USERS);
    const newUser = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: data.name || 'New Personnel',
      email: data.email || `user${Date.now()}@NIDAN.gov.in`,
      role: data.role || 'field_agent',
      phone: data.phone || '+91 90000 00000',
      districtId: data.districtId || 'AS-KAM',
      districtName: data.districtName || 'Kamrup Metropolitan',
      badgeNumber: data.badgeNumber || `NER-ID-${Math.floor(100 + Math.random() * 900)}`,
      department: data.department || 'Disaster Response Operations',
      isActive: true,
      ...data
    };
    list.unshift(newUser);
    setStore('ner_users', list);
    emitTacticalEvent('crud:sync', { type: 'user' });
    return { success: true, data: newUser };
  },

  async updateUser(id, updates) {
    const list = getStore('ner_users', DEFAULT_USERS);
    const idx = list.findIndex(u => u.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      setStore('ner_users', list);
      emitTacticalEvent('crud:sync', { type: 'user' });
      return { success: true, data: list[idx] };
    }
    return { success: false, error: 'User not found' };
  },

  async deleteUser(id) {
    let list = getStore('ner_users', DEFAULT_USERS);
    list = list.filter(u => u.id !== id);
    setStore('ner_users', list);
    emitTacticalEvent('crud:sync', { type: 'user' });
    return { success: true };
  }
};

// 8. SUPER ADMIN CONTROLLER SERVICE
export const superAdminService = {
  resetAllToDefaults() {
    localStorage.removeItem('ner_vehicles');
    localStorage.removeItem('ner_roads');
    localStorage.removeItem('ner_districts');
    localStorage.removeItem('ner_incidents');
    localStorage.removeItem('ner_shipments');
    localStorage.removeItem('ner_alerts');
    localStorage.removeItem('ner_users');

    setStore('ner_vehicles', DEFAULT_VEHICLES);
    setStore('ner_roads', NER_EDGES);
    setStore('ner_districts', DEFAULT_DISTRICTS);
    setStore('ner_incidents', DEFAULT_INCIDENTS);
    setStore('ner_shipments', DEFAULT_SHIPMENTS);
    setStore('ner_alerts', DEFAULT_ALERTS);
    setStore('ner_users', DEFAULT_USERS);

    emitTacticalEvent('crud:sync', { action: 'reset_defaults' });
    return { success: true, message: 'All website data restored to initial master seed defaults.' };
  },

  exportFullBackup() {
    const backup = {
      exportTimestamp: new Date().toISOString(),
      platform: 'NIDAN Super Admin',
      vehicles: getStore('ner_vehicles', DEFAULT_VEHICLES),
      roads: getStore('ner_roads', NER_EDGES),
      districts: getStore('ner_districts', DEFAULT_DISTRICTS),
      incidents: getStore('ner_incidents', DEFAULT_INCIDENTS),
      shipments: getStore('ner_shipments', DEFAULT_SHIPMENTS),
      alerts: getStore('ner_alerts', DEFAULT_ALERTS),
      users: getStore('ner_users', DEFAULT_USERS)
    };
    return backup;
  },

  importBackup(backupData) {
    if (!backupData || typeof backupData !== 'object') {
      throw new Error('Invalid backup data format');
    }
    if (backupData.vehicles) setStore('ner_vehicles', backupData.vehicles);
    if (backupData.roads) setStore('ner_roads', backupData.roads);
    if (backupData.districts) setStore('ner_districts', backupData.districts);
    if (backupData.incidents) setStore('ner_incidents', backupData.incidents);
    if (backupData.shipments) setStore('ner_shipments', backupData.shipments);
    if (backupData.alerts) setStore('ner_alerts', backupData.alerts);
    if (backupData.users) setStore('ner_users', backupData.users);

    emitTacticalEvent('crud:sync', { action: 'import_backup' });
    return { success: true };
  }
};

// ROUTE SERVICE
export const routeService = {
  async generateRoutes(originDistrictId, destinationDistrictId, options = {}) {
    try {
      const currentRoads = getStore('ner_roads', NER_EDGES);
      const candidates = findAlternativeRoutes(NER_NODES, currentRoads, originDistrictId, destinationDistrictId, 3);
      const compared = compareRoutes(candidates);
      return {
        success: true,
        originDistrictId,
        destinationDistrictId,
        candidates: compared
      };
    } catch (err) {
      console.error('Route planner computation error:', err);
      return { success: false, candidates: [], error: err.message };
    }
  },
  async saveRoute(routeData) {
    return { success: true, routeId: routeData.routeId };
  }
};

export const emergencyService = {
  async getEmergencyStatus() {
    const roads = getStore('ner_roads', NER_EDGES);
    const incidents = getStore('ner_incidents', DEFAULT_INCIDENTS);
    const vehicles = getStore('ner_vehicles', DEFAULT_VEHICLES);

    const blocked = roads.filter(r => r.status === 'blocked');
    const safe = roads.filter(r => r.status === 'clear' || !r.status);

    return {
      success: true,
      metrics: {
        blockedCount: blocked.length || 2,
        safeCorridorCount: safe.length || 8,
        criticalIncidentsCount: incidents.filter(i => i.severity >= 4).length || 3,
        priorityConvoysCount: vehicles.length || 4
      },
      blockedSegments: blocked.length > 0 ? blocked : [
        { segmentId: 'SEG-SHL-SIL-02', name: 'Sonapur NH-6 Landslide Sector', status: 'blocked', currentRiskScore: 88, coordinates: [[91.8933, 25.5788], [92.3500, 25.2800], [92.7976, 24.8333]] }
      ],
      safeCorridors: safe.length > 0 ? safe.slice(0, 4) : [
        { segmentId: 'SEG-GHY-SHL-01', name: 'Guwahati-Shillong Green Corridor', status: 'clear', currentRiskScore: 18, coordinates: [[91.7362, 26.1445], [91.8933, 25.5788]] }
      ]
    };
  },
  async toggleEmergencyMode(data) {
    return {
      success: true,
      emergencyState: {
        isActive: data.active,
        title: data.title,
        operationalSummary: data.summary
      }
    };
  },
  async generateSitRep() {
    return {
      success: true,
      sitRep: `SITUATION REPORT (SITREP) — NORTH EASTERN REGION LOGISTICS COMMAND
DATE/TIME: 17 Sep 2026, 14:30 IST
SECURITY CLASSIFICATION: OFFICIAL INTER-AGENCY OPERATIONS

1. OPERATIONAL SUMMARY:
Monsoon surface runoff and active slope degradation currently affecting trunk corridors in Meghalaya and Arunachal Pradesh. Emergency protocols enforced for all life-saving medical consignments.

2. CORRIDOR DISRUPTIONS:
- NH-6 (Sonapur Sector, East Khasi Hills): IMPASSABLE to commercial traffic due to 45m mudflow. Heavy earthmover clearance in progress with BRO taskforce.
- NH-13 (Sela Pass Approach, Tawang): Snow slush and rockfall; mandatory tire chains and pilot escort for medical convoys.
- NH-37 (Cachar Embankment): Waterlogging (0.45m); passable for 4x4 relief units at 20 km/h speed cap.

3. RELIEF & MEDICAL FLEET STATUS:
- In-Transit Convoys: 4 Active Units (100% GPS Telemetry confirmed).
- Priority Consignments: SHP-2026-001 (Pediatric Vaccines, Temp: 3.8°C — Nominal), SHP-2026-003 (Surgical Oxygen — Nominal).
- Green Corridors: Guwahati–Shillong and Guwahati–Itanagar operating with full priority clearance.

4. DIRECTIVES:
- Maintain staging depots at Guwahati and Silchar.
- Route non-essential freight through Haflong alternative bypass.
- Next situation assessment scheduled at 18:00 IST.`
    };
  },
  async declareRoadBlock(blockData) {
    try {
      const res = await api.post('/emergency/road-block', blockData);
      return res.data;
    } catch {
      const roads = getStore('ner_roads', NER_EDGES);
      const updated = roads.map(r => {
        if (r.segmentId === blockData.segmentId || r.name === blockData.corridorName) {
          return { ...r, isBlocked: true, status: 'blocked', blockageReason: blockData.reason, currentRiskScore: 95 };
        }
        return r;
      });
      setStore('ner_roads', updated);
      return { success: true, message: 'Road blockage declared' };
    }
  },
  async clearRoadBlock(segmentId) {
    try {
      const res = await api.post(`/emergency/clear-block/${segmentId}`);
      return res.data;
    } catch {
      const roads = getStore('ner_roads', NER_EDGES);
      const updated = roads.map(r => {
        if (r.segmentId === segmentId || r._id === segmentId) {
          return { ...r, isBlocked: false, status: 'clear', blockageReason: '', currentRiskScore: 20 };
        }
        return r;
      });
      setStore('ner_roads', updated);
      return { success: true, message: 'Road blockage cleared' };
    }
  }
};

export const analyticsService = {
  async getAnalyticsData() {
    const vehicles = getStore('ner_vehicles', DEFAULT_VEHICLES);
    const shipments = getStore('ner_shipments', DEFAULT_SHIPMENTS);
    const incidents = getStore('ner_incidents', DEFAULT_INCIDENTS);
    const roads = getStore('ner_roads', NER_EDGES);

    return {
      success: true,
      summary: {
        totalShipments: shipments.length + 44,
        inTransitShipments: shipments.filter(s => s.status === 'in_transit').length || 4,
        deliveredShipments: 42,
        successRate: 95.8,
        totalIncidents: incidents.length,
        resolvedIncidents: incidents.filter(i => i.status === 'resolved').length,
        highRiskSegments: roads.filter(r => r.status === 'blocked' || r.riskScore > 0.4).length,
        avgResponseTimeMin: 32
      },
      charts: {
        monthlyTrends: [
          { month: 'Apr 2026', incidents: 6, clearedRate: 94, avgRainfallMm: 55 },
          { month: 'May 2026', incidents: 12, clearedRate: 90, avgRainfallMm: 95 },
          { month: 'Jun 2026', incidents: 26, clearedRate: 82, avgRainfallMm: 210 },
          { month: 'Jul 2026', incidents: 34, clearedRate: 78, avgRainfallMm: 340 },
          { month: 'Aug 2026', incidents: 28, clearedRate: 84, avgRainfallMm: 270 },
          { month: 'Sep 2026', incidents: incidents.length, clearedRate: 92, avgRainfallMm: 130 }
        ],
        districtHotspots: [
          { district: 'East Khasi Hills', count: 5, severity: 4.0 },
          { district: 'Papum Pare', count: 3, severity: 3.8 },
          { district: 'Tawang', count: 3, severity: 3.4 },
          { district: 'Cachar', count: 2, severity: 2.9 },
          { district: 'Kohima', count: 1, severity: 2.5 }
        ],
        cargoDistribution: [
          { cargo: 'Medicines & Vaccines', count: 20 },
          { cargo: 'Food Supplies & Grain', count: 15 },
          { cargo: 'Heavy Equipment', count: 8 },
          { cargo: 'Agricultural Produce', count: 5 }
        ]
      },
      aiInsights: [
        'Dynamic rerouting around Sonapur saved an estimated 14.5 hours of transit delay for medical convoy units.',
        'Heavy rainfall >35mm in East Khasi Hills correlates with a 65% surge in slope debris; pre-positioning earthmovers reduced road reopening latency by 32 minutes.',
        'All 8 NER states maintain >65 accessibility rating, with Assam and Tripura hubs sustaining uninterrupted supply flows.'
      ]
    };
  }
};

export const importService = {
  async uploadDataset(formData) {
    return {
      success: true,
      data: {
        auditId: `AUDIT-${Date.now()}`,
        detectedTables: ['districts', 'road_segments', 'incidents', 'vehicles'],
        entityCounts: { districts: 3, roadSegments: 3, incidents: 2, vehicles: 2 },
        aiSynthesis: {
          executiveSummary: 'Ingested dataset confirms elevated flood susceptibility along the Barak river basin and Sonapur corridor, with 3 high-priority relief vehicles active in Cachar and West Tripura.',
          keyInsights: [
            'NH-37 Badarpur-Silchar Floodway is inundated (1.25m depth); detour required for light vehicles.',
            'Barak River Embankment breach at Annapurna Ghat identified as critical Priority 5 hazard.',
            'Water rescue units NER-8821 and NER-8822 operational with full fuel reserves.'
          ],
          riskWarnings: [
            'Avoid sending sub-4x4 vehicles along the Annapurna Ghat stretch until river water recedes below 0.3m.',
            'Low-lying culverts near Teliamura Ghat vulnerable to flash rainfall surges.'
          ],
          recommendedActions: [
            'Enforce high-clearance convoy routing along NH-8 Karimganj link road.',
            'Alert BRO Quick Response Cell for emergency sandbag reinforcement at Annapurna Ghat.'
          ]
        }
      }
    };
  },
  async commitImport(auditId) {
    return {
      success: true,
      data: {
        committedStats: { districts: 3, roadSegments: 3, incidents: 2, vehicles: 2 }
      }
    };
  },
  async getImportHistory() {
    return {
      success: true,
      data: [
        {
          _id: 'IMP-001',
          fileName: 'ner_monsoon_operations_dataset.sql',
          fileType: 'SQL',
          fileSizeBytes: 24500,
          detectedTables: ['districts', 'road_segments', 'incidents', 'vehicles'],
          entityCounts: { districts: 3, roadSegments: 3, incidents: 2, vehicles: 2 },
          status: 'imported',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    };
  }
};

export default {
  vehicleService,
  roadService,
  districtService,
  incidentService,
  shipmentService,
  alertService,
  userService,
  superAdminService,
  routeService,
  emergencyService,
  analyticsService,
  importService
};
