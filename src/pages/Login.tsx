import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import diigoLogo from '../diigo_logo.png';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { AuroraBackground } from '../components/ui/AuroraBackground';
import {
  ShieldCheck,
  KeyRound,
  LogIn,
  User,
  Crown,
} from 'lucide-react';


type Portal = 'employee' | 'hr' | 'admin';

interface PortalFormProps {
  portal: Portal;
  onSuccess: (role: string) => void;
}

const PortalForm: React.FC<PortalFormProps> = ({ portal, onSuccess }) => {
  const { login, forgotPassword } = useAuth();
  const { toast } = useToast();
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ emailOrId?: string; password?: string }>({});
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  useEffect(() => {
    setEmailOrId('');
    setPassword('');
    setErrors({});
  }, [portal]);

  const getFieldsConfig = () => {
    switch (portal) {
      case 'admin':
        return {
          label: 'Super Admin ID or Email',
          placeholder: 'e.g. ADM001 or admin@company.com',
          demoEmail: 'admin@company.com',
          btnText: loading ? 'Signing in…' : 'Sign In to Super Admin Portal'
        };
      case 'hr':
        return {
          label: 'HR ID or Email',
          placeholder: 'e.g. HR001 or hr@company.com',
          demoEmail: 'hr@company.com',
          btnText: loading ? 'Signing in…' : 'Sign In to HR Portal'
        };
      case 'employee':
      default:
        return {
          label: 'Employee ID or Email',
          placeholder: 'e.g. EMP001 or employee@company.com',
          demoEmail: 'employee@company.com',
          btnText: loading ? 'Signing in…' : 'Sign In to Employee Portal'
        };
    }
  };

  const config = getFieldsConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { emailOrId?: string; password?: string } = {};
    if (!emailOrId.trim()) newErrors.emailOrId = 'Employee ID or Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await login(emailOrId, password);
      if (res.success) {
        const saved = localStorage.getItem('currentUser');
        const parsed = saved ? JSON.parse(saved) : null;
        const role: string = parsed?.role ?? 'employee';
        if (portal === 'admin' && role !== 'admin') {
          toast('This account does not have Super Admin access.', 'error');
          setErrors({ password: 'Not a Super Admin account.' });
          setLoading(false);
          return;
        }
        if (portal === 'hr' && role !== 'hr') {
          toast('This account does not have HR access.', 'error');
          setErrors({ password: 'Not an HR account.' });
          setLoading(false);
          return;
        }
        if (portal === 'employee' && role !== 'employee') {
          toast('This account does not have Employee access.', 'error');
          setErrors({ password: 'Not an Employee account.' });
          setLoading(false);
          return;
        }
        toast('Welcome back! Logged in successfully.', 'success');
        onSuccess(role);
      } else {
        toast(res.message, 'error');
        setErrors({ password: res.message });
      }
    } catch {
      toast('Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput.trim()) { setForgotError('Please enter your Employee ID or Email'); return; }
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await forgotPassword(forgotInput);
      if (res.success) {
        toast(res.message, 'success');
        setForgotOpen(false);
        setForgotInput('');
      } else {
        setForgotError(res.message);
        toast(res.message, 'error');
      }
    } catch {
      setForgotError('An error occurred. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 mt-5">
        <Input
          label={config.label}
          placeholder={config.placeholder}
          value={emailOrId}
          onChange={e => setEmailOrId(e.target.value)}
          error={errors.emailOrId}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          error={errors.password}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { setForgotOpen(true); setForgotError(''); }}
            className="text-xs font-semibold transition-colors"
            style={{ color: '#8B5CF6' }}
          >
            Forgot Password?
          </button>
        </div>

        <Button
          type="submit"
          disabled={loading}
          style={portal === 'admin' ? { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' } : undefined}
          className={`w-full h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 ${
            portal === 'admin' ? 'hover:bg-[#7C3AED] text-white' : ''
          }`}
        >
          <LogIn className="h-4 w-4" />
          {config.btnText}
        </Button>

        {/* Demo hint */}
        <div className="rounded-lg p-3 border border-border/80 bg-muted/5 text-[10.5px] leading-relaxed text-muted-foreground">
          <span className="font-bold">Demo: </span>
          <code className="font-mono font-semibold text-foreground/80">
            {config.demoEmail}
          </code>
          {' / '}
          <code className="font-mono font-semibold" style={{ color: '#4C1D95' }}>password</code>
        </div>
      </form>

      <Modal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} title="Reset Password" size="sm">
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <div className="flex flex-col items-center text-center mb-4">
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)' }}
            >
              <KeyRound className="h-6 w-6" style={{ color: '#7C3AED' }} />
            </div>
            <p className="text-sm" style={{ color: '#6D5A9C' }}>
              Enter your Employee ID or Email to reset your password.
            </p>
          </div>
          <Input
            label="Employee ID or Email"
            placeholder="e.g. D01"
            value={forgotInput}
            onChange={e => setForgotInput(e.target.value)}
            error={forgotError}
            autoFocus
          />
          <div className="flex gap-3 pt-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setForgotOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={forgotLoading}>
              {forgotLoading ? 'Searching…' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

// ─── Main Login Page ──────────────────────────────────────────────────────────

export const Login: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Portal>('employee');

  if (isAuthenticated && currentUser) {
    if (currentUser.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (currentUser.role === 'hr') {
      return <Navigate to="/hr/dashboard" replace />;
    } else {
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  const handleSuccess = (role: string) => {
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'hr') {
      navigate('/hr/dashboard');
    } else {
      navigate('/employee/dashboard');
    }
  };

  const getHeadingAndDesc = () => {
    switch (activeTab) {
      case 'admin':
        return {
          heading: 'Login Into Administration Center',
          desc: 'Manage the entire attendance system, users, permissions, reports, and company settings.'
        };
      case 'hr':
        return {
          heading: 'Login Into HR Dashboard',
          desc: 'Access HR dashboard to manage employee records, leaves, and attendance.'
        };
      case 'employee':
      default:
        return {
          heading: 'Login Into Your Dashboard',
          desc: 'Mark attendance and access your employee profile'
        };
    }
  };

  const { heading, desc } = getHeadingAndDesc();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden text-foreground transition-colors duration-200">

      {/* ── Aurora Full Page Background ── */}
      <AuroraBackground variant="page" />

      {/* Brand */}
      <div className="flex flex-col items-center mb-8 text-center z-10">
        <img src={diigoLogo} alt="Diigo Logo" className="h-14 md:h-16 object-contain mb-3 drop-shadow-lg" />
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Attendance Registry Portal
        </p>
      </div>

      {/* Centered Login Card — Glassmorphism */}
      <div className="glass-card w-full max-w-md z-10 rounded-[20px] overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-white/20 dark:border-white/10 text-xs sm:text-sm">
          {/* Employee Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('employee')}
            className={`flex-1 py-4 font-bold transition-all duration-200 border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'employee'
                ? 'text-primary border-primary bg-white/20 dark:bg-white/5'
                : 'text-muted-foreground hover:bg-white/10 border-transparent'
            }`}
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="hidden xs:inline truncate">Employee Login</span>
            <span className="xs:hidden truncate">Employee</span>
          </button>

          {/* HR Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('hr')}
            className={`flex-1 py-4 font-bold transition-all duration-200 border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'hr'
                ? 'text-primary border-primary bg-white/20 dark:bg-white/5'
                : 'text-muted-foreground hover:bg-white/10 border-transparent'
            }`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span className="hidden xs:inline truncate">HR Login</span>
            <span className="xs:hidden truncate">HR</span>
          </button>

          {/* Super Admin Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-4 font-bold transition-all duration-200 border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'text-[#8B5CF6] border-[#8B5CF6] bg-white/20 dark:bg-white/5'
                : 'text-muted-foreground hover:bg-white/10 border-transparent'
            }`}
          >
            <Crown className="h-4 w-4 shrink-0" />
            <span className="hidden xs:inline truncate">Super Admin Login</span>
            <span className="xs:hidden truncate">Super Admin</span>
          </button>
        </div>

        {/* Card Content Form */}
        <div className="p-7 flex flex-col">
          <div className="flex flex-col items-center text-center mb-3">
            {activeTab === 'admin' && (
              <span className="mb-2 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 animate-in fade-in zoom-in-95 duration-200">
                <Crown className="h-3 w-3" /> Super Admin
              </span>
            )}
            <h2 className="font-bold text-xl leading-tight text-foreground font-display">
              {heading}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {desc}
            </p>
          </div>
          <PortalForm portal={activeTab} onSuccess={handleSuccess} />
        </div>
      </div>

      {/* Footer */}
      <div className="z-10 mt-8 text-xs font-medium" style={{ color: '#C4B5FD' }}>
        Diigo Attendance &copy; {new Date().getFullYear()} — HRMS v2.0
      </div>
    </div>
  );
};
