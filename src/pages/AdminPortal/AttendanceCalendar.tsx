import React, { useState, useMemo, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { GoogleCalendarSync } from '../../components/ui/GoogleCalendarSync';
import {
  Info,
  Search,
  UserCheck,
  UserX,
  CalendarCheck,
  Building2,
  Mail,
  Briefcase
} from 'lucide-react';
import { AttendanceStatus } from '../../types';

// Helper to add days for exclusive calendar ranges
const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Formatting date strings to nice reading formats
const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export const AttendanceCalendar: React.FC = () => {
  const { employees, attendance, holidays, leaveRequests, announcements } = useData();
  const { currentUser } = useAuth();

  const calendarRef = useRef<FullCalendar | null>(null);

  // Layout Tab selection
  const [activeTab, setActiveTab] = useState<'my' | 'company'>('company');

  // Keep track of current view type
  const [currentView, setCurrentView] = useState<string>('dayGridMonth');

  // Currently focused date for summary panel (defaults to today's active mock date)
  const [focusedDateStr, setFocusedDateStr] = useState<string>('2026-06-03');

  // Date details modal triggers
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');

  // Sync focused date when calendar date range updates or tab changes
  useEffect(() => {
    setModalSearchQuery('');
  }, [detailDate]);

  // Helper to compute stats for a date YYYY-MM-DD
  const getDayStats = useMemo(() => {
    const memoMap: Record<string, { present: number; absent: number; leave: number; isWeekend: boolean; holidayName?: string }> = {};
    
    return (dateStr: string) => {
      if (memoMap[dateStr]) return memoMap[dateStr];

      const targetDateObj = new Date(dateStr);
      const dayOfWeek = targetDateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const holiday = holidays.find(h => h.holiday_date === dateStr);
      const dayRecords = attendance.filter(a => a.date === dateStr);

      let present = 0;
      let absent = 0;
      let leave = 0;

      employees.forEach(emp => {
        const rec = dayRecords.find(r => r.employee_id === emp.employee_id);
        const onLeave = leaveRequests.find(
          l =>
            l.employee_id === emp.employee_id &&
            l.status === 'Approved' &&
            dateStr >= l.start_date.split('T')[0] &&
            dateStr <= l.end_date.split('T')[0]
        );

        if (rec) {
          if (rec.status === 'Present' || rec.status === 'Half Day') {
            present++;
          } else if (rec.status === 'Leave') {
            leave++;
          } else {
            absent++;
          }
        } else if (onLeave) {
          leave++;
        } else {
          if (holiday) {
            leave++;
          } else if (isWeekend) {
            leave++;
          } else {
            absent++;
          }
        }
      });

      const res = { present, absent, leave, isWeekend, holidayName: holiday?.holiday_name };
      memoMap[dateStr] = res;
      return res;
    };
  }, [employees, attendance, holidays, leaveRequests]);

  // 1. Right Side Summary Panel Calculations
  const summaryStats = useMemo(() => {
    return getDayStats(focusedDateStr);
  }, [focusedDateStr, getDayStats]);

  // 2. Fetch Employee details lists for details modal
  const selectedDateDetails = useMemo(() => {
    if (!detailDate) return [];

    const dayRecords = attendance.filter(a => a.date === detailDate);
    const holiday = holidays.find(h => h.holiday_date === detailDate);
    const dayOfWeek = new Date(detailDate).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const list = employees.map(emp => {
      const rec = dayRecords.find(r => r.employee_id === emp.employee_id);
      const onLeave = leaveRequests.find(
        l =>
          l.employee_id === emp.employee_id &&
          l.status === 'Approved' &&
          detailDate >= l.start_date.split('T')[0] &&
          detailDate <= l.end_date.split('T')[0]
      );

      let status: AttendanceStatus = 'Absent';
      let checkIn: string | null = null;
      let checkOut: string | null = null;
      let workingHours: number | null = null;

      if (rec) {
        status = rec.status;
        checkIn = rec.check_in;
        checkOut = rec.check_out;
        workingHours = rec.working_hours;
      } else if (onLeave) {
        status = 'Leave';
      } else if (holiday) {
        status = 'Leave'; // Holiday off
      } else if (isWeekend) {
        status = 'Leave'; // Weekend off
      }

      return {
        name: emp.name,
        employee_id: emp.employee_id,
        department: emp.department,
        status,
        checkIn,
        checkOut,
        workingHours,
        isHoliday: !!holiday,
        isWeekend
      };
    });

    if (modalSearchQuery.trim() !== '') {
      const q = modalSearchQuery.toLowerCase().trim();
      return list.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          item.employee_id.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q)
      );
    }

    return list;
  }, [detailDate, employees, attendance, holidays, leaveRequests, modalSearchQuery]);

  // 3. Construct FullCalendar Events
  const calendarEvents = useMemo(() => {
    const events: any[] = [];

    // Map Holidays (Global across both views)
    holidays.forEach(h => {
      events.push({
        id: `hol_${h.id}`,
        title: `🔵 Holiday: ${h.holiday_name}`,
        start: h.holiday_date,
        allDay: true,
        classNames: ['fc-event-holiday']
      });
    });

    if (activeTab === 'my') {
      // PERSONAL CALENDAR EVENTS
      if (!currentUser) return events;

      // Personal attendance records
      const myLogs = attendance.filter(a => a.employee_id === currentUser.employee_id);
      myLogs.forEach(rec => {
        let title = '🟢 Present';
        let clsName = 'fc-event-present';
        if (rec.status === 'Half Day') {
          title = '🟡 Half Day';
          clsName = 'fc-event-halfday';
        } else if (rec.status === 'Leave') {
          title = '🟡 On Leave';
          clsName = 'fc-event-leave';
        } else if (rec.status === 'Absent') {
          title = '🔴 Absent';
          clsName = 'fc-event-absent';
        }

        events.push({
          id: `my_att_${rec.id}`,
          title,
          start: rec.check_in ? `${rec.date}T${rec.check_in}` : rec.date,
          end: rec.check_out ? `${rec.date}T${rec.check_out}` : undefined,
          allDay: !rec.check_in,
          classNames: [clsName]
        });
      });

      // Personal approved leaves
      const myLeaves = leaveRequests.filter(l => l.employee_id === currentUser.employee_id && l.status === 'Approved');
      myLeaves.forEach(l => {
        events.push({
          id: `my_leave_${l.id}`,
          title: `🟡 Approved Leave: ${l.leave_type}`,
          start: l.start_date.split('T')[0],
          end: addDays(l.end_date.split('T')[0], 1),
          allDay: true,
          classNames: ['fc-event-leave']
        });
      });

    } else {
      // COMPANY CALENDAR EVENTS
      // Announcements
      announcements.forEach(a => {
        events.push({
          id: `ann_${a.id}`,
          title: `📢 Notice: ${a.title}`,
          start: a.created_at.split('T')[0],
          allDay: true,
          classNames: ['fc-event-announcement']
        });
      });

      // Approved leaves
      leaveRequests.filter(l => l.status === 'Approved').forEach(l => {
        const empName = employees.find(e => e.employee_id === l.employee_id)?.name || l.employee_id;
        events.push({
          id: `leave_${l.id}`,
          title: `🟡 Leave: ${empName} (${l.leave_type})`,
          start: l.start_date.split('T')[0],
          end: addDays(l.end_date.split('T')[0], 1),
          allDay: true,
          classNames: ['fc-event-leave']
        });
      });

      if (currentView === 'dayGridMonth') {
        // Month View: Render daily aggregated headcount summaries to keep month grid clean
        const uniqueDates = Array.from(new Set(attendance.map(a => a.date)));
        uniqueDates.forEach(dateStr => {
          const stats = getDayStats(dateStr);
          if (stats.present > 0) {
            events.push({
              id: `agg_pres_${dateStr}`,
              title: `🟢 Present: ${stats.present}`,
              start: dateStr,
              allDay: true,
              classNames: ['fc-event-present']
            });
          }
          if (stats.leave > 0) {
            events.push({
              id: `agg_leave_${dateStr}`,
              title: `🟡 On Leave: ${stats.leave}`,
              start: dateStr,
              allDay: true,
              classNames: ['fc-event-leave']
            });
          }
          if (stats.absent > 0) {
            events.push({
              id: `agg_abs_${dateStr}`,
              title: `🔴 Absent: ${stats.absent}`,
              start: dateStr,
              allDay: true,
              classNames: ['fc-event-absent']
            });
          }
        });
      } else {
        // Week / Day / Agenda views: Render individual employee attendance logs
        attendance.forEach(rec => {
          const empName = employees.find(e => e.employee_id === rec.employee_id)?.name || rec.employee_id;
          let title = `🟢 ${empName} - Present`;
          let clsName = 'fc-event-present';
          
          if (rec.status === 'Half Day') {
            title = `🟡 ${empName} - Half Day`;
            clsName = 'fc-event-halfday';
          } else if (rec.status === 'Leave') {
            title = `🟡 ${empName} - Leave`;
            clsName = 'fc-event-leave';
          } else if (rec.status === 'Absent') {
            title = `🔴 ${empName} - Absent`;
            clsName = 'fc-event-absent';
          }

          events.push({
            id: `att_${rec.id}`,
            title,
            start: rec.check_in ? `${rec.date}T${rec.check_in}` : rec.date,
            end: rec.check_out ? `${rec.date}T${rec.check_out}` : undefined,
            allDay: !rec.check_in,
            classNames: [clsName]
          });
        });
      }
    }

    return events;
  }, [activeTab, currentUser, attendance, holidays, leaveRequests, announcements, currentView, employees, getDayStats]);

  // Click date callback
  const handleDateClick = (arg: any) => {
    const dateStr = arg.dateStr;
    setFocusedDateStr(dateStr);
    
    if (currentView === 'dayGridMonth') {
      // Month view drill down: switch to day view
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        calendarApi.changeView('timeGridDay', dateStr);
      }
    } else {
      // Non-month views: open detailed table modal
      setDetailDate(dateStr);
    }
  };

  // Click event callback
  const handleEventClick = (arg: any) => {
    const eventDate = arg.event.startStr.split('T')[0];
    setFocusedDateStr(eventDate);
    setDetailDate(eventDate);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Upper Title Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            Attendance Calendar
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeTab === 'my'
              ? 'View your personal clock timings, leaves, and holidays on an interactive timeline.'
              : 'Monitor aggregates and individual shifts for leaves, holidays, and daily attendance.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-muted/10 p-1 rounded-xl border border-border">
          <button
            onClick={() => {
              setActiveTab('my');
              setCurrentView('dayGridMonth');
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === 'my'
                ? 'bg-[#8B5CF6] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Calendar
          </button>
          <button
            onClick={() => {
              setActiveTab('company');
              setCurrentView('dayGridMonth');
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === 'company'
                ? 'bg-[#8B5CF6] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Company Calendar
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar left (75%), Summary right (25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* FullCalendar Card */}
        <div className="lg:col-span-3">
          <Card className="shadow-premium-light dark:shadow-premium-dark border border-border transition-all duration-300">
            <CardContent className="p-4">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                initialDate="2026-06-03"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                }}
                events={calendarEvents}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                datesSet={(arg) => setCurrentView(arg.view.type)}
                height="auto"
                editable={false}
                selectable={true}
                dayMaxEvents={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Side Summary Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Google Calendar Sync */}
          <GoogleCalendarSync />

          <Card className="shadow-premium-light dark:shadow-premium-dark border border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/5">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Daily Breakdown Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-5">
              {/* Selected date display */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Selected Date</p>
                <p className="text-sm font-bold text-foreground font-display mt-0.5">{formatDate(focusedDateStr)}</p>
              </div>

              {/* KPI metrics */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-[#6BCB77]/10 border border-[#6BCB77]/20 text-center">
                  <p className="text-2xl font-extrabold font-mono text-[#6BCB77]">{summaryStats.present}</p>
                  <p className="text-[9px] font-bold text-[#6BCB77]/80 uppercase mt-0.5">Present</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F28B82]/10 border border-[#F28B82]/20 text-center">
                  <p className="text-2xl font-extrabold font-mono text-[#F28B82]">{summaryStats.absent}</p>
                  <p className="text-[9px] font-bold text-[#F28B82]/80 uppercase mt-0.5">Absent</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F7C873]/10 border border-[#F7C873]/20 text-center">
                  <p className="text-2xl font-extrabold font-mono text-[#F7C873]">{summaryStats.leave}</p>
                  <p className="text-[9px] font-bold text-[#F7C873]/80 uppercase mt-0.5">On Leave</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#8AB4F8]/10 border border-[#8AB4F8]/20 text-center">
                  <p className="text-2xl font-extrabold font-mono text-[#8AB4F8]">{summaryStats.holidayName ? 1 : 0}</p>
                  <p className="text-[9px] font-bold text-[#8AB4F8]/80 uppercase mt-0.5">Holiday</p>
                </div>
              </div>

              {/* Holiday info badge if present */}
              {summaryStats.holidayName && (
                <div className="p-3 rounded-xl bg-[#8AB4F8]/10 border border-[#8AB4F8]/20 text-xs text-[#8AB4F8] font-bold flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  <Info className="h-4.5 w-4.5 mt-0.5 shrink-0" />
                  <span>{summaryStats.holidayName}</span>
                </div>
              )}

              {/* Modal trigger action */}
              <Button
                onClick={() => setDetailDate(focusedDateStr)}
                className="w-full text-xs font-bold h-10 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center justify-center gap-1.5"
              >
                <UserCheck className="h-4 w-4" />
                View Detailed Table
              </Button>
            </CardContent>
          </Card>

          {/* Indicator Legends */}
          <Card className="shadow-premium-light dark:shadow-premium-dark border border-border">
            <CardHeader className="py-3 border-b border-border/50 bg-muted/5">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Legends
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 text-xs font-semibold text-foreground/80">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6BCB77]" /> Present
                </span>
                <span className="text-[10px] text-muted-foreground">#6BCB77</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FFD166]" /> Half Day
                </span>
                <span className="text-[10px] text-muted-foreground">#FFD166</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F28B82]" /> Absent
                </span>
                <span className="text-[10px] text-muted-foreground">#F28B82</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F7C873]" /> Leave
                </span>
                <span className="text-[10px] text-muted-foreground">#F7C873</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8AB4F8]" /> Holiday
                </span>
                <span className="text-[10px] text-muted-foreground">#8AB4F8</span>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Date detail Modal breakdown list */}
      <Modal
        isOpen={!!detailDate}
        onClose={() => setDetailDate(null)}
        title={`Staff Attendance Table: ${detailDate ? formatDate(detailDate) : ''}`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Modal filter options */}
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or status..."
                value={modalSearchQuery}
                onChange={e => setModalSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            {detailDate && (
              <Badge variant="outline" className="font-bold font-mono text-[10px] border-[#8B5CF6]/30 text-[#8B5CF6] px-2.5 py-1">
                Total Employees: {selectedDateDetails.length}
              </Badge>
            )}
          </div>

          {/* Table Container */}
          <div className="border border-border rounded-xl overflow-hidden shadow-sm max-h-[350px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-muted/10 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="py-2.5 text-xs">Employee Name</TableHead>
                  <TableHead className="py-2.5 text-xs">Employee ID</TableHead>
                  <TableHead className="py-2.5 text-xs">Department</TableHead>
                  <TableHead className="py-2.5 text-xs">Status</TableHead>
                  <TableHead className="py-2.5 text-xs">Clock In</TableHead>
                  <TableHead className="py-2.5 text-xs">Clock Out</TableHead>
                  <TableHead className="py-2.5 text-xs text-right">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDateDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs font-semibold">
                      No records match the active criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedDateDetails.map((rec, i) => (
                    <TableRow key={i} className="hover:bg-muted/5 transition-colors">
                      <TableCell className="py-3 font-semibold text-foreground flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center">
                          {rec.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs">{rec.name}</span>
                      </TableCell>
                      <TableCell className="py-3 font-mono text-xs font-bold text-muted-foreground">{rec.employee_id}</TableCell>
                      <TableCell className="py-3 text-muted-foreground text-xs font-medium">{rec.department}</TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant={
                            rec.status === 'Present'
                              ? 'success'
                              : rec.status === 'Half Day'
                              ? 'warning'
                              : rec.status === 'Leave'
                              ? 'info'
                              : 'danger'
                          }
                          className="px-2 py-0.5 text-[9px] font-extrabold uppercase"
                        >
                          {rec.status === 'Leave' && rec.isHoliday ? 'Holiday Off' : rec.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                        {rec.checkIn
                          ? new Date(`2000-01-01T${rec.checkIn}`).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '--:--'}
                      </TableCell>
                      <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                        {rec.checkOut
                          ? new Date(`2000-01-01T${rec.checkOut}`).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : rec.checkIn ? (
                            <span className="text-[var(--calendar-present-text)] font-semibold flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--calendar-present-text)] animate-pulse" />
                              Active Shift
                            </span>
                          ) : '--:--'}
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono text-xs text-foreground font-semibold">
                        {rec.workingHours !== null && rec.workingHours !== undefined ? `${Number(rec.workingHours).toFixed(2)}h` : '--'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
