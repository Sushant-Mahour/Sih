import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown, Check, Compass, Layers, MoreHorizontal } from 'lucide-react';

const SIBLING_PAGES = [
  { name: 'Overview Dashboard', path: '/dashboard' },
  { name: 'Live Map & Convoys', path: '/map' },
  { name: 'AI Route Planner', path: '/routes/planner' },
  { name: 'Incident Command', path: '/incidents' },
  { name: 'Alerts & Broadcasts', path: '/alerts' },
  { name: 'Analytics & Insights', path: '/analytics' },
  { name: 'Districts of NER', path: '/districts' },
  { name: 'Consignments Manifest', path: '/shipments' },
  { name: 'Dataset Ingestion', path: '/import-data' },
  { name: 'Emergency Command', path: '/emergency' },
  { name: 'Super Admin Data Hub', path: '/admin' },
  { name: 'Driver Dashboard', path: '/driver' },
  { name: 'Platform Settings', path: '/settings' }
];

const ROUTE_MAP = {
  dashboard: '/dashboard',
  overview: '/dashboard',
  consignments: '/shipments',
  shipments: '/shipments',
  incidents: '/incidents',
  districts: '/districts',
  'live map': '/map',
  map: '/map',
  convoys: '/map',
  alerts: '/alerts',
  emergency: '/emergency',
  routes: '/routes/planner',
  'route planner': '/routes/planner',
  analytics: '/analytics',
  'data hub': '/admin',
  'super admin': '/admin',
  'dataset ingestion': '/import-data',
  settings: '/settings',
  driver: '/driver'
};

function resolveBreadcrumbPath(item) {
  if (!item) return null;
  if (typeof item === 'object' && item.path) return item.path;
  const label = typeof item === 'object' ? item.label : String(item);
  const normalized = label.trim().toLowerCase();
  return ROUTE_MAP[normalized] || null;
}

function getBreadcrumbLabel(item) {
  if (!item) return '';
  if (typeof item === 'object' && item.label) return item.label;
  return String(item);
}

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
  scopeOptions = [],
  activeScope,
  onScopeChange
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [ellipsisOpen, setEllipsisOpen] = useState(false);
  const dropdownRef = useRef(null);
  const ellipsisRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (ellipsisRef.current && !ellipsisRef.current.contains(e.target)) {
        setEllipsisOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasMultipleBreadcrumbs = breadcrumbs.length > 2;

  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-4 border-b border-border-subtle">
      <div className="space-y-1.5 flex-1 min-w-0">
        {/* Breadcrumb + Page Context Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-[12px] text-text-muted flex-wrap">
              {breadcrumbs.map((b, i) => {
                const isLast = i === breadcrumbs.length - 1;
                const label = getBreadcrumbLabel(b);
                const path = resolveBreadcrumbPath(b);

                return (
                  <React.Fragment key={i}>
                    {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />}

                    {isLast ? (
                      <span className="text-text-primary font-bold truncate max-w-[200px] sm:max-w-none">
                        {label}
                      </span>
                    ) : path ? (
                      <button
                        onClick={() => navigate(path)}
                        className="text-text-secondary hover:text-accent font-semibold transition cursor-pointer hover:underline"
                      >
                        {label}
                      </button>
                    ) : (
                      <span className="text-text-secondary font-medium">{label}</span>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          )}

          {/* Page-Context Quick Switcher Dropdown */}
          <div ref={dropdownRef} className="relative inline-block ml-1">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-2 py-0.5 rounded-md border text-[11px] font-semibold text-accent bg-accent-subtle/50 hover:bg-accent-subtle flex items-center gap-1 transition cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)' }}
              title="Jump to sibling section / view context"
            >
              <Compass className="w-3 h-3" />
              <span className="hidden xs:inline">Jump Section</span>
              <ChevronDown className="w-3 h-3 text-text-muted" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-bg-elevated border border-border-subtle rounded-xl shadow-xl py-1 z-50 overflow-hidden">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-text-muted border-b border-border-subtle tracking-wider bg-bg-subtle/40">
                  Platform Section Navigator
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {SIBLING_PAGES.map((p) => {
                    const isCurrent = location.pathname.startsWith(p.path);
                    return (
                      <button
                        key={p.path}
                        onClick={() => {
                          navigate(p.path);
                          setDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-accent-subtle hover:text-accent transition cursor-pointer ${
                          isCurrent ? 'font-bold text-accent bg-accent-subtle/30' : 'text-text-primary'
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Page Title & Scope */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          {title && (
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight leading-tight">
              {title}
            </h1>
          )}

          {scopeOptions && scopeOptions.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <span>Viewing:</span>
              <select
                value={activeScope}
                onChange={(e) => onScopeChange && onScopeChange(e.target.value)}
                className="bg-bg-subtle border border-border-subtle text-text-primary text-xs font-semibold rounded px-2 py-1 focus:outline-none cursor-pointer"
              >
                {scopeOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {description && (
          <p className="text-xs sm:text-sm text-text-secondary leading-normal">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-shrink-0 pt-1 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
