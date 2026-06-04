import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../components/ui/Toast';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Send,
  X,
  PlaneTakeoff,
  Hourglass,
  TrendingUp,
  CalendarCheck,
  Info,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const LEAVE_TYPES = [
  'Annual Leave',
  'Sick Leave',
  'Casual Leave',
  'Maternity / Paternity Leave',
  'Unpaid Leave',
  'Compensatory Leave',
];

const LEAVE_TYPE_META: Record<string, { color: string; bg: string; light: string }> = {
  'Annual Leave':               { color: 'text-[#235347]',    bg: 'bg-[#235347]',    light: 'bg-[#235347]/10' },
  'Sick Leave':                 { color: 'text-[#EF4444]',    bg: 'bg-[#EF4444]',    light: 'bg-[#FEE2E2]'    },
  'Casual Leave':               { color: 'text-[#14B8A6]',    bg: 'bg-[#14B8A6]',    light: 'bg-[#14B8A6]/10' },
  'Maternity / Paternity Leave':{ color: 'text-[#3B82F6]',    bg: 'bg-[#3B82F6]',    light: 'bg-[#DBEAFE]'    },
  'Unpaid Leave':               { color: 'text-[#64748B]',    bg: 'bg-[#64748B]',    light: 'bg-[#F1F5F9]'    },
  'Compensatory Leave':         { color: 'text-[#F59E0B]',    bg: 'bg-[#F59E0B]',    light: 'bg-[#FEF3C7]'    },
};

const STATUS_CFG = {
  Pending:  { icon: Hourglass,    cls: 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/40'  },
  Approved: { icon: CheckCircle2, cls: 'bg-[#DCFCE7] text-[#166534] border-[#22C55E]/40'  },
  Rejected: { icon: XCircle,      cls: 'bg-[#FEE2E2] text-[#991B1B] border-[#EF4444]/40'  },
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

const daysBetween = (start: string, end: string) =>
  Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG] ?? STATUS_CFG.Pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const EmployeeLeave: React.FC = () => {
  const { currentUser } = useAuth();
  const { leaveRequests, applyForLeave } = useData();
  const { toast } = useToast();

  const today = new Date().toISOString().split('T')[0];

  const [modalOpen, setModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0]);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate]     = useState(today);
  const [reason, setReason]       = useState('');
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const myLeaves = useMemo(() =>
    leaveRequests
      .filter(l => l.employee_id === currentUser?.employee_id)
      .sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [leaveRequests, currentUser]
  );

  const stats = useMemo(() => {
    const approved = myLeaves.filter(l => l.status === 'Approved');
    const totalDaysUsed = approved.reduce((s, l) => s + daysBetween(l.start_date, l.end_date), 0);
    return {
      total:        myLeaves.length,
      pending:      myLeaves.filter(l => l.status === 'Pending').length,
      approved:     approved.length,
      rejected:     myLeaves.filter(l => l.status === 'Rejected').length,
      totalDaysUsed,
    };
  }, [myLeaves]);

  // leave type breakdown
  const typeBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    myLeaves.forEach(l => { map[l.leave_type] = (map[l.leave_type] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [myLeaves]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!startDate) errs.startDate = 'Required';
    if (!endDate)   errs.endDate   = 'Required';
    if (endDate < startDate) errs.endDate = 'Must be on or after start date';
    if (startDate < today)   errs.startDate = 'Cannot apply for a past date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !currentUser) return;
    setSubmitting(true);
    setTimeout(() => {
      applyForLeave(currentUser.employee_id, leaveType, startDate, endDate);
      toast('Leave request submitted successfully!', 'success');
      setModalOpen(false);
      resetForm();
      setSubmitting(false);
    }, 600);
  };

  const resetForm = () => {
    setLeaveType(LEAVE_TYPES[0]);
    setStartDate(today);
    setEndDate(today);
    setReason('');
    setErrors({});
  };

  if (!currentUser) return null;

  const previewDays = startDate && endDate && endDate >= startDate ? daysBetween(startDate, endDate) : 0;
  const recentLeaves = myLeaves.slice(0, 6);

  return (
    <div className="space-y-5 text-left">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] font-display">Leave Requests</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Apply for leave and track your request status.</p>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition shadow-md"
        >
          <Plus className="h-4 w-4" />
          Apply for Leave
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BENTO GRID
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-[auto] gap-4">

        {/* ① Big hero stat — spans 2 cols × 2 rows - Styled in corporate brand Navy/Teal */}
        <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden bg-secondary text-white p-6 flex flex-col justify-between shadow-xl min-h-[200px] border border-secondary/30">
          <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-[#14B8A6]/20 blur-xl" />

          <div className="z-10">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 shadow-inner">
              <PlaneTakeoff className="h-6 w-6 text-white" />
            </div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">Total Leave Days Used</p>
            <p className="text-6xl font-bold mt-1 leading-none">{stats.totalDaysUsed}</p>
            <p className="text-white/70 text-sm mt-1">across {stats.approved} approved request{stats.approved !== 1 ? 's' : ''}</p>
          </div>

          <div className="z-10 flex items-center gap-3 pt-3 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-white/60 text-[10px] uppercase tracking-wide">Total</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-[#14B8A6]">{stats.pending}</p>
              <p className="text-white/60 text-[10px] uppercase tracking-wide">Pending</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.rejected}</p>
              <p className="text-white/60 text-[10px] uppercase tracking-wide">Rejected</p>
            </div>
          </div>
        </div>

        {/* ② Approved count card - Status specific styling */}
        <div className="rounded-2xl bg-[#DCFCE7] border border-[#22C55E]/40 p-5 flex flex-col justify-between shadow-sm">
          <CheckCircle2 className="h-7 w-7 text-[#22C55E] mb-3" />
          <div>
            <p className="text-3xl font-bold text-[#166534]">{stats.approved}</p>
            <p className="text-xs text-[#166534] font-semibold mt-0.5">Approved</p>
          </div>
        </div>

        {/* ③ Pending count card - Status specific styling */}
        <div className="rounded-2xl bg-[#FEF3C7] border border-[#F59E0B]/40 p-5 flex flex-col justify-between shadow-sm">
          <Hourglass className="h-7 w-7 text-[#F59E0B] mb-3" />
          <div>
            <p className="text-3xl font-bold text-[#92400E]">{stats.pending}</p>
            <p className="text-xs text-[#92400E] font-semibold mt-0.5">Pending Review</p>
          </div>
        </div>

        {/* ④ Leave type breakdown - Progress bar highlights in Teal/Navy */}
        <div className="col-span-2 rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-secondary" />
            <h3 className="font-bold text-[#0F172A] text-sm">Leave Type Breakdown</h3>
          </div>
          {typeBreakdown.length === 0 ? (
            <p className="text-xs text-[#64748B] text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-2.5">
              {typeBreakdown.map(([type, count]) => {
                const meta = LEAVE_TYPE_META[type] ?? LEAVE_TYPE_META['Annual Leave'];
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`font-semibold ${meta.color}`}>{type}</span>
                      <span className="text-[#64748B]">{count} req · {pct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${meta.bg} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ⑤ Recent requests — spans full 4 cols */}
        <div className="col-span-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-secondary" />
              <h3 className="font-bold text-[#0F172A]">My Leave History</h3>
            </div>
            <span className="text-xs text-[#64748B]">{myLeaves.length} request{myLeaves.length !== 1 ? 's' : ''} total</span>
          </div>

          {myLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#64748B]">
              <PlaneTakeoff className="h-10 w-10 mb-3 opacity-30" />
              <p className="font-semibold text-sm">No leave requests yet</p>
              <p className="text-xs mt-1">Click <strong className="text-secondary">Apply for Leave</strong> to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#E2E8F0]">
              {recentLeaves.map(lv => {
                const meta = LEAVE_TYPE_META[lv.leave_type] ?? LEAVE_TYPE_META['Annual Leave'];
                const days = daysBetween(lv.start_date, lv.end_date);
                return (
                  <div key={lv.id} className="bg-white p-5 hover:bg-[#F8FAFC] transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className={`h-9 w-9 rounded-xl ${meta.light} flex items-center justify-center flex-shrink-0`}>
                        <CalendarDays className={`h-4 w-4 ${meta.color}`} />
                      </div>
                      <StatusBadge status={lv.status} />
                    </div>
                    <p className="font-bold text-[#0F172A] text-sm">{lv.leave_type}</p>
                    <p className="text-xs text-[#64748B] mt-1">
                      {fmtDate(lv.start_date)}
                      {lv.start_date !== lv.end_date && <> — {fmtDate(lv.end_date)}</>}
                    </p>
                    <div className={`mt-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.light} ${meta.color}`}>
                      {days} day{days !== 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ⑥ Info banner — styled in corporate Teal/Navy tints */}
        <div className="col-span-4 flex items-start gap-3 rounded-2xl border border-[#CBD5E1] bg-[#F1F5F9] px-5 py-4">
          <Info className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[#0F172A] leading-relaxed">
            <span className="font-bold">How it works: </span>
            Submit your leave request below. HR will review and approve or reject within 1–2 business days. Approved leaves automatically update your attendance calendar.
          </div>
        </div>

      </div>

      {/* ── Apply Leave Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border border-[#E2E8F0]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F1F5F9]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Send className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0F172A]">Apply for Leave</h3>
                  <p className="text-xs text-[#64748B]">Fill in the details and submit</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="h-8 w-8 rounded-full hover:bg-slate-200 flex items-center justify-center transition">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

              {/* Leave type selector */}
              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1.5 uppercase tracking-wide">Leave Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {LEAVE_TYPES.map(t => {
                    const meta = LEAVE_TYPE_META[t];
                    const active = leaveType === t;
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setLeaveType(t)}
                        className={`text-left px-3 py-2 rounded-xl border text-xs font-semibold transition-all
                          ${active ? `${meta.light} ${meta.color} border-secondary shadow-sm` : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#64748B] mb-1.5 uppercase tracking-wide">Start Date</label>
                  <input type="date" value={startDate} min={today}
                    onChange={e => { setStartDate(e.target.value); if (e.target.value > endDate) setEndDate(e.target.value); }}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition
                      ${errors.startDate ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}
                  />
                  {errors.startDate && <p className="text-[11px] text-rose-500 mt-1">{errors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#64748B] mb-1.5 uppercase tracking-wide">End Date</label>
                  <input type="date" value={endDate} min={startDate}
                    onChange={e => setEndDate(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition
                      ${errors.endDate ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}
                  />
                  {errors.endDate && <p className="text-[11px] text-rose-500 mt-1">{errors.endDate}</p>}
                </div>
              </div>

              {/* Duration preview */}
              {previewDays > 0 && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${(LEAVE_TYPE_META[leaveType] ?? LEAVE_TYPE_META['Annual Leave']).light} border-[#CBD5E1]`}>
                  <CalendarDays className={`h-5 w-5 ${(LEAVE_TYPE_META[leaveType] ?? LEAVE_TYPE_META['Annual Leave']).color}`} />
                  <div>
                    <p className={`text-sm font-bold ${(LEAVE_TYPE_META[leaveType] ?? LEAVE_TYPE_META['Annual Leave']).color}`}>
                      {previewDays} day{previewDays !== 1 ? 's' : ''} of {leaveType}
                    </p>
                    <p className="text-xs text-[#64748B]">{fmtDate(startDate)}{startDate !== endDate && ` → ${fmtDate(endDate)}`}</p>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1.5 uppercase tracking-wide">
                  Reason <span className="font-normal normal-case text-slate-400">(optional)</span>
                </label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                  placeholder="Brief description of your leave reason…"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition resize-none"
                />
              </div>

              {/* Footer buttons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#CBD5E1] text-sm font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-60">
                  <Send className="h-4 w-4" />
                  {submitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
