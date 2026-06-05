import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../components/ui/Toast';
import { Badge } from '../../components/ui/Badge';
import {
  Check,
  X,
  Plane,
  Clock,
  Users,
  CalendarCheck,
  CalendarX,
  Timer,
  Search,
} from 'lucide-react';

export const LeaveManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { leaveRequests, employees, approveLeave, rejectLeave } = useData();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const leavesWithEmployee = useMemo(() => {
    return leaveRequests
      .map((req) => {
        const emp = employees.find((e) => e.employee_id === req.employee_id);
        return {
          ...req,
          employee_name: emp ? emp.name : 'Unknown Employee',
          department: emp ? emp.department : '--',
        };
      })
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [leaveRequests, employees]);

  const filteredLeaves = useMemo(() => {
    const byTab =
      activeTab === 'all'
        ? leavesWithEmployee
        : leavesWithEmployee.filter((l) => l.status.toLowerCase() === activeTab);
    if (!searchQuery.trim()) return byTab;
    const q = searchQuery.toLowerCase().trim();
    return byTab.filter(
      (l) =>
        l.employee_name.toLowerCase().includes(q) ||
        l.employee_id.toLowerCase().includes(q) ||
        l.leave_type.toLowerCase().includes(q)
    );
  }, [leavesWithEmployee, activeTab, searchQuery]);

  const pendingCount = leavesWithEmployee.filter((l) => l.status === 'Pending').length;
  const approvedCount = leavesWithEmployee.filter((l) => l.status === 'Approved').length;
  const rejectedCount = leavesWithEmployee.filter((l) => l.status === 'Rejected').length;

  const handleApprove = (id: string, name: string) => {
    if (!currentUser) return;
    approveLeave(id, currentUser.name);
    toast(`Approved leave request for ${name}`, 'success');
  };

  const handleReject = (id: string, name: string) => {
    if (!currentUser) return;
    rejectLeave(id, currentUser.name);
    toast(`Rejected leave request for ${name}`, 'success');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="Present" className="font-semibold text-xs px-2.5 py-0.5">Approved</Badge>;
      case 'Rejected':
        return <Badge variant="Absent" className="font-semibold text-xs px-2.5 py-0.5">Rejected</Badge>;
      default:
        return <Badge variant="Leave" className="font-semibold text-xs px-2.5 py-0.5">Pending</Badge>;
    }
  };

  const tabs = [
    { id: 'all', label: 'All Requests', count: leavesWithEmployee.length },
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'approved', label: 'Approved', count: approvedCount },
    { id: 'rejected', label: 'Rejected', count: rejectedCount },
  ];

  if (!currentUser) return null;

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const daysBetween = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            Leave Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track employee leave requests, approve or reject pending submissions.
          </p>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: leavesWithEmployee.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Pending Review', value: pendingCount, icon: Timer, color: 'text-amber-600', bg: 'bg-amber-500/10' },
          { label: 'Approved', value: approvedCount, icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
          { label: 'Rejected', value: rejectedCount, icon: CalendarX, color: 'text-rose-600', bg: 'bg-rose-500/10' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 shadow-sm"
          >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${kpi.bg}`}>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground leading-none">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Tab Toolbar ── */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm">
        {/* Tabs */}
        <div className="flex gap-1 bg-muted/10 p-1 rounded-lg border border-border flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                activeTab === t.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                    activeTab === t.id
                      ? 'bg-white/25 text-white'
                      : t.id === 'pending'
                      ? 'bg-amber-500/20 text-amber-600'
                      : 'bg-muted/20 text-muted-foreground'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, ID, or leave type…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-border bg-muted/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
      </div>

      {/* ── Leave Requests Table ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden text-foreground">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-4 px-6">Employee</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Leave Type</th>
                <th className="py-4 px-6">Duration</th>
                <th className="py-4 px-6">Dates</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-muted-foreground text-xs">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-muted/5 transition-colors">
                    {/* Employee */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {leave.employee_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground leading-tight">{leave.employee_name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{leave.employee_id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-4 px-6 text-muted-foreground text-xs font-medium">
                      {leave.department}
                    </td>

                    {/* Leave Type */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Plane className="h-3.5 w-3.5 text-primary" />
                        {leave.leave_type}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {daysBetween(leave.start_date, leave.end_date)}{' '}
                        {daysBetween(leave.start_date, leave.end_date) === 1 ? 'day' : 'days'}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="py-4 px-6 text-xs text-muted-foreground font-mono">
                      {fmtDate(leave.start_date)}{' '}
                      <span className="text-border mx-1">→</span>{' '}
                      {fmtDate(leave.end_date)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 text-center">{getStatusBadge(leave.status)}</td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      {leave.status === 'Pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(leave.id, leave.employee_name)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(leave.id, leave.employee_name)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20 transition"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredLeaves.length > 0 && (
          <div className="border-t border-border px-6 py-3 flex items-center justify-between text-xs text-muted-foreground bg-muted/5">
            <span>
              Showing <span className="font-semibold text-foreground">{filteredLeaves.length}</span> requests
            </span>
            <span className="font-semibold text-primary">
              {pendingCount} Pending · {approvedCount} Approved · {rejectedCount} Rejected
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
