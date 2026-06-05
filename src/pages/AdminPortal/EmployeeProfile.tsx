import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import {
  ArrowLeft,
  Mail,
  Building2,
  Briefcase,
  ShieldCheck,
  User,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock3,
  TrendingUp,
  ClipboardList,
  AlertCircle,
  CalendarCheck,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  'from-[#2563EB] to-[#3B82F6]',
  'from-[#3B82F6] to-[#C084FC]',
  'from-[#C084FC] to-[#E9D5FF]',
  'from-[#6D28D9] to-[#2563EB]',
  'from-[#1D4ED8] to-[#3B82F6]',
  'from-[#9F7AEA] to-[#E9D5FF]',
];
const getGradient = (name: string) =>
  AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const DEPT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Engineering:       { bg: 'bg-primary/10',   text: 'text-primary-text',   dot: 'bg-primary'   },
  Marketing:         { bg: 'bg-primary/10',   text: 'text-primary-text',   dot: 'bg-primary'   },
  Sales:             { bg: 'bg-primary/10',   text: 'text-primary-text',   dot: 'bg-primary'   },
  'Human Resources': { bg: 'bg-primary/10',   text: 'text-primary-text',   dot: 'bg-primary'   },
  Finance:           { bg: 'bg-primary/10',   text: 'text-primary-text',   dot: 'bg-primary'   },
};
const getDept = (dept: string) =>
  DEPT_COLORS[dept] ?? { bg: 'bg-muted/10', text: 'text-muted-foreground', dot: 'bg-muted' };

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  return (
    <Badge variant={status as any}>
      {status === 'Leave' ? 'On Leave' : status}
    </Badge>
  );
};

const fmt = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const fmtShort = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Main Component ───────────────────────────────────────────────────────────

export const EmployeeProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { employees, attendance, leaveRequests } = useData();
  const { currentUser } = useAuth();

  const backPath = useMemo(() => {
    return currentUser?.role === 'hr' ? '/hr/employees' : '/admin/employees';
  }, [currentUser]);

  const emp = useMemo(() => employees.find(e => e.id === id), [employees, id]);

  const empAttendance = useMemo(() =>
    attendance
      .filter(a => a.employee_id === emp?.employee_id)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [attendance, emp]
  );

  const empLeaves = useMemo(() =>
    leaveRequests
      .filter(l => l.employee_id === emp?.employee_id)
      .sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [leaveRequests, emp]
  );

  const stats = useMemo(() => {
    const present  = empAttendance.filter(a => a.status === 'Present').length;
    const absent   = empAttendance.filter(a => a.status === 'Absent').length;
    const halfDay  = empAttendance.filter(a => a.status === 'Half Day').length;
    const leave    = empAttendance.filter(a => a.status === 'Leave').length;
    const total    = present + absent + halfDay + leave;
    const rate     = total > 0 ? Math.round(((present + halfDay * 0.5) / total) * 100) : 0;
    const avgHours = empAttendance.filter(a => a.working_hours).reduce((s, a) => s + Number(a.working_hours || 0), 0) /
                     (empAttendance.filter(a => a.working_hours).length || 1);
    return { present, absent, halfDay, leave, total, rate, avgHours: avgHours.toFixed(1) };
  }, [empAttendance]);

  const tenure = useMemo(() => {
    if (!emp?.join_date) return '—';
    const joined = new Date(emp.join_date);
    const now = new Date();
    const months = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth());
    const years = Math.floor(months / 12);
    const rem   = months % 12;
    if (years === 0) return `${rem} month${rem !== 1 ? 's' : ''}`;
    if (rem === 0)   return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years}y ${rem}m`;
  }, [emp]);

  if (!emp) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <AlertCircle className="h-10 w-10 opacity-40" />
        <p className="font-medium">Employee not found.</p>
        <button onClick={() => navigate(backPath)}
          className="text-sm text-primary font-semibold hover:underline">
          ← Back to Directory
        </button>
      </div>
    );
  }

  const grad = getGradient(emp.name);
  const dept = getDept(emp.department);
  const recentRecords = empAttendance.slice(0, 15);

  return (
    <div className="space-y-6">

      {/* ── Back button + breadcrumb ──────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </button>
        <span className="text-border">/</span>
        <span className="text-sm font-semibold text-foreground/80">{emp.name}</span>
      </div>

      {/* ── Hero banner + identity card ───────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden border border-border shadow-card bg-card">
        {/* Gradient banner */}
        <div className={`h-36 bg-gradient-to-r ${grad} relative`}>
          {emp.role === 'admin' && (
            <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-card/90 text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Super Admin
            </span>
          )}
          {emp.role === 'hr' && (
            <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-card/90 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-3.5 w-3.5" /> HR Manager
            </span>
          )}
        </div>

        <div className="px-6 pb-6">
          {/* Avatar overlapping banner */}
          <div className={`-mt-14 mb-4 h-24 w-24 rounded-2xl bg-gradient-to-br ${grad} text-white text-3xl font-bold flex items-center justify-center ring-4 ring-card shadow-xl`}>
            {getInitials(emp.name)}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display">{emp.name}</h1>
              <p className="text-muted-foreground mt-0.5">{emp.designation}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${dept.bg} ${dept.text}`}>
                  <span className={`h-2 w-2 rounded-full ${dept.dot}`} />
                  {emp.department}
                </span>
                <StatusBadge status={emp.current_status} />
              </div>
            </div>

            {/* Key info pills */}
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/5 border border-border">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Joined</p>
                  <p className="text-foreground/80 font-semibold text-xs">{emp.join_date ? fmtShort(emp.join_date) : '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/5 border border-border">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Tenure</p>
                  <p className="text-foreground/80 font-semibold text-xs">{tenure}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contact info row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Mail,      label: 'Email',       value: emp.email },
          { icon: Building2, label: 'Department',  value: emp.department },
          { icon: Briefcase, label: 'Designation', value: emp.designation },
          { icon: User,      label: 'Employee ID', value: emp.employee_id, mono: true },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="h-9 w-9 rounded-lg bg-muted/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{item.label}</p>
                <p className={`text-foreground font-semibold text-sm truncate ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Attendance stats ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" /> Attendance Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Attendance Rate', value: `${stats.rate}%`,        bg: 'bg-primary/10',  text: 'text-primary',  icon: TrendingUp    },
            { label: 'Present Days',    value: stats.present,            bg: 'bg-[var(--calendar-present-bg)]', text: 'text-[var(--calendar-present-text)]', icon: CheckCircle2  },
            { label: 'Absent Days',     value: stats.absent,             bg: 'bg-[var(--calendar-absent-bg)]',    text: 'text-[var(--calendar-absent-text)]',   icon: XCircle       },
            { label: 'Half Days',       value: stats.halfDay,            bg: 'bg-[var(--calendar-halfday-bg)]',   text: 'text-[var(--calendar-halfday-text)]',  icon: Clock3        },
            { label: 'Leave Days',      value: stats.leave,              bg: 'bg-[var(--calendar-leave-bg)]',    text: 'text-[var(--calendar-leave-text)]',   icon: CalendarDays  },
            { label: 'Avg Hours/Day',   value: `${stats.avgHours}h`,     bg: 'bg-[var(--calendar-holiday-bg)]',  text: 'text-[var(--calendar-holiday-text)]', icon: Clock3        },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`rounded-xl ${s.bg} p-4 flex flex-col gap-2 border border-border shadow-card`}>
                <Icon className={`h-5 w-5 ${s.text}`} />
                <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground font-medium leading-tight">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Two-column: Recent Attendance + Leave History ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Attendance (2/3 width) */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Recent Attendance
            </h3>
            <span className="text-xs text-muted-foreground">Last {recentRecords.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/5 border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Check In</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Check Out</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentRecords.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">No attendance records found.</td></tr>
                ) : (
                  recentRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{fmtShort(rec.date)}</td>
                      <td className="px-5 py-3"><StatusBadge status={rec.status} /></td>
                      <td className="px-5 py-3 font-mono text-muted-foreground text-xs">
                        {rec.check_in
                          ? <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[var(--calendar-present-text)]" />{rec.check_in.slice(0, 5)}</span>
                          : <span className="text-muted-foreground/30">—</span>}
                      </td>
                      <td className="px-5 py-3 font-mono text-muted-foreground text-xs">
                        {rec.check_out
                          ? <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[var(--calendar-absent-text)]" />{rec.check_out.slice(0, 5)}</span>
                          : rec.check_in ? <span className="text-[var(--calendar-leave-text)] text-xs font-semibold">Active ●</span>
                          : <span className="text-muted-foreground/30">—</span>}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {rec.working_hours != null && Number(rec.working_hours) > 0
                          ? <span className="font-semibold">{Number(rec.working_hours).toFixed(2)}h</span>
                          : <span className="text-muted-foreground/30">—</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave History (1/3 width) */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" /> Leave History
            </h3>
          </div>
          <div className="divide-y divide-border">
            {empLeaves.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">No leave records found.</div>
            ) : (
              empLeaves.map(lv => (
                <div key={lv.id} className="px-5 py-4 hover:bg-muted/5 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-foreground text-sm">{lv.leave_type}</p>
                    <Badge variant={lv.status as any}>
                      {lv.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {fmtShort(lv.start_date)}
                    {lv.start_date !== lv.end_date && <> → {fmtShort(lv.end_date)}</>}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
