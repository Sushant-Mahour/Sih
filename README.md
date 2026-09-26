# North East Region (NER) Tactical Logistics & Emergency Command Platform (NIDAN)

> **Mission-Critical Multi-Modal Logistics, Real-Time Fleet Telemetry, Deterministic Hazard Risk Assessment & AI Emergency Command for the 8 North Eastern States of India.**

---

## 1. Overview & Problem Addressed

The North Eastern Region (NER) of India—comprising Assam, Meghalaya, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura, and Sikkim—presents some of the most challenging logistical terrain in South Asia. Frequent monsoon landslides, steep Himalayan gradients, flash floods, and sparse connectivity frequently isolate critical districts.

**NIDAN** solves this through:
1. **Deterministic Multi-Factor Risk Engine**: Calculates real-time road hazard scores using rainfall intensity, slope gradients from SRTM DEM, and historical incident density.
2. **Graph-Based Multi-Criteria Route Optimizer**: Computes **Fastest**, **Safest**, and **Balanced** candidate paths via Dijkstra's/A* pathfinding with risk penalties.
3. **Google Gemini Multimodal AI Integration**: Instant photo classification for landslides, data-grounded route explanations, natural language intelligence synthesis, and multilingual emergency broadcast translation (Assamese, Bengali, Hindi, English).
4. **Resilient Offline PWA Sync**: IndexedDB queued incident submissions that automatically sync upon network restoration with idempotent UUID upserting.
5. **Real-Time Fleet Simulation**: Socket.io live telemetry streaming vehicle position, speed, heading, and cargo temperature every 2.5s.

---

## 2. Platform Architecture

```
ner-logistics-platform/
├── frontend/                          # React 18 + Vite + TailwindCSS + MapLibre GL JS
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    # Button, Card, Badge, Modal, Input, Table, StatCard
│   │   │   ├── layout/                # Sidebar, Topbar, PageShell, EmergencyBanner
│   │   │   └── map/                   # MapContainer, MapLegend
│   │   ├── pages/                     # 16 Tactical Screen Implementations
│   │   │   ├── public/                # Landing, Login
│   │   │   ├── dashboard/             # Overview
│   │   │   ├── map/                   # LiveMap, VehicleDetail
│   │   │   ├── routes/                # RoutePlanner
│   │   │   ├── incidents/             # ReportIncident, IncidentList, IncidentDetail
│   │   │   ├── alerts/                # AlertsCenter
│   │   │   ├── analytics/             # Analytics
│   │   │   ├── districts/             # DistrictDirectory, DistrictDetail
│   │   │   ├── shipments/             # ShipmentList, ShipmentDetail
│   │   │   └── emergency/             # EmergencyMode
│   │   ├── services/                  # api.js, domainServices.js, socket.js, offlineSync.js
│   │   └── features/                  # Zustand stores (useAuthStore, useUIStore, useEmergencyStore)
│
├── backend/                           # Node.js + Express + Socket.io + Mongoose
│   ├── src/
│   │   ├── config/                    # db.js (with MongoMemoryServer fallback), gemini.js, env.js
│   │   ├── models/                    # User, Vehicle, Shipment, Route, Incident, Alert, District, RoadSegment
│   │   ├── services/                  # riskEngine, routeOptimizer, gemini, weather, notification
│   │   ├── controllers/               # Resource controllers
│   │   ├── routes/                    # Versioned REST endpoints (/api/v1)
│   │   ├── sockets/                   # Live tracking Socket.io namespace
│   │   ├── jobs/                      # GPS movement simulation interval (2.5s)
│   │   ├── seed/                      # Database seed scripts
│   │   └── app.js                     # Server entrypoint
│
└── data/                              # Real NER Datasets & Curated Seed Data
    ├── ner-districts.geojson          # Real 8-state administrative nodes & centroids
    ├── ner-road-network.geojson       # Strategic highway network topology (NH-6, NH-13, NH-15, NH-2)
    └── seed-vehicles-shipments.json   # Curated vehicles, consignments, alerts, and field incidents
```

---

## 3. Dataset Transparency: Real Open Data vs Synthetic Seed

| Dataset Layer | Source & Nature | Usage in Platform |
|---|---|---|
| **Districts & Centroids** | **REAL** (GADM India Admin Level 2 filtered to NER) | Base node network for all 8 states in `data/ner-districts.geojson` |
| **Road Network Topology** | **REAL** (OpenStreetMap Overpass Highway Corridors) | Graph edges with distance, slope & bridges in `data/ner-road-network.geojson` |
| **Precipitation & Weather** | **REAL LIVE** (Open-Meteo API / WMO Weather Radar) | Live cached weather feed per district centroid |
| **Elevation & Slopes** | **REAL** (SRTM 30m DEM / Topography Gradients) | Precomputed slope degrees and elevation profiles per corridor |
| **Vehicles & Consignments** | **SYNTHETIC SEED** (`@faker-js/faker` & Curated) | Demo fleet of Tata 4x4s, Reefer trucks, and medical rations |
| **Incidents & Landslides** | **SYNTHETIC SEED** (Plausible Historical Scenarios) | Representative mudslide and flash flood ground reports |

---

## 4. Quick Start & Execution

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Step 1: Start the Backend
```bash
cd backend
npm install
npm start
```
*Note: The backend automatically connects to local MongoDB or initializes an embedded in-memory database fallback seamlessly.*

### Step 2: Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Access the application in your browser at `http://localhost:5173`.

---

## 5. Preset Role Credentials for Evaluation

The login page (`/login`) includes a **one-click role switcher**:
- **Commandant (HQ Admin)**: `admin@nerlogistics.gov.in` / `Password@123`
- **District Disaster Officer**: `officer@nerlogistics.gov.in` / `Password@123`
- **Mobile Field Agent**: `agent@nerlogistics.gov.in` / `Password@123`
- **Convoy Fleet Driver**: `driver@nerlogistics.gov.in` / `Password@123`

---

## 6. Offline PWA Demonstration
1. Open the application and navigate to **Field Incidents -> Submit Incident** (`/incidents/new`).
2. Open DevTools -> Network -> Toggle to **Offline**.
3. Fill in hazard details, upload a photo, and click **Transmit Incident Report**.
4. The system will store the payload in **IndexedDB** and display an offline badge.
5. Toggle Network back to **Online**; the background sync will automatically transmit the report to the backend without duplicates.
