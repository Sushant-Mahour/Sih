import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Radio,
  Send,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Check,
  Activity,
  Users,
  Eye,
  CheckCheck,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { PageShell } from '../../components/layout/PageShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { showToast } from '../../components/ui/Toast';
import { alertService } from '../../services/domainServices';
import { formatDate } from '../../utils/formatters';
import { useTheme } from '../../features/ThemeContext';

export function AlertsCenter() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [resolvedIds, setResolvedIds] = useState(new Set());

  // Broadcast Form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('critical');
  const [scope, setScope] = useState('corridor');
  const [selectedChannels, setSelectedChannels] = useState(['in_app', 'sms', 'push']);

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertService.getAlerts()
  });

  const alerts = alertsData?.data || [];

  const broadcastMutation = useMutation({
    mutationFn: (data) => alertService.broadcastAlert(data),
    onSuccess: (newAlert) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setModalOpen(false);
      setTitle('');
      setMessage('');
      showToast('Emergency broadcast transmitted across all channels.', 'success');
    }
  });

  const handleBroadcastSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    broadcastMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      severity,
      scope,
      channels: selectedChannels
    });
  };

  const handleMarkResolved = (alertId) => {
    setResolvedIds((prev) => new Set(prev).add(alertId));
    showToast(`Alert ${alertId} marked as resolved.`, 'success');
  };

  const filteredAlerts = alerts.filter((alt) => {
    if (severityFilter === 'all') return true;
    return alt.severity === severityFilter;
  });

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;

  const severityPieData = [
    { name: 'Critical', key: 'critical', value: criticalCount, color: theme === 'dark' ? '#EF4444' : '#DC2626' },
    { name: 'Warning', key: 'warning', value: warningCount, color: theme === 'dark' ? '#F59E0B' : '#D97706' },
    { name: 'Info', key: 'info', value: infoCount, color: theme === 'dark' ? '#3B82F6' : '#1D4ED8' }
  ];

  // 24-hour activity sparkline data
  const activitySparkline = [
    { time: '00:00', alerts: 1 },
    { time: '04:00', alerts: 0 },
    { time: '08:00', alerts: 3 },
    { time: '12:00', alerts: 6 },
    { time: '16:00', alerts: 4 },
    { time: '20:00', alerts: 2 },
    { time: 'Now', alerts: alerts.length }
  ];

  // Channel metrics with delivery & read rates
  const channelDistribution = [
    { channel: 'In-App', sent: 48, delivered: 48, read: 41 },
    { channel: 'Push Alert', sent: 34, delivered: 32, read: 28 },
    { channel: 'SMS Broadcast', sent: 22, delivered: 21, read: 19 }
  ];

  const handlePieClick = (entry) => {
    if (severityFilter === entry.key) {
      setSeverityFilter('all');
    } else {
      setSeverityFilter(entry.key);
    }
  };

  return (
    <PageShell
      title="Alerts & Notification Broadcast Center"
      description="Multi-channel emergency dispatches, broadcast advisory log, and active situation alerts"
      breadcrumbs={['Dashboard', 'Alerts & Broadcasts']}
      actions={
        <Button variant="danger" size="sm" onClick={() => setModalOpen(true)} icon={Radio}>
          Issue Emergency Broadcast
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Alerts Feed with 3px Severity Left Border (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Severity Filter Tabs */}
          <div className="flex items-center justify-between p-1 bg-bg-subtle border border-border-subtle rounded-lg text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: `All Alerts (${alerts.length})` },
                { id: 'critical', label: `Critical (${criticalCount})` },
                { id: 'warning', label: `Warning (${warningCount})` },
                { id: 'info', label: `Info (${infoCount})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSeverityFilter(tab.id)}
                  className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                    severityFilter === tab.id
                      ? 'bg-bg-elevated text-accent font-semibold shadow-sm border border-border-subtle'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {severityFilter !== 'all' && (
              <button
                onClick={() => setSeverityFilter('all')}
                className="text-[11px] text-text-muted hover:text-accent font-medium px-2 cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {filteredAlerts.length === 0 ? (
            <EmptyState
              title="No Active Advisories"
              description="No alerts matching the selected severity level."
            />
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alt, idx) => {
                const isResolved = resolvedIds.has(alt.alertId);
                const isCritical = alt.severity === 'critical';
                const isWarning = alt.severity === 'warning';
                const ackCount = alt.acknowledgedDrivers || (isCritical ? 14 : isWarning ? 8 : 4);
                const totalTargetDrivers = 16;
                const ackPct = Math.min(100, Math.round((ackCount / totalTargetDrivers) * 100));

                return (
                  <Card
                    key={alt.alertId || idx}
                    className={`relative p-4 transition-all ${
                      isResolved ? 'opacity-60 bg-bg-subtle/30' : ''
                    } before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:rounded-l ${
                      isCritical
                        ? 'before:bg-danger'
                        : isWarning
                        ? 'before:bg-warning'
                        : 'before:bg-accent'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={isCritical ? 'danger' : isWarning ? 'warning' : 'primary'} size="sm">
                            {alt.severity?.toUpperCase()} ALERT
                          </Badge>
                          <span className="font-mono text-xs text-text-muted">
                            {alt.alertId}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-text-muted">
                          {formatDate(alt.broadcastAt || alt.createdAt)}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">{alt.title}</h4>
                        <p className="text-xs text-text-secondary leading-relaxed mt-1">{alt.message}</p>
                      </div>

                      {/* Delivery & Driver ACK Metric Bar */}
                      <div className="p-2.5 rounded-lg border text-xs space-y-1.5" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-text-muted flex items-center gap-1 font-medium">
                            <Users className="w-3.5 h-3.5 text-accent" />
                            Driver Acknowledgements
                          </span>
                          <span className="font-mono font-bold text-text-primary">
                            {ackCount} / {totalTargetDrivers} Convoys ({ackPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-border-subtle rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              ackPct > 80 ? 'bg-emerald-500' : ackPct > 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${ackPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-text-muted">
                          <span className="text-[11px]">Channels:</span>
                          {(alt.channels || ['in_app', 'push']).map((ch) => (
                            <span key={ch} className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border-subtle text-[10px] uppercase font-mono font-semibold">
                              {ch}
                            </span>
                          ))}
                        </div>

                        {!isResolved ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkResolved(alt.alertId)}
                            icon={Check}
                          >
                            Mark Resolved
                          </Button>
                        ) : (
                          <span className="text-emerald-500 text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Sticky Summary & Flat Charts (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-20">
          {/* Interactive Severity Donut */}
          <Card header="Alert Severity Breakdown (Click to Filter)">
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    onClick={handlePieClick}
                    className="cursor-pointer"
                  >
                    {severityPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={severityFilter === entry.key ? 'var(--accent)' : 'transparent'}
                        strokeWidth={severityFilter === entry.key ? 3 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                      borderColor: theme === 'dark' ? '#334155' : '#E3E8EF',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-border-subtle">
              <div
                onClick={() => setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical')}
                className="cursor-pointer p-1 rounded hover:bg-bg-subtle transition"
              >
                <span className="text-text-muted text-[10px] block">CRITICAL</span>
                <b className="text-danger">{criticalCount}</b>
              </div>
              <div
                onClick={() => setSeverityFilter(severityFilter === 'warning' ? 'all' : 'warning')}
                className="cursor-pointer p-1 rounded hover:bg-bg-subtle transition"
              >
                <span className="text-text-muted text-[10px] block">WARNING</span>
                <b className="text-warning">{warningCount}</b>
              </div>
              <div
                onClick={() => setSeverityFilter(severityFilter === 'info' ? 'all' : 'info')}
                className="cursor-pointer p-1 rounded hover:bg-bg-subtle transition"
              >
                <span className="text-text-muted text-[10px] block">INFO</span>
                <b className="text-accent">{infoCount}</b>
              </div>
            </div>
          </Card>

          {/* 24-Hour Broadcast Frequency Sparkline */}
          <Card header="24-Hour Broadcast Timeline">
            <div className="h-32 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activitySparkline}>
                  <defs>
                    <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme === 'dark' ? '#38BDF8' : '#0284C7'} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={theme === 'dark' ? '#38BDF8' : '#0284C7'} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} fontSize={10} tickLine={false} />
                  <YAxis stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                      borderColor: theme === 'dark' ? '#334155' : '#E3E8EF',
                      borderRadius: '6px',
                      fontSize: '11px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="alerts"
                    stroke={theme === 'dark' ? '#38BDF8' : '#0284C7'}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#alertGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Dispatch Channel Delivery & Read Performance */}
          <Card header="Dispatch Delivery & Read Rates">
            <div className="space-y-3 pt-1">
              {channelDistribution.map((ch) => {
                const readPct = Math.round((ch.read / ch.sent) * 100);
                return (
                  <div key={ch.channel} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-text-primary">{ch.channel}</span>
                      <span className="font-mono text-[11px] text-text-secondary">
                        {ch.delivered}/{ch.sent} Sent • <b className="text-accent">{readPct}% Read</b>
                      </span>
                    </div>
                    <div className="w-full bg-border-subtle rounded-full h-1.5 overflow-hidden flex">
                      <div className="bg-accent h-1.5" style={{ width: `${(ch.delivered / ch.sent) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Broadcast Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Issue Emergency Broadcast Advisory"
        subtitle="Transmit high-priority alert across Push, SMS, and In-App channels"
      >
        <form onSubmit={handleBroadcastSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Alert Severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              options={[
                { value: 'critical', label: 'Critical (Red Alert)' },
                { value: 'warning', label: 'Warning (Caution)' },
                { value: 'info', label: 'Informational' }
              ]}
              allowOthers
            />

            <Select
              label="Broadcast Scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              options={[
                { value: 'corridor', label: 'Corridor Level' },
                { value: 'district', label: 'District Level' },
                { value: 'all', label: 'All 8 NER States' }
              ]}
              allowOthers
            />
          </div>

          <Input
            label="Advisory Title"
            placeholder="e.g. NH-6 Impassable: Divert Relief Convoys to Haflong Bypass"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Advisory Message Body
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter mandatory advisory, instructions for in-transit convoys, and emergency contact details…"
              className="w-full bg-bg-base text-text-primary placeholder-text-muted border border-border-subtle rounded-lg p-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              required
            />
          </div>

          <Button
            type="submit"
            variant="danger"
            loading={broadcastMutation.isPending}
            className="w-full"
            icon={Send}
          >
            Dispatch Multi-Channel Broadcast
          </Button>
        </form>
      </Modal>
    </PageShell>
  );
}

export default AlertsCenter;
