import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  MapPin,
  Route,
  AlertOctagon,
  Bell,
  BarChart3,
  Building2,
  Package,
  ShieldAlert,
  Database,
  Settings,
  Radio,
  Shield,
  Eye
} from 'lucide-react';
import { useAuthStore } from '../../features/useAuthStore';
import { useEmergencyStore } from '../../features/useEmergencyStore';
import { useUIStore } from '../../features/useUIStore';
import { ROLES, PAGE_ACCESS_MATRIX } from '../../config/roles';

export function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, switchRole } = useAuthStore();
  const { isEmergencyActive } = useEmergencyStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const currentRole = user?.role || ROLES.ADMIN;
  const isAdmin = currentRole === ROLES.ADMIN;

  const rawNavItems = [
    { key: 'overview', label: t('nav.overview', 'Overview'), path: '/dashboard', icon: LayoutDashboard, roles: PAGE_ACCESS_MATRIX['/dashboard'] },
    { key: 'map', label: t('nav.map', 'Live Map & Convoys'), path: '/map', icon: MapPin, roles: PAGE_ACCESS_MATRIX['/map'] },
    { key: 'routePlanner', label: t('nav.routePlanner', 'AI Route Planner'), path: '/routes/planner', icon: Route, roles: PAGE_ACCESS_MATRIX['/routes/planner'] },
    { key: 'incidents', label: t('nav.incidents', 'Incident Command'), path: '/incidents', icon: AlertOctagon, roles: PAGE_ACCESS_MATRIX['/incidents'] },
    { key: 'alerts', label: t('nav.alerts', 'Alerts & Broadcasts'), path: '/alerts', icon: Bell, roles: PAGE_ACCESS_MATRIX['/alerts'] },
    { key: 'analytics', label: t('nav.analytics', 'Analytics & Insights'), path: '/analytics', icon: BarChart3, roles: PAGE_ACCESS_MATRIX['/analytics'] },
    { key: 'districts', label: t('nav.districts', 'Districts of NER'), path: '/districts', icon: Building2, roles: PAGE_ACCESS_MATRIX['/districts'] },
    { key: 'consignments', label: t('nav.consignments', 'Consignments'), path: '/shipments', icon: Package, roles: PAGE_ACCESS_MATRIX['/shipments'] },
    { key: 'datasetIngestion', label: t('nav.datasetIngestion', 'Dataset Ingestion'), path: '/import-data', icon: Database, roles: PAGE_ACCESS_MATRIX['/import-data'] },
    { key: 'superAdmin', label: 'Super Admin Data Hub', path: '/super-admin', icon: Shield, roles: PAGE_ACCESS_MATRIX['/super-admin'] },
    { key: 'emergencyMode', label: t('nav.emergencyMode', 'Emergency Mode'), path: '/emergency', icon: ShieldAlert, highlight: isEmergencyActive, roles: PAGE_ACCESS_MATRIX['/emergency'] },
    { key: 'settings', label: t('nav.settings', 'Settings'), path: '/settings', icon: Settings, roles: PAGE_ACCESS_MATRIX['/settings'] }
  ];

  // Strictly filter navigation items by current authenticated role
  const navItems = rawNavItems.filter((item) => item.roles && item.roles.includes(currentRole));

  const handleRoleChange = async (newRole) => {
    await switchRole(newRole);
    if (newRole === ROLES.DRIVER) {
      navigate('/driver');
    } else if (newRole === ROLES.FIELD_AGENT) {
      navigate('/incidents');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-bg-subtle border-r border-border-subtle transition-all duration-200 ${sidebarOpen ? 'w-60' : 'w-16 -translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Platform Brand Header */}
        <div className="h-14 px-4 flex items-center gap-3 border-b border-border-subtle bg-bg-elevated flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white flex-shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden min-w-0">
              <h1 className="text-sm font-semibold text-text-primary tracking-tight truncate">
                NIDAN
              </h1>
              <p className="text-[11px] text-text-muted truncate leading-tight">
                Logistics & Emergency Command
              </p>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 relative ${isActive
                    ? 'bg-accent-subtle text-accent font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:bg-accent before:rounded-r'
                    : item.highlight
                      ? 'bg-danger-bg text-danger hover:bg-danger-bg/80'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-base'
                  }`
                }
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${item.highlight && !sidebarOpen ? 'text-danger' : ''}`} />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {sidebarOpen && item.highlight && (
                  <span className="ml-auto px-1.5 py-0.2 rounded text-[10px] font-bold bg-danger text-white">
                    ALERT
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Identity & Admin Debug Persona Switcher */}
        <div className="p-3 border-t border-border-subtle bg-bg-elevated flex-shrink-0">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-text-muted flex items-center gap-1">
                  <Shield className="w-3 h-3 text-accent" /> {t('roles.activeRole', 'Active Role')}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-accent-subtle text-accent border border-accent/20 capitalize">
                  {currentRole.replace('_', ' ')}
                </span>
              </div>

              {/* Admin Evaluation Tool (Hidden for non-admins) */}
              {isAdmin && (
                <div className="pt-1 border-t border-border-subtle/60">
                  <div className="flex items-center gap-1 text-[10px] text-text-muted mb-1 font-mono">
                    <Eye className="w-3 h-3 text-amber-500" />
                    <span>Admin View-As Tool</span>
                  </div>
                  <select
                    aria-label="Select active simulation persona"
                    value={currentRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full bg-bg-base border border-border-subtle text-text-primary text-xs rounded-md px-2 py-1 focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="admin">{t('roles.admin', 'Commandant (HQ Admin)')}</option>
                    <option value="district_officer">{t('roles.district_officer', 'District Disaster Officer')}</option>
                    <option value="field_agent">{t('roles.field_agent', 'Mobile Field Agent')}</option>
                    <option value="driver">{t('roles.driver', 'Convoy Fleet Driver')}</option>
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center" title={`Active Role: ${currentRole}`}>
              <span className="w-7 h-7 rounded-md bg-accent-subtle border border-accent/30 text-accent font-semibold text-xs flex items-center justify-center uppercase">
                {currentRole[0] || 'A'}
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
