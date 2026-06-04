import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { LiveCalendar } from '../../components/ui/LiveCalendar';
import {
  Calendar,
  Clock,
  Award,
  Newspaper,
  Sparkles,
  Users2,
  CalendarCheck,
  Check,
  TrendingUp,
  Info,
  CalendarDays
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { attendance, checkIn, checkOut, leaveRequests, holidays, employees } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [runningHoursStr, setRunningHoursStr] = useState('00:00:00');

  // Modal states
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [isPredictorOpen, setIsPredictorOpen] = useState(false);
  const [isTeammatesOpen, setIsTeammatesOpen] = useState(false);
  const [isShiftsOpen, setIsShiftsOpen] = useState(false);

  // Predictor modal states
  const [futureDaysPresent, setFutureDaysPresent] = useState(10);
  const [futureDaysAbsent, setFutureDaysAbsent] = useState(0);

  // Keep digital clock updating
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const myAttendance = useMemo(() => {
    if (!currentUser) return [];
    return attendance.filter(a => a.employee_id === currentUser.employee_id);
  }, [attendance, currentUser]);

  const myAttendanceByDate = useMemo(() => {
    const map: Record<string, { status: string }> = {};
    myAttendance.forEach(a => { map[a.date] = { status: a.status }; });
    return map;
  }, [myAttendance]);

  const holidayByDate = useMemo(() => {
    const map: Record<string, string> = {};
    holidays.forEach(h => { map[h.holiday_date] = h.holiday_name; });
    return map;
  }, [holidays]);

  const todayStr = new Date().toISOString().split('T')[0];

  const myAttendance = useMemo(() => {
    if (!currentUser) return [];
    return attendance.filter(a => a.employee_id === currentUser.employee_id);
  }, [attendance, currentUser]);

  // Build calendar lookup maps
  const myAttendanceByDate = useMemo(() => {
    const map: Record<string, { status: string }> = {};
    myAttendance.forEach(a => { map[a.date] = { status: a.status }; });
    return map;
  }, [myAttendance]);

  const holidayByDate = useMemo(() => {
    const map: Record<string, string> = {};
    holidays.forEach(h => { map[h.holiday_date] = h.holiday_name; });
    return map;
  }, [holidays]);

  // Find today's attendance record
  const todayRecord = attendance.find(
    (a) => a.employee_id === currentUser?.employee_id && a.date === todayStr
  );

  const isWeekend = currentTime.getDay() === 0 || currentTime.getDay() === 6;
  const todayHoliday = holidays.find((h) => h.holiday_date === todayStr);

  const hasCheckedIn = !!todayRecord?.check_in;
  const hasCheckedOut = !!todayRecord?.check_out;

  // Running timer for elapsed working hours
  useEffect(() => {
    if (!currentUser || !hasCheckedIn || hasCheckedOut || !todayRecord?.check_in) {
      setRunningHoursStr('00:00:00');
      return;
    }

    const calculateElapsed = () => {
      const checkInTimeStr = todayRecord.check_in!;
      const [inH, inM, inS] = checkInTimeStr.split(':').map(Number);
      
      const now = new Date();
      const checkInDate = new Date();
      checkInDate.setHours(inH, inM, inS || 0);

      let diffMs = now.getTime() - checkInDate.getTime();
      if (diffMs < 0) diffMs = 0;

      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);

      setRunningHoursStr(
        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    calculateElapsed();
    const timer = setInterval(calculateElapsed, 1000);
    return () => clearInterval(timer);
  }, [hasCheckedIn, hasCheckedOut, todayRecord, currentUser]);

  const handleCheckIn = () => {
    if (!currentUser) return;
    checkIn(currentUser.employee_id);
    toast('Successfully checked in today!', 'success');
  };

  const handleCheckOut = () => {
    if (!currentUser) return;
    checkOut(currentUser.employee_id);
    toast('Successfully checked out today!', 'success');
  };

  if (!currentUser) return null;

  // Calculate Dates for the Current Week (Mon to Fri)
  const getWeekDays = () => {
    const current = new Date();
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    
    const weekDays = [];
    for (let i = 0; i < 5; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      weekDays.push(nextDay);
    }
    return weekDays;
  };

  const weekDays = getWeekDays();

  // Find attendance status for a given date
  const getDayStatus = (date: Date) => {
    const dStr = date.toISOString().split('T')[0];
    const rec = attendance.find(a => a.employee_id === currentUser.employee_id && a.date === dStr);
    
    if (rec) {
      return rec.status; // 'Present', 'Absent', 'Half Day'
    }

    // Check if it's weekend
    const dayNum = date.getDay();
    if (dayNum === 0 || dayNum === 6) return 'Weekend';

    // Check if holiday
    const hol = holidays.find(h => h.holiday_date === dStr);
    if (hol) return 'Holiday';

    // Check if approved leave
    const leave = leaveRequests.find(
      l => l.employee_id === currentUser.employee_id && l.status === 'Approved' && dStr >= l.start_date && dStr <= l.end_date
    );
    if (leave) return 'Leave';

    // Check if past or future
    const todayNoTime = new Date();
    todayNoTime.setHours(0,0,0,0);
    const dateNoTime = new Date(date);
    dateNoTime.setHours(0,0,0,0);

    if (dateNoTime.getTime() > todayNoTime.getTime()) {
      return 'Future';
    } else if (dateNoTime.getTime() === todayNoTime.getTime()) {
      return hasCheckedIn ? 'Present' : 'Pending';
    } else {
      return 'Absent'; // past unmarked weekday is absent
    }
  };

  const getNumberSuffix = (num: number) => {
    if (num > 3 && num < 21) return 'th';
    switch (num % 10) {
      case 1:  return 'st';
      case 2:  return 'nd';
      case 3:  return 'rd';
      default: return 'th';
    }
  };

  const currentDayNum = currentTime.getDate();
  const currentDayName = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  const currentMonthYear = currentTime.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Compute Statistics
  const presentDays = myAttendance.filter(a => a.status === 'Present').length;
  const halfDays = myAttendance.filter(a => a.status === 'Half Day').length;
  const totalCompletedRecords = myAttendance.length;
  
  const baseAttendanceRate = totalCompletedRecords > 0 
    ? Math.round(((presentDays + halfDays * 0.5) / totalCompletedRecords) * 100)
    : 94;

  const approvedLeavesCount = leaveRequests
    .filter(l => l.employee_id === currentUser.employee_id && l.status === 'Approved')
    .reduce((acc, curr) => {
      const start = new Date(curr.start_date);
      const end = new Date(curr.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return acc + diffDays;
    }, 0);

  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const presentThisMonth = myAttendance.filter(
    a => a.date.startsWith(currentMonthPrefix) && (a.status === 'Present' || a.status === 'Half Day')
  ).length;

  const companyNews = [
    { id: 1, title: 'Upcoming Public Holiday', desc: 'The office will be closed this Friday for World Environment Day. Enjoy the long weekend!', date: 'Jun 2, 2026' },
    { id: 2, title: 'Annual Health Checkup Camp', desc: 'A free healthcare checkup is scheduled in the cafeteria room on Monday morning, starting at 10 AM.', date: 'May 31, 2026' },
    { id: 3, title: 'New Remote Work Guidelines', desc: 'Updated remote working policy has been published in the HR guidelines manual. Access via portal attachments.', date: 'May 28, 2026' }
  ];

  const teammatesList = employees
    .filter(e => e.department === currentUser.department && e.employee_id !== currentUser.employee_id)
    .map(e => {
      const isOnline = attendance.some(a => a.employee_id === e.employee_id && a.date === todayStr && !a.check_out);
      const isOnLeave = leaveRequests.some(l => l.employee_id === e.employee_id && l.status === 'Approved' && todayStr >= l.start_date && todayStr <= l.end_date);
      return {
        ...e,
        status: isOnLeave ? 'On Leave' : isOnline ? 'Online' : 'Offline'
      };
    });

  const totalDaysSoFarPredictor = totalCompletedRecords + futureDaysPresent + futureDaysAbsent;
  const predictedRate = totalDaysSoFarPredictor > 0
    ? Math.round(((presentDays + futureDaysPresent + (halfDays * 0.5)) / totalDaysSoFarPredictor) * 100)
    : 0;

  return (
    <div className="space-y-6">
      
      {/* ── Unified Bento Grid Layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">

        {/* Bento 1: Unified Shift & Identity Header (Spans 8) */}
        <div className="md:col-span-8 bg-card border border-border rounded-lg p-6 shadow-card hover:scale-[1.005] hover:shadow-premium-light dark:hover:shadow-premium-dark transition-all duration-300 flex flex-col justify-between min-h-[160px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-lg border border-border shadow-sm">
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="text-left">
                <h4 className="font-bold text-lg text-foreground font-display leading-tight">{currentUser.name}</h4>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{currentUser.designation} • {currentUser.employee_id}</p>
              </div>
            </div>
            <div className="text-xs font-semibold text-muted-foreground bg-muted/10 px-3 py-1 rounded-full font-display">
              {currentMonthYear}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
            <div className="flex items-center space-x-2.5">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">Active Shift Time</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {hasCheckedIn 
                    ? `Clocked In at ${new Date(`2000-01-01T${todayRecord.check_in}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : todayHoliday 
                    ? `Holiday: ${todayHoliday.holiday_name}`
                    : isWeekend 
                    ? 'Weekend Rest Day' 
                    : 'Standard Shift: 9:00 AM - 5:00 PM'}
                </p>
              </div>
            </div>
            <div>
              {!hasCheckedIn ? (
                <button
                  onClick={handleCheckIn}
                  disabled={isWeekend || !!todayHoliday}
                  className="px-5 py-2.5 bg-primary text-primary-foreground hover:opacity-90 disabled:bg-muted/10 disabled:text-muted-foreground/40 font-bold text-sm rounded-lg transition duration-150 shadow-sm font-display"
                >
                  Clock In
                </button>
              ) : !hasCheckedOut ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono bg-muted/10 px-2 py-1 rounded-md text-foreground animate-pulse">
                    {runningHoursStr}
                  </span>
                  <button
                    onClick={handleCheckOut}
                    className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-[var(--primary-hover)] font-bold text-sm rounded-lg transition duration-150 shadow-sm font-display"
                  >
                    Clock Out
                  </button>
                </div>
              ) : (
                <button
                  disabled
                  className="px-5 py-2.5 bg-muted/10 text-muted-foreground/40 font-bold text-sm rounded-lg"
                >
                  Completed
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bento 2: Digital Clock Widget (Spans 4) */}
        <div className="md:col-span-4 bg-card border border-border rounded-lg p-6 shadow-card hover:scale-[1.005] hover:shadow-premium-light dark:hover:shadow-premium-dark transition-all duration-300 flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Time Clock</span>
            <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
          </div>
          <div className="text-left my-auto py-1">
            <div className="text-4xl font-black font-mono tracking-tight text-foreground leading-none">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              {currentDayName}, {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="text-[10px] text-muted-foreground/80 font-semibold border-t border-border/60 pt-2 flex items-center gap-1">
            <Info className="h-3.5 w-3.5 text-primary" />
            <span>Updates automatically in real time</span>
          </div>
        </div>

        {/* Bento 3: Weekly Streak (Spans 8) */}
        <div className="md:col-span-8 bg-card border border-border rounded-lg p-6 shadow-card hover:scale-[1.005] hover:shadow-premium-light dark:hover:shadow-premium-dark transition-all duration-300 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 text-left">Weekly Status Streak</h3>
            <div className="grid grid-cols-5 gap-4">
              {weekDays.map((day, idx) => {
                const status = getDayStatus(day);
                const isToday = day.toISOString().split('T')[0] === todayStr;

                let bgStyle = 'bg-muted/10 border-border';
                let icon = null;
                
                if (status === 'Present') {
                  bgStyle = 'bg-[var(--calendar-present-bg)] border-[var(--calendar-present-border)] text-[var(--calendar-present-text)]';
                  icon = <Check className="h-3.5 w-3.5 stroke-[3]" />;
                } else if (status === 'Absent') {
                  bgStyle = 'bg-[var(--calendar-absent-bg)] border-[var(--calendar-absent-border)] text-[var(--calendar-absent-text)]';
                  icon = <span className="text-[10px] font-black">✕</span>;
                } else if (status === 'Leave') {
                  bgStyle = 'bg-[var(--calendar-leave-bg)] border-[var(--calendar-leave-border)] text-[var(--calendar-leave-text)]';
                  icon = <span className="text-[10px] font-bold">L</span>;
                } else if (status === 'Holiday') {
                  bgStyle = 'bg-[var(--calendar-holiday-bg)] border-[var(--calendar-holiday-border)] text-[var(--calendar-holiday-text)]';
                  icon = <span className="text-[10px] font-bold">H</span>;
                } else if (status === 'Half Day') {
                  bgStyle = 'bg-[var(--calendar-leave-bg)]/80 border-[var(--calendar-leave-border)]/70 text-[var(--calendar-leave-text)]';
                  icon = <span className="text-[10px] font-bold">HD</span>;
                } else if (status === 'Pending') {
                  bgStyle = 'bg-muted/20 border-border animate-pulse';
                }

                return (
                  <div key={idx} className="flex flex-col items-center space-y-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center border font-display transition shadow-sm ${bgStyle} ${
                        isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                      }`}
                    >
                      {icon ? icon : <span className="text-xs text-muted-foreground font-bold">{day.getDate()}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-5 pt-4 border-t border-border text-[10px] text-muted-foreground font-semibold justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-present" /> Present</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-absent" /> Absent</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-leave" /> Leave</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-halfday" /> Half Day</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-holiday" /> Holiday</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-weekend" /> Weekend</span>
            </div>
          </div>
        </div>

        {/* Bento 4: Quick Actions Grid (Spans 4) */}
        <div className="md:col-span-4 bg-card border border-border rounded-lg p-6 shadow-card hover:scale-[1.005] hover:shadow-premium-light dark:hover:shadow-premium-dark transition-all duration-300 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 text-left">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/employee/leaves')}
                className="flex flex-col items-center justify-center p-3 bg-muted/5 hover:bg-primary/10 rounded-xl border border-border/80 transition text-center group active:scale-95"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition duration-150">
                  <CalendarDays className="h-4.5 w-4.5" />
                </div>
                <span className="text-xs font-bold text-foreground">Ask Leave</span>
              </button>

              <button 
                onClick={() => setIsLeaderboardOpen(true)}
                className="flex flex-col items-center justify-center p-3 bg-muted/5 hover:bg-primary/10 rounded-xl border border-border/80 transition text-center group active:scale-95"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition duration-150">
                  <Award className="h-4.5 w-4.5" />
                </div>
                <span className="text-xs font-bold text-foreground">Leaderboard</span>
              </button>

              <button 
                onClick={() => setIsNewsOpen(true)}
                className="flex flex-col items-center justify-center p-3 bg-muted/5 hover:bg-primary/10 rounded-xl border border-border/80 transition text-center group active:scale-95"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition duration-150">
                  <Newspaper className="h-4.5 w-4.5" />
                </div>
                <span className="text-xs font-bold text-foreground">News</span>
              </button>

              <button 
                onClick={() => setIsPredictorOpen(true)}
                className="flex flex-col items-center justify-center p-3 bg-muted/5 hover:bg-primary/10 rounded-xl border border-border/80 transition text-center group active:scale-95"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition duration-150">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <span className="text-xs font-bold text-foreground">Predictor</span>
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => setIsTeammatesOpen(true)}
              className="flex-1 py-2 bg-muted/5 hover:bg-primary/10 text-xs font-bold text-foreground border border-border/80 rounded-lg transition active:scale-95"
            >
              Teammates
            </button>
            <button 
              onClick={() => setIsShiftsOpen(true)}
              className="flex-1 py-2 bg-muted/5 hover:bg-primary/10 text-xs font-bold text-foreground border border-border/80 rounded-lg transition active:scale-95"
            >
              Active Shift
            </button>
          </div>
        </div>

        {/* Bento 5: Monthly Circular Overview (Spans 8) */}
        <div className="md:col-span-8 bg-card border border-border rounded-lg p-6 shadow-card hover:scale-[1.005] hover:shadow-premium-light dark:hover:shadow-premium-dark transition-all duration-300 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-5 text-left">Monthly Overview Metrics</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center justify-center p-4 bg-muted/5 rounded-xl border border-border/60">
              <div className="relative flex items-center justify-center w-20 h-20">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="28" className="stroke-border fill-transparent" strokeWidth="4.5" />
                  <circle cx="50%" cy="50%" r="28" className="stroke-primary fill-transparent transition-all duration-500" strokeWidth="4.5" 
                    strokeDasharray={2 * Math.PI * 28} 
                    strokeDashoffset={2 * Math.PI * 28 - (baseAttendanceRate / 100) * (2 * Math.PI * 28)} 
                    strokeLinecap="round" />
                </svg>
                <span className="absolute text-sm font-extrabold font-display text-foreground">{baseAttendanceRate}%</span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground mt-2 text-center">Attendance Rate</span>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-muted/5 rounded-xl border border-border/60">
              <div className="relative flex items-center justify-center w-20 h-20">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="28" className="stroke-border fill-transparent" strokeWidth="4.5" />
                  <circle cx="50%" cy="50%" r="28" className="stroke-primary fill-transparent transition-all duration-500" strokeWidth="4.5" 
                    strokeDasharray={2 * Math.PI * 28} 
                    strokeDashoffset={2 * Math.PI * 28 - (Math.min(100, (approvedLeavesCount / 12) * 100) / 100) * (2 * Math.PI * 28)} 
                    strokeLinecap="round" />
                </svg>
                <span className="absolute text-sm font-extrabold font-display text-foreground">{approvedLeavesCount.toString().padStart(2, '0')}</span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground mt-2 text-center">Leaves Taken</span>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-muted/5 rounded-xl border border-border/60">
              <div className="relative flex items-center justify-center w-20 h-20">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="28" className="stroke-border fill-transparent" strokeWidth="4.5" />
                  <circle cx="50%" cy="50%" r="28" className="stroke-primary fill-transparent transition-all duration-500" strokeWidth="4.5" 
                    strokeDasharray={2 * Math.PI * 28} 
                    strokeDashoffset={2 * Math.PI * 28 - (Math.min(100, (presentThisMonth / 22) * 100) / 100) * (2 * Math.PI * 28)} 
                    strokeLinecap="round" />
                </svg>
                <span className="absolute text-sm font-extrabold font-display text-foreground">{presentThisMonth.toString().padStart(2, '0')}</span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground mt-2 text-center">Working Days</span>
            </div>
          </div>
        </div>

        {/* Bento 6: Colleagues & System Info Tip (Spans 4) */}
        <div className="md:col-span-4 bg-card border border-border rounded-lg p-6 shadow-card hover:scale-[1.005] hover:shadow-premium-light dark:hover:shadow-premium-dark transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider text-left">Colleagues ({teammatesList.filter(t => t.status === 'Online').length} Online)</h3>
              <button onClick={() => setIsTeammatesOpen(true)} className="text-[10px] text-primary font-bold hover:underline">View All</button>
            </div>
            <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
              {teammatesList.slice(0, 3).map(teammate => (
                <div key={teammate.id} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0 text-left">
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary">
                      {teammate.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{teammate.name}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    teammate.status === 'Online' ? 'bg-[var(--calendar-present-bg)] text-[var(--calendar-present-text)]' : teammate.status === 'On Leave' ? 'bg-[var(--calendar-leave-bg)] text-[var(--calendar-leave-text)]' : 'bg-muted text-muted-foreground'
                  }`}>
                    {teammate.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-muted/5 text-foreground rounded-xl p-3 border border-border/80 flex items-start gap-2.5 mt-4">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <span className="text-[10px] font-bold text-foreground block">Quick tip</span>
              <span className="text-[9.5px] text-muted-foreground leading-normal block mt-0.5">
                Forgot check-out? Reach out directly to your HR Representative to adjust past registry logs.
              </span>
            </div>
          </div>
        </div>

        {/* Bento 7: Live Calendar (Full width) */}
        <div className="md:col-span-12 bg-card border border-border rounded-lg p-6 shadow-card hover:shadow-premium-light transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">My Attendance Calendar</h3>
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Live View</span>
          </div>
          <LiveCalendar
            attendanceByDate={myAttendanceByDate}
            holidayByDate={holidayByDate}
            compact={false}
          />
        </div>

      </div>

      {/* ── MODALS ── */}

      {/* 1. Leaderboard Modal */}
      <Modal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} title="Department Attendance Leaderboard" size="md">
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-3 bg-muted/5 p-3.5 rounded-xl border border-border">
            <Award className="h-6 w-6 text-primary flex-shrink-0" />
            <p className="text-xs font-medium text-foreground leading-relaxed">
              Teammates with the best attendance score in the <strong>{currentUser.department}</strong> department this month.
            </p>
          </div>
          
          <div className="divide-y divide-border">
            {employees
              .filter(e => e.department === currentUser.department)
              .map((emp, index) => {
                const score = 100 - (index * 2);
                return (
                  <div key={emp.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : index === 1 ? 'bg-muted text-muted-foreground' : 'bg-muted/50 text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-foreground block">{emp.name}</span>
                        <span className="text-[10px] text-muted-foreground">{emp.designation}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{score}% Score</span>
                  </div>
                );
              })}
          </div>
        </div>
      </Modal>

      {/* 2. News Modal */}
      <Modal isOpen={isNewsOpen} onClose={() => setIsNewsOpen(false)} title="Company Announcements" size="md">
        <div className="space-y-4">
          {companyNews.map(news => (
            <div key={news.id} className="p-4 bg-muted/5 border border-border rounded-xl space-y-1 text-left">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-foreground font-display">{news.title}</span>
                <span className="text-[10px] text-muted-foreground font-medium">{news.date}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">{news.desc}</p>
            </div>
          ))}
        </div>
      </Modal>

      {/* 3. Predictor Modal */}
      <Modal isOpen={isPredictorOpen} onClose={() => setIsPredictorOpen(false)} title="Smart Attendance Predictor" size="md">
        <div className="space-y-5 text-left">
          <div className="bg-muted/5 p-4 rounded-xl border border-border text-left space-y-2">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              How it works
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Estimate your monthly attendance percentage by toggling the slider to predict your future weekday check-ins vs missed days.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-foreground mb-1.5 font-display">
                <span>Days you will check in:</span>
                <span className="text-primary">{futureDaysPresent} Workdays</span>
              </div>
              <input 
                type="range" min="0" max="22" value={futureDaysPresent} 
                onChange={e => setFutureDaysPresent(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-foreground mb-1.5 font-display">
                <span>Days you will miss/skip:</span>
                <span className="text-[#E88B8B]">{futureDaysAbsent} Days</span>
              </div>
              <input 
                type="range" min="0" max="10" value={futureDaysAbsent} 
                onChange={e => setFutureDaysAbsent(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-[#E88B8B]"
              />
            </div>
          </div>

          <div className="bg-primary text-primary-foreground p-4 rounded-xl text-center space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">Predicted Score</span>
            <div className="text-3xl font-extrabold font-display">{predictedRate}%</div>
            <span className="text-[11px] opacity-80 block mt-1">
              Based on {presentDays} past present days + {futureDaysPresent} predicted workdays.
            </span>
          </div>
        </div>
      </Modal>

      {/* 4. Teammates Modal */}
      <Modal isOpen={isTeammatesOpen} onClose={() => setIsTeammatesOpen(false)} title="Department Colleagues" size="md">
        <div className="space-y-3 text-left">
          <p className="text-xs text-muted-foreground mb-3">Live check-in indicators of your colleagues today.</p>
          <div className="divide-y divide-border">
            {teammatesList.map(teammate => (
              <div key={teammate.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center space-x-2.5">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                    {teammate.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground block">{teammate.name}</span>
                    <span className="text-[10px] text-muted-foreground">{teammate.designation}</span>
                  </div>
                </div>
                
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  teammate.status === 'Online' ? 'bg-[var(--calendar-present-bg)] text-[var(--calendar-present-text)]' : teammate.status === 'On Leave' ? 'bg-[var(--calendar-leave-bg)] text-[var(--calendar-leave-text)]' : 'bg-muted text-muted-foreground'
                }`}>
                  {teammate.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* 5. Shifts Modal */}
      <Modal isOpen={isShiftsOpen} onClose={() => setIsShiftsOpen(false)} title="Your Active Work Shift" size="sm">
        <div className="space-y-4 text-left">
          <div className="p-4 bg-muted/5 rounded-xl border border-border text-center space-y-2">
            <Clock className="h-8 w-8 text-primary mx-auto" />
            <div>
              <span className="text-xs font-bold text-foreground block">Standard Day Shift</span>
              <span className="text-sm font-black font-mono text-primary block mt-1">09:00 AM - 05:00 PM</span>
            </div>
          </div>
          
          <div className="space-y-2.5 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Shift Type:</span>
              <strong className="text-foreground font-semibold">Fixed Weekdays</strong>
            </div>
            <div className="flex justify-between">
              <span>Grace Period:</span>
              <strong className="text-foreground font-semibold">15 Minutes</strong>
            </div>
            <div className="flex justify-between">
              <span>Break Time:</span>
              <strong className="text-foreground font-semibold">1 Hour Lunch break</strong>
            </div>
            <div className="flex justify-between">
              <span>Work Days:</span>
              <strong className="text-foreground font-semibold">Monday - Friday</strong>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
};
