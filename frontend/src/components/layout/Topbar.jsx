import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Globe,
  Bell,
  MapPin,
  Route,
  Truck,
  Package,
  X,
  Building2,
  ChevronDown,
  Check,
  Volume2,
  VolumeX,
  LogOut,
  User,
  Settings as SettingsIcon,
  Play,
  Pause,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  CheckCheck
} from 'lucide-react';
import { useAuthStore } from '../../features/useAuthStore';
import { useUIStore } from '../../features/useUIStore';
import { useTheme } from '../../features/ThemeContext';
import { useNotificationStore } from '../../features/useNotificationStore';
import { playNotificationSound, speakAnnouncement, testLaptopSpeaker } from '../../services/soundService';
import { showToast } from '../ui/Toast';

const LANGUAGES = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'as', native: 'অসমীয়া', english: 'Assamese' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { code: 'mni', native: 'মৈতৈলোন্', english: 'Manipuri' },
  { code: 'lus', native: 'Mizo ṭawng', english: 'Mizo' },
  { code: 'kha', native: 'Ka Ktien Khasi', english: 'Khasi' },
  { code: 'ne', native: 'नेपाली', english: 'Nepali' }
];

export function Topbar() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { theme, toggleTheme } = useTheme();

  const {
    notifications,
    unreadCount,
    isMuted,
    toggleMute,
    markAsRead,
    markAllAsRead,
    removeNotification
  } = useNotificationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('live');

  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const langMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Global keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setLangMenuOpen(false);
        setNotifMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for all dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setNotifMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('ner_language', langCode);
    setLangMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setProfileMenuOpen(false);
    showToast('Signed out of Command Session', 'info');
    navigate('/login');
  };

  const audioRef = useRef(null);

  const handleInlineAudioPlay = (n, e) => {
    e.stopPropagation();
    if (playingAudioId === n.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(n.id);
      if (n.audioDataUrl && (n.audioDataUrl.startsWith('data:audio') || n.audioDataUrl.startsWith('blob:') || n.audioDataUrl.startsWith('http'))) {
        try {
          const audio = new Audio(n.audioDataUrl);
          audioRef.current = audio;
          audio.onended = () => setPlayingAudioId(null);
          audio.onerror = () => {
            playNotificationSound('incident_report');
            speakAnnouncement(`Voice field report: ${n.message}`);
            setTimeout(() => setPlayingAudioId(null), 3500);
          };
          audio.play().catch(() => {
            playNotificationSound('incident_report');
            speakAnnouncement(`Voice field report: ${n.message}`);
            setTimeout(() => setPlayingAudioId(null), 3500);
          });
        } catch (err) {
          playNotificationSound('incident_report');
          speakAnnouncement(`Voice field report: ${n.message}`);
          setTimeout(() => setPlayingAudioId(null), 3500);
        }
      } else {
        playNotificationSound('incident_report');
        speakAnnouncement(`Voice field report: ${n.message}`);
        setTimeout(() => setPlayingAudioId(null), 3500);
      }
    }
  };

  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    setNotifMenuOpen(false);
    if (n.targetPath) {
      navigate(n.targetPath);
    } else if (n.incidentId) {
      navigate(`/incidents/${n.incidentId}`);
    } else {
      navigate('/alerts');
    }
  };

  const currentLangObj = LANGUAGES.find(l => l.code === (i18n.language || 'en')) || LANGUAGES[0];

  // Search index
  const searchableItems = [
    { type: 'Districts', title: 'Kamrup Metropolitan (Guwahati)', path: '/districts/AS-KAM', icon: Building2 },
    { type: 'Districts', title: 'East Khasi Hills (Shillong)', path: '/districts/ML-EKH', icon: Building2 },
    { type: 'Districts', title: 'Papum Pare (Itanagar)', path: '/districts/AR-PAP', icon: Building2 },
    { type: 'Districts', title: 'Cachar (Silchar)', path: '/districts/AS-CAC', icon: Building2 },
    { type: 'Districts', title: 'Tawang', path: '/districts/AR-TAW', icon: Building2 },
    { type: 'Routes', title: 'NH-6 Guwahati to Shillong Expressway', path: '/routes/planner', icon: Route },
    { type: 'Routes', title: 'NH-27 / NH-29 Guwahati to Dimapur-Kohima', path: '/routes/planner', icon: Route },
    { type: 'Routes', title: 'NH-13 Trans-Arunachal Sela Corridor', path: '/routes/planner', icon: Route },
    { type: 'Vehicles', title: 'NER-CONVOY-101 (Tata 4x4 Medical Escort)', path: '/map/vehicle/NER-CONVOY-101', icon: Truck },
    { type: 'Vehicles', title: 'NER-CONVOY-102 (Ashok Leyland Relief Carrier)', path: '/map/vehicle/NER-CONVOY-102', icon: Truck },
    { type: 'Consignments', title: 'SHP-2026-001 (Life-Saving Vaccines)', path: '/shipments/SHP-2026-001', icon: Package },
    { type: 'Consignments', title: 'SHP-2026-002 (Emergency Water Skids)', path: '/shipments/SHP-2026-002', icon: Package }
  ];

  const filteredResults = searchQuery.trim()
    ? searchableItems.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectResult = (item) => {
    navigate(item.path);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="h-14 bg-bg-elevated border-b border-border-subtle px-4 flex items-center justify-between sticky top-0 z-30 transition-colors duration-150">
      {/* Left: Sidebar Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-[480px]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-muted">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search districts, routes, vehicles, consignments…"
              className="w-full bg-bg-subtle text-text-primary placeholder-text-muted text-xs rounded-md pl-8 pr-16 py-1.5 border border-border-subtle focus:outline-none focus:border-accent focus:bg-bg-base transition duration-150"
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-bg-base border border-border-subtle rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Search Dropdown Results */}
          {searchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-bg-elevated border border-border-subtle rounded-lg shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
              {filteredResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-muted">
                  No matching records for "{searchQuery}"
                </div>
              ) : (
                <div className="py-1">
                  {['Districts', 'Routes', 'Vehicles', 'Consignments'].map((category) => {
                    const categoryItems = filteredResults.filter((r) => r.type === category);
                    if (categoryItems.length === 0) return null;
                    return (
                      <div key={category} className="py-1">
                        <div className="px-3 py-1 text-[11px] font-semibold text-text-muted uppercase tracking-wider bg-bg-subtle/50">
                          {category}
                        </div>
                        {categoryItems.map((item, idx) => {
                          const ItemIcon = item.icon;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectResult(item)}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-accent-subtle hover:text-accent flex items-center gap-2.5 transition cursor-pointer"
                            >
                              <ItemIcon className="w-4 h-4 text-text-muted flex-shrink-0" />
                              <span className="font-medium truncate">{item.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Telemetry Status, Theme, Sound Mute, Language, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Telemetry status dot */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-text-muted">
          <span className={`w-2 h-2 rounded-full ${connectionStatus === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="font-mono">{connectionStatus === 'live' ? 'Live · 2.5s' : 'Reconnecting'}</span>
        </div>

        {/* Audio Mute / Unmute Toggle Button */}
        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute notification sounds' : 'Mute notification sounds'}
          title={isMuted ? 'Notification chime muted (Click to unmute)' : 'Notification chime active (Click to mute)'}
          className={`w-8 h-8 rounded-md flex items-center justify-center border transition cursor-pointer ${
            isMuted
              ? 'text-red-500 border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30'
              : 'text-text-secondary hover:text-accent hover:bg-accent-subtle border-border-subtle'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-accent" />}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="w-8 h-8 rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-subtle border border-border-subtle transition cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-text-secondary" />}
        </button>

        {/* 8-Language Popover Selector */}
        <div ref={langMenuRef} className="relative">
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            aria-label="Select language"
            className="flex items-center gap-1.5 bg-bg-subtle border border-border-subtle rounded-md px-2.5 py-1 text-xs font-semibold text-text-primary hover:bg-bg-base transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-accent" />
            <span>{currentLangObj.native}</span>
            <ChevronDown className="w-3 h-3 text-text-muted" />
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-bg-elevated border border-border-subtle rounded-xl shadow-xl py-1 z-50 overflow-hidden">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-text-muted border-b border-border-subtle tracking-wider bg-bg-subtle/40">
                Choose Language (8 NER)
              </div>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLanguageChange(l.code)}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition hover:bg-accent-subtle hover:text-accent ${
                    i18n.language === l.code ? 'font-bold text-accent bg-accent-subtle/40' : 'text-text-primary'
                  }`}
                >
                  <div>
                    <span className="block text-xs">{l.native}</span>
                    <span className="block text-[10px] text-text-muted">{l.english}</span>
                  </div>
                  {i18n.language === l.code && <Check className="w-3.5 h-3.5 text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Notification Bell & Panel (Priority 3) */}
        <div ref={notifMenuRef} className="relative">
          <button
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            aria-label="View notifications and hazard reports"
            className="relative p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-subtle border border-border-subtle transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border border-bg-elevated">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-bg-elevated border border-border-subtle rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
              {/* Notification Header */}
              <div className="px-3 py-2 border-b border-border-subtle flex items-center justify-between bg-bg-subtle/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-accent" />
                  <span className="text-xs font-bold text-text-primary">Tactical Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-accent hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-border-subtle">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-muted">
                    No active notifications or pending reviews.
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isPlaying = playingAudioId === n.id;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 transition cursor-pointer hover:bg-bg-subtle relative ${
                          !n.isRead ? 'bg-accent-subtle/20 font-medium' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {n.severity >= 4 ? (
                              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            )}
                            <p className="text-xs font-bold text-text-primary leading-tight line-clamp-1">
                              {n.title}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(n.id);
                            }}
                            className="text-text-muted hover:text-text-primary p-0.5"
                            title="Dismiss"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>

                        <p className="text-[11px] text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-1">
                          <span className="text-[10px] text-text-muted font-mono">{n.time}</span>

                          <div className="flex items-center gap-2">
                            {n.hasVoiceNote && (
                              <button
                                onClick={(e) => handleInlineAudioPlay(n, e)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                                  isPlaying
                                    ? 'bg-amber-600 text-white animate-pulse'
                                    : 'bg-accent/15 text-accent hover:bg-accent/25'
                                }`}
                                title="Listen to recorded field audio"
                              >
                                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                <span>Voice ({n.audioDuration || '0:18'})</span>
                              </button>
                            )}

                            <span className="text-[11px] text-accent font-bold hover:underline flex items-center gap-0.5">
                              Review <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Panel Footer */}
              <div className="p-2 border-t border-border-subtle bg-bg-subtle/50 text-center">
                <button
                  onClick={() => {
                    setNotifMenuOpen(false);
                    navigate('/alerts');
                  }}
                  className="text-xs text-accent font-bold hover:underline"
                >
                  View All Advisories & Broadcasts →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu with Logout Dropdown (Priority 2 Fix 3) */}
        <div ref={profileMenuRef} className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 pl-2 border-l border-border-subtle hover:opacity-90 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-md bg-accent text-white flex items-center justify-center font-semibold text-xs flex-shrink-0">
              {user?.name?.[0] || 'C'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-text-primary leading-tight truncate max-w-[130px]">
                {user?.name || 'Commandant'}
              </p>
              <p className="text-[10px] text-text-muted capitalize">
                {user?.role?.replace('_', ' ') || 'Admin'}
              </p>
            </div>
            <ChevronDown className="w-3 h-3 text-text-muted hidden sm:block" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-bg-elevated border border-border-subtle rounded-xl shadow-xl py-1 z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-border-subtle bg-bg-subtle/40">
                <p className="text-xs font-bold text-text-primary">{user?.name || 'Commandant'}</p>
                <p className="text-[11px] text-text-muted truncate">{user?.email || 'admin@nerlogistics.gov.in'}</p>
                <p className="text-[10px] font-mono text-accent mt-0.5 capitalize">{user?.department || 'NER Command'}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-bg-subtle text-text-primary transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-text-muted" />
                  <span>View Profile</span>
                </button>

                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-bg-subtle text-text-primary transition cursor-pointer"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-text-muted" />
                  <span>Platform Settings</span>
                </button>
              </div>

              <div className="border-t border-border-subtle py-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
