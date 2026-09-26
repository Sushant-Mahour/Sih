import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  FileText,
  Database,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Layers,
  Clock,
  Download,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusPill } from '../../components/ui/Badge';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../../components/ui/Table';
import { EmptyState } from '../../components/ui/EmptyState';
import { showToast } from '../../components/ui/Toast';
import { importService } from '../../services/domainServices';
import { formatDate } from '../../utils/formatters';

export function ImportData() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [commitResult, setCommitResult] = useState(null);

  // Fetch Import History
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['importHistory'],
    queryFn: () => importService.getImportHistory()
  });

  const history = historyData?.data || [];

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: (formData) => importService.uploadDataset(formData),
    onSuccess: (res) => {
      setUploadResult(res.data);
      setCommitResult(null);
      showToast('Dataset analyzed and parsed successfully', 'success');
      queryClient.invalidateQueries(['importHistory']);
    },
    onError: () => {
      showToast('Error analyzing dataset', 'error');
    }
  });

  // Commit Mutation
  const commitMutation = useMutation({
    mutationFn: (auditId) => importService.commitImport(auditId),
    onSuccess: (res) => {
      setCommitResult(res.data);
      showToast('Dataset committed to live platform registry', 'success');
      queryClient.invalidateQueries(['importHistory']);
      queryClient.invalidateQueries(['districts']);
      queryClient.invalidateQueries(['incidents']);
      queryClient.invalidateQueries(['roads']);
      queryClient.invalidateQueries(['vehicles']);
    },
    onError: () => {
      showToast('Failed to commit dataset to database', 'error');
    }
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleRunAnalysis = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('dataset', file);
    uploadMutation.mutate(formData);
  };

  // Pre-load sample datasets for immediate testing
  const loadSampleSql = () => {
    const sampleSql = `-- North East Region Emergency Operations Dataset (Monsoon Response)
INSERT INTO districts (district_id, name, state, hq, lat, lng, elevation, flood_susceptibility) VALUES
('dist-cachar', 'Cachar', 'Assam', 'Silchar', 24.8333, 92.7789, 21, 'critical'),
('dist-karimganj', 'Karimganj', 'Assam', 'Karimganj', 24.8667, 92.3500, 18, 'high'),
('dist-west-tripura', 'West Tripura', 'Tripura', 'Agartala', 23.8315, 91.2868, 12, 'high');

INSERT INTO road_segments (segment_id, name, from_node, to_node, distance_km, flood_depth, status, blockage_reason) VALUES
('RS-NH37-SIL', 'NH-37 Badarpur-Silchar Floodway', 'Badarpur', 'Silchar', 32, 1.25, 'flooded', 'Barak River Overflow (Water 1.25m above embankment)'),
('RS-NH44-AGR', 'NH-44 Agartala Bypass Corridor', 'Teliamura', 'Agartala', 42, 0.45, 'restricted', 'Flash waterlogging across low-lying culverts'),
('RS-NH08-KRG', 'NH-8 Karimganj Link Road', 'Churaibari', 'Karimganj', 28, 0.00, 'clear', 'Clear for 4x4 relief convoys');

INSERT INTO incidents (incident_id, title, incident_type, severity, district_name, lat, lng, description) VALUES
('inc-barak-01', 'Barak River Embankment Breach at Annapurna Ghat', 'flood', 5, 'Cachar', 24.8250, 92.7900, 'Severe river overflow inundating trunk transit artery.'),
('inc-tel-02', 'Culvert Submersion near Teliamura Ghat', 'road_blockage', 3, 'West Tripura', 23.8400, 91.5800, 'Submerged culvert with debris buildup.');

INSERT INTO vehicles (vehicle_id, driver_name, speed_kmph, fuel, lat, lng, type) VALUES
('NER-8821', 'Subedar D. Gogoi', 38, 92, 24.8333, 92.7789, 'Heavy 4x4 Water Rescue Unit'),
('NER-8822', 'Havildar T. Debbarma', 45, 88, 23.8315, 91.2868, 'All-Terrain Medical Escort');
`;

    const blob = new Blob([sampleSql], { type: 'text/sql' });
    const sampleFile = new File([blob], 'ner_monsoon_operations_dataset.sql', { type: 'text/sql' });
    setFile(sampleFile);
    showToast('Loaded sample SQL dataset', 'info');
  };

  const loadSampleCsv = () => {
    const sampleCsv = `segment_id,name,from_node,to_node,distance_km,flood_depth,status,blockage_reason
RS-NH102-IMP,NH-102 Imphal-Moreh Mountain Corridor,Imphal,Moreh,105,0.00,clear,Open for high-priority logistics
RS-NH29-KOH,NH-29 Dimapur-Kohima Heavy Pass,Dimapur,Kohima,74,0.65,restricted,Heavy mudflow and continuous rockfalls
RS-NH53-SIL,NH-53 Jiribam-Silchar River Corridor,Jiribam,Silchar,85,1.10,flooded,Jiri River Spillage impassable for light vehicles
`;
    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const sampleFile = new File([blob], 'ner_highway_flood_assessment.csv', { type: 'text/csv' });
    setFile(sampleFile);
    showToast('Loaded sample CSV dataset', 'info');
  };

  return (
    <PageShell
      title="Dataset Ingestion & AI Situation Analysis"
      subtitle="Ingest regional disaster records, road networks, and telemetry with instant AI tactical situation synthesis"
      breadcrumbs={['Dashboard', 'Dataset Ingestion']}
    >
      {/* Top Banner & Quick Templates */}
      <Card className="p-4" style={{ background: 'var(--accent-subtle)', borderColor: 'var(--accent)' }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                Multi-Schema Parser & Tactical Synthesizer
                <Badge variant="safe" size="sm">Active</Badge>
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Accepts <code className="font-mono font-semibold">.sql</code> (INSERT statements), <code className="font-mono font-semibold">.csv</code>, and <code className="font-mono font-semibold">.json</code> formats.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadSampleSql} icon={FileText}>
              Load Sample SQL
            </Button>
            <Button variant="outline" size="sm" onClick={loadSampleCsv} icon={FileText}>
              Load Sample CSV
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Table Detector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card title="Dataset Upload Zone">
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all"
              style={{
                borderColor: isDragging ? 'var(--accent)' : file ? 'var(--safe)' : 'var(--border-subtle)',
                background: isDragging ? 'var(--accent-subtle)' : file ? 'var(--safe-bg)' : 'var(--bg-subtle)'
              }}
            >
              {file ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ background: 'var(--safe-bg)', color: 'var(--safe)' }}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      Type: {file.name.split('.').pop()?.toUpperCase()} • {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <label className="text-xs font-semibold cursor-pointer underline block pt-1" style={{ color: 'var(--accent)' }}>
                    Choose different file
                    <input type="file" accept=".sql,.csv,.json,.geojson" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Drag & drop your dataset here</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Supports .SQL, .CSV, .JSON (Max 25MB)</p>
                  </div>
                  <label className="inline-block px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer border transition" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                    Browse Files
                    <input type="file" accept=".sql,.csv,.json,.geojson" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t mt-4 flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
              <Button
                variant="primary"
                onClick={handleRunAnalysis}
                disabled={!file || uploadMutation.isPending}
                icon={Sparkles}
                className="w-full"
              >
                {uploadMutation.isPending ? 'Parsing & Synthesizing...' : 'Run AI Situation Analysis'}
              </Button>
            </div>
          </Card>

          {/* Recognized Schema Preview */}
          {uploadResult && (
            <Card title="Ingestion Schema Verification">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {uploadResult.detectedTables?.map((tbl) => (
                    <span
                      key={tbl}
                      className="px-2.5 py-1 rounded-md border text-xs font-mono flex items-center gap-1.5"
                      style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                    >
                      <Check className="w-3 h-3 text-emerald-500" /> {tbl}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center font-mono">
                  <div className="p-2 rounded-lg border" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>DISTRICTS</span>
                    <b className="text-sm" style={{ color: 'var(--accent)' }}>{uploadResult.entityCounts?.districts || 0}</b>
                  </div>
                  <div className="p-2 rounded-lg border" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>HAZARDS</span>
                    <b className="text-sm text-red-500">{uploadResult.entityCounts?.incidents || 0}</b>
                  </div>
                  <div className="p-2 rounded-lg border" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>ROADS</span>
                    <b className="text-sm text-amber-500">{uploadResult.entityCounts?.roadSegments || 0}</b>
                  </div>
                  <div className="p-2 rounded-lg border" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>VEHICLES</span>
                    <b className="text-sm text-emerald-500">{uploadResult.entityCounts?.vehicles || 0}</b>
                  </div>
                </div>

                {/* Commit to Live DB Button */}
                <div className="pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  {commitResult ? (
                    <div className="p-3 rounded-lg border text-xs flex items-center gap-2" style={{ background: 'var(--safe-bg)', borderColor: 'var(--safe)', color: 'var(--safe)' }}>
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Committed <b>{commitResult.committedStats?.roadSegments || 0} roads</b>,{' '}
                        <b>{commitResult.committedStats?.incidents || 0} hazards</b> to live platform!
                      </span>
                    </div>
                  ) : (
                    <Button
                      variant="safe"
                      onClick={() => commitMutation.mutate(uploadResult.auditId)}
                      loading={commitMutation.isPending}
                      icon={CheckCircle2}
                      className="w-full"
                    >
                      Commit Ingested Dataset to Live Platform
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: AI Situation Analysis Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {uploadResult?.aiSynthesis ? (
            <div className="space-y-4">
              {/* Executive Summary Card */}
              <Card
                title="Executive Situation Summary"
                className="shadow-sm"
              >
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {uploadResult.aiSynthesis.executiveSummary}
                </p>
              </Card>

              {/* Key Insights */}
              <Card title="Key Actionable Operational Insights">
                <div className="space-y-2">
                  {uploadResult.aiSynthesis.keyInsights?.map((insight, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border text-xs flex items-start gap-2.5"
                      style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    >
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                        {idx + 1}
                      </span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Risk Warnings */}
              <Card title="Critical Risk Warnings & Data Gaps">
                <div className="space-y-2">
                  {uploadResult.aiSynthesis.riskWarnings?.map((warning, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border text-xs flex items-start gap-2.5"
                      style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--text-primary)' }}
                    >
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recommended Directives */}
              <Card title="Recommended Incident Directives">
                <div className="space-y-2">
                  {uploadResult.aiSynthesis.recommendedActions?.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border text-xs flex items-start gap-2.5"
                      style={{ background: 'var(--safe-bg)', borderColor: 'var(--safe)', color: 'var(--text-primary)' }}
                    >
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Card className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-8 border-dashed">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                <Database className="w-7 h-7" />
              </div>
              <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>No Dataset Ingested Yet</h4>
              <p className="text-xs max-w-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Upload a field dataset or click <b>"Load Sample SQL"</b> above to trigger automated table recognition and AI situation synthesis.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Historical Dataset Imports Audit Table */}
      <Card title={`Dataset Ingestion Audit History (${history.length})`}>
        {history.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>
            No previous datasets imported in this session.
          </p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>File Name</TableHeader>
                <TableHeader>Format</TableHeader>
                <TableHeader>File Size</TableHeader>
                <TableHeader>Detected Tables</TableHeader>
                <TableHeader>Entities</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Timestamp</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h._id}>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                      {h.fileName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded border text-[10px] font-mono uppercase" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}>
                      {h.fileType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {((h.fileSizeBytes || 0) / 1024).toFixed(1)} KB
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {h.detectedTables?.slice(0, 3).map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded border text-[10px]" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {h.entityCounts ? `${h.entityCounts.districts}D • ${h.entityCounts.incidents}H • ${h.entityCounts.roadSegments}R` : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={h.status === 'imported' ? 'completed' : 'active'} label={h.status} />
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(h.createdAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </PageShell>
  );
}
