import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { LiveCalendar } from '../../components/ui/LiveCalendar';
import { Clock, Award, Newspaper, Sparkles, CalendarDays, Check, TrendingUp, Info } from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { attendance, checkIn, checkOut, leaveRequests, holidays, employees } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [runningHoursStr, setRunningHoursStr] = useState('00:00:00');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [isPredictorOpen, setIsPredictorOpen] = useState(false);
  const [isTeammatesOpen, setIsTeammatesOpen] = useState(false);
  const [isShiftsOpen, setIsShiftsOpen] = useState(false);
  const [futureDaysPresent, setFutureDaysPresent] = useState(10);
  const [futureDaysAbsent, setFutureDaysAbsent] = useState(0);

  // Time update
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Core data computations
  const todayStr = new Date().toISOString().split('T')[0];
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

  const todayRecord = attendance.find(
    (a) => a.employee_id === currentUser?.employee_id && a.date === todayStr
  );

  const isWeekend = currentTime.getDay() === 0 || currentTime.getDay() === 6;
  const todayHoliday = holidays.find(h => h.holiday_date === todayStr);
  const hasCheckedIn = !!todayRecord?.check_in;
  const hasCheckedOut = !!todayRecord?.check_out;

  // Running hours calculation
  useEffect(() => {
    if (!hasCheckedIn || hasCheckedOut || !todayRecord?.check_in) {
      setRunningHoursStr('00:00:00');
      return;
    }
    const calc = () => {
      const [inH, inM, inS] = todayRecord.check_in!.split(':').map(Number);
      const checkInDate = new Date();
      checkInDate.setHours(inH, inM, inS || 0);
      let diff = Math.max(0, Date.now() - checkInDate.getTime());
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRunningHoursStr(`${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [hasCheckedIn, hasCheckedOut, todayRecord]);

  if (!currentUser) return null;

  const getWeekDays = () => {
    const cur = new Date(), day = cur.getDay(), diff = cur.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(cur.setDate(diff));
    return Array.from({ length: 5 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
  };

  const getDayStatus = (date: Date) => {
    const dStr = date.toISOString().split('T')[0];
    const rec = attendance.find(a => a.employee_id === currentUser.employee_id && a.date === dStr);
    if (rec) return rec.status;
    if (date.getDay() === 0 || date.getDay() === 6) return 'Weekend';
    if (holidays.find(h => h.holiday_date === dStr)) return 'Holiday';
    if (leaveRequests.find(l => l.employee_id === currentUser.employee_id && l.status === 'Approved' && dStr >= l.start_date && dStr <= l.end_date)) return 'Leave';
    const todayNoTime = new Date(); todayNoTime.setHours(0, 0, 0, 0);
    const dateNoTime = new Date(date); dateNoTime.setHours(0, 0, 0, 0);
    if (dateNoTime.getTime() > todayNoTime.getTime()) return 'Future';
    if (dateNoTime.getTime() === todayNoTime.getTime()) return hasCheckedIn ? 'Present' : 'Pending';
    return 'Absent';
  };

  const weekDays = getWeekDays();
  const presentDays = myAttendance.filter(a => a.status === 'Present').length;
  const halfDays = myAttendance.filter(a => a.status === 'Half Day').length;
  const totalRecords = myAttendance.length;
  const attendanceRate = totalRecords > 0 ? Math.round(((presentDays + halfDays * 0.5) / totalRecords) * 100) : 94;
  const approvedLeaves = leaveRequests.filter(l => l.employee_id === currentUser.employee_id && l.status === 'Approved')
    .reduce((acc, l) => acc + (Math.ceil(Math.abs(new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000) + 1), 0);
  const presentThisMonth = myAttendance.filter(a => a.date.startsWith(new Date().toISOString().substring(0, 7)) && (a.status === 'Present' || a.status === 'Half Day')).length;
  const teammatesList = employees.filter(e => e.department === currentUser.department && e.employee_id !== currentUser.employee_id)
    .map(e => ({
      ...e,
      status: leaveRequests.some(l => l.employee_id === e.employee_id && l.status === 'Approved' && todayStr >= l.start_date && todayStr <= l.end_date)
        ? 'On Leave'
        : attendance.some(a => a.employee_id === e.employee_id && a.date === todayStr && !a.check_out)
          ? 'Online'
          : 'Offline'
    }));
  const predictedRate = (totalRecords + futureDaysPresent + futureDaysAbsent) > 0
    ? Math.round(((presentDays + futureDaysPresent + (halfDays * 0.5)) / (totalRecords + futureDaysPresent + futureDaysAbsent)) * 100)
    : 0;

  const statusStyle = (s: string) => {
    if (s === 'Present') return { bg: '#EDE9FE', border: 'rgba(139,92,246,0.3)', text: '#6D28D9' };
    if (s === 'Absent') return { bg: '#F2EBFF', border: 'rgba(196,181,253,0.4)', text: '#9879E9' };
    if (s === 'Leave') return { bg: '#DDD6FE', border: 'rgba(167,139,250,0.4)', text: '#7C3AED' };
    if (s === 'Holiday') return { bg: '#C4B5FD', border: 'rgba(139,92,246,0.4)', text: '#4C1D95' };
    if (s === 'Half Day') return { bg: '#EDE9FE', border: 'rgba(167,139,250,0.3)', text: '#5B21B6' };
    return { bg: 'rgba(242,235,255,0.5)', border: 'rgba(196,181,253,0.2)', text: '#C4B5FD' };
  };

  const card = "glass-card p-6 flex flex-col";
  const sectionTitle = { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#9879E9', marginBottom: 16 };

  const companyNews = [
    { id: 1, title: 'Upcoming Public Holiday', desc: 'The office will be closed this Friday. Enjoy the long weekend!', date: 'Jun 2, 2026' },
    { id: 2, title: 'Annual Health Checkup Camp', desc: 'Free healthcare checkup in cafeteria on Monday at 10 AM.', date: 'May 31, 2026' },
    { id: 3, title: 'New Remote Work Guidelines', desc: 'Updated remote working policy published in HR guidelines.', date: 'May 28, 2026' },
  ];

  return (
    <div className="space-y-6 pb-10 animate-fadeInUp">
      {/* Welcome Banner */}
      <div className="rounded-3xl p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#7C3AED 0%,#A78BFA 60%,#C4B5FD 100%)', boxShadow: '0 12px 40px rgba(124,58,237,0.28)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#fff,transparent)', transform: 'translate(30%,-30%)' }} />
        <div className="text-white z-10 space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block"
            style={{ background: 'rgba(255,255,255,0.2)' }}>Employee Portal</span>
          <h2 className="text-2xl font-black">Good {currentTime.getHours() < 12 ? 'Morning' : 'Afternoon'}, {currentUser.name.split(' ')[0]}! 👋</h2>
          <p className="text-sm opacity-80">{currentUser.designation} · {currentUser.department} · {currentUser.employee_id}</p>
        </div>
        <div className="z-10 flex flex-col items-end gap-1 text-white">
          <span className="text-4xl font-black font-mono">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </span>
          <span className="text-sm opacity-75">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Clock In/Out + Weekly Streak */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Clock In/Out Card */}
        <div className={`md:col-span-5 ${card}`} style={{ justifyContent: 'space-between', minHeight: 180 }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={sectionTitle}>Today's Attendance</p>
              <p className="text-sm" style={{ color: '#6D5A9C' }}>
                {hasCheckedIn ? `Clocked in at ${new Date(`2000-01-01T${todayRecord!.check_in}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : todayHoliday ? `Holiday: ${todayHoliday.holiday_name}` : isWeekend ? 'Weekend Rest Day' : 'Standard Shift: 9:00 AM - 5:00 PM'}
              </p>
            </div>
            {hasCheckedIn && !hasCheckedOut && (
              <span className="font-mono text-sm font-bold px-3 py-1.5 rounded-xl animate-pulse" style={{ background: '#EDE9FE', color: '#7C3AED' }}>{runningHoursStr}</span>
            )}
          </div>
          <div className="mt-4">
            {!hasCheckedIn ? (
              <button onClick={() => { if (!currentUser) return; checkIn(currentUser.employee_id); toast('Checked in successfully!', 'success'); }} disabled={isWeekend || !!todayHoliday}
                className="btn-lilac px-6 py-3 rounded-full text-sm font-bold w-full disabled:opacity-40 disabled:cursor-not-allowed">
                Clock In
              </button>
            ) : !hasCheckedOut ? (
              <button onClick={() => { if (!currentUser) return; checkOut(currentUser.employee_id); toast('Checked out successfully!', 'success'); }}
                className="w-full px-6 py-3 rounded-full text-sm font-bold transition-all" style={{ background: 'linear-gradient(135deg,#6D28D9,#4C1D95)', color: '#fff', boxShadow: '0 4px 16px rgba(109,40,217,0.3)' }}>
                Clock Out
              </button>
            ) : (
              <div className="flex items-center gap-2 justify-center py-2" style={{ color: '#8B5CF6' }}>
                <Check className="h-5 w-5" /> <span className="font-semibold text-sm">Shift Complete</span>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Streak */}
        <div className={`md:col-span-7 ${card}`}>
          <p style={sectionTitle}>Weekly Streak</p>
          <div className="grid grid-cols-5 gap-3">
            {weekDays.map((day, idx) => {
              const status = getDayStatus(day);
              const st = statusStyle(status);
              const isToday = day.toISOString().split('T')[0] === todayStr;
              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: '#9879E9' }}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border transition-all"
                    style={{ background: st.bg, borderColor: st.border, color: st.text, boxShadow: isToday ? '0 0 0 2.5px #8B5CF6, 0 0 0 4px rgba(139,92,246,0.2)' : 'none' }}>
                    {status === 'Present' ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : status === 'Absent' ? <span className="text-[10px] font-black">✕</span> : status === 'Leave' ? <span className="text-[10px] font-bold">L</span> : status === 'Holiday' ? <span className="text-[10px] font-bold">H</span> : status === 'Half Day' ? <span className="text-[10px] font-bold">HD</span> : <span className="text-[10px] font-bold" style={{ color: '#C4B5FD' }}>{day.getDate()}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3 border-t text-[10px] font-semibold" style={{ borderColor: 'rgba(216,180,254,0.3)', color: '#9879E9' }}>
            {[['Present', '#8B5CF6'], ['Absent', '#C4B5FD'], ['Leave', '#A78BFA'], ['Holiday', '#7C3AED'], ['Half Day', '#6D28D9']].map(([lbl, col]) => (
              <span key={lbl} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: col }} />{lbl}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Monthly Metrics */}
        <div className={`md:col-span-8 ${card}`}>
          <p style={sectionTitle}>Monthly Overview</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Attendance Rate', value: attendanceRate, max: 100, unit: '%', color: '#8B5CF6' },
              { label: 'Leaves Taken', value: approvedLeaves, max: 12, unit: '', color: '#A78BFA' },
              { label: 'Working Days', value: presentThisMonth, max: 22, unit: '', color: '#7C3AED' },
            ].map(({ label, value, max, unit, color }) => (
              <div key={label} className="flex flex-col items-center justify-center p-4 rounded-2xl border" style={{ background: 'rgba(242,235,255,0.5)', borderColor: 'rgba(216,180,254,0.4)' }}>
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full ring-progress">
                    <circle cx="50%" cy="50%" r="28" fill="transparent" stroke="#EDE9FE" strokeWidth="4.5" />
                    <circle cx="50%" cy="50%" r="28" fill="transparent" stroke={color} strokeWidth="4.5" strokeDasharray={2 * Math.PI * 28} strokeDashoffset={2 * Math.PI * 28 - (Math.min(1, value / max)) * 2 * Math.PI * 28} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-black" style={{ color: '#4C1D95' }}>{value}{unit}</span>
                </div>
                <span className="text-[10px] font-bold text-center mt-2" style={{ color: '#9879E9' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`md:col-span-4 ${card}`}>
          <p style={sectionTitle}>Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Ask Leave', icon: <CalendarDays className="h-5 w-5" />, action: () => navigate('/employee/leaves') },
              { label: 'Leaderboard', icon: <Award className="h-5 w-5" />, action: () => setIsLeaderboardOpen(true) },
              { label: 'News', icon: <Newspaper className="h-5 w-5" />, action: () => setIsNewsOpen(true) },
              { label: 'Predictor', icon: <Sparkles className="h-5 w-5" />, action: () => setIsPredictorOpen(true) },
            ].map(({ label, icon, action }) => (
              <button key={label} onClick={action}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 active:scale-95"
                style={{ background: 'rgba(242,235,255,0.5)', borderColor: 'rgba(216,180,254,0.4)', color: '#6D5A9C' }}>
                <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)', color: '#8B5CF6' }}>{icon}</div>
                <span className="text-xs font-bold" style={{ color: '#4C1D95' }}>{label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            {([['Teammates', () => setIsTeammatesOpen(true)], ['Shift Info', () => setIsShiftsOpen(true)] ] as [string, () => void][]).map(([lbl, fn]) => (
              <button key={lbl} onClick={fn}
                className="flex-1 py-2 text-xs font-bold rounded-xl border transition-all hover:bg-lilac-100"
                style={{ borderColor: 'rgba(216,180,254,0.4)', color: '#7C3AED', background: 'rgba(242,235,255,0.5)' }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <p style={sectionTitle}>My Attendance Calendar</p>
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#EDE9FE', color: '#7C3AED' }}>Live View</span>
        </div>
        <LiveCalendar attendanceByDate={myAttendanceByDate} holidayByDate={holidayByDate} compact={false} />
      </div>

      {/* Modals */}
      <Modal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} title="Attendance Leaderboard" size="md">
        <div className="space-y-3">
          {employees.filter(e => e.department === currentUser.department).map((emp, i) => (
            <div key={emp.id} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: '#EDE9FE' }}>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-black" style={{ background: i === 0 ? '#DDD6FE' : '#F2EBFF', color: '#7C3AED' }}>{i + 1}</div>
                <div>
                  <span className="text-sm font-semibold block" style={{ color: '#4C1D95' }}>{emp.name}</span>
                  <span className="text-[10px]" style={{ color: '#9879E9' }}>{emp.designation}</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#EDE9FE', color: '#6D28D9' }}>{100 - i * 2}%</span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isNewsOpen} onClose={() => setIsNewsOpen(false)} title="Company Announcements" size="md">
        <div className="space-y-3">
          {companyNews.map(n => (
            <div key={n.id} className="p-4 rounded-2xl border" style={{ background: '#F7F2FF', borderColor: '#DDD6FE' }}>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-bold" style={{ color: '#4C1D95' }}>{n.title}</span>
                <span className="text-[10px]" style={{ color: '#9879E9' }}>{n.date}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#6D5A9C' }}>{n.desc}</p>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isPredictorOpen} onClose={() => setIsPredictorOpen(false)} title="Attendance Predictor" size="md">
        <div className="space-y-5">
          <div className="p-3 rounded-2xl flex items-start gap-2" style={{ background: '#F2EBFF', border: '1px solid #DDD6FE' }}>
            <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#8B5CF6' }} />
            <p className="text-xs" style={{ color: '#6D5A9C' }}>Estimate your monthly attendance score by adjusting future check-in days.</p>
          </div>
          {[['Days you will attend', futureDaysPresent, 22, setFutureDaysPresent, '#8B5CF6'], ['Days you will miss', futureDaysAbsent, 10, setFutureDaysAbsent, '#C4B5FD']].map(([lbl, val, max, setter, col]) => (
            <div key={lbl as string}>
              <div className="flex justify-between text-xs font-bold mb-2" style={{ color: '#4C1D95' }}>
                <>{lbl}:</> <span style={{ color: col as string }}>{val as number} days</span>
              </div>
              <input type="range" min="0" max={max as number} value={val as number} onChange={e => (setter as Function)(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor: col as string, background: '#EDE9FE' }} />
            </div>
          ))}
          <div className="p-5 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', color: '#fff' }}>
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1">Predicted Score</p>
            <div className="text-4xl font-black">{predictedRate}%</div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isTeammatesOpen} onClose={() => setIsTeammatesOpen(false)} title="Department Colleagues" size="md">
        <div className="divide-y" style={{ borderColor: '#EDE9FE' }}>
          {teammatesList.map(t => (
            <div key={t.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#A78BFA,#8B5CF6)' }}>{t.name.split(' ').map((n: string) => n[0]).join('')}</div>
                <div>
                  <span className="text-sm font-semibold block" style={{ color: '#4C1D95' }}>{t.name}</span>
                  <span className="text-[10px]" style={{ color: '#9879E9' }}>{t.designation}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: t.status === 'Online' ? '#EDE9FE' : t.status === 'On Leave' ? '#DDD6FE' : '#F2EBFF', color: t.status === 'Online' ? '#6D28D9' : t.status === 'On Leave' ? '#7C3AED' : '#9879E9' }}>{t.status}</span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isShiftsOpen} onClose={() => setIsShiftsOpen(false)} title="Active Work Shift" size="sm">
        <div className="space-y-4">
          <div className="p-5 rounded-2xl text-center" style={{ background: '#F2EBFF', border: '1px solid #DDD6FE' }}>
            <Clock className="h-8 w-8 mx-auto mb-2" style={{ color: '#8B5CF6' }} />
            <span className="text-xs font-bold block" style={{ color: '#4C1D95' }}>Standard Day Shift</span>
            <span className="text-lg font-black font-mono mt-1 block" style={{ color: '#7C3AED' }}>09:00 AM – 05:00 PM</span>
          </div>
          {[
            ['Shift Type', 'Fixed Weekdays'],
            ['Grace Period', '15 Minutes'],
            ['Break Time', '1 Hour Lunch'],
            ['Work Days', 'Mon – Fri']
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs" style={{ color: '#6D5A9C' }}>
              <span>{k}:</span><strong style={{ color: '#4C1D95' }}>{v}</strong>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
