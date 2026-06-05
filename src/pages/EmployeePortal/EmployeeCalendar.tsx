import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  PlaneTakeoff,
  RefreshCw,
  Link2,
  Unlink,
  Loader2,
  Calendar as CalendarIcon,
  ExternalLink,
  MapPin,
  Zap,
  Palmtree,
  Timer,
  ChevronRight,
  Globe,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface GoogleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  htmlLink?: string;
  description?: string;
  location?: string;
}

interface GoogleStatus {
  connected: boolean;
  email?: string;
  picture?: string;
  name?: string;
  auto_sync?: boolean;
  last_synced?: string;
}

interface EventDetail {
  id: string;
  title: string;
  type: 'attendance' | 'leave' | 'holiday' | 'google';
  start: string;
  end?: string;
  status?: string;
  checkIn?: string | null;
  checkOut?: string | null;
  workingHours?: number | null;
  leaveType?: string;
  holidayName?: string;
  htmlLink?: string;
  description?: string;
  location?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const formatTime = (timeStr: string | null): string => {
  if (!timeStr) return '--:--';
  try {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return timeStr;
  }
};

const formatRelativeTime = (dateStr: string | null): string => {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const EmployeeCalendar: React.FC = () => {
  const { currentUser } = useAuth();
  const { attendance, holidays, leaveRequests } = useData();

  const calendarRef = useRef<FullCalendar | null>(null);

  // Google Calendar State
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus>({ connected: false });
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [, setIsLoadingGoogle] = useState(true);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Calendar UI State
  const [, setCurrentView] = useState<string>('dayGridMonth');
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // ─── Google Calendar Data Fetching ───────────────────────────────────────
  const fetchGoogleStatus = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/google/status/${currentUser.employee_id}`);
      const data = await res.json();
      setGoogleStatus(data);
    } catch (err) {
      console.error('Failed to check Google status:', err);
    } finally {
      setIsLoadingGoogle(false);
    }
  }, [currentUser]);

  const fetchGoogleEvents = useCallback(async () => {
    if (!currentUser || !googleStatus.connected) return;
    try {
      const res = await fetch(`/api/google/events/${currentUser.employee_id}`);
      if (res.ok) {
        const data = await res.json();
        setGoogleEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch Google events:', err);
    }
  }, [currentUser, googleStatus.connected]);

  useEffect(() => {
    fetchGoogleStatus();
    // Check OAuth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('google') === 'connected') {
      setGoogleStatus(prev => ({ ...prev, connected: true }));
      setSyncToast({ message: 'Google Calendar connected successfully!', type: 'success' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('google') === 'error') {
      setSyncToast({ message: 'Failed to connect Google Calendar.', type: 'error' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchGoogleStatus]);

  useEffect(() => {
    if (googleStatus.connected) {
      fetchGoogleEvents();
    }
  }, [googleStatus.connected, fetchGoogleEvents]);

  // Auto-sync every 5 minutes
  useEffect(() => {
    if (!googleStatus.connected || !googleStatus.auto_sync || !currentUser) return;
    const interval = setInterval(async () => {
      setIsSyncing(true);
      try {
        const res = await fetch(`/api/google/sync/${currentUser.employee_id}`, { method: 'POST' });
        if (res.ok) {
          fetchGoogleEvents();
          fetchGoogleStatus();
        }
      } catch { /* silent */ } finally {
        setIsSyncing(false);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [googleStatus.connected, googleStatus.auto_sync, currentUser, fetchGoogleEvents, fetchGoogleStatus]);

  // Dismiss toast after 4s
  useEffect(() => {
    if (syncToast) {
      const timer = setTimeout(() => setSyncToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [syncToast]);

  // ─── Google Actions ──────────────────────────────────────────────────────
  const handleConnect = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/google/auth-url?employeeId=${currentUser.employee_id}`);
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setSyncToast({ message: 'Failed to start Google connection.', type: 'error' });
    }
  };

  const handleDisconnect = async () => {
    if (!currentUser) return;
    await fetch(`/api/google/disconnect/${currentUser.employee_id}`, { method: 'DELETE' });
    setGoogleStatus({ connected: false });
    setGoogleEvents([]);
    setSyncToast({ message: 'Google Calendar disconnected.', type: 'success' });
  };

  const handleSync = async (silent = false) => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/google/sync/${currentUser.employee_id}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        if (!silent) {
          setSyncToast({
            message: `Synced ${data.synced.attendance + data.synced.leaves + data.synced.holidays} events to Google Calendar`,
            type: 'success',
          });
        }
        fetchGoogleEvents();
        fetchGoogleStatus();
      } else {
        if (!silent) setSyncToast({ message: data.error || 'Sync failed', type: 'error' });
      }
    } catch {
      if (!silent) setSyncToast({ message: 'Sync failed. Check your connection.', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutoSync = async () => {
    if (!currentUser) return;
    const newVal = !googleStatus.auto_sync;
    setGoogleStatus(prev => ({ ...prev, auto_sync: newVal }));
    await fetch(`/api/google/toggle-auto-sync/${currentUser.employee_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto_sync: newVal }),
    });
  };

  // ─── Calendar Events Construction ───────────────────────────────────────
  const calendarEvents = useMemo(() => {
    const events: any[] = [];
    if (!currentUser) return events;

    // Attendance events (Green)
    const myLogs = attendance.filter(a => a.employee_id === currentUser.employee_id);
    myLogs.forEach(rec => {
      let title = 'Present';
      let clsName = 'fc-event-present';
      if (rec.status === 'Half Day') { title = 'Half Day'; clsName = 'fc-event-halfday'; }
      else if (rec.status === 'Leave') { title = 'On Leave'; clsName = 'fc-event-leave'; }
      else if (rec.status === 'Absent') { title = 'Absent'; clsName = 'fc-event-absent'; }

      events.push({
        id: `att_${rec.id}`,
        title,
        start: rec.check_in ? `${rec.date}T${rec.check_in}` : rec.date,
        end: rec.check_out ? `${rec.date}T${rec.check_out}` : undefined,
        allDay: !rec.check_in,
        classNames: [clsName],
        extendedProps: { type: 'attendance', status: rec.status, checkIn: rec.check_in, checkOut: rec.check_out, workingHours: rec.working_hours },
      });
    });

    // Leave events (Orange)
    const myLeaves = leaveRequests.filter(l => l.employee_id === currentUser.employee_id && l.status === 'Approved');
    myLeaves.forEach(l => {
      events.push({
        id: `leave_${l.id}`,
        title: `Leave: ${l.leave_type}`,
        start: l.start_date.split('T')[0],
        end: addDays(l.end_date.split('T')[0], 1),
        allDay: true,
        classNames: ['fc-event-leave'],
        extendedProps: { type: 'leave', leaveType: l.leave_type },
      });
    });

    // Holidays (Purple)
    holidays.forEach(h => {
      events.push({
        id: `hol_${h.id}`,
        title: h.holiday_name,
        start: h.holiday_date,
        allDay: true,
        classNames: ['fc-event-holiday-purple'],
        extendedProps: { type: 'holiday', holidayName: h.holiday_name },
      });
    });

    // Google Calendar events (Blue)
    googleEvents.forEach(ge => {
      events.push({
        id: `google_${ge.id}`,
        title: ge.title,
        start: ge.start,
        end: ge.end,
        allDay: ge.allDay,
        classNames: ['fc-event-google'],
        extendedProps: { type: 'google', htmlLink: ge.htmlLink, description: ge.description, location: ge.location },
      });
    });

    return events;
  }, [currentUser, attendance, holidays, leaveRequests, googleEvents]);

  // ─── Event Click Handler ─────────────────────────────────────────────────
  const handleEventClick = (arg: any) => {
    const { extendedProps } = arg.event;
    const detail: EventDetail = {
      id: arg.event.id,
      title: arg.event.title,
      type: extendedProps.type,
      start: arg.event.startStr,
      end: arg.event.endStr,
      status: extendedProps.status,
      checkIn: extendedProps.checkIn,
      checkOut: extendedProps.checkOut,
      workingHours: extendedProps.workingHours,
      leaveType: extendedProps.leaveType,
      holidayName: extendedProps.holidayName,
      htmlLink: extendedProps.htmlLink,
      description: extendedProps.description,
      location: extendedProps.location,
    };
    setSelectedEvent(detail);
    setShowEventModal(true);
  };

  // ─── Side Panel Computations ─────────────────────────────────────────────
  const todayStr = '2026-06-03';

  const todaySchedule = useMemo(() => {
    return calendarEvents.filter(e => {
      const start = (e.start || '').split('T')[0];
      return start === todayStr;
    });
  }, [calendarEvents]);

  const upcomingEvents = useMemo(() => {
    return calendarEvents
      .filter(e => {
        const start = (e.start || '').split('T')[0];
        return start > todayStr;
      })
      .sort((a, b) => (a.start > b.start ? 1 : -1))
      .slice(0, 5);
  }, [calendarEvents]);

  const nextHoliday = useMemo(() => {
    return holidays
      .filter(h => h.holiday_date >= todayStr)
      .sort((a, b) => (a.holiday_date > b.holiday_date ? 1 : -1))[0];
  }, [holidays]);

  const leaveBalance = useMemo(() => {
    const used = leaveRequests.filter(
      l => l.employee_id === currentUser?.employee_id && l.status === 'Approved'
    ).length;
    return { used, total: 24, remaining: 24 - used };
  }, [leaveRequests, currentUser]);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 text-left relative">
      {/* Toast Notification */}
      {syncToast && (
        <div className={`fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 ${
          syncToast.type === 'success'
            ? 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          {syncToast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {syncToast.message}
        </div>
      )}

      {/* ─── Google Calendar Header Section ─── */}
      {googleStatus.connected ? (
        <div className="glass-card rounded-2xl p-5 border border-border/50 transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Google Avatar */}
              {googleStatus.picture ? (
                <img
                  src={googleStatus.picture}
                  alt="Google Avatar"
                  className="w-10 h-10 rounded-full ring-2 ring-[#8B5CF6]/20 ring-offset-2 ring-offset-card"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">{googleStatus.name || 'Google Calendar'}</h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Connected
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{googleStatus.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Sync Info */}
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Last synced</p>
                <p className="text-xs font-semibold text-foreground">{formatRelativeTime(googleStatus.last_synced || null)}</p>
              </div>

              {/* Auto-sync Toggle */}
              <button
                onClick={handleToggleAutoSync}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title={googleStatus.auto_sync ? 'Auto-sync ON' : 'Auto-sync OFF'}
              >
                {googleStatus.auto_sync ? (
                  <ToggleRight className="w-5 h-5 text-[#8B5CF6]" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
                <span className="hidden md:inline">Auto</span>
              </button>

              {/* Sync Button */}
              <Button
                onClick={() => handleSync(false)}
                disabled={isSyncing}
                className="flex items-center gap-1.5 text-xs px-3.5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg shadow-sm transition-all"
              >
                {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {isSyncing ? 'Syncing...' : 'Sync'}
              </Button>

              {/* Disconnect */}
              <Button
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 text-xs px-3 py-2 bg-card hover:bg-muted/20 text-muted-foreground border border-border rounded-lg transition-all"
              >
                <Unlink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Empty State / Connect Prompt ─── */
        <div className="glass-card rounded-2xl p-8 border border-border/50 text-center transition-all duration-300">
          <div className="max-w-md mx-auto space-y-4">
            {/* Google Calendar Illustration */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/20 to-[#6366F1]/20 rounded-2xl animate-pulse" />
              <div className="absolute inset-2 bg-card rounded-xl border border-border flex items-center justify-center">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="3" stroke="#8B5CF6" strokeWidth="1.5" fill="none"/>
                  <line x1="3" y1="9" x2="21" y2="9" stroke="#8B5CF6" strokeWidth="1.5"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="12" cy="15" r="2" fill="#8B5CF6"/>
                </svg>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground font-display">Connect Google Calendar</h2>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Sync your attendance, leaves, and holidays directly to Google Calendar. 
                See everything in one place with real-time updates.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                <CheckCircle className="w-3 h-3" /> Auto-sync attendance
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <CalendarIcon className="w-3 h-3" /> See Google events
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <Zap className="w-3 h-3" /> Real-time updates
              </span>
            </div>

            <Button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-semibold text-sm shadow-lg shadow-[#8B5CF6]/25 hover:shadow-[#8B5CF6]/40 transition-all duration-200 hover:scale-[1.02]"
            >
              <Link2 className="w-4 h-4" />
              Connect Google Calendar
            </Button>
          </div>
        </div>
      )}

      {/* ─── Main Grid: Calendar + Side Panel ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* FullCalendar (8 cols) */}
        <div className="lg:col-span-8 xl:col-span-9">
          <Card className="glass-card border border-border/50 overflow-hidden transition-all duration-300">
            <CardContent className="p-0">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                initialDate="2026-06-03"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                }}
                events={calendarEvents}
                eventClick={handleEventClick}
                datesSet={(arg) => setCurrentView(arg.view.type)}
                height="auto"
                editable={true}
                selectable={true}
                dayMaxEvents={3}
                eventDisplay="block"
                nowIndicator={true}
                eventDidMount={(info) => {
                  // Tooltip on hover
                  const type = info.event.extendedProps.type;
                  let tip = info.event.title;
                  if (type === 'attendance') tip = `Attendance: ${info.event.extendedProps.status}`;
                  if (type === 'google') tip = `📅 ${info.event.title}`;
                  info.el.setAttribute('title', tip);
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* ─── Side Panel (4 cols) ─── */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">

          {/* Today's Schedule */}
          <Card className="glass-card border border-border/50 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-[#8B5CF6]" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-1">
              {todaySchedule.length > 0 ? (
                <div className="space-y-2">
                  {todaySchedule.slice(0, 4).map((evt, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/5 border border-border/30 hover:bg-muted/10 transition-colors">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        evt.classNames?.[0]?.includes('present') ? 'bg-green-500' :
                        evt.classNames?.[0]?.includes('leave') ? 'bg-orange-500' :
                        evt.classNames?.[0]?.includes('holiday') ? 'bg-purple-500' :
                        evt.classNames?.[0]?.includes('google') ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{evt.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {evt.allDay ? 'All day' : evt.start?.split('T')[1]?.slice(0, 5) || ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-3 text-center">No events today</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="glass-card border border-border/50 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-[#8B5CF6]" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-1">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-2">
                  {upcomingEvents.map((evt, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/10 transition-colors">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        evt.classNames?.[0]?.includes('present') ? 'bg-green-500' :
                        evt.classNames?.[0]?.includes('leave') ? 'bg-orange-500' :
                        evt.classNames?.[0]?.includes('holiday') ? 'bg-purple-500' :
                        evt.classNames?.[0]?.includes('google') ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{evt.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(evt.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-3 text-center">No upcoming events</p>
              )}
            </CardContent>
          </Card>

          {/* Next Holiday */}
          {nextHoliday && (
            <Card className="glass-card border border-border/50 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-900/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Palmtree className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Next Holiday</p>
                    <p className="text-sm font-bold text-foreground">{nextHoliday.holiday_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(nextHoliday.holiday_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leave Balance */}
          <Card className="glass-card border border-border/50 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <PlaneTakeoff className="w-4.5 h-4.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Leave Balance</p>
                    <p className="text-sm font-bold text-foreground">{leaveBalance.remaining} days left</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold font-mono text-[#8B5CF6]">{leaveBalance.remaining}/{leaveBalance.total}</p>
                </div>
              </div>
              {/* Mini progress bar */}
              <div className="mt-3 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] rounded-full transition-all duration-500"
                  style={{ width: `${(leaveBalance.remaining / leaveBalance.total) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Color Legend */}
          <Card className="glass-card border border-border/50">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Legend</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-[11px] text-foreground">Attendance</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="text-[11px] text-foreground">Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-[11px] text-foreground">Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-[11px] text-foreground">Google</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Event Detail Modal ─── */}
      {showEventModal && selectedEvent && (
        <Modal isOpen={showEventModal} onClose={() => setShowEventModal(false)} title="Event Details">
          <div className="space-y-4 p-2">
            {/* Event Type Badge */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                selectedEvent.type === 'attendance' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                selectedEvent.type === 'leave' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                selectedEvent.type === 'holiday' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              }`}>
                {selectedEvent.type === 'attendance' && <CheckCircle className="w-3 h-3" />}
                {selectedEvent.type === 'leave' && <PlaneTakeoff className="w-3 h-3" />}
                {selectedEvent.type === 'holiday' && <Palmtree className="w-3 h-3" />}
                {selectedEvent.type === 'google' && <CalendarIcon className="w-3 h-3" />}
                {selectedEvent.type}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-foreground">{selectedEvent.title}</h3>

            {/* Date/Time */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                {new Date(selectedEvent.start).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Attendance Details */}
            {selectedEvent.type === 'attendance' && (
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-muted/5 border border-border/50">
                <div className="text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Status</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{selectedEvent.status}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Clock In</p>
                  <p className="text-sm font-bold font-mono text-foreground mt-0.5">{formatTime(selectedEvent.checkIn || null)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Clock Out</p>
                  <p className="text-sm font-bold font-mono text-foreground mt-0.5">{formatTime(selectedEvent.checkOut || null)}</p>
                </div>
              </div>
            )}

            {/* Working Hours */}
            {selectedEvent.type === 'attendance' && selectedEvent.workingHours && (
              <div className="flex items-center gap-2 text-sm">
                <Timer className="w-4 h-4 text-[#8B5CF6]" />
                <span className="text-foreground font-semibold">{Number(selectedEvent.workingHours).toFixed(2)} hours worked</span>
              </div>
            )}

            {/* Google Event Links */}
            {selectedEvent.type === 'google' && (
              <>
                {selectedEvent.description && (
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                )}
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.htmlLink && (
                  <a
                    href={selectedEvent.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#8B5CF6] hover:text-[#7C3AED] font-semibold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in Google Calendar
                  </a>
                )}
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
