import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import diigoLogo from '../diigo_logo.png';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  Clock,
  ShieldCheck,
  UserCircle2,
  KeyRound,
  LogIn,
  Building2,
  Leaf,
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

        toast('Logged in successfully', 'success');
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
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
          <button type="button"
            onClick={() => { setForgotOpen(true); setForgotError(''); }}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Forgot Password?
          </button>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
        >
          <LogIn className="h-4 w-4" />
          {loading ? 'Signing in…' : `Sign in to ${isAdmin ? 'Admin' : 'Employee'} Portal`}
        </Button>

        {/* Demo hint */}
        <div className="rounded-xl p-3 border border-border/80 bg-muted/5 text-[10.5px] leading-relaxed text-muted-foreground">
          <span className="font-bold">Demo: </span>
          <code className="font-mono font-semibold text-foreground/80">
            {isAdmin ? 'admin@company.com' : 'employee@company.com'}
          </code>
          {' / '}
          <code className="font-mono font-semibold text-foreground/80">password</code>
        </div>
      </form>

      <Modal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} title="Reset Password" size="sm">
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3">
              <KeyRound className="h-5 w-5" />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your Employee ID or Email address and we'll help reset your password.
            </p>
          </div>
          <Input label="Employee ID or Email" placeholder="e.g. EMP001"
            value={forgotInput} onChange={e => setForgotInput(e.target.value)}
            error={forgotError} autoFocus />
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

  if (isAuthenticated && currentUser) {
    return <Navigate to={currentUser.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />;
  }

  const handleSuccess = (role: string) => {
    navigate(role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background text-foreground transition-colors duration-200">

      {/* Brand */}
      <div className="flex flex-col items-center mb-8 text-center z-10">
        <img src={diigoLogo} alt="Diigo Logo" className="h-14 md:h-16 object-contain mb-3 dark:brightness-110" />
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Enterprise Attendance Registry Portal
        </p>
      </div>

      {/* Two portal cards */}
      <div className="w-full max-w-4xl z-10 grid grid-cols-1 md:grid-cols-2 gap-6 px-2">

        {/* ── Employee Portal Card ── */}
        <div className="relative rounded-xl p-7 flex flex-col bg-card border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-11 w-11 rounded-lg flex items-center justify-center border border-border bg-muted/10">
              <UserCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight text-foreground font-display">Employee Portal</h2>
              <p className="text-xs text-muted-foreground">Mark attendance &amp; view records</p>
            </div>
          </div>

          <ul className="mt-4 space-y-1.5 text-xs border-t border-border pt-4 text-muted-foreground">
            {['Check In / Check Out', 'View attendance calendar', 'Apply for leave'].map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full flex-shrink-0 bg-primary/40" />
                {f}
              </li>
            ))}
          </ul>

          <PortalForm portal="employee" onSuccess={handleSuccess} />
        </div>

        {/* ── Admin / HR Portal Card ── */}
        <div className="relative rounded-xl p-7 flex flex-col bg-card border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-11 w-11 rounded-lg flex items-center justify-center border border-border bg-muted/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight text-foreground font-display">Admin / HR Portal</h2>
              <p className="text-xs text-muted-foreground">Manage employees &amp; attendance</p>
            </div>
          </div>

          <ul className="mt-4 space-y-1.5 text-xs border-t border-border pt-4 text-muted-foreground">
            {['Manage employee directory', 'Approve / reject leave requests', 'Generate attendance reports'].map(f => (
              <li key={f} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full flex-shrink-0 bg-primary/40" />
                {f}
              </li>
            ))}
          </ul>

          <PortalForm portal="admin" onSuccess={handleSuccess} />
        </div>
      </div>

      {/* Footer */}
      <div className="z-10 mt-10 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Diigo Attendance &copy; {new Date().getFullYear()} — Enterprise HRMS</span>
      </div>
    </div>
  );
};
