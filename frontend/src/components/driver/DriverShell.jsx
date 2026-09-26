import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Navigation,
  Mic,
  MessageSquare,
  User,
  Radio,
  Globe,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  PhoneCall,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useTheme } from '../../features/ThemeContext';
import { useAuthStore } from '../../features/useAuthStore';

export function DriverShell({ children, vehicleId = 'NER-CONVOY-101', gpsStatus = 'strong' }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuthStore();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'as', label: 'অসমীয়া (Assamese)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'mni', label: 'মৈতৈলোন্ (Manipuri)' },
    { code: 'lus', label: 'Mizo ṭawng (Mizo)' },
    { code: 'kha', label: 'Ka Ktien Khasi' },
    { code: 'ne', label: 'नेपाली (Nepali)' }
  ];

  const handleLanguageSelect = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setLangMenuOpen(false);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const driverTabs = [
    { label: t('driver.myRoute', 'My Route'), path: '/driver', icon: Navigation, end: true },
    { label: t('driver.report', 'Report'), path: '/driver/report', icon: Mic },
    { label: t('driver.messages', 'Messages'), path: '/driver/messages', icon: MessageSquare },
    { label: t('driver.profile', 'Profile'), path: '/driver/profile', icon: User }
  ];

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-150 select-none pb-20"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* 1. TOP HEADER (Simple, Driver-Specific, Zero Admin Leaks) */}
      <header
        className="sticky top-0 z-40 h-14 px-4 flex items-center justify-between border-b shadow-xs backdrop-blur-md"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        {/* Left: Vehicle Badge & Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center shadow-xs">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              <span>{vehicleId}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-[10px] flex items-center gap-1 font-medium" style={{ color: 'var(--text-muted)' }}>
              {gpsStatus === 'strong' ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-500" />
                  <span>GPS: Live (High Accuracy)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-500" />
                  <span>GPS: Reconnecting...</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Emergency Call, Language & Theme */}
        <div className="flex items-center gap-2">
          {/* Direct tap-to-call emergency */}
          <a
            href="tel:+919435011200"
            className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/50 hover:bg-red-100 transition"
            title="Call Control Room"
          >
            <PhoneCall className="w-4 h-4" />
          </a>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="px-2 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition"
              style={{
                background: 'var(--bg-subtle)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)'
              }}
            >
              <Globe className="w-3.5 h-3.5 text-accent" />
              <span className="uppercase text-[11px] font-mono">{i18n.language?.slice(0, 2)}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {langMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-50"
                  onClick={() => setLangMenuOpen(false)}
                />
                <div
                  className="absolute right-0 mt-1 w-48 rounded-xl border shadow-xl z-50 p-1 space-y-0.5"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  {languages.map((lng) => (
                    <button
                      key={lng.code}
                      onClick={() => handleLanguageSelect(lng.code)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                        i18n.language === lng.code
                          ? 'bg-accent text-white font-semibold'
                          : 'text-text-primary hover:bg-bg-subtle'
                      }`}
                    >
                      {lng.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border transition"
            style={{
              background: 'var(--bg-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </header>

      {/* 2. MAIN DRIVER VIEW CONTENT */}
      <main className="flex-1 max-w-xl w-full mx-auto p-3 sm:p-4">
        {children}
      </main>

      {/* 3. BOTTOM TAB NAVIGATION (Exactly 4 Tabs, Thumb-Friendly >= 56px) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t shadow-lg flex items-center justify-around px-2 backdrop-blur-md"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        {driverTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.end
            ? location.pathname === tab.path
            : location.pathname.startsWith(tab.path);

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`flex-1 flex flex-col items-center justify-center h-full py-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-accent font-bold scale-[1.03]'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-accent-subtle text-accent' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium tracking-tight mt-0.5">
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default DriverShell;
