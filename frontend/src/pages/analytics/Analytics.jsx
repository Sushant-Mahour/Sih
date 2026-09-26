import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  Calendar,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Truck,
  AlertTriangle,
  CloudRain,
  Activity,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';
import { PageShell } from '../../components/layout/PageShell';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../../components/ui/Table';
import { showToast } from '../../components/ui/Toast';
import { analyticsService } from '../../services/domainServices';
import { useTheme } from '../../features/ThemeContext';

export function Analytics() {
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = useState('6m');

  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: () => analyticsService.getAnalyticsData()
  });

  const summary = analyticsRes?.summary || {
    totalShipments: 48,
    inTransitShipments: 4,
    deliveredShipments: 42,
    successRate: 95.8,
    totalIncidents: 14,
    resolvedIncidents: 11,
    highRiskSegments: 2,
    avgResponseTimeMin: 32
  };

  const charts = analyticsRes?.charts || {
    monthlyTrends: [
      { month: 'Apr 2026', incidents: 6, clearedRate: 94, avgRainfallMm: 55 },
      { month: 'May 2026', incidents: 12, clearedRate: 90, avgRainfallMm: 95 },
      { month: 'Jun 2026', incidents: 26, clearedRate: 82, avgRainfallMm: 210 },
      { month: 'Jul 2026', incidents: 34, clearedRate: 78, avgRainfallMm: 340 },
      { month: 'Aug 2026', incidents: 28, clearedRate: 84, avgRainfallMm: 270 },
      { month: 'Sep 2026', incidents: 14, clearedRate: 92, avgRainfallMm: 130 }
    ],
    districtHotspots: [
      { district: 'East Khasi Hills', count: 5, severity: 4.0 },
      { district: 'Papum Pare', count: 3, severity: 3.8 },
      { district: 'Tawang', count: 3, severity: 3.4 },
      { district: 'Cachar', count: 2, severity: 2.9 },
      { district: 'Kohima', count: 1, severity: 2.5 }
    ],
    cargoDistribution: [
      { cargo: 'Medicines & Vaccines', count: 22 },
      { cargo: 'Food Supplies & Grains', count: 14 },
      { cargo: 'Water & Sanitation', count: 8 },
      { cargo: 'Heavy Equipment & Fuel', count: 4 }
    ]
  };

  const aiInsights = analyticsRes?.aiInsights || [
    'Peak monsoon rainfall in July (>340mm) creates a 4.2x escalation in Sonapur NH-6 rockfalls, requiring pre-emptive equipment staging.',
    'Clearance response times dropped by 14 minutes in Meghalaya following proactive BRO earthmover positioning at Nongpoh and Jowai.',
    'Cold-chain vaccine shipments along Guwahati–Shillong maintained 99.4% thermal integrity despite detour routes.'
  ];

  const chartTheme = {
    accent: theme === 'dark' ? '#3B82F6' : '#1D4ED8',
    accentSubtle: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(29, 78, 216, 0.15)',
    danger: theme === 'dark' ? '#EF4444' : '#DC2626',
    dangerSubtle: theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.15)',
    success: theme === 'dark' ? '#10B981' : '#059669',
    warning: theme === 'dark' ? '#F59E0B' : '#D97706',
    grid: theme === 'dark' ? '#334155' : '#E2E8F0',
    text: theme === 'dark' ? '#94A3B8' : '#64748B',
    tooltipBg: theme === 'dark' ? '#1E293B' : '#FFFFFF',
    tooltipBorder: theme === 'dark' ? '#334155' : '#E3E8EF'
  };

  const PIE_COLORS = [chartTheme.accent, chartTheme.success, chartTheme.warning, chartTheme.danger];

  const handleExportCsv = () => {
    try {
      const rows = [
        ['Month', 'Monsoon Rainfall (mm)', 'Disruptions (Incidents)', 'Clearance Rate (%)'],
        ...(charts.monthlyTrends || []).map((m) => [m.month, m.avgRainfallMm, m.incidents, `${m.clearedRate}%`])
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ner_logistics_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Analytics report exported as CSV.', 'success');
    } catch {
      showToast('Export failed. Please try again.', 'error');
    }
  };

  return (
    <PageShell
      title="Logistics Analytics & Corridor Insights"
      description="Historical disruption metrics, dual-axis monsoon precipitation correlation, and strategic AI intelligence synthesis"
      breadcrumbs={['Dashboard', 'Analytics']}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            options={[
              { value: '30d', label: 'Last 30 Days' },
              { value: '6m', label: 'Last 6 Months' },
              { value: '1y', label: 'Full Year 2026' }
            ]}
            className="w-36 py-1 text-xs"
          />
          <Button variant="outline" size="sm" onClick={handleExportCsv} icon={Download}>
            Export CSV
          </Button>
        </div>
      }
    >
      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Consignment Delivery Rate"
          value={`${summary.successRate}%`}
          subtitle={`${summary.deliveredShipments} of ${summary.totalShipments} missions`}
          trend={{ isPositive: true, text: '+2.4%' }}
        />
        <StatCard
          title="Mean Road Clearance Time"
          value={`${summary.avgResponseTimeMin} min`}
          subtitle="BRO Heavy Taskforce"
          trend={{ isPositive: true, text: '-14 min' }}
        />
        <StatCard
          title="Recorded Hazard Incidents"
          value={summary.totalIncidents}
          subtitle={`${summary.resolvedIncidents} cleared & reopened`}
        />
        <StatCard
          title="Active High-Risk Corridors"
          value={summary.highRiskSegments}
          subtitle="NH-6 & NH-13 mountain passes"
        />
      </div>

      {/* Strategic AI Insights */}
      <Card header={
        <div className="flex items-center gap-2 text-text-primary">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>Strategic AI Ground Intelligence Synthesis</span>
        </div>
      }>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {aiInsights.map((insight, idx) => (
            <div key={idx} className="p-3.5 rounded-lg bg-bg-subtle border border-border-subtle space-y-1">
              <span className="text-[10px] font-mono font-semibold text-accent uppercase">
                STRATEGIC FINDING #{idx + 1}
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Primary Dual-Axis Chart: Monsoon Precipitation vs Corridor Disruptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card
            header={
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 w-full">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-accent" />
                  <span className="font-semibold text-text-primary">Monsoon Precipitation (mm) vs Corridor Disruptions</span>
                </div>
                <span className="text-[11px] font-mono text-text-muted">Dual-Axis Synthesis (Rainfall vs Impasses)</span>
              </div>
            }
          >
            <div className="space-y-4">
              {/* Correlation Summary Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-bg-subtle border border-border-subtle text-xs">
                <div className="flex items-center gap-2 text-text-secondary">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span>Blue Bars: <b>Monthly Rainfall (mm)</b></span>
                  <span className="text-text-muted">|</span>
                  <span className="w-2 h-2 rounded-full bg-danger" />
                  <span>Red Line: <b>Hazard Disruptions</b></span>
                  <span className="text-text-muted">|</span>
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span>Green Dash: <b>Clearance Rate (%)</b></span>
                </div>
                <Badge variant="warning" size="sm">
                  High Correlation: r = 0.93
                </Badge>
              </div>

              {/* Dual-Axis ComposedChart */}
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={charts.monthlyTrends} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                    <XAxis dataKey="month" stroke={chartTheme.text} fontSize={12} tickLine={false} />
                    
                    {/* Left Y-Axis: Rainfall (0 - 400mm) */}
                    <YAxis
                      yAxisId="left"
                      stroke={chartTheme.accent}
                      fontSize={11}
                      tickLine={false}
                      domain={[0, 400]}
                      unit="mm"
                    />

                    {/* Right Y-Axis: Disruptions & Clearance (0 - 100) */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={chartTheme.danger}
                      fontSize={11}
                      tickLine={false}
                      domain={[0, 100]}
                      unit=" #"
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartTheme.tooltipBg,
                        borderColor: chartTheme.tooltipBorder,
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value, name) => {
                        if (name === 'Precipitation (mm)') return [`${value} mm`, name];
                        if (name === 'Clearance Rate (%)') return [`${value}%`, name];
                        return [`${value} incidents`, name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                    {/* Left-Axis Rainfall Bar */}
                    <Bar
                      yAxisId="left"
                      dataKey="avgRainfallMm"
                      name="Precipitation (mm)"
                      fill={chartTheme.accent}
                      radius={[4, 4, 0, 0]}
                      barSize={26}
                      opacity={0.85}
                    />

                    {/* Right-Axis Disruption Line */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="incidents"
                      name="Disruptions (Incidents)"
                      stroke={chartTheme.danger}
                      strokeWidth={3}
                      dot={{ r: 4, fill: chartTheme.danger }}
                      activeDot={{ r: 6 }}
                    />

                    {/* Right-Axis Clearance Rate Line */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="clearedRate"
                      name="Clearance Rate (%)"
                      stroke={chartTheme.success}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3, fill: chartTheme.success }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Weather-Disruption Correlation Table */}
              <div className="pt-2">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Month</TableHeader>
                      <TableHeader>Avg Precipitation (mm)</TableHeader>
                      <TableHeader>Disruptions</TableHeader>
                      <TableHeader>Clearance Rate</TableHeader>
                      <TableHeader className="text-right">Risk Index</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {charts.monthlyTrends.map((row, idx) => {
                      const isHigh = row.avgRainfallMm >= 250;
                      const isMed = row.avgRainfallMm >= 100 && row.avgRainfallMm < 250;
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold text-text-primary">{row.month}</TableCell>
                          <TableCell className="font-mono text-xs">
                            <span className="text-accent font-semibold">{row.avgRainfallMm} mm</span>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-danger font-semibold">
                            {row.incidents} impasses
                          </TableCell>
                          <TableCell className="font-mono text-xs text-success font-semibold">
                            {row.clearedRate}%
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={isHigh ? 'danger' : isMed ? 'warning' : 'safe'} size="sm">
                              {isHigh ? 'CRITICAL MONSOON' : isMed ? 'ELEVATED' : 'NOMINAL'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Cargo Breakdown & District Hotspots (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Cargo Category Distribution */}
          <Card header="Consignment Cargo Classification">
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.cargoDistribution}
                    dataKey="count"
                    nameKey="cargo"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {charts.cargoDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltipBg,
                      borderColor: chartTheme.tooltipBorder,
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Regional Incident Hotspots */}
          <Card header="District Disruption Hotspots">
            <div className="space-y-3">
              {charts.districtHotspots.map((d, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-bg-subtle border border-border-subtle flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-text-primary">{d.district}</div>
                    <div className="text-[11px] text-text-muted">Mean Severity: {d.severity} / 5.0</div>
                  </div>
                  <Badge variant={d.count >= 4 ? 'danger' : d.count >= 2 ? 'warning' : 'primary'} size="sm">
                    {d.count} Incidents
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

export default Analytics;
