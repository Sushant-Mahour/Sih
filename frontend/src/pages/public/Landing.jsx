import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Shield,
  MapPin,
  Route,
  AlertTriangle,
  WifiOff,
  Cpu,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Database,
  Building2,
  Truck
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useTheme } from '../../features/ThemeContext';

export function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const states = [
    'Assam', 'Meghalaya', 'Arunachal Pradesh', 'Nagaland',
    'Manipur', 'Mizoram', 'Tripura', 'Sikkim'
  ];

  const features = [
    {
      icon: Route,
      title: "Bidirectional Dijkstra's Routing Engine",
      description: 'Dual-frontier graph pathfinding with edge penalties and real-time obstacle avoidance across mountain road networks.'
    },
    {
      icon: MapPin,
      title: '3-Tier Offline Vector Map',
      description: 'Zero-watermark static vector basemaps with sub-second coordinate transforms and fallback tile layers.'
    },
    {
      icon: Database,
      title: 'Multi-Schema Dataset Ingestion',
      description: 'Ingest SQL dumps, CSV rosters, and JSON road hazard telemetry with instant AI situation synthesis.'
    },
    {
      icon: ShieldAlert,
      title: 'Joint Emergency & SitRep Command',
      description: 'One-click disaster protocol escalation, green corridor enforcement, and automated military-grade SitRep reports.'
    }
  ];

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Top Header */}
      <header
        className="h-16 px-6 md:px-12 flex items-center justify-between border-b sticky top-0 z-40 backdrop-blur-md"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: 'var(--accent)' }}>
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              NIDAN
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                v2.4
              </span>
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Smart Logistics & Accessibility Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
          <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
            Officer Login
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')} icon={ArrowRight}>
            Command Center
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 md:px-12 py-16 md:py-24 max-w-6xl mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold shadow-xs"
            style={{
              background: 'var(--bg-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent)'
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            OPERATIONAL LOGISTICS & EMERGENCY PLATFORM FOR ALL 8 NER STATES
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
            Resilient Mountain Logistics &{' '}
            <span style={{ color: 'var(--accent)' }}>Disaster Intelligence</span>
          </h2>

          <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Deterministic risk calculations, bidirectional shortest-path graph optimization, offline-first vector maps, and multimodal hazard analysis engineered for the North Eastern Region.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" variant="primary" onClick={() => navigate('/dashboard')} icon={Activity}>
              Launch Command Dashboard
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/map')} icon={MapPin}>
              Live Convoy Radar
            </Button>
            <Button size="lg" variant="danger" onClick={() => navigate('/emergency')} icon={ShieldAlert}>
              Emergency Console
            </Button>
          </div>
        </div>

        {/* Operational Metrics Ticker */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto w-full">
          <Card className="text-center p-4">
            <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>FLEET TELEMETRY</p>
            <p className="text-2xl font-mono font-bold mt-1" style={{ color: 'var(--accent)' }}>100% LIVE</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>2.5s GPS Telemetry Stream</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>ROUTING ENGINE</p>
            <p className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">Dijkstra's</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>Bidirectional Dual-Frontier</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>AI ANALYSIS</p>
            <p className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-1">GEMINI AI</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>Multimodal Hazard Detection</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>MAP ENGINE</p>
            <p className="text-2xl font-mono font-bold text-sky-600 dark:text-sky-400 mt-1">OFFLINE</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>Zero Watermark Vector SVG</p>
          </Card>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 max-w-4xl mx-auto w-full">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card key={i} className="p-5 flex items-start gap-4">
                <div className="p-2.5 rounded-lg shrink-0 border" style={{ background: 'var(--accent-subtle)', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{f.title}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.description}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* State Badges Strip */}
        <div className="mt-14 text-center space-y-3">
          <p className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            COVERAGE ACROSS ALL 8 NORTH EASTERN STATES
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {states.map((st) => (
              <span
                key={st}
                className="px-3 py-1 rounded-full border text-xs font-medium"
                style={{
                  background: 'var(--bg-subtle)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)'
                }}
              >
                {st}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-6 px-6 md:px-12 border-t text-xs flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)'
        }}
      >
        <p>© 2026 NIDAN Logistics & Emergency Command System. Smart India Hackathon Edition.</p>
        <div className="flex items-center gap-4">
          <span className="cursor-pointer hover:underline" onClick={() => navigate('/login')}>Login</span>
          <span>•</span>
          <span className="cursor-pointer hover:underline" onClick={() => navigate('/emergency')}>Emergency Console</span>
          <span>•</span>
          <span className="cursor-pointer hover:underline" onClick={() => navigate('/routes/planner')}>Route Planner</span>
        </div>
      </footer>
    </div>
  );
}
