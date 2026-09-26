import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Plus,
  Search,
  LayoutGrid,
  List,
  Globe,
  ArrowRight,
  Sparkles,
  Calendar
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusPill } from '../../components/ui/Badge';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { incidentService, districtService } from '../../services/domainServices';
import { formatDate } from '../../utils/formatters';

export function IncidentList() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');

  const { data: incidentsData, isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => incidentService.getIncidents()
  });

  const { data: districtsData } = useQuery({
    queryKey: ['districts'],
    queryFn: () => districtService.getDistricts()
  });

  const incidents = incidentsData?.data || [];
  const districts = districtsData?.data || [];

  // AND Filter Logic with stable date sorting
  const filteredIncidents = incidents
    .filter((inc) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        inc.title?.toLowerCase().includes(q) ||
        inc.districtName?.toLowerCase().includes(q) ||
        inc.description?.toLowerCase().includes(q) ||
        inc.clientUuid?.toLowerCase().includes(q);

      const matchesSeverity =
        severityFilter === 'all' ||
        String(inc.severity) === String(severityFilter);

      const matchesStatus =
        statusFilter === 'all' ||
        inc.status === statusFilter;

      const matchesDistrict =
        districtFilter === 'all' ||
        inc.districtId === districtFilter ||
        inc.districtName === districtFilter;

      return matchesSearch && matchesSeverity && matchesStatus && matchesDistrict;
    })
    .sort((a, b) => {
      const dateA = new Date(a.capturedAt || 0).getTime();
      const dateB = new Date(b.capturedAt || 0).getTime();
      return dateB - dateA; // Newest first
    });

  return (
    <PageShell
      title="Incident Command & Hazard Matrix"
      description="Multimodal ground intelligence, road obstacle clearance tracking, and rapid response coordination across all 8 NER states"
      breadcrumbs={['Dashboard', 'Incidents']}
      actions={
        <Button variant="danger" size="sm" onClick={() => navigate('/incidents/new')} icon={Plus}>
          Submit Field Incident
        </Button>
      }
    >
      {/* Single Unified Filter Bar */}
      <Card className="p-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <Input
              placeholder="Search hazards, road, district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
              className="py-1 text-xs"
            />

            <Select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Severity Levels' },
                { value: '5', label: 'Level 5 (Emergency Crisis)' },
                { value: '4', label: 'Level 4 (Major Impasse)' },
                { value: '3', label: 'Level 3 (Moderate)' },
                { value: '2', label: 'Level 2 (Minor)' }
              ]}
              className="py-1 text-xs"
            />

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'reported', label: 'Reported' },
                { value: 'verified', label: 'Verified by EOC' },
                { value: 'crew_dispatched', label: 'Crew Dispatched' },
                { value: 'resolved', label: 'Resolved / Cleared' }
              ]}
              className="py-1 text-xs"
            />

            <Select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Districts' },
                ...districts.map((d) => ({ value: d.districtId, label: d.name }))
              ]}
              className="py-1 text-xs"
            />
          </div>

          {/* View Toggle (Table / Grid) */}
          <div className="flex items-center gap-1 border-l border-border-subtle pl-3">
            <button
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className={`p-1.5 rounded-md border transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-accent-subtle text-accent border-accent/30'
                  : 'text-text-secondary hover:text-text-primary border-border-subtle bg-bg-base'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              aria-label="Card grid view"
              className={`p-1.5 rounded-md border transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-accent-subtle text-accent border-accent/30'
                  : 'text-text-secondary hover:text-text-primary border-border-subtle bg-bg-base'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Incident Data View */}
      {filteredIncidents.length === 0 ? (
        <EmptyState
          title="No Matching Incidents Found"
          description="Adjust your search filters or submit a new incident report from the field."
          action={
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setSeverityFilter('all'); setStatusFilter('all'); setDistrictFilter('all'); }}>
              Reset Filters
            </Button>
          }
        />
      ) : viewMode === 'table' ? (
        <Card padding={false}>
          <Table headers={['ID', 'Hazard Title', 'Category', 'Severity', 'District', 'Status', 'Captured At', 'Action']}>
            {filteredIncidents.map((inc) => {
              const id = inc.clientUuid || inc._id;
              return (
                <TableRow key={id} onClick={() => navigate(`/incidents/${id}`)}>
                  <TableCell className="font-mono text-xs font-semibold text-text-primary">{id}</TableCell>
                  <TableCell className="font-medium text-text-primary max-w-xs truncate">{inc.title}</TableCell>
                  <TableCell className="capitalize text-text-secondary">{inc.incidentType?.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Badge variant={inc.severity >= 4 ? 'danger' : inc.severity === 3 ? 'warning' : 'safe'} size="sm">
                      Level {inc.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary">{inc.districtName}</TableCell>
                  <TableCell><StatusPill status={inc.status} /></TableCell>
                  <TableCell className="font-mono text-[11px] text-text-muted">{formatDate(inc.capturedAt)}</TableCell>
                  <TableCell>
                    <span className="text-accent hover:text-accent-hover text-xs font-medium inline-flex items-center gap-1">
                      Inspect <ArrowRight className="w-3 h-3" />
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIncidents.map((inc) => {
            const id = inc.clientUuid || inc._id;
            return (
              <Card
                key={id}
                onClick={() => navigate(`/incidents/${id}`)}
                hoverable
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={inc.severity >= 4 ? 'danger' : inc.severity === 3 ? 'warning' : 'safe'} size="sm">
                    Level {inc.severity} • {inc.incidentType?.replace('_', ' ')}
                  </Badge>
                  <StatusPill status={inc.status} />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-text-primary line-clamp-1">{inc.title}</h4>
                  <p className="text-xs text-text-secondary line-clamp-2 mt-1 leading-relaxed">{inc.description}</p>
                </div>

                {inc.aiClassification?.shortDescription && (
                  <div className="p-2 rounded-md bg-accent-subtle/50 border border-accent/20 text-[11px] text-text-primary flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{inc.aiClassification.shortDescription}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted">
                  <span>{inc.districtName}</span>
                  <span className="font-mono">{formatDate(inc.capturedAt)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

export default IncidentList;
