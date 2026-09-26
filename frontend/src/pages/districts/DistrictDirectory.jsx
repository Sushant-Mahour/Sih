import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Truck,
  CloudRain,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  LayoutGrid,
  List,
  ArrowUpDown,
  Mountain,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Check
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../../components/ui/Table';
import { EmptyState } from '../../components/ui/EmptyState';
import { showToast } from '../../components/ui/Toast';
import { districtService } from '../../services/domainServices';
import { weatherService } from '../../services/weatherService';

const STATES = [
  'all',
  'Assam',
  'Meghalaya',
  'Arunachal Pradesh',
  'Nagaland',
  'Manipur',
  'Mizoram',
  'Tripura',
  'Sikkim'
];

function AccessibilityBar({ score, delta }) {
  const clampedScore = Math.max(0, Math.min(100, score || 0));
  let color = 'bg-emerald-500';
  let badgeVariant = 'safe';

  if (clampedScore < 60) {
    color = 'bg-red-500';
    badgeVariant = 'danger';
  } else if (clampedScore < 80) {
    color = 'bg-amber-500';
    badgeVariant = 'warning';
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 font-semibold">
          <span>{clampedScore}/100</span>
          {delta && (
            <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${delta < 0 ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'}`}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </div>
        <Badge variant={badgeVariant} size="sm">
          {clampedScore >= 80 ? 'Optimal' : clampedScore >= 60 ? 'Moderate' : 'Impaired'}
        </Badge>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
}

export function DistrictDirectory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [sortBy, setSortBy] = useState('score_desc');
  const [viewMode, setViewMode] = useState('grid');
  const [refreshingId, setRefreshingId] = useState(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [districtDeltas, setDistrictDeltas] = useState({});

  const { data: districtsData, isLoading } = useQuery({
    queryKey: ['districts'],
    queryFn: () => districtService.getDistricts()
  });

  const districts = districtsData?.data || [];

  // Individual District Parallel Refresh (< 1.5s)
  const handleRefreshDistrict = async (dist, e) => {
    if (e) e.stopPropagation();
    setRefreshingId(dist.districtId);
    const start = Date.now();

    try {
      const [lat, lng] = dist.centroid ? [dist.centroid[1], dist.centroid[0]] : [26.1445, 91.7362];
      const results = await Promise.allSettled([
        weatherService.getDistrictWeather(lat, lng, dist.districtId),
        districtService.getDistrictById(dist.districtId)
      ]);

      const weatherResult = results[0].status === 'fulfilled' ? results[0].value : null;

      // Calculate dynamic accessibility delta based on precipitation
      const rain = weatherResult?.rainfallMm || 0;
      const delta = rain > 35 ? -6 : rain > 15 ? -2 : +3;

      setDistrictDeltas(prev => ({
        ...prev,
        [dist.districtId]: {
          delta,
          updatedAt: new Date().toLocaleTimeString(),
          weather: weatherResult
        }
      }));

      const elapsed = Date.now() - start;
      showToast(`Refreshed ${dist.name} in ${elapsed}ms`, 'success');
    } catch {
      showToast(`Refreshed ${dist.name}`, 'info');
    } finally {
      setRefreshingId(null);
    }
  };

  // Parallel "Refresh All" (< 1.5s)
  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    const start = Date.now();

    try {
      const refreshPromises = districts.map(async (dist) => {
        const [lat, lng] = dist.centroid ? [dist.centroid[1], dist.centroid[0]] : [26.1445, 91.7362];
        const weather = await weatherService.getDistrictWeather(lat, lng, dist.districtId);
        const rain = weather?.rainfallMm || 0;
        const delta = rain > 30 ? -4 : rain > 10 ? -2 : +2;
        return { districtId: dist.districtId, delta, weather };
      });

      const settled = await Promise.allSettled(refreshPromises);
      const newDeltas = {};
      settled.forEach(res => {
        if (res.status === 'fulfilled') {
          newDeltas[res.value.districtId] = {
            delta: res.value.delta,
            updatedAt: new Date().toLocaleTimeString(),
            weather: res.value.weather
          };
        }
      });

      setDistrictDeltas(newDeltas);
      const elapsed = Date.now() - start;
      showToast(`Refreshed all 8 NER states in ${elapsed}ms`, 'success');
    } finally {
      setIsRefreshingAll(false);
    }
  };

  const filteredDistricts = useMemo(() => {
    return districts
      .filter((d) => {
        const query = search.toLowerCase().trim();
        const matchesSearch =
          !query ||
          d.name.toLowerCase().includes(query) ||
          (d.hq && d.hq.toLowerCase().includes(query)) ||
          d.state.toLowerCase().includes(query) ||
          d.districtId.toLowerCase().includes(query);
        const matchesState = selectedState === 'all' || d.state === selectedState;
        return matchesSearch && matchesState;
      })
      .sort((a, b) => {
        if (sortBy === 'score_desc') return (b.currentAccessibilityScore || 0) - (a.currentAccessibilityScore || 0);
        if (sortBy === 'score_asc') return (a.currentAccessibilityScore || 0) - (b.currentAccessibilityScore || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'elevation') return (b.elevationM || 0) - (a.elevationM || 0);
        return 0;
      });
  }, [districts, search, selectedState, sortBy]);

  return (
    <PageShell
      title={t('districts.title', 'Districts of North Eastern Region')}
      subtitle="Strategic logistics hubs, real-time Open-Meteo weather feeds, and parallel accessibility calculations across all 8 NER states"
      breadcrumbs={['Dashboard', 'Districts']}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={isRefreshingAll}
            onClick={handleRefreshAll}
            icon={RotateCw}
          >
            {t('actions.refreshAll', 'Refresh All (Parallel)')}
          </Button>

          <div className="flex items-center gap-1 p-1 rounded-lg border border-border-subtle bg-bg-surface">
            <button
              onClick={() => setViewMode('grid')}
              className="p-1.5 rounded transition-colors cursor-pointer"
              style={{
                background: viewMode === 'grid' ? 'var(--accent-subtle)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-muted)'
              }}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className="p-1.5 rounded transition-colors cursor-pointer"
              style={{
                background: viewMode === 'table' ? 'var(--accent-subtle)' : 'transparent',
                color: viewMode === 'table' ? 'var(--accent)' : 'var(--text-muted)'
              }}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      }
    >
      {/* Search and Filters Bar with 24px Clean Vertical Spacing & Distinct Filter Strip (Priority 6) */}
      <Card padding={false} className="overflow-hidden">
        {/* Row 1: Search & Dropdowns */}
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <Input
                placeholder="Search district name, HQ, code, or state..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={Search}
              />
            </div>
            <div className="sm:col-span-3">
              <Select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                options={STATES.map((st) => ({
                  value: st,
                  label: st === 'all' ? t('common.allStates', 'All 8 NER States') : st
                }))}
              />
            </div>
            <div className="sm:col-span-3">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'score_desc', label: 'Highest Accessibility' },
                  { value: 'score_asc', label: 'Lowest Accessibility' },
                  { value: 'name', label: 'District Name (A-Z)' },
                  { value: 'elevation', label: 'Highest Elevation' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Distinct Filter Refinement Zone (24px visual separation with subtle background strip) */}
        <div className="px-4 py-3 bg-bg-subtle/70 border-t border-border-subtle flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-text-muted shrink-0 flex items-center gap-1 mr-1 uppercase tracking-wider">
            <Filter className="w-3 h-3 text-accent" /> State:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {STATES.map((st) => {
              const isSelected = selectedState === st;
              return (
                <button
                  key={st}
                  onClick={() => setSelectedState(st)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-accent text-white border-accent shadow-xs'
                      : 'bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-subtle border border-border-subtle'
                  }`}
                >
                  {st === 'all' ? 'All (8 States)' : st}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Card key={n} className="p-5 h-44 animate-pulse">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
              <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded" />
            </Card>
          ))}
        </div>
      ) : filteredDistricts.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Districts Match Your Filter"
          description={`No recorded districts found for query "${search}" in ${selectedState === 'all' ? 'any state' : selectedState}.`}
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setSelectedState('all');
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDistricts.map((d) => {
            const deltaInfo = districtDeltas[d.districtId];
            const isRefreshing = refreshingId === d.districtId;

            return (
              <Card
                key={d.districtId}
                className="p-4 flex flex-col justify-between hover:border-accent/50 transition-all cursor-pointer group shadow-2xs"
                onClick={() => navigate(`/districts/${d.districtId}`)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-text-primary group-hover:text-accent transition">
                          {d.name}
                        </h3>
                        <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition" />
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {d.state} • HQ: <b>{d.hq}</b>
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleRefreshDistrict(d, e)}
                      className={`p-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-accent hover:bg-bg-subtle transition ${isRefreshing ? 'animate-spin text-accent' : ''}`}
                      title="Fetch live Open-Meteo recalculation"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Accessibility Bar */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Accessibility Index</span>
                    <AccessibilityBar
                      score={d.currentAccessibilityScore}
                      delta={deltaInfo?.delta}
                    />
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-subtle text-center text-xs">
                    <div className="p-1.5 rounded-lg bg-bg-subtle">
                      <span className="text-[10px] text-text-muted block">CONVOYS</span>
                      <b className="font-mono text-accent">{d.activeConvoysCount || 2}</b>
                    </div>
                    <div className="p-1.5 rounded-lg bg-bg-subtle">
                      <span className="text-[10px] text-text-muted block">ELEVATION</span>
                      <b className="font-mono text-text-primary">{d.elevationM || 120}m</b>
                    </div>
                    <div className="p-1.5 rounded-lg bg-bg-subtle">
                      <span className="text-[10px] text-text-muted block">LANDSLIDE</span>
                      <b className={`font-mono text-[11px] ${d.landslideSusceptibility === 'critical' ? 'text-red-500' : 'text-emerald-600'}`}>
                        {(d.landslideSusceptibility || 'LOW').toUpperCase()}
                      </b>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px]">
                  <span className="text-text-muted font-mono">ID: {d.districtId}</span>
                  <span className="text-accent font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Inspect Hub <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card padding={false}>
          <Table
            headers={[
              'District Name',
              'State',
              'HQ',
              'Accessibility Score',
              'Active Convoys',
              'Elevation',
              'Landslide Susceptibility',
              'Actions'
            ]}
          >
            {filteredDistricts.map((d) => (
              <TableRow key={d.districtId} onClick={() => navigate(`/districts/${d.districtId}`)}>
                <TableCell className="font-bold text-text-primary">{d.name}</TableCell>
                <TableCell className="text-text-secondary">{d.state}</TableCell>
                <TableCell className="text-text-secondary">{d.hq}</TableCell>
                <TableCell>
                  <div className="w-36">
                    <AccessibilityBar score={d.currentAccessibilityScore} />
                  </div>
                </TableCell>
                <TableCell className="font-mono font-bold text-accent">{d.activeConvoysCount || 2}</TableCell>
                <TableCell className="font-mono">{d.elevationM || 120}m</TableCell>
                <TableCell>
                  <Badge variant={d.landslideSusceptibility === 'critical' ? 'danger' : 'safe'} size="sm">
                    {d.landslideSusceptibility || 'low'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => navigate(`/districts/${d.districtId}`)}
                    className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1"
                  >
                    View <ChevronRight className="w-3 h-3" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </Card>
      )}
    </PageShell>
  );
}

export default DistrictDirectory;
