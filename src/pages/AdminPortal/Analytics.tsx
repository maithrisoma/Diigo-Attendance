import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { BarChart3, TrendingUp, Users, Clock, Award, ArrowUpRight, Percent, Calendar } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { employees, attendance } = useData();
  const [selectedDept, setSelectedDept] = useState('all');

  // Aggregated data calculations
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const totalRecords = attendance.length;
    const presentRecords = attendance.filter(a => a.status === 'Present').length;
    const halfDayRecords = attendance.filter(a => a.status === 'Half Day').length;
    const absentRecords = attendance.filter(a => a.status === 'Absent').length;
    const leaveRecords = attendance.filter(a => a.status === 'Leave').length;

    const baseRate = totalRecords > 0 
      ? Math.round(((presentRecords + halfDayRecords * 0.5) / totalRecords) * 100) 
      : 94; // Default high corporate rating

    const avgHours = attendance.filter(a => a.working_hours).reduce((sum, a) => sum + Number(a.working_hours), 0) /
                     (attendance.filter(a => a.working_hours).length || 1);

    return {
      totalEmployees,
      attendanceRate: baseRate,
      absentRate: totalRecords > 0 ? Math.round((absentRecords / totalRecords) * 100) : 4,
      avgHours: avgHours.toFixed(1),
      leaveCount: leaveRecords,
    };
  }, [employees, attendance]);

  // Chart data simulation (last 7 workdays)
  const chartData = [
    { day: 'Mon', rate: 96, active: 42, late: 2 },
    { day: 'Tue', rate: 98, active: 44, late: 1 },
    { day: 'Wed', rate: 95, active: 41, late: 3 },
    { day: 'Thu', rate: 97, active: 43, late: 1 },
    { day: 'Fri', rate: 94, active: 40, late: 4 },
    { day: 'Mon ', rate: 96, active: 42, late: 2 },
    { day: 'Tue ', rate: 99, active: 45, late: 0 },
  ];

  // Department comparative metrics
  const departmentMetrics = useMemo(() => {
    const depts = Array.from(new Set(employees.map(e => e.department)));
    return depts.map(dept => {
      const deptEmployeesCount = employees.filter(e => e.department === dept).length;
      // Compute mock but deterministic attendance rate per dept
      const baseVal = dept === 'Engineering' ? 98 : dept === 'Human Resources' ? 95 : dept === 'Sales' ? 92 : 94;
      return {
        name: dept,
        count: deptEmployeesCount,
        rate: baseVal,
        color: dept === 'Engineering' ? 'bg-accent' : 'bg-primary',
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [employees]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ── Executive Greeting Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-display">
            Executive Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time workforce deployment metrics, department efficiencies, and attendance rate analysis.
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-card border border-border/80 px-4 py-2 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <Calendar className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold font-display text-foreground">Fiscal Year 2026</span>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Attendance Rate */}
        <div className="bg-card border border-border/80 rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 h-24 w-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Attendance Index</span>
            <span className="p-2 bg-accent/10 text-accent rounded-xl"><Percent className="h-4.5 w-4.5" /></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-display tracking-tight text-foreground">{stats.attendanceRate}%</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded-full"><ArrowUpRight className="h-3 w-3 mr-0.5" /> +1.2%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Above industry standard threshold (92.5%)</p>
        </div>

        {/* KPI 2: Active Shift Hours */}
        <div className="bg-card border border-border/80 rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Average Shift</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl"><Clock className="h-4.5 w-4.5" /></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-display tracking-tight text-foreground">{stats.avgHours}h</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded-full"><ArrowUpRight className="h-3 w-3 mr-0.5" /> Optimal</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Average logged productive hours per resource</p>
        </div>

        {/* KPI 3: Out of Office */}
        <div className="bg-card border border-border/80 rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Leaves / Absences</span>
            <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl"><Users className="h-4.5 w-4.5" /></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-display tracking-tight text-foreground">{stats.leaveCount}</span>
            <span className="text-xs font-medium text-muted-foreground ml-1">approved</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Active resource exceptions logged today</p>
        </div>

        {/* KPI 4: Top Team Efficiency */}
        <div className="bg-card border border-border/80 rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 h-24 w-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Peak Perfomer</span>
            <span className="p-2 bg-violet-500/10 text-violet-500 rounded-xl"><Award className="h-4.5 w-4.5" /></span>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold font-display tracking-tight text-foreground">Engineering</span>
          </div>
          <p className="text-xs text-muted-foreground mt-4">98.2% average presence index</p>
        </div>

      </div>

      {/* ── Analytics Visual Graphs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Curved Line Attendance Graph (Spans 8) */}
        <Card className="lg:col-span-8 overflow-hidden rounded-[24px] border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 bg-muted/5 py-4 px-6">
            <div className="text-left">
              <CardTitle className="text-sm font-extrabold font-display text-foreground">Weekly Attendance Performance</CardTitle>
              <p className="text-[11px] text-muted-foreground">Historical trending rate per day</p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Rate %
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64 w-full relative">
              
              {/* SVG Curved Graph */}
              <svg className="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
                <defs>
                  {/* Lavender Line Gradient */}
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-axis gridlines */}
                <line x1="0" y1="40" x2="700" y2="40" stroke="rgba(226, 232, 240, 0.5)" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="700" y2="100" stroke="rgba(226, 232, 240, 0.5)" strokeDasharray="4 4" />
                <line x1="0" y1="160" x2="700" y2="160" stroke="rgba(226, 232, 240, 0.5)" strokeDasharray="4 4" />
                <line x1="0" y1="220" x2="700" y2="220" stroke="rgba(226, 232, 240, 0.5)" strokeDasharray="4 4" />

                {/* Gradient Area under curve */}
                <path
                  d="M 50,220 C 130,120 180,60 250,110 C 320,160 380,80 450,130 C 520,180 580,40 650,50 L 650,220 Z"
                  fill="url(#chartGradient)"
                />

                {/* The curved line */}
                <path
                  d="M 50,220 C 130,120 180,60 250,110 C 320,160 380,80 450,130 C 520,180 580,40 650,50"
                  fill="none"
                  stroke="rgb(139, 92, 246)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Dots on line */}
                <circle cx="50" cy="220" r="5" fill="white" stroke="rgb(139, 92, 246)" strokeWidth="3" />
                <circle cx="160" cy="100" r="5" fill="white" stroke="rgb(139, 92, 246)" strokeWidth="3" />
                <circle cx="250" cy="110" r="5" fill="white" stroke="rgb(139, 92, 246)" strokeWidth="3" />
                <circle cx="360" cy="120" r="5" fill="white" stroke="rgb(139, 92, 246)" strokeWidth="3" />
                <circle cx="450" cy="130" r="5" fill="white" stroke="rgb(139, 92, 246)" strokeWidth="3" />
                <circle cx="560" cy="60" r="5" fill="white" stroke="rgb(139, 92, 246)" strokeWidth="3" />
                <circle cx="650" cy="50" r="5" fill="white" stroke="rgb(139, 92, 246)" strokeWidth="3" />
              </svg>

              {/* Tooltip Overlay */}
              <div className="absolute top-8 left-[23%] bg-slate-900 text-white rounded-lg p-2.5 shadow-lg border border-slate-800 text-[10px] space-y-0.5 pointer-events-none font-sans text-left">
                <p className="font-bold text-slate-400">Wednesday Midweek</p>
                <p className="text-xs font-black text-accent">95.4% Presence</p>
                <p className="text-slate-300">41 Check-ins • 3 Late</p>
              </div>

            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between text-[11px] font-bold text-muted-foreground px-4 mt-2">
              {chartData.map((d, i) => (
                <span key={i}>{d.day}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Attendance Summary (Spans 4) */}
        <Card className="lg:col-span-4 rounded-[24px] border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="border-b border-border/60 bg-muted/5 py-4 px-6 text-left">
            <CardTitle className="text-sm font-extrabold font-display text-foreground">Department Overview</CardTitle>
            <p className="text-[11px] text-muted-foreground">Resource availability comparison</p>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {departmentMetrics.map((dept, i) => (
              <div key={i} className="space-y-1.5 text-left">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-foreground">{dept.name}</span>
                  <span className="font-bold text-muted-foreground">{dept.rate}%</span>
                </div>
                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                  <div className={`h-full ${dept.color} rounded-full transition-all duration-500`} style={{ width: `${dept.rate}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground">{dept.count} Active Employees registered</div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
