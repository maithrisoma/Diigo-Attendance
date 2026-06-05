import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import diigoLogo from '../diigo_logo.png';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  ShieldCheck,
  UserCircle2,
  KeyRound,
  LogIn,
} from 'lucide-react';

type Portal = 'employee' | 'admin';

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

  const isAdmin = portal === 'admin';

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
        if (isAdmin && role !== 'admin') {
          toast('This account does not have Admin access.', 'error');
          setErrors({ password: 'Not an Admin account.' });
          setLoading(false);
          return;
        }
        if (!isAdmin && role === 'admin') {
          toast('Please use the Admin Portal to sign in.', 'error');
          setErrors({ password: 'Use the Admin portal.' });
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
          label={isAdmin ? 'Admin ID or Email' : 'Employee ID or Email'}
          placeholder={isAdmin ? 'e.g. HR001 or admin@company.com' : 'e.g. EMP001 or employee@company.com'}
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
          className="w-full h-12 text-sm"
        >
          <LogIn className="h-4 w-4 mr-2" />
          {loading ? 'Signing in…' : `Sign in to ${isAdmin ? 'Admin' : 'Employee'} Portal`}
        </Button>

        {/* Demo hint */}
        <div
          className="rounded-2xl p-4 text-[11px] leading-relaxed"
          style={{ background: 'rgba(237,233,254,0.6)', border: '1px solid #DDD6FE' }}
        >
          <span className="font-bold" style={{ color: '#6D28D9' }}>Demo credentials: </span>
          <code className="font-mono font-semibold" style={{ color: '#4C1D95' }}>
            {isAdmin ? 'admin@company.com' : 'employee@company.com'}
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
            placeholder="e.g. EMP001"
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
  const [activeTab, setActiveTab] = useState<'employee' | 'admin'>('employee');

  if (isAuthenticated && currentUser) {
    return <Navigate to={currentUser.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />;
  }

  const handleSuccess = (role: string) => {
    navigate(role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #F7F2FF 0%, #EDE9FE 50%, #DDD6FE 100%)' }}
    >
      {/* Animated background blobs */}
      <div
        className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full opacity-40 animate-blob"
        style={{ background: 'radial-gradient(circle, #C4B5FD 0%, #A78BFA 100%)', filter: 'blur(60px)' }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-80 h-80 rounded-full opacity-30 animate-blob animation-delay-2000"
        style={{ background: 'radial-gradient(circle, #DDD6FE 0%, #C4B5FD 100%)', filter: 'blur(50px)' }}
      />
      <div
        className="absolute top-[40%] right-[10%] w-64 h-64 rounded-full opacity-20 animate-blob animation-delay-4000"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, #A78BFA 100%)', filter: 'blur(70px)' }}
      />

      {/* Brand */}
      <div className="flex flex-col items-center mb-8 text-center z-10 animate-fadeInUp">
        <div
          className="p-3 rounded-2xl mb-4"
          style={{ background: 'rgba(255,255,255,0.85)', boxShadow: '0 4px 20px rgba(139,92,246,0.15)' }}
        >
          <img src={diigoLogo} alt="Diigo Logo" className="h-12 object-contain" />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: '#4C1D95' }}>Diigo Attendance</h1>
        <p className="text-xs font-semibold tracking-widest uppercase mt-1" style={{ color: '#9879E9' }}>
          Premium HR Management Portal
        </p>
      </div>

      {/* Login Card */}
      <div
        className="w-full max-w-md z-10 rounded-3xl overflow-hidden animate-fadeInUp"
        style={{
          background: 'rgba(255,255,255,0.88)',
          border: '1.5px solid #D8B4FE',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 20px 60px rgba(139,92,246,0.18), 0 4px 16px rgba(196,181,253,0.25)',
        }}
      >
        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: '#DDD6FE' }}>
          {(['employee', 'admin'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-4 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                borderBottom: activeTab === tab ? '2.5px solid #8B5CF6' : '2.5px solid transparent',
                color: activeTab === tab ? '#8B5CF6' : '#9879E9',
                background: activeTab === tab ? 'rgba(237,233,254,0.4)' : 'transparent',
              }}
            >
              {tab === 'employee' ? (
                <UserCircle2 className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {tab === 'employee' ? 'Employee Login' : 'HR / Admin Login'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold" style={{ color: '#4C1D95' }}>
              {activeTab === 'employee' ? 'Welcome Back' : 'Admin Portal'}
            </h2>
            <p className="text-xs mt-1.5" style={{ color: '#9879E9' }}>
              {activeTab === 'employee'
                ? 'Mark attendance and manage your employee profile'
                : 'Manage staff records, leaves, approvals, and reports'}
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
