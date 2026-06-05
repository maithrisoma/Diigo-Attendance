import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Badge } from '../../components/ui/Badge';
import { LiveCalendar } from '../../components/ui/LiveCalendar';
import {
  Users, UserCheck, UserX, PlaneTakeoff, TrendingUp, Clock,
  Briefcase, Plus, FileText, Globe,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = value / (800 / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { clearInterval(timer); setDisplay(value); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}</span>;
};

const LilacKPI: React.FC<{
  label: string; value: number; sub: string;
  icon: React.ReactNode; accent?: string;
}> = ({ label, value, sub, icon, accent = '#8B5CF6' }) => (
  <div
    className="glass-card p-6 flex flex-col gap-4 hover:-translate-y-1 transition-all duration-300"
    style={{ borderColor: 'rgba(216,180,254,0.5)' }}
  >
    <div className="flex justify-between items-start">
      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#9879E9' }}>
        {label}
      </span>
      <span
        className="p-2 rounded-xl"
        style={{ background: `${accent}18`, color: accent }}
      >
        {icon}
      </span>
    </div>
    <div>
      <h3 className="text-3xl font-black tracking-tight" style={{ color: accent }}>
        <AnimatedCounter value={value} />
      </h3>
      <p className="text-xs mt-1" style={{ color: '#C4B5FD' }}>{sub}</p>
    </div>
  </div>
);

export const AdminDashboard: React.FC = () => {
  const { employees, attendance, leaveRequests, activities, holidays } = useData();
  const todayStr = new Date().toISOString().split('T')[0];

  const attendanceByDate = useMemo(() => {
    const map: Record<string, { status: string }> = {};
    attendance.forEach(a => { map[a.date] = { status: a.status }; });
    return map;
  }, [attendance]);

  const holidayByDate = useMemo(() => {
    const map: Record<string, string> = {};
    holidays.forEach(h => { map[h.holiday_date] = h.holiday_name; });
    return map;
  }, [holidays]);

  const stats = useMemo(() => {
    const total = employees.length;
    const todayRecords = attendance.filter(a => a.date === todayStr);
    let present = 0, absent = 0, leave = 0, late = 0, remote = 0;
    employees.forEach(emp => {
      const rec = todayRecords.find(r => r.employee_id === emp.employee_id);
      if (rec) {
        if (rec.status === 'Present' || rec.status === 'Half Day') {
          present++;
          if (rec.check_in && rec.check_in > '09:15:00') late++;
          if (emp.department === 'Engineering' || emp.department === 'Design') remote++;
        } else if (rec.status === 'Leave') leave++;
        else absent++;
      } else absent++;
    });
    return { total, present, absent, leave, late, remote, attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0 };
  }, [employees, attendance, todayStr]);

  const chartData = useMemo(() => {
    const data: Array<{ name: string; Present: number; Absent: number }> = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdays: Date[] = [];
    let offset = 0;
    while (weekdays.length < 7) {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      if (d.getDay() !== 0 && d.getDay() !== 6) weekdays.unshift(d);
      offset++;
    }
    weekdays.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayRecords = attendance.filter(a => a.date === dateStr);
      let present = 0, absent = 0;
      employees.forEach(emp => {
        const rec = dayRecords.find(r => r.employee_id === emp.employee_id);
        if (rec && (rec.status === 'Present' || rec.status === 'Half Day')) present++;
        else absent++;
      });
      data.push({ name: dayNames[date.getDay()], Present: present, Absent: absent });
    });
    return data;
  }, [employees, attendance]);

  const liveStatusList = useMemo(() => {
    const todayRecords = attendance.filter(a => a.date === todayStr);
    return employees.map(emp => {
      const rec = todayRecords.find(r => r.employee_id === emp.employee_id);
      return { ...emp, status: rec ? rec.status : 'Absent', checkIn: rec?.check_in ?? null, checkOut: rec?.check_out ?? null };
    }).slice(0, 5);
  }, [employees, attendance, todayStr]);

  const getActivityIcon = (type: string) => {
    const iconStyle = (bg: string) => ({
      background: bg, width: 28, height: 28, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    });
    switch (type) {
      case 'check_in':    return <div style={iconStyle('#EDE9FE')}><UserCheck className="h-3.5 w-3.5" style={{ color: '#8B5CF6' }} /></div>;
      case 'check_out':   return <div style={iconStyle('#F2EBFF')}><Clock className="h-3.5 w-3.5" style={{ color: '#9879E9' }} /></div>;
      case 'leave_approve': return <div style={iconStyle('#DDD6FE')}><Briefcase className="h-3.5 w-3.5" style={{ color: '#7C3AED' }} /></div>;
      case 'leave_reject':  return <div style={iconStyle('#EDE9FE')}><UserX className="h-3.5 w-3.5" style={{ color: '#6D28D9' }} /></div>;
      default:            return <div style={iconStyle('#F2EBFF')}><Users className="h-3.5 w-3.5" style={{ color: '#A78BFA' }} /></div>;
    }
  };

  const pendingLeaves = leaveRequests.filter(r => r.status === 'Pending').length;

  return (
    <div className="space-y-8 pb-12 animate-fadeInUp">

      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 60%, #C4B5FD 100%)',
          boxShadow: '0 12px 48px rgba(124,58,237,0.30)',
        }}
      >
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-24 h-32 w-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', filter: 'blur(20px)' }} />

        <div className="relative z-10 text-white space-y-2">
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.20)', border: '1px solid rgba(255,255,255,0.30)' }}
          >
            Admin Dashboard
          </span>
          <h2 className="text-2xl font-black tracking-tight" style={{ color: '#fff' }}>
            Welcome back, HR Director 👋
          </h2>
          <p className="text-sm opacity-85">
            {stats.attendanceRate}% attendance today · {stats.present} of {stats.total} staff present
          </p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10">
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.40)' }}
          >
            <Plus className="h-4 w-4" /> Add Employee
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)' }}
          >
            <FileText className="h-4 w-4" /> Generate Report
          </button>
        </div>
      </div>

      {/* Pending alert */}
      {pendingLeaves > 0 && (
        <div
          className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold"
          style={{ background: 'rgba(237,233,254,0.8)', border: '1.5px solid #C4B5FD', color: '#6D28D9' }}
        >
          <PlaneTakeoff className="h-4 w-4" style={{ color: '#8B5CF6' }} />
          <span>{pendingLeaves} leave request{pendingLeaves > 1 ? 's' : ''} pending your approval</span>
        </div>
      )}

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <LilacKPI label="Total Staff" value={stats.total} sub="Full-time accounts" icon={<Users className="h-4 w-4" />} accent="#6D28D9" />
        <LilacKPI label="Present Today" value={stats.present} sub="Active in office" icon={<UserCheck className="h-4 w-4" />} accent="#7C3AED" />
        <LilacKPI label="Late Check-ins" value={stats.late} sub="After 09:15 AM" icon={<Clock className="h-4 w-4" />} accent="#A78BFA" />
        <LilacKPI label="Out of Office" value={stats.absent} sub="Unregistered today" icon={<UserX className="h-4 w-4" />} accent="#9879E9" />
        <LilacKPI label="Remote Active" value={stats.remote} sub="Working remotely" icon={<Globe className="h-4 w-4" />} accent="#8B5CF6" />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Area Chart */}
        <div className="glass-card lg:col-span-8 overflow-hidden">
          <div
            className="px-6 py-4 flex items-center justify-between border-b"
            style={{ borderColor: 'rgba(216,180,254,0.4)', background: 'rgba(242,235,255,0.5)' }}
          >
            <div>
              <h3 className="font-bold text-sm" style={{ color: '#4C1D95' }}>Weekly Attendance Analytics</h3>
              <p className="text-xs mt-0.5" style={{ color: '#9879E9' }}>Historical workforce attendance</p>
            </div>
            <span
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: '#EDE9FE', color: '#7C3AED' }}
            >
              <TrendingUp className="h-3.5 w-3.5" /> Live
            </span>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C4B5FD" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#C4B5FD" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDE9FE" />
                  <XAxis dataKey="name" stroke="#C4B5FD" fontSize={11} tickLine={false} />
                  <YAxis stroke="#C4B5FD" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)', borderColor: '#D8B4FE',
                      color: '#4C1D95', borderRadius: 16, fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="Present" stroke="#8B5CF6" fillOpacity={1} fill="url(#gradPresent)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="Absent" stroke="#C4B5FD" fillOpacity={1} fill="url(#gradAbsent)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="glass-card lg:col-span-4 flex flex-col" style={{ maxHeight: 380 }}>
          <div
            className="px-5 py-4 flex items-center justify-between border-b flex-shrink-0"
            style={{ borderColor: 'rgba(216,180,254,0.4)', background: 'rgba(242,235,255,0.5)' }}
          >
            <h3 className="font-bold text-sm" style={{ color: '#4C1D95' }}>Activity Feed</h3>
            <span className="h-2 w-2 rounded-full animate-ping" style={{ background: '#8B5CF6' }} />
          </div>
          <div className="overflow-y-auto flex-1 divide-y" style={{ borderColor: 'rgba(216,180,254,0.3)' }}>
            {activities.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: '#C4B5FD' }}>No recent activities.</div>
            ) : (
              activities.map(act => (
                <div key={act.id} className="p-4 flex gap-3 hover:bg-lilac-50 transition-colors">
                  {getActivityIcon(act.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed font-medium" style={{ color: '#4C1D95' }}>{act.message}</p>
                    <div className="flex justify-between items-center mt-1 text-[10px]" style={{ color: '#C4B5FD' }}>
                      <span>{act.user_name}</span>
                      <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Staff Panel */}
        <div className="glass-card lg:col-span-8 overflow-hidden">
          <div
            className="px-6 py-4 flex items-center justify-between border-b"
            style={{ borderColor: 'rgba(216,180,254,0.4)', background: 'rgba(242,235,255,0.5)' }}
          >
            <div>
              <h3 className="font-bold text-sm" style={{ color: '#4C1D95' }}>Live Staff Status</h3>
              <p className="text-xs mt-0.5" style={{ color: '#9879E9' }}>Real-time presence tracking</p>
            </div>
            <Badge variant="secondary">✓ Synced</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-lilac">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {liveStatusList.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#A78BFA,#8B5CF6)' }}
                        >
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <span className="font-semibold block" style={{ color: '#4C1D95' }}>{emp.name}</span>
                          <span className="text-[10px]" style={{ color: '#9879E9' }}>{emp.designation}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#6D5A9C' }}>{emp.department}</td>
                    <td className="font-mono text-[11px]">{emp.checkIn || '—'}</td>
                    <td className="font-mono text-[11px]">{emp.checkOut || '—'}</td>
                    <td className="text-right">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: emp.status === 'Present' ? '#EDE9FE' : emp.status === 'Leave' ? '#DDD6FE' : '#F2EBFF',
                          color: emp.status === 'Present' ? '#6D28D9' : emp.status === 'Leave' ? '#7C3AED' : '#9879E9',
                        }}
                      >
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calendar */}
        <div className="glass-card lg:col-span-4 overflow-hidden">
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: 'rgba(216,180,254,0.4)', background: 'rgba(242,235,255,0.5)' }}
          >
            <h3 className="font-bold text-sm" style={{ color: '#4C1D95' }}>Corporate Calendar</h3>
            <p className="text-xs mt-0.5" style={{ color: '#9879E9' }}>Attendance & schedule overview</p>
          </div>
          <div className="p-4">
            <LiveCalendar
              attendanceByDate={attendanceByDate}
              holidayByDate={holidayByDate}
              compact={false}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
