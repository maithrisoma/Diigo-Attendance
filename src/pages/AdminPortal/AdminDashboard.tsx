import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  Users,
  UserCheck,
  UserX,
  PlaneTakeoff,
  TrendingUp,
  Clock,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { employees, attendance, leaveRequests, activities } = useData();

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate Today's Stats
  const stats = useMemo(() => {
    const total = employees.length;
    
    // Find today's records
    const todayRecords = attendance.filter((a) => a.date === todayStr);

    let present = 0;
    let absent = 0;
    let leave = 0;

    employees.forEach((emp) => {
      const rec = todayRecords.find((r) => r.employee_id === emp.employee_id);
      if (rec) {
        if (rec.status === 'Present' || rec.status === 'Half Day') {
          present++;
        } else if (rec.status === 'Leave') {
          leave++;
        } else {
          absent++;
        }
      } else {
        // If no record, default to absent
        absent++;
      }
    });

    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      leave,
      attendanceRate,
    };
  }, [employees, attendance, todayStr]);

  // Donut Chart Data: Attendance Distribution
  const pieData = useMemo(() => {
    return [
      { name: 'Present', value: stats.present, color: '#8EB69B' },
      { name: 'Absent', value: stats.absent, color: '#E88B8B' },
      { name: 'Leave', value: stats.leave, color: '#F3C969' },
    ];
  }, [stats]);

  // Weekly Trend Area Chart Data
  const weeklyData = useMemo(() => {
    // Generate dates of the last 5 weekdays (excluding weekends)
    const data: Array<{ day: string; Present: number; Absent: number; Leave: number }> = [];
    const today = new Date('2026-06-03');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdays: Date[] = [];
    
    let offset = 0;
    while (weekdays.length < 5) {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        weekdays.unshift(d); // add to start to keep chronological
      }
      offset++;
    }

    weekdays.forEach((date) => {
      const dateStr = date.toISOString().split('T')[0];
      const dayRecords = attendance.filter((a) => a.date === dateStr);
      
      let present = 0;
      let absent = 0;
      let leave = 0;

      employees.forEach((emp) => {
        const rec = dayRecords.find((r) => r.employee_id === emp.employee_id);
        if (rec) {
          if (rec.status === 'Present' || rec.status === 'Half Day') present++;
          else if (rec.status === 'Leave') leave++;
          else absent++;
        } else {
          absent++;
        }
      });

      data.push({
        day: dayNames[date.getDay()],
        Present: present,
        Absent: absent,
        Leave: leave,
      });
    });

    return data;
  }, [employees, attendance]);

  // Department-wise Bar Chart Data
  const deptData = useMemo(() => {
    const depts = Array.from(new Set(employees.map((e) => e.department)));
    const todayRecords = attendance.filter((a) => a.date === todayStr);

    return depts.map((dept) => {
      const deptEmps = employees.filter((e) => e.department === dept);
      const totalInDept = deptEmps.length;
      let presentInDept = 0;

      deptEmps.forEach((emp) => {
        const rec = todayRecords.find((r) => r.employee_id === emp.employee_id);
        if (rec && (rec.status === 'Present' || rec.status === 'Half Day')) {
          presentInDept++;
        }
      });

      const rate = totalInDept > 0 ? Math.round((presentInDept / totalInDept) * 100) : 0;

      return {
        name: dept,
        'Attendance Rate (%)': rate,
        Employees: totalInDept,
      };
    });
  }, [employees, attendance, todayStr]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'check_in':
        return <div className="h-7 w-7 rounded-full bg-[#8EB69B]/20 text-[#8EB69B] flex items-center justify-center"><UserCheck className="h-4 w-4" /></div>;
      case 'check_out':
        return <div className="h-7 w-7 rounded-full bg-[#235347]/20 text-[#235347] flex items-center justify-center"><Clock className="h-4 w-4" /></div>;
      case 'leave_approve':
        return <div className="h-7 w-7 rounded-full bg-[#87B5FF]/20 text-[#87B5FF] flex items-center justify-center"><Briefcase className="h-4 w-4" /></div>;
      case 'leave_reject':
        return <div className="h-7 w-7 rounded-full bg-[#E88B8B]/20 text-[#E88B8B] flex items-center justify-center"><UserX className="h-4 w-4" /></div>;
      case 'employee_add':
      default:
        return <div className="h-7 w-7 rounded-full bg-[#F3C969]/20 text-[#F3C969] flex items-center justify-center"><Users className="h-4 w-4" /></div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
          Admin Overview
        </h1>
        <p className="text-xs text-muted-foreground">
          Monitor real-time office presence, track department statistics, and review action activities.
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Staff</span>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground font-display">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Registered in system</p>
          </CardContent>
        </Card>

        <Card className="border-[#8EB69B]/30 bg-[var(--calendar-present-bg)]/40 text-[#8EB69B]">
          <CardContent className="p-6 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">Present Today</span>
              <UserCheck className="h-5 w-5 text-[#8EB69B]" />
            </div>
            <p className="text-3xl font-bold text-[#8EB69B] font-display">{stats.present}</p>
            <p className="text-[10px] text-foreground/75 font-medium">Checked-in today</p>
          </CardContent>
        </Card>

        <Card className="border-[#E88B8B]/30 bg-[var(--calendar-absent-bg)]/40 text-[#E88B8B]">
          <CardContent className="p-6 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">Absent Today</span>
              <UserX className="h-5 w-5 text-[#E88B8B]" />
            </div>
            <p className="text-3xl font-bold text-[#E88B8B] font-display">{stats.absent}</p>
            <p className="text-[10px] text-foreground/75 font-medium">No clock-in logged</p>
          </CardContent>
        </Card>

        <Card className="border-[#F3C969]/30 bg-[var(--calendar-leave-bg)]/40 text-[#F3C969]">
          <CardContent className="p-6 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">On Leave</span>
              <PlaneTakeoff className="h-5 w-5 text-[#F3C969]" />
            </div>
            <p className="text-3xl font-bold text-[#F3C969] font-display">{stats.leave}</p>
            <p className="text-[10px] text-foreground/75 font-medium">Approved leave requests</p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/10 col-span-2 lg:col-span-1 text-primary">
          <CardContent className="p-6 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">Daily Rate</span>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-primary font-display">{stats.attendanceRate}%</p>
            <p className="text-[10px] text-primary/80 font-medium">Of staff active today</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Charts & Activity Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Visualizations Block */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Charts Row 1: Distribution & Weekly Trend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Donut Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Attendance Share</CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center relative">
                {stats.total === 0 ? (
                  <span className="text-xs text-muted-foreground">No data today</span>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Inner Center text */}
                    <div className="absolute flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold text-foreground">{stats.attendanceRate}%</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Present</p>
                    </div>
                  </>
                )}
              </CardContent>
              {/* Pie legend */}
              <div className="px-6 pb-4 flex justify-center space-x-6 text-xs font-semibold text-muted-foreground border-t border-border pt-2 bg-muted/5">
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#8EB69B]" /> Present ({stats.present})</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#E88B8B]" /> Absent ({stats.absent})</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#F3C969]" /> On Leave ({stats.leave})</div>
              </div>
            </Card>

            {/* Weekly Trend Area Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Weekly Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8EB69B" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8EB69B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                    <Area type="monotone" dataKey="Present" stroke="#8EB69B" fillOpacity={1} fill="url(#colorPresent)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>

          {/* Department Attendance Rate Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Department-wise Presence</CardTitle>
            </CardHeader>
            <CardContent className="h-60 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                  <Bar dataKey="Attendance Rate (%)" fill="#8EB69B" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>

        {/* Dynamic Activity Log Sidebar Panel */}
        <Card className="flex flex-col h-full xl:max-h-[580px] overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/5 py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Recent Activity Log</CardTitle>
            <Badge variant="outline" className="text-[10px] font-bold">Live Stream</Badge>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1 divide-y divide-border">
            {activities.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
                No recent activity logged.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="p-4 hover:bg-muted/10 transition-colors flex gap-3 items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(act.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs text-foreground leading-relaxed font-semibold">
                      {act.message}
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                      <span>By: {act.user_name}</span>
                      <span>
                        {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
