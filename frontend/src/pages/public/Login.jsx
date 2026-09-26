import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Radio, KeyRound, User, Lock, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../features/useAuthStore';
import { useTheme } from '../../features/ThemeContext';
import { showToast } from '../../components/ui/Toast';

export function Login() {
  const navigate = useNavigate();
  const { login, switchRole } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const [selectedRole, setSelectedRole] = useState('admin');
  const [email, setEmail] = useState('admin@nerlogistics.gov.in');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('849201');

  const demoAccounts = [
    { role: 'admin', label: 'Commandant (HQ Admin)', email: 'admin@nerlogistics.gov.in', desc: 'Full emergency protocol control & broadcast authority' },
    { role: 'district_officer', label: 'District Disaster Officer', email: 'officer@nerlogistics.gov.in', desc: 'District node oversight, checkpoints & incident validation' },
    { role: 'field_agent', label: 'Mobile Field Agent', email: 'agent@nerlogistics.gov.in', desc: 'Field incident reporting & mobile hazard capture' },
    { role: 'driver', label: 'Convoy Fleet Driver', email: 'driver@nerlogistics.gov.in', desc: 'Telemetry tracking, waypoint clearance & detour alerts' }
  ];

  const handleRoleSelect = (acc) => {
    setSelectedRole(acc.role);
    setEmail(acc.email);
    setPassword('Password@123');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await switchRole(selectedRole);
      showToast(`Authenticated as ${selectedRole.replace('_', ' ')}`, 'success');
      if (selectedRole === 'driver') {
        navigate('/driver');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      showToast('Authenticated in offline mode', 'info');
      if (selectedRole === 'driver') {
        navigate('/driver');
      } else {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4 transition-colors duration-200 relative"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </div>

      <div className="w-full max-w-3xl space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl text-white mb-1 shadow-sm" style={{ background: 'var(--accent)' }}>
            <Radio className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            NIDAN Logistics & Emergency Command
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Select an operational role or authenticate with official credentials
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Quick Demo Role Selector (Left) */}
          <Card className="md:col-span-6 p-5 space-y-3" title="Instant Evaluation Roles">
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Select a test persona for 1-click evaluation:
            </p>
            <div className="space-y-2">
              {demoAccounts.map((acc) => {
                const isSelected = selectedRole === acc.role;
                return (
                  <div
                    key={acc.role}
                    onClick={() => handleRoleSelect(acc)}
                    className="p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between"
                    style={{
                      background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
                      borderColor: isSelected ? 'var(--accent)' : 'var(--border-subtle)'
                    }}
                  >
                    <div>
                      <p className="text-xs font-semibold" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {acc.label}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{acc.desc}</p>
                    </div>
                    <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: isSelected ? 'var(--accent)' : 'var(--border-subtle)' }} />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Login Form (Right) */}
          <Card className="md:col-span-6 p-5" title="Authenticate Officer">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <Input
                label="Official Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={User}
                required
              />

              <Input
                label="Passcode / Security Token"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                required
              />

              <div className="p-2.5 rounded-lg border text-[11px] flex items-center justify-between" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <span>Status: <b className="text-emerald-600 dark:text-emerald-400 font-mono">AUTHORIZED</b></span>
                <span className="font-mono" style={{ color: 'var(--accent)' }}>DEMO OTP: {otp}</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
                icon={ArrowRight}
              >
                Authenticate & Enter
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
