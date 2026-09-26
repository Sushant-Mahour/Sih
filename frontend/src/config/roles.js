/**
 * NIDAN Single Source of Truth Role Matrix
 * Consumed by: Sidebar, Route Guards (RequireAuth), and Backend Middleware
 */

export const ROLES = {
  ADMIN: 'admin',                         // Commandant / HQ Admin (full regional command)
  DISTRICT_OFFICER: 'district_officer',   // District Disaster Officer (scoped to assigned districts)
  FIELD_AGENT: 'field_agent',             // Mobile Field Agent (ground reporting only)
  DRIVER: 'driver'                        // Convoy Fleet Driver (operates single vehicle, views own journey)
};

export const ALL_ROLES = [
  ROLES.ADMIN,
  ROLES.DISTRICT_OFFICER,
  ROLES.FIELD_AGENT,
  ROLES.DRIVER
];

export const COMMAND_ROLES = [
  ROLES.ADMIN,
  ROLES.DISTRICT_OFFICER
];

export const REPORTING_ROLES = [
  ROLES.ADMIN,
  ROLES.DISTRICT_OFFICER,
  ROLES.FIELD_AGENT,
  ROLES.DRIVER
];

/**
 * Default home landing routes per role
 */
export const ROLE_HOME_ROUTES = {
  [ROLES.ADMIN]: '/dashboard',
  [ROLES.DISTRICT_OFFICER]: '/dashboard',
  [ROLES.FIELD_AGENT]: '/incidents',
  [ROLES.DRIVER]: '/driver'
};

/**
 * Page Access Matrix
 * V = Full access, P = Partial/Scoped access, X = No access
 */
export const PAGE_ACCESS_MATRIX = {
  '/dashboard': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER],
  '/driver': [ROLES.DRIVER],
  '/driver/alternative-route': [ROLES.DRIVER],
  '/driver/report': [ROLES.DRIVER],
  '/driver/messages': [ROLES.DRIVER],
  '/driver/profile': [ROLES.DRIVER],
  '/map': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER],
  '/map/vehicle/:id': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER],
  '/routes': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER],
  '/routes/planner': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER],
  '/incidents': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER, ROLES.FIELD_AGENT],
  '/incidents/new': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER, ROLES.FIELD_AGENT, ROLES.DRIVER],
  '/incidents/:id': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER, ROLES.FIELD_AGENT],
  '/alerts': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER, ROLES.FIELD_AGENT],
  '/analytics': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER],
  '/districts': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER],
  '/districts/:id': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER],
  '/shipments': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER, ROLES.DRIVER],
  '/shipments/:id': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER, ROLES.DRIVER],
  '/emergency': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER],
  '/import-data': [ROLES.ADMIN],
  '/super-admin': [ROLES.ADMIN],
  '/settings': [ROLES.ADMIN, ROLES.DISTRICT_OFFICER, ROLES.FIELD_AGENT, ROLES.DRIVER]
};

/**
 * Action Capabilities Matrix
 */
export const ACTION_CAPABILITIES = {
  ACTIVATE_RED_ALERT: [ROLES.ADMIN],
  ACTIVATE_DISTRICT_ALERT: [ROLES.ADMIN, ROLES.DISTRICT_OFFICER],
  VERIFY_INCIDENT: [ROLES.ADMIN, ROLES.DISTRICT_OFFICER],
  SUBMIT_INCIDENT: [ROLES.ADMIN, ROLES.DISTRICT_OFFICER, ROLES.FIELD_AGENT, ROLES.DRIVER],
  APPROVE_ALTERNATIVE_ROUTE: [ROLES.ADMIN, ROLES.DISTRICT_OFFICER],
  REQUEST_ALTERNATIVE_ROUTE: [ROLES.DRIVER],
  SEND_DRIVER_INSTRUCTION: [ROLES.ADMIN, ROLES.DISTRICT_OFFICER],
  ACKNOWLEDGE_INSTRUCTION: [ROLES.DRIVER],
  SCHEDULE_CONSIGNMENT: [ROLES.ADMIN, ROLES.DISTRICT_OFFICER],
  MANAGE_USERS: [ROLES.ADMIN],
  INGEST_DATASETS: [ROLES.ADMIN],
  EXPORT_REPORTS: [ROLES.ADMIN, ROLES.DISTRICT_OFFICER]
};

/**
 * Check if a role has capability for a given action
 */
export function hasCapability(role, actionKey) {
  const allowed = ACTION_CAPABILITIES[actionKey] || [];
  return allowed.includes(role);
}

/**
 * Check if a role has access to a given page route
 */
export function canAccessRoute(role, path) {
  const allowed = PAGE_ACCESS_MATRIX[path];
  if (!allowed) return true; // public or unlisted route
  return allowed.includes(role);
}
