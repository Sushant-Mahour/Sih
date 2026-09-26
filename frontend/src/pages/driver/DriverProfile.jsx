import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Truck,
  Phone,
  Shield,
  LogOut,
  Globe,
  Bell,
  CheckCircle2,
  Calendar,
  PhoneCall,
  Flame,
  Hospital,
  AlertTriangle
} from 'lucide-react';
import { DriverShell } from '../../components/driver/DriverShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../features/useAuthStore';
import { showToast } from '../../components/ui/Toast';

export function DriverProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const driverProfile = {
    name: 'Bikash Borah',
    roleLabel: 'Convoy Fleet Driver',
    driverId: 'NER-DRV-0841',
    phone: '+91 94351 22891',
    assignedVehicle: 'NER-CONVOY-101 (Tata 4x4 High-Terrain)',
    licenseNumber: 'AS-01-2018-0092144',
    licenseExpiry: '14 Oct 2029',
    shiftStatus: 'Active Mountain Shift (06:00 - 18:00 IST)',
    depotBase: 'Guwahati Trunk Staging Logistics Yard',
    emergencyContacts: [
      { label: 'NER Joint Control Room (24x7)', phone: '+91 94350 11200', icon: PhoneCall, primary: true },
      { label: 'Disaster Cell Patrol Escort', phone: '+91 94350 22311', icon: Shield, primary: false },
      { label: 'Emergency Medical & Trauma Desk', phone: '108', icon: Hospital, primary: false },
      { label: 'Highway Breakdown Crane Unit', phone: '+91 94350 33444', icon: Truck, primary: false }
    ]
  };

  const handleLogout = () => {
    logout();
    showToast('Signed out of Convoy Telemetry session', 'info');
    navigate('/login');
  };

  return (
    <DriverShell>
      <div className="space-y-4">
        {/* Driver Persona Header */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-accent text-white flex items-center justify-center font-bold text-xl shadow-md">
              {driverProfile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                  {driverProfile.name}
                </h2>
                <Badge variant="safe" size="sm">ON SHIFT</Badge>
              </div>
              <p className="text-xs font-mono text-accent font-semibold">{driverProfile.driverId}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{driverProfile.phone}</p>
            </div>
          </div>

          <div className="pt-2 border-t text-xs space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Assigned Convoy Unit:</span>
              <span className="font-semibold text-right" style={{ color: 'var(--text-primary)' }}>
                {driverProfile.assignedVehicle}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>License Record:</span>
              <span className="font-mono text-right" style={{ color: 'var(--text-secondary)' }}>
                {driverProfile.licenseNumber} (Exp: {driverProfile.licenseExpiry})
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Active Shift:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {driverProfile.shiftStatus}
              </span>
            </div>
          </div>
        </Card>

        {/* Tap-to-Call Emergency Contacts (Large Touch Buttons) */}
        <Card title="Emergency Response Speed Dial">
          <div className="space-y-2.5">
            {driverProfile.emergencyContacts.map((c, idx) => {
              const Icon = c.icon;
              return (
                <a
                  key={idx}
                  href={`tel:${c.phone}`}
                  className={`w-full h-13 px-3.5 rounded-xl flex items-center justify-between font-bold text-xs transition cursor-pointer shadow-xs ${
                    c.primary
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'border text-text-primary hover:bg-bg-subtle'
                  }`}
                  style={{
                    borderColor: c.primary ? 'transparent' : 'var(--border-subtle)',
                    background: c.primary ? undefined : 'var(--bg-subtle)'
                  }}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <Icon className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="font-bold">{c.label}</div>
                      <div className="text-[10px] opacity-80 font-mono">{c.phone}</div>
                    </div>
                  </div>
                  <Phone className="w-4 h-4 shrink-0 opacity-80" />
                </a>
              );
            })}
          </div>
        </Card>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="w-full h-12 rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Driver Session</span>
        </button>
      </div>
    </DriverShell>
  );
}

export default DriverProfile;
