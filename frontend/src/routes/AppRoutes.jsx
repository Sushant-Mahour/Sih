import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { ROLES, PAGE_ACCESS_MATRIX } from '../config/roles';

import { Landing } from '../pages/public/Landing';
import { Login } from '../pages/public/Login';
import { Overview } from '../pages/dashboard/Overview';
import { LiveMap } from '../pages/map/LiveMap';
import { VehicleDetail } from '../pages/map/VehicleDetail';
import { RoutePlanner } from '../pages/routes/RoutePlanner';
import { ReportIncident } from '../pages/incidents/ReportIncident';
import { IncidentList } from '../pages/incidents/IncidentList';
import { IncidentDetail } from '../pages/incidents/IncidentDetail';
import { AlertsCenter } from '../pages/alerts/AlertsCenter';
import { Analytics } from '../pages/analytics/Analytics';
import { DistrictDirectory } from '../pages/districts/DistrictDirectory';
import { DistrictDetail } from '../pages/districts/DistrictDetail';
import { ShipmentList } from '../pages/shipments/ShipmentList';
import { ShipmentDetail } from '../pages/shipments/ShipmentDetail';
import { EmergencyMode } from '../pages/emergency/EmergencyMode';
import { ImportData } from '../pages/import/ImportData';
import { Settings } from '../pages/settings/Settings';
import { SuperAdmin } from '../pages/admin/SuperAdmin';
import { DriverDashboard } from '../pages/driver/DriverDashboard';
import { DriverAlternativeRoute } from '../pages/driver/DriverAlternativeRoute';
import { DriverMessages } from '../pages/driver/DriverMessages';
import { DriverProfile } from '../pages/driver/DriverProfile';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Driver Mobile Views (Isolated Driver Shell) */}
      <Route
        path="/driver"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/driver']}>
            <DriverDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/driver/alternative-route"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/driver/alternative-route']}>
            <DriverAlternativeRoute />
          </RequireAuth>
        }
      />
      <Route
        path="/driver/report"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/driver/report']}>
            <ReportIncident standalone />
          </RequireAuth>
        }
      />
      <Route
        path="/driver/messages"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/driver/messages']}>
            <DriverMessages />
          </RequireAuth>
        }
      />
      <Route
        path="/driver/profile"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/driver/profile']}>
            <DriverProfile />
          </RequireAuth>
        }
      />

      {/* Command & Headquarters Pages */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/dashboard']}>
            <Overview />
          </RequireAuth>
        }
      />
      <Route
        path="/map"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/map']}>
            <LiveMap />
          </RequireAuth>
        }
      />
      <Route
        path="/map/vehicle/:id"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/map/vehicle/:id']}>
            <VehicleDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/routes"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/routes']}>
            <RoutePlanner />
          </RequireAuth>
        }
      />
      <Route
        path="/routes/planner"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/routes/planner']}>
            <RoutePlanner />
          </RequireAuth>
        }
      />
      <Route
        path="/incidents/new"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/incidents/new']}>
            <ReportIncident />
          </RequireAuth>
        }
      />
      <Route
        path="/incidents"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/incidents']}>
            <IncidentList />
          </RequireAuth>
        }
      />
      <Route
        path="/incidents/:id"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/incidents/:id']}>
            <IncidentDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/alerts"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/alerts']}>
            <AlertsCenter />
          </RequireAuth>
        }
      />
      <Route
        path="/analytics"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/analytics']}>
            <Analytics />
          </RequireAuth>
        }
      />
      <Route
        path="/districts"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/districts']}>
            <DistrictDirectory />
          </RequireAuth>
        }
      />
      <Route
        path="/districts/:id"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/districts/:id']}>
            <DistrictDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/shipments"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/shipments']}>
            <ShipmentList />
          </RequireAuth>
        }
      />
      <Route
        path="/shipments/:id"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/shipments/:id']}>
            <ShipmentDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/emergency"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/emergency']}>
            <EmergencyMode />
          </RequireAuth>
        }
      />
      <Route
        path="/import-data"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/import-data']}>
            <ImportData />
          </RequireAuth>
        }
      />
      <Route
        path="/super-admin"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/super-admin']}>
            <SuperAdmin />
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth roles={PAGE_ACCESS_MATRIX['/settings']}>
            <Settings />
          </RequireAuth>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
