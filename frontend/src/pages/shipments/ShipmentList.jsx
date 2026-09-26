import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  Truck,
  ArrowRight,
  ShieldAlert,
  Clock,
  Thermometer,
  ExternalLink,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusPill } from '../../components/ui/Badge';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { showToast } from '../../components/ui/Toast';
import { shipmentService, districtService, vehicleService } from '../../services/domainServices';

export function ShipmentList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [cargoFilter, setCargoFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State for new shipment dispatch
  const [title, setTitle] = useState('');
  const [originDistrictId, setOriginDistrictId] = useState('AS-KAM');
  const [destinationDistrictId, setDestinationDistrictId] = useState('ML-EKH');
  const [cargoType, setCargoType] = useState('Medicines');
  const [priority, setPriority] = useState('critical');
  const [assignedVehicleId, setAssignedVehicleId] = useState('NER-CONVOY-101');
  const [tempRequirementC, setTempRequirementC] = useState('2°C to 8°C');
  const [weightKg, setWeightKg] = useState('1200');

  const { data: shipmentsData, isLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => shipmentService.getShipments()
  });

  const { data: districtsData } = useQuery({
    queryKey: ['districts'],
    queryFn: () => districtService.getDistricts()
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleService.getVehicles()
  });

  const shipments = shipmentsData?.data || [];
  const districts = districtsData?.data || [];
  const vehicles = vehiclesData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data) => shipmentService.createShipment(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      showToast('Consignment dispatched successfully', 'success');
      setModalOpen(false);
      setTitle('');
    },
    onError: () => {
      showToast('Failed to schedule consignment dispatch', 'error');
    }
  });

  const handleCreateShipment = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please provide a consignment title', 'warning');
      return;
    }
    const orig = districts.find(d => d.districtId === originDistrictId);
    const dest = districts.find(d => d.districtId === destinationDistrictId);

    createMutation.mutate({
      title,
      originDistrictId,
      originName: orig?.name ? `${orig.name} Hub` : 'Guwahati Hub',
      destinationDistrictId,
      destinationName: dest?.name ? `${dest.name} Staging` : 'Destination Staging',
      cargoType,
      priority,
      assignedVehicleId,
      tempRequirementC,
      weightKg: parseInt(weightKg, 10) || 1000
    });
  };

  const filteredShipments = shipments.filter((shp) => {
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (shp.shipmentId && shp.shipmentId.toLowerCase().includes(query)) ||
      (shp.title && shp.title.toLowerCase().includes(query)) ||
      (shp.destinationName && shp.destinationName.toLowerCase().includes(query)) ||
      (shp.originName && shp.originName.toLowerCase().includes(query));
    const matchesCargo = cargoFilter === 'all' || shp.cargoType === cargoFilter;
    const matchesPriority = priorityFilter === 'all' || shp.priority === priorityFilter;
    return matchesSearch && matchesCargo && matchesPriority;
  });

  return (
    <PageShell
      title="Consignment Tracking & Cargo Manifest"
      subtitle="Chain-of-custody tracking for medicines, emergency rations, and relief cargo across North East corridors"
      breadcrumbs={['Dashboard', 'Consignments']}
      actionSlot={
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} icon={Plus}>
          Schedule Dispatch
        </Button>
      }
    >
      {/* Search & Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <Input
              placeholder="Search shipment ID, origin, destination, cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="sm:col-span-3">
            <Select
              value={cargoFilter}
              onChange={(e) => setCargoFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Cargo Types' },
                { value: 'Medicines', label: 'Medicines & Vaccines' },
                { value: 'Food Supplies', label: 'Food Grain & Rations' },
                { value: 'Heavy Equipment', label: 'Heavy Equipment' },
                { value: 'Agricultural Produce', label: 'Agricultural Produce' }
              ]}
            />
          </div>
          <div className="sm:col-span-3">
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'critical', label: 'Critical / Life-Saving' },
                { value: 'high', label: 'High Priority' },
                { value: 'standard', label: 'Standard Schedule' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Manifest Table */}
      {isLoading ? (
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </Card>
      ) : filteredShipments.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No consignments found"
          description={
            search || cargoFilter !== 'all' || priorityFilter !== 'all'
              ? 'No shipments match your active search filters.'
              : 'There are currently no active or dispatched consignments in the registry.'
          }
          actionLabel="Dispatch Consignment"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Consignment ID</TableHeader>
                <TableHeader>Description / Cargo</TableHeader>
                <TableHeader>Origin → Destination</TableHeader>
                <TableHeader>Priority</TableHeader>
                <TableHeader>Assigned Fleet Unit</TableHeader>
                <TableHeader>Temp Target</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right">Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredShipments.map((shp) => (
                <TableRow
                  key={shp.shipmentId}
                  className="cursor-pointer"
                  onClick={() => navigate(`/shipments/${shp.shipmentId}`)}
                >
                  <TableCell>
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent)' }}>
                      {shp.shipmentId}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {shp.title}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {shp.cargoType} • {shp.weightKg || 1000} kg
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {shp.originName}
                    </div>
                    <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      → {shp.destinationName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={shp.priority === 'critical' ? 'danger' : shp.priority === 'high' ? 'warning' : 'default'}
                      size="sm"
                    >
                      {shp.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {shp.assignedVehicleId || 'Unassigned'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-sky-600 dark:text-sky-400 font-medium">
                      {shp.tempRequirementC || 'Ambient'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={shp.status === 'in_transit' ? 'active' : shp.status === 'rerouted' ? 'warning' : 'completed'} label={shp.status?.replace('_', ' ')} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" icon={ChevronRight}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Schedule Dispatch Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Consignment Dispatch"
      >
        <form onSubmit={handleCreateShipment} className="space-y-4">
          <Input
            label="Consignment Title / Manifest Description"
            placeholder="e.g. Life-saving Anti-Venom & Pediatric Vaccines"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Origin Hub"
              value={originDistrictId}
              onChange={(e) => setOriginDistrictId(e.target.value)}
              options={districts.map(d => ({ value: d.districtId, label: `${d.name} (${d.state})` }))}
            />
            <Select
              label="Destination Staging"
              value={destinationDistrictId}
              onChange={(e) => setDestinationDistrictId(e.target.value)}
              options={districts.map(d => ({ value: d.districtId, label: `${d.name} (${d.state})` }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Cargo Classification"
              value={cargoType}
              onChange={(e) => setCargoType(e.target.value)}
              options={[
                { value: 'Medicines', label: 'Medicines & Vaccines' },
                { value: 'Food Supplies', label: 'Food Grain & Relief Rations' },
                { value: 'Heavy Equipment', label: 'Heavy Equipment & Tools' },
                { value: 'Agricultural Produce', label: 'Agricultural Produce' }
              ]}
              allowOthers
            />
            <Select
              label="Convoy Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={[
                { value: 'critical', label: 'Critical / Life-Saving' },
                { value: 'high', label: 'High Priority' },
                { value: 'standard', label: 'Standard Schedule' }
              ]}
              allowOthers
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <Input
                label="Weight (kg)"
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
            <div className="sm:col-span-1">
              <Input
                label="Temp Target"
                value={tempRequirementC}
                onChange={(e) => setTempRequirementC(e.target.value)}
                placeholder="2°C to 8°C"
              />
            </div>
            <div className="sm:col-span-1">
              <Select
                label="Assigned Vehicle"
                value={assignedVehicleId}
                onChange={(e) => setAssignedVehicleId(e.target.value)}
                options={vehicles.map(v => ({ value: v.vehicleId, label: v.vehicleId }))}
                allowOthers
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending}
              icon={Truck}
            >
              Authorize & Dispatch
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
