import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DatePicker } from '../../components/ui/DatePicker';
import {
  Search,
  RefreshCw,
  Clock,
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  Building2,
  Mail,
} from 'lucide-react';
import { AttendanceStatus } from '../../types';

export const AttendanceRegistry: React.FC = () => {
  const { employees, attendance, holidays } = useData();

  const [selectedDate, setSelectedDate] = useState('2026-06-03');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const departments = useMemo(() => {
    const list = Array.from(new Set(employees.map((e) => e.department)));
    return [{ value: 'all', label: 'All Departments' }, ...list.map((d) => ({ value: d, label: d }))];
  }, [employees]);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'Present', label: 'Present' },
    { value: 'Absent', label: 'Absent' },
    { value: 'Half Day', label: 'Half Day' },
    { value: 'Leave', label: 'On Leave' },
  ];

  const registryRecords = useMemo(() => {
    const targetDate = selectedDate;
    const targetDateObj = new Date(targetDate);
    const dayOfWeek = targetDateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holiday = holidays.find((h) => h.holiday_date === targetDate);
    const dayRecords = attendance.filter((a) => a.date === targetDate);

    const mapped = employees.map((emp) => {
      const rec = dayRecords.find((r) => r.employee_id === emp.employee_id);
      let checkIn: string | null = null;
      let checkOut: string | null = null;
      let workingHours: number | null = null;

      if (rec) {
        checkIn = rec.check_in;
        checkOut = rec.check_out;
        workingHours = rec.working_hours;
      }

      return {
        id: `reg_${emp.employee_id}_${targetDate}`,
        employee_name: emp.name,
        employee_id: emp.employee_id,
        department: emp.department,
        check_in: checkIn,
        check_out: checkOut,
        working_hours: workingHours,
        status: rec
          ? rec.status
          : holiday
          ? ('Leave' as AttendanceStatus)
          : ('Absent' as AttendanceStatus),
        isHoliday: !!holiday,
        holidayName: holiday?.holiday_name,
        isWeekend,
      };
    });

    return mapped.filter((rec) => {
      const matchesSearch =
        searchQuery === '' ||
        rec.employee_name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        rec.employee_id.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesDept = selectedDept === 'all' || rec.department === selectedDept;
      const matchesStatus = selectedStatus === 'all' || rec.status === selectedStatus;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, attendance, holidays, selectedDate, selectedDept, selectedStatus, searchQuery]);

  const handleResetFilters = () => {
    setSelectedDate('2026-06-03');
    setSelectedDept('all');
    setSelectedStatus('all');
    setSearchQuery('');
  };

  // KPI counts (unfiltered, based on full date)
  const allForDate = useMemo(() => {
    const holiday = holidays.find((h) => h.holiday_date === selectedDate);
    const dayRecords = attendance.filter((a) => a.date === selectedDate);
    return employees.map((emp) => {
      const rec = dayRecords.find((r) => r.employee_id === emp.employee_id);
      return rec
        ? rec.status
        : holiday
        ? 'Leave'
        : 'Absent';
    });
  }, [employees, attendance, holidays, selectedDate]);

  const kpiPresent = allForDate.filter((s) => s === 'Present').length;
  const kpiAbsent = allForDate.filter((s) => s === 'Absent').length;
  const kpiLeave = allForDate.filter((s) => s === 'Leave' || s === 'Half Day').length;

  const getStatusBadge = (rec: typeof registryRecords[0]) => {
    if (rec.isHoliday)
      return <Badge variant="Holiday" className="font-semibold text-xs px-2 py-0.5">Holiday</Badge>;
    if (rec.status === 'Present')
      return <Badge variant="Present" className="font-semibold text-xs px-2.5 py-0.5">Present</Badge>;
    if (rec.status === 'Half Day')
      return <Badge variant="Half Day" className="font-semibold text-xs px-2.5 py-0.5">Half Day</Badge>;
    if (rec.status === 'Leave')
      return <Badge variant="Leave" className="font-semibold text-xs px-2.5 py-0.5">On Leave</Badge>;
    return <Badge variant="Absent" className="font-semibold text-xs px-2.5 py-0.5">Absent</Badge>;
  };

  const fmtTime = (t: string | null) => {
    if (!t) return null;
    return new Date(`2000-01-01T${t}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            Attendance Registry
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            View daily check-in logs for all employee records. Filter by date, department, or status.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
          <CalendarDays className="h-3.5 w-3.5" />
          {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: employees.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Present', value: kpiPresent, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
          { label: 'Absent', value: kpiAbsent, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-500/10' },
          { label: 'Leave / Half Day', value: kpiLeave, icon: CalendarDays, color: 'text-amber-600', bg: 'bg-amber-500/10' },
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

      {/* ── Filter Toolbar ── */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row gap-3 shadow-sm flex-wrap">
        {/* Date Picker */}
        <div className="min-w-[160px]">
          <DatePicker label="Registry Date" value={selectedDate} onChange={(val) => setSelectedDate(val)} />
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <label className="text-xs font-semibold text-muted-foreground tracking-wide mb-1.5 block">
            Search Employee
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Name or Employee ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-border bg-muted/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
        </div>

        {/* Department */}
        <div className="min-w-[160px]">
          <Select label="Department" options={departments} value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} />
        </div>

        {/* Status */}
        <div className="min-w-[140px]">
          <Select label="Status" options={statusOptions} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} />
        </div>

        {/* Reset */}
        <div className="flex items-end">
          <button
            onClick={handleResetFilters}
            className="h-10 px-4 py-2 bg-muted/10 hover:bg-muted/20 text-foreground border border-border rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* ── Registry Table ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden text-foreground">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-4 px-6">Employee</th>
                <th className="py-4 px-6">Employee ID</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Check In</th>
                <th className="py-4 px-6">Check Out</th>
                <th className="py-4 px-6">Working Hrs</th>
                <th className="py-4 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {registryRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-muted-foreground text-xs">
                    No registry records matched your filters.
                  </td>
                </tr>
              ) : (
                registryRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-muted/5 transition-colors">
                    {/* Employee */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {rec.employee_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground leading-tight">{rec.employee_name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{rec.employee_id}</p>
                        </div>
                      </div>
                    </td>

                    {/* ID */}
                    <td className="py-4 px-6 font-mono text-xs text-muted-foreground">{rec.employee_id}</td>

                    {/* Department */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                        <Building2 className="h-3 w-3" />
                        {rec.department}
                      </span>
                    </td>

                    {/* Check In */}
                    <td className="py-4 px-6 font-mono text-xs">
                      {rec.check_in ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <Clock className="h-3.5 w-3.5" />
                          {fmtTime(rec.check_in)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--:--</span>
                      )}
                    </td>

                    {/* Check Out */}
                    <td className="py-4 px-6 font-mono text-xs">
                      {rec.check_out ? (
                        <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
                          <Clock className="h-3.5 w-3.5" />
                          {fmtTime(rec.check_out)}
                        </span>
                      ) : rec.check_in ? (
                        <span className="flex items-center gap-1 text-amber-500 font-semibold text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Active Shift
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--:--</span>
                      )}
                    </td>

                    {/* Working Hours */}
                    <td className="py-4 px-6 font-mono text-xs">
                      {rec.working_hours != null ? (
                        <span className="text-foreground font-semibold">{rec.working_hours.toFixed(1)}h</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 text-center">{getStatusBadge(rec)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {registryRecords.length > 0 && (
          <div className="border-t border-border px-6 py-3 flex items-center justify-between text-xs text-muted-foreground bg-muted/5">
            <span>Showing <span className="font-semibold text-foreground">{registryRecords.length}</span> of <span className="font-semibold text-foreground">{employees.length}</span> employees</span>
            <span className="font-semibold text-primary">{kpiPresent} Present · {kpiAbsent} Absent · {kpiLeave} Leave</span>
          </div>
        )}
      </div>
    </div>
  );
};
