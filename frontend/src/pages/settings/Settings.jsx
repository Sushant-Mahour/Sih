import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Map,
  Bell,
  Volume2,
  Globe,
  Shield,
  RotateCcw,
  Download,
  Save,
  CheckCircle2
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { showToast } from '../../components/ui/Toast';
import { useTheme } from '../../features/ThemeContext';
import { useAuthStore } from '../../features/useAuthStore';

export function Settings() {
  const { i18n } = useTranslation();
  const { theme, themeMode, setTheme, setThemeMode } = useTheme();
  const currentThemeMode = themeMode || theme || 'light';
  const { user, switchRole } = useAuthStore();

  const [activeTab, setActiveTab] = useState('appearance');

  // Local settings state
  const [mapProvider, setMapProvider] = useState(() => localStorage.getItem('ner_map_provider') || 'static');
  const [refreshInterval, setRefreshInterval] = useState(() => localStorage.getItem('ner_refresh_interval') || '2500');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('ner_sound_alerts') !== 'false');
  const [browserNotifications, setBrowserNotifications] = useState(() => localStorage.getItem('ner_browser_notifs') === 'true');
  const [language, setLanguage] = useState(() => localStorage.getItem('i18nextLng') || localStorage.getItem('ner_language') || 'en');
  const [coordinateFormat, setCoordinateFormat] = useState('decimal');

  const handleSaveSettings = () => {
    localStorage.setItem('ner_map_provider', mapProvider);
    localStorage.setItem('ner_refresh_interval', refreshInterval);
    localStorage.setItem('ner_sound_alerts', String(soundEnabled));
    localStorage.setItem('ner_browser_notifs', String(browserNotifications));
    localStorage.setItem('ner_language', language);
    localStorage.setItem('i18nextLng', language);
    i18n.changeLanguage(language);
    showToast('Platform preferences saved successfully', 'success');
  };

  const handleResetDefaults = () => {
    setTheme('light');
    setMapProvider('static');
    setRefreshInterval('2500');
    setSoundEnabled(true);
    setBrowserNotifications(false);
    setLanguage('en');
    localStorage.removeItem('ner_map_provider');
    localStorage.removeItem('ner_refresh_interval');
    localStorage.removeItem('ner_sound_alerts');
    localStorage.removeItem('ner_browser_notifs');
    localStorage.removeItem('ner_language');
    showToast('Preferences restored to system defaults', 'info');
  };

  const handleExportDiagnostics = () => {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      platform: 'NIDAN Enterprise Logistics',
      version: '2.4.0',
      activeRole: user?.role,
      theme,
      mapProvider,
      refreshInterval,
      soundEnabled,
      browserNotifications,
      language
    };

    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ner_diagnostics_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Diagnostic log exported', 'info');
  };

  const navTabs = [
    { id: 'appearance', label: 'Appearance & Theme', icon: Sun },
    { id: 'map', label: 'Map Engine & Telemetry', icon: Map },
    { id: 'notifications', label: 'Sound & Alerts', icon: Bell },
    { id: 'language', label: 'Language & Locale', icon: Globe },
    { id: 'role', label: 'Persona & Diagnostics', icon: Shield }
  ];

  return (
    <PageShell
      title="Platform Settings & Preferences"
      subtitle="Configure appearance, map provider tiers, telemetry refresh rates, audio alerts, and role profiles"
      breadcrumbs={['Dashboard', 'Settings']}
      actionSlot={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetDefaults} icon={RotateCcw}>
            Reset Defaults
          </Button>
          <Button variant="primary" size="sm" onClick={handleSaveSettings} icon={Save}>
            Save Preferences
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sub-nav (4 cols) */}
        <div className="lg:col-span-4">
          <Card className="p-2 space-y-1">
            {navTabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${isActive ? 'font-semibold' : ''
                    }`}
                  style={{
                    background: isActive ? 'var(--accent-subtle)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)'
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </Card>
        </div>

        {/* Right Tab Content Panel (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Appearance & Theme */}
          {activeTab === 'appearance' && (
            <Card title="Appearance & Color Theme">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold block mb-2" style={{ color: 'var(--text-primary)' }}>
                    Interface Color Theme
                  </label>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                    Choose between crisp Light mode (default for daylight operations), Dark mode (for low-light monitoring), or System preference.
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (setTheme) setTheme('light');
                        else if (setThemeMode) setThemeMode('light');
                        showToast('Theme set to Light mode', 'info');
                      }}
                      className={`p-4 rounded-xl border text-center space-y-2 transition-all cursor-pointer ${currentThemeMode === 'light'
                          ? 'border-accent bg-accent-subtle/50 ring-2 ring-accent shadow-sm'
                          : 'border-border-subtle bg-bg-subtle hover:bg-bg-base'
                        }`}
                    >
                      <div className="w-8 h-8 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Sun className="w-4 h-4" />
                      </div>
                      <div className="font-semibold text-xs text-text-primary">Light Mode</div>
                      <div className="text-[10px] text-text-muted">Default enterprise theme</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (setTheme) setTheme('dark');
                        else if (setThemeMode) setThemeMode('dark');
                        showToast('Theme set to Dark mode', 'info');
                      }}
                      className={`p-4 rounded-xl border text-center space-y-2 transition-all cursor-pointer ${currentThemeMode === 'dark'
                          ? 'border-accent bg-accent-subtle/50 ring-2 ring-accent shadow-sm'
                          : 'border-border-subtle bg-bg-subtle hover:bg-bg-base'
                        }`}
                    >
                      <div className="w-8 h-8 mx-auto rounded-full bg-slate-800 text-sky-400 flex items-center justify-center">
                        <Moon className="w-4 h-4" />
                      </div>
                      <div className="font-semibold text-xs text-text-primary">Dark Mode</div>
                      <div className="text-[10px] text-text-muted">Low-light night operations</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (setTheme) setTheme('system');
                        else if (setThemeMode) setThemeMode('system');
                        showToast('Theme set to System OS preference', 'info');
                      }}
                      className={`p-4 rounded-xl border text-center space-y-2 transition-all cursor-pointer ${currentThemeMode === 'system'
                          ? 'border-accent bg-accent-subtle/50 ring-2 ring-accent shadow-sm'
                          : 'border-border-subtle bg-bg-subtle hover:bg-bg-base'
                        }`}
                    >
                      <div className="w-8 h-8 mx-auto rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div className="font-semibold text-xs text-text-primary">System Auto</div>
                      <div className="text-[10px] text-text-muted">Sync with OS theme</div>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm block" style={{ color: 'var(--text-primary)' }}>High-Density Tables</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Display more table rows with condensed vertical padding</span>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Map Engine & Telemetry */}
          {activeTab === 'map' && (
            <Card title="Map Engine & GPS Telemetry">
              <div className="space-y-4">
                <Select
                  label="Default Basemap Layer"
                  value={mapProvider}
                  onChange={(e) => setMapProvider(e.target.value)}
                  options={[
                    { value: 'static', label: 'Static Vector Basemap (100% Offline, Zero Watermark)' },
                    { value: 'street', label: 'OpenStreetMap Street Tiles' },
                    { value: 'terrain', label: 'Topographical Mountain Terrain' }
                  ]}
                />

                <Select
                  label="Telemetry Stream Polling Rate"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(e.target.value)}
                  options={[
                    { value: '1000', label: 'Ultra High (1.0s) — Heavy Bandwidth' },
                    { value: '2500', label: 'Nominal Operational (2.5s) — Recommended' },
                    { value: '5000', label: 'Standard (5.0s)' },
                    { value: '10000', label: 'Low Bandwidth / Battery Saver (10.0s)' }
                  ]}
                />

                <Select
                  label="Coordinate Projection Format"
                  value={coordinateFormat}
                  onChange={(e) => setCoordinateFormat(e.target.value)}
                  options={[
                    { value: 'decimal', label: 'Decimal Degrees (26.1445°N, 91.7362°E)' },
                    { value: 'dms', label: 'Degrees Minutes Seconds (26° 8\' 40" N)' }
                  ]}
                />
              </div>
            </Card>
          )}

          {/* Notifications & Audio */}
          {activeTab === 'notifications' && (
            <Card title="Audio & Incident Alert Settings">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Audible Incident Chimes</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Play subtle audio tone when new Severity 4/5 incident is logged</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Browser Push Notifications</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Receive desktop alerts for emergency corridor closures</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={browserNotifications}
                    onChange={(e) => setBrowserNotifications(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Language & Regional */}
          {activeTab === 'language' && (
            <Card title="Language & Regional Settings">
              <div className="space-y-4">
                <Select
                  label="Interface Language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  options={[
                    { value: 'en', label: 'English (India)' },
                    { value: 'as', label: 'অসমীয়া (Assamese)' },
                    { value: 'bn', label: 'বাংলা (Bengali)' },
                    { value: 'hi', label: 'हिन्दी (Hindi)' },
                    { value: 'mni', label: 'মৈতৈলোন্ (Manipuri)' },
                    { value: 'lus', label: 'Mizo ṭawng (Mizo)' },
                    { value: 'kha', label: 'Ka Ktien Khasi (Khasi)' },
                    { value: 'ne', label: 'नेपाली (Nepali)' }
                  ]}
                />

                <div className="p-3 rounded-lg border text-xs" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Regional Time Zone</p>
                  <p>All timestamps are rendered in Indian Standard Time (IST, UTC+5:30) with explicit formatting.</p>
                </div>
              </div>
            </Card>
          )}

          {/* Persona & Diagnostics */}
          {activeTab === 'role' && (
            <Card title="Active Persona & System Diagnostics">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold block mb-1" style={{ color: 'var(--text-primary)' }}>
                    Active Simulation Role
                  </label>
                  <select
                    value={user?.role || 'admin'}
                    onChange={(e) => {
                      switchRole(e.target.value);
                      showToast(`Role switched to ${e.target.value}`, 'info');
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  >
                    <option value="admin">Commandant (HQ Admin) — Full Controls</option>
                    <option value="district_officer">District Disaster Officer — Local Approvals</option>
                    <option value="field_agent">Mobile Field Agent — Incident Reporter</option>
                    <option value="driver">Convoy Fleet Driver — Telemetry Only</option>
                  </select>
                </div>

                <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <span className="font-semibold text-sm block" style={{ color: 'var(--text-primary)' }}>System Diagnostic Dump</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Export system state, active routing cache, and store configs</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportDiagnostics} icon={Download}>
                    Export JSON
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
