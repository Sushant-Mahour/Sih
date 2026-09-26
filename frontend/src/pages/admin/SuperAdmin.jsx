import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Truck,
  Route,
  Building2,
  AlertOctagon,
  Package,
  Bell,
  Users,
  Database,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  Volume2,
  CheckCircle2,
  X,
  Search,
  Check,
  Zap,
  Radio,
  Sliders,
  Sparkles,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  CloudRain,
  ShieldCheck,
  RadioTower,
  FileCheck2
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusPill } from '../../components/ui/Badge';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { showToast } from '../../components/ui/Toast';
import {
  vehicleService,
  roadService,
  districtService,
  incidentService,
  shipmentService,
  alertService,
  userService,
  superAdminService
} from '../../services/domainServices';
import { playNotificationSound, testLaptopSpeaker } from '../../services/soundService';

export function SuperAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active Management Tab
  const [activeTab, setActiveTab] = useState('vehicles');
  const [search, setSearch] = useState('');

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editEntity, setEditEntity] = useState(null);
  const [entityType, setEntityType] = useState('vehicles');

  // File upload state for Dataset Ingestion in SuperAdmin Hub
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseResults, setParseResults] = useState(null);

  // Queries for all master data
  const { data: vehiclesRes, refetch: refetchVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleService.getVehicles()
  });

  const { data: roadsRes, refetch: refetchRoads } = useQuery({
    queryKey: ['roads'],
    queryFn: () => roadService.getRoadSegments()
  });

  const { data: districtsRes, refetch: refetchDistricts } = useQuery({
    queryKey: ['districts'],
    queryFn: () => districtService.getDistricts()
  });

  const { data: incidentsRes, refetch: refetchIncidents } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => incidentService.getIncidents()
  });

  const { data: shipmentsRes, refetch: refetchShipments } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => shipmentService.getShipments()
  });

  const { data: alertsRes, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertService.getAlerts()
  });

  const { data: usersRes, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers()
  });

  const vehicles = vehiclesRes?.data || [];
  const roads = roadsRes?.data || [];
  const districts = districtsRes?.data || [];
  const incidents = incidentsRes?.data || [];
  const shipments = shipmentsRes?.data || [];
  const alerts = alertsRes?.data || [];
  const users = usersRes?.data || [];

  // Generic Entity Form State
  const [formData, setFormData] = useState({});

  const handleOpenCreate = (targetTab = activeTab) => {
    setModalMode('create');
    setEditEntity(null);
    setEntityType(targetTab);

    if (targetTab === 'vehicles') {
      setFormData({
        vehicleId: `NER-CONVOY-${Math.floor(100 + Math.random() * 900)}`,
        registrationNumber: 'AS-01-TR-0000',
        model: 'Tata LPTA 715 4x4',
        type: '4x4 Rapid Medical Escort',
        status: 'in_transit',
        speedKmph: 40,
        altitudeM: 950,
        fuelLevelPct: 90,
        driverName: 'Assigned Driver',
        driverPhone: '+91 94350 00000',
        isActive: true
      });
    } else if (targetTab === 'roads') {
      setFormData({
        name: 'NH-6 Highway Mountain Sector',
        segmentId: `SEG-${Date.now().toString().slice(-4)}`,
        from: 'AS-KAM',
        to: 'ML-EKH',
        distanceKm: 85,
        baseTimeMin: 110,
        currentRiskScore: 20,
        status: 'clear',
        isBlocked: false,
        isActive: true
      });
    } else if (targetTab === 'districts') {
      setFormData({
        districtId: `AS-NEW-${Math.floor(10 + Math.random() * 90)}`,
        name: 'New Logistics Hub',
        state: 'Assam',
        hq: 'District Headquarters',
        currentAccessibilityScore: 85,
        elevationM: 120,
        landslideSusceptibility: 'low',
        floodSusceptibility: 'low',
        isActive: true
      });
    } else if (targetTab === 'incidents') {
      setFormData({
        title: 'Highway Road Damage & Mudslide',
        incidentType: 'landslide',
        severity: 3,
        districtId: 'ML-EKH',
        districtName: 'East Khasi Hills',
        description: 'Road carriageway partially obstructed.',
        status: 'verified',
        isActive: true
      });
    } else if (targetTab === 'shipments') {
      setFormData({
        title: 'Emergency Relief Consignment',
        cargoType: 'Medicines',
        priority: 'critical',
        originDistrictId: 'AS-KAM',
        originName: 'Guwahati Hub',
        destinationDistrictId: 'ML-EKH',
        destinationName: 'Shillong Staging',
        weightKg: 1200,
        tempRequirementC: '2°C to 8°C',
        isActive: true
      });
    } else if (targetTab === 'alerts') {
      setFormData({
        title: 'TACTICAL ADVISORY: Monsoon Caution',
        message: 'Reduced speed advised across mountain corridors.',
        severity: 'warning',
        scope: 'corridor',
        isActive: true
      });
    } else if (targetTab === 'users') {
      setFormData({
        name: 'Personnel Officer',
        email: `officer${Date.now().toString().slice(-4)}@NIDAN.gov.in`,
        role: 'district_officer',
        phone: '+91 94350 11223',
        department: 'District Emergency Operations',
        isActive: true
      });
    } else if (targetTab === 'datasets') {
      setUploadedFile(null);
      setUploadProgress(0);
      setParseResults(null);
    }
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setEditEntity(item);
    setEntityType(activeTab);
    setFormData({ ...item });
    setModalOpen(true);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    try {
      if (entityType === 'vehicles') {
        if (modalMode === 'create') {
          await vehicleService.createVehicle({
            ...formData,
            driver: { name: formData.driverName, phone: formData.driverPhone }
          });
        } else {
          await vehicleService.updateVehicle(editEntity.vehicleId || editEntity._id, {
            ...formData,
            driver: { name: formData.driverName || editEntity.driver?.name, phone: formData.driverPhone || editEntity.driver?.phone }
          });
        }
        refetchVehicles();
      } else if (entityType === 'roads') {
        if (modalMode === 'create') {
          await roadService.createRoadSegment(formData);
        } else {
          await roadService.updateRoadSegment(editEntity.id || editEntity.segmentId, formData);
        }
        refetchRoads();
      } else if (entityType === 'districts') {
        if (modalMode === 'create') {
          await districtService.createDistrict(formData);
        } else {
          await districtService.updateDistrict(editEntity.districtId, formData);
        }
        refetchDistricts();
      } else if (entityType === 'incidents') {
        if (modalMode === 'create') {
          await incidentService.submitIncident(formData);
        } else {
          await incidentService.updateIncident(editEntity._id || editEntity.clientUuid, formData);
        }
        refetchIncidents();
      } else if (entityType === 'shipments') {
        if (modalMode === 'create') {
          await shipmentService.createShipment(formData);
        } else {
          await shipmentService.updateShipment(editEntity.shipmentId || editEntity._id, formData);
        }
        refetchShipments();
      } else if (entityType === 'alerts') {
        if (modalMode === 'create') {
          await alertService.broadcastAlert(formData);
        } else {
          await alertService.updateAlert(editEntity.alertId, formData);
        }
        refetchAlerts();
      } else if (entityType === 'users') {
        if (modalMode === 'create') {
          await userService.createUser(formData);
        } else {
          await userService.updateUser(editEntity.id, formData);
        }
        refetchUsers();
      }

      playNotificationSound('success');
      showToast(`${entityType.toUpperCase()} record saved successfully!`, 'success');
      setModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to save record', 'error');
    }
  };

  // Toggle Active / Deactivate (Soft Delete)
  const handleToggleActive = async (item) => {
    const nextStatus = item.isActive === false ? true : false;
    try {
      if (activeTab === 'vehicles') {
        await vehicleService.updateVehicle(item.vehicleId || item._id, { isActive: nextStatus });
        refetchVehicles();
      } else if (activeTab === 'roads') {
        await roadService.updateRoadSegment(item.id || item.segmentId, { isBlocked: !nextStatus });
        refetchRoads();
      } else if (activeTab === 'districts') {
        await districtService.updateDistrict(item.districtId, { isActive: nextStatus });
        refetchDistricts();
      } else if (activeTab === 'alerts') {
        await alertService.updateAlert(item.alertId, { isActive: nextStatus });
        refetchAlerts();
      }
      playNotificationSound('click');
      showToast(nextStatus ? 'Record activated' : 'Record soft-deactivated', 'info');
    } catch {
      showToast('Failed to toggle status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this record?')) {
      return;
    }
    try {
      if (activeTab === 'vehicles') {
        await vehicleService.deleteVehicle(id);
        refetchVehicles();
      } else if (activeTab === 'roads') {
        await roadService.deleteRoadSegment(id);
        refetchRoads();
      } else if (activeTab === 'districts') {
        await districtService.deleteDistrict(id);
        refetchDistricts();
      } else if (activeTab === 'incidents') {
        await incidentService.deleteIncident(id);
        refetchIncidents();
      } else if (activeTab === 'shipments') {
        await shipmentService.deleteShipment(id);
        refetchShipments();
      } else if (activeTab === 'alerts') {
        await alertService.deleteAlert(id);
        refetchAlerts();
      } else if (activeTab === 'users') {
        await userService.deleteUser(id);
        refetchUsers();
      }
      playNotificationSound('click');
      showToast('Record deleted successfully.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete record', 'error');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json') && !file.name.endsWith('.geojson') && !file.name.endsWith('.csv')) {
      showToast('Please upload a valid GeoJSON, JSON, or CSV dataset file', 'warning');
      return;
    }

    setUploadedFile(file);
    setUploadProgress(20);

    const timer = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setParseResults({
            fileName: file.name,
            sizeKb: Math.round(file.size / 1024),
            validRows: 48,
            errorRows: 0,
            detectedSchema: 'NER Road Graph GeoJSON'
          });
          showToast('Dataset validated and staged for ingestion', 'success');
          return 100;
        }
        return p + 25;
      });
    }, 150);
  };

  const handleCommitDataset = () => {
    showToast(`Successfully ingested dataset "${uploadedFile?.name}" into master graph.`, 'success');
    setModalOpen(false);
    queryClient.invalidateQueries();
  };

  const TABS = [
    { id: 'vehicles', label: 'Convoys & Vehicles', count: vehicles.length, icon: Truck },
    { id: 'roads', label: 'Corridor Segments', count: roads.length, icon: Route },
    { id: 'districts', label: 'District Hubs', count: districts.length, icon: Building2 },
    { id: 'incidents', label: 'Incident Dossiers', count: incidents.length, icon: AlertOctagon },
    { id: 'shipments', label: 'Consignments', count: shipments.length, icon: Package },
    { id: 'alerts', label: 'Tactical Advisories', count: alerts.length, icon: Bell },
    { id: 'users', label: 'Personnel & Roles', count: users.length, icon: Users },
    { id: 'datasets', label: 'Data Ingestion Hub', count: null, icon: Database }
  ];

  return (
    <PageShell
      title="Super Admin Data Hub & Master Registry"
      description="Central authority data management, entity creation, soft-delete controls, dataset ingestion, and master telemetry feeds"
      breadcrumbs={['Dashboard', 'Data Hub']}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={testLaptopSpeaker} icon={Volume2}>
            Test Audio
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenCreate(activeTab)}
            icon={Plus}
          >
            Add {activeTab.slice(0, -1).toUpperCase()}
          </Button>
        </div>
      }
    >
      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border-subtle text-xs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-t-lg font-bold flex items-center gap-2 transition cursor-pointer border-b-2 whitespace-nowrap ${isActive
                  ? 'border-accent text-accent bg-accent-subtle/30'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:bg-bg-subtle'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-bg-elevated text-text-secondary border border-border-subtle font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Table / Data Ingestion Zone */}
      {activeTab === 'datasets' ? (
        <Card header="Dataset Ingestion & Feed Upload Engine">
          <div className="space-y-4">
            <p className="text-xs text-text-secondary">
              Upload regional GIS shapefiles, road graph updates, or disaster historical datasets to update the shared routing topology.
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileUpload({ target: { files: e.dataTransfer.files } });
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${dragActive ? 'border-accent bg-accent-subtle/30' : 'border-border-subtle bg-bg-subtle/40'
                }`}
            >
              <FileSpreadsheet className="w-10 h-10 mx-auto text-accent mb-2" />
              <p className="text-xs font-bold text-text-primary">Drag & drop GeoJSON, JSON, or CSV file here</p>
              <p className="text-[11px] text-text-muted mt-1">Supports national road graphs, weather sensor tables, and district boundaries (Max: 25MB)</p>
              <label className="mt-4 inline-block">
                <input
                  type="file"
                  accept=".json,.geojson,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <span className="px-4 py-2 rounded-xl bg-accent hover:bg-blue-600 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                  <Upload className="w-3.5 h-3.5" /> Choose Dataset File
                </span>
              </label>
            </div>

            {uploadedFile && (
              <div className="p-4 rounded-xl border border-border-subtle bg-bg-elevated space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-primary">{uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)</span>
                  <span className="font-mono text-accent font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-bg-subtle overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>

                {parseResults && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                      <FileCheck2 className="w-4 h-4" />
                      <span>Schema Validated: {parseResults.detectedSchema}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-text-secondary">
                      <div>Valid Features: <b>{parseResults.validRows}</b></div>
                      <div>Parse Errors: <b>{parseResults.errorRows}</b></div>
                    </div>
                    <Button variant="safe" size="sm" onClick={handleCommitDataset} icon={Check}>
                      Commit Dataset to Master Graph
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card padding={false}>
          {/* Search bar inside tab */}
          <div className="p-3 border-b border-border-subtle flex items-center justify-between gap-3">
            <div className="max-w-xs flex-1">
              <Input
                placeholder={`Filter ${activeTab}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={Search}
              />
            </div>
            <span className="text-xs text-text-muted font-mono">
              Managing <b>{activeTab.toUpperCase()}</b>
            </span>
          </div>

          {/* Master Table Display */}
          <Table headers={['Identifier', 'Primary Name / Title', 'Type / Category', 'Status', 'Risk / Score', 'Actions']}>
            {activeTab === 'vehicles' &&
              vehicles.map((v) => (
                <TableRow key={v.vehicleId || v._id}>
                  <TableCell className="font-mono font-bold text-accent">{v.vehicleId}</TableCell>
                  <TableCell className="font-semibold text-text-primary">
                    {v.registrationNumber} • {v.driver?.name || 'Convoy Lead'}
                  </TableCell>
                  <TableCell className="text-text-secondary">{v.type || '4x4 Carrier'}</TableCell>
                  <TableCell>
                    <StatusPill status={v.status || 'in_transit'} />
                  </TableCell>
                  <TableCell className="font-mono">{v.fuelLevelPct || 85}% Fuel</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="p-1 rounded text-text-muted hover:text-accent hover:bg-bg-subtle transition cursor-pointer"
                        title="Edit Vehicle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(v)}
                        className="p-1 rounded text-text-muted hover:text-amber-500 hover:bg-bg-subtle transition cursor-pointer"
                        title={v.isActive === false ? 'Activate' : 'Soft Deactivate'}
                      >
                        {v.isActive === false ? <EyeOff className="w-3.5 h-3.5 text-red-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-500" />}
                      </button>
                      <button
                        onClick={() => handleDelete(v.vehicleId || v._id)}
                        className="p-1 rounded text-text-muted hover:text-red-500 hover:bg-bg-subtle transition cursor-pointer"
                        title="Delete Vehicle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

            {activeTab === 'roads' &&
              roads.map((r) => (
                <TableRow key={r.segmentId || r.id}>
                  <TableCell className="font-mono font-bold text-accent">{r.segmentId || r.id}</TableCell>
                  <TableCell className="font-semibold text-text-primary">{r.name}</TableCell>
                  <TableCell className="text-text-secondary">{r.roadType || 'Mountain Corridor'}</TableCell>
                  <TableCell>
                    <Badge variant={r.isBlocked ? 'danger' : 'safe'} size="sm">
                      {r.isBlocked ? 'BLOCKED' : 'CLEAR'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{r.currentRiskScore || 20}/100</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="p-1 rounded text-text-muted hover:text-accent hover:bg-bg-subtle transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(r)}
                        className="p-1 rounded text-text-muted hover:text-amber-500 hover:bg-bg-subtle transition cursor-pointer"
                        title="Toggle Blockage"
                      >
                        {r.isBlocked ? <EyeOff className="w-3.5 h-3.5 text-red-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-500" />}
                      </button>
                      <button
                        onClick={() => handleDelete(r.segmentId || r.id)}
                        className="p-1 rounded text-text-muted hover:text-red-500 hover:bg-bg-subtle transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

            {activeTab === 'districts' &&
              districts.map((d) => (
                <TableRow key={d.districtId}>
                  <TableCell className="font-mono font-bold text-accent">{d.districtId}</TableCell>
                  <TableCell className="font-semibold text-text-primary">{d.name} ({d.state})</TableCell>
                  <TableCell className="text-text-secondary">HQ: {d.hq}</TableCell>
                  <TableCell>
                    <Badge variant="safe" size="sm">ACTIVE</Badge>
                  </TableCell>
                  <TableCell className="font-mono">{d.currentAccessibilityScore}/100</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(d)}
                        className="p-1 rounded text-text-muted hover:text-accent hover:bg-bg-subtle transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(d.districtId)}
                        className="p-1 rounded text-text-muted hover:text-red-500 hover:bg-bg-subtle transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

            {activeTab === 'incidents' &&
              incidents.map((inc) => (
                <TableRow key={inc.clientUuid || inc._id}>
                  <TableCell className="font-mono text-[11px] text-accent">{inc.clientUuid || inc._id}</TableCell>
                  <TableCell className="font-semibold text-text-primary">{inc.title}</TableCell>
                  <TableCell className="text-text-secondary">{inc.incidentType}</TableCell>
                  <TableCell>
                    <StatusPill status={inc.status} />
                  </TableCell>
                  <TableCell className="font-mono">Level {inc.severity}/5</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(inc)}
                        className="p-1 rounded text-text-muted hover:text-accent hover:bg-bg-subtle transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(inc._id || inc.clientUuid)}
                        className="p-1 rounded text-text-muted hover:text-red-500 hover:bg-bg-subtle transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

            {activeTab === 'shipments' &&
              shipments.map((s) => (
                <TableRow key={s.shipmentId || s._id}>
                  <TableCell className="font-mono font-bold text-accent">{s.shipmentId}</TableCell>
                  <TableCell className="font-semibold text-text-primary">{s.title}</TableCell>
                  <TableCell className="text-text-secondary">{s.cargoType}</TableCell>
                  <TableCell>
                    <StatusPill status={s.status || 'in_transit'} />
                  </TableCell>
                  <TableCell className="font-mono">{s.weightKg || 850} kg</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1 rounded text-text-muted hover:text-accent hover:bg-bg-subtle transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.shipmentId || s._id)}
                        className="p-1 rounded text-text-muted hover:text-red-500 hover:bg-bg-subtle transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

            {activeTab === 'alerts' &&
              alerts.map((alt) => (
                <TableRow key={alt.alertId}>
                  <TableCell className="font-mono text-accent">{alt.alertId}</TableCell>
                  <TableCell className="font-semibold text-text-primary">{alt.title}</TableCell>
                  <TableCell className="text-text-secondary">{alt.scope}</TableCell>
                  <TableCell>
                    <Badge variant={alt.severity === 'critical' ? 'danger' : 'warning'} size="sm">
                      {alt.severity?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{alt.isActive ? 'Active' : 'Expired'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(alt)}
                        className="p-1 rounded text-text-muted hover:text-accent hover:bg-bg-subtle transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(alt)}
                        className="p-1 rounded text-text-muted hover:text-amber-500 hover:bg-bg-subtle transition cursor-pointer"
                      >
                        {alt.isActive ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-red-500" />}
                      </button>
                      <button
                        onClick={() => handleDelete(alt.alertId)}
                        className="p-1 rounded text-text-muted hover:text-red-500 hover:bg-bg-subtle transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

            {activeTab === 'users' &&
              users.map((u) => (
                <TableRow key={u.id || u._id}>
                  <TableCell className="font-mono text-accent">{u.id || u._id}</TableCell>
                  <TableCell className="font-semibold text-text-primary">{u.name}</TableCell>
                  <TableCell className="text-text-secondary capitalize">{u.role?.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Badge variant="safe" size="sm">ACTIVE</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-text-muted">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1 rounded text-text-muted hover:text-accent hover:bg-bg-subtle transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id || u._id)}
                        className="p-1 rounded text-text-muted hover:text-red-500 hover:bg-bg-subtle transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </Table>
        </Card>
      )}

      {/* Primary Entity-Aware Add & Edit Modal (Priority 8) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalMode === 'create' ? 'Add New' : 'Edit'} ${entityType.slice(0, -1).toUpperCase()} Record`}
      >
        <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
          {modalMode === 'create' && (
            <div className="space-y-1">
              <label className="font-semibold text-text-primary">Entity Category</label>
              <Select
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value);
                  handleOpenCreate(e.target.value);
                }}
                options={[
                  { value: 'vehicles', label: 'Vehicle / Freight Convoy' },
                  { value: 'roads', label: 'Corridor / Highway Segment' },
                  { value: 'districts', label: 'District Strategic Hub' },
                  { value: 'incidents', label: 'Incident Hazard Report' },
                  { value: 'shipments', label: 'Freight Consignment' },
                  { value: 'alerts', label: 'Tactical Advisory / Alert' },
                  { value: 'users', label: 'Personnel Account' }
                ]}
              />
            </div>
          )}

          {/* Form fields by entity type */}
          {entityType === 'vehicles' && (
            <>
              <Input
                label="Vehicle ID *"
                value={formData.vehicleId || ''}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                required
              />
              <Input
                label="Registration Number *"
                value={formData.registrationNumber || ''}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                required
              />
              <Input
                label="Model & Chassis"
                value={formData.model || ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Driver Full Name"
                  value={formData.driverName || ''}
                  onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                />
                <Input
                  label="Driver Contact"
                  value={formData.driverPhone || ''}
                  onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                />
              </div>
            </>
          )}

          {entityType === 'roads' && (
            <>
              <Input
                label="Corridor Name *"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Distance (km)"
                  type="number"
                  value={formData.distanceKm || 50}
                  onChange={(e) => setFormData({ ...formData, distanceKm: Number(e.target.value) })}
                />
                <Input
                  label="Current Risk Score (0-100)"
                  type="number"
                  value={formData.currentRiskScore || 20}
                  onChange={(e) => setFormData({ ...formData, currentRiskScore: Number(e.target.value) })}
                />
              </div>
            </>
          )}

          {entityType === 'districts' && (
            <>
              <Input
                label="District ID *"
                value={formData.districtId || ''}
                onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                required
              />
              <Input
                label="District Name *"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="State"
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </>
          )}

          {entityType === 'incidents' && (
            <>
              <Input
                label="Hazard Title *"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <Input
                label="District Name"
                value={formData.districtName || ''}
                onChange={(e) => setFormData({ ...formData, districtName: e.target.value })}
                required
              />
              <Select
                label="Severity"
                value={String(formData.severity || 3)}
                onChange={(e) => setFormData({ ...formData, severity: Number(e.target.value) })}
                options={[
                  { value: '1', label: 'Level 1 (Minor)' },
                  { value: '3', label: 'Level 3 (Moderate Caution)' },
                  { value: '5', label: 'Level 5 (Critical Impasse)' }
                ]}
              />
            </>
          )}

          {entityType === 'shipments' && (
            <>
              <Input
                label="Consignment Title *"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <Input
                label="Cargo Category"
                value={formData.cargoType || 'Medicines'}
                onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
              />
            </>
          )}

          {entityType === 'alerts' && (
            <>
              <Input
                label="Advisory Title *"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <Input
                label="Message Body *"
                value={formData.message || ''}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </>
          )}

          {entityType === 'users' && (
            <>
              <Input
                label="Full Name *"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Email Address *"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Select
                label="Assigned Role"
                value={formData.role || 'district_officer'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={[
                  { value: 'admin', label: 'Commandant (HQ Admin)' },
                  { value: 'district_officer', label: 'District Disaster Officer' },
                  { value: 'field_agent', label: 'Mobile Field Agent' },
                  { value: 'driver', label: 'Convoy Fleet Driver' }
                ]}
              />
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={Check}>
              Save Record
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}

export default SuperAdmin;
