import React, { useState, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { GoogleCalendarSync } from '../../components/ui/GoogleCalendarSync';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  PlaneTakeoff,
  Info
} from 'lucide-react';

const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const EmployeeCalendar: React.FC = () => {
  const { currentUser } = useAuth();
  const { attendance, holidays, leaveRequests } = useData();

  const calendarRef = useRef<FullCalendar | null>(null);

  // Selected date for shift log details panel (defaults to today's active mock date)
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-06-03');
  const [currentView, setCurrentView] = useState<string>('dayGridMonth');

  // Helper to extract personal day log
  const getDayLog = useMemo(() => {
    return (dateStr: string) => {
      const targetDateObj = new Date(dateStr);
      const dayOfWeek = targetDateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const holiday = holidays.find(h => h.holiday_date === dateStr);
      const rec = attendance.find(a => a.employee_id === currentUser?.employee_id && a.date === dateStr);
      const onLeave = leaveRequests.find(
        l =>
          l.employee_id === currentUser?.employee_id &&
          l.status === 'Approved' &&
          dateStr >= l.start_date.split('T')[0] &&
          dateStr <= l.end_date.split('T')[0]
      );

      let status: 'Present' | 'Absent' | 'Leave' | 'Holiday' | 'Weekend' | 'Future' = 'Absent';
      let checkIn: string | null = null;
      let checkOut: string | null = null;
      let workingHours: number | null = null;

      const todayStr = '2026-06-03';
      const isFuture = dateStr > todayStr;

      if (isFuture) {
        status = 'Future';
      } else if (rec) {
        if (rec.status === 'Present' || rec.status === 'Half Day') {
          status = 'Present';
        } else if (rec.status === 'Leave') {
          status = 'Leave';
        } else {
          status = 'Absent';
        }
        checkIn = rec.check_in;
        checkOut = rec.check_out;
        workingHours = rec.working_hours;
      } else if (onLeave) {
        status = 'Leave';
      } else if (holiday) {
        status = 'Holiday';
      } else if (isWeekend) {
        status = 'Weekend';
      }

      return { status, checkIn, checkOut, workingHours, holidayName: holiday?.holiday_name || onLeave?.leave_type, isWeekend, isFuture };
    };
  }, [attendance, holidays, leaveRequests, currentUser]);

  const activeDetailLog = useMemo(() => {
    return getDayLog(selectedDateStr);
  }, [selectedDateStr, getDayLog]);

  // Construct events for current employee calendar
  const personalEvents = useMemo(() => {
    const events: any[] = [];
    if (!currentUser) return events;

    // 1. Personal clock timings
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

    // 2. Personal approved leaves
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

    // 3. Global Holidays
    holidays.forEach(h => {
      events.push({
        id: `hol_${h.id}`,
        title: `🔵 Holiday: ${h.holiday_name}`,
        start: h.holiday_date,
        allDay: true,
        classNames: ['fc-event-holiday']
      });
    });

    return events;
  }, [currentUser, attendance, holidays, leaveRequests]);

  // Click date callback
  const handleDateClick = (arg: any) => {
    const dateStr = arg.dateStr;
    setSelectedDateStr(dateStr);
    
    if (currentView === 'dayGridMonth') {
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        calendarApi.changeView('timeGridDay', dateStr);
      }
    }
  };

  // Click event callback
  const handleEventClick = (arg: any) => {
    const eventDate = arg.event.startStr.split('T')[0];
    setSelectedDateStr(eventDate);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
          Attendance Calendar
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review your personal check-ins, holidays, and leaves inside an interactive scheduler.
        </p>
      </div>

      {/* Main Grid split: Calendar left (75%), Panel right (25%) */}
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
                events={personalEvents}
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

        {/* Right Section (Selected Day Details) */}
        <div className="lg:col-span-1 space-y-4">
          {/* Google Calendar Sync */}
          <GoogleCalendarSync />

          <Card className="hover:shadow-premium-light dark:hover:shadow-premium-dark border border-border transition-all duration-300">
            <CardHeader className="border-b border-border bg-muted/5 py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#8B5CF6]" />
                Shift Log Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-5">
              
              {/* Selected Date Header */}
              <div className="text-left">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Selected Date</p>
                <p className="text-sm font-bold font-display text-foreground mt-0.5">
                  {new Date(selectedDateStr).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Status Badge Block */}
              <div className="p-4 rounded-2xl border border-border/80 text-left flex items-start gap-3 bg-muted/5">
                <div className="mt-0.5">
                  {activeDetailLog.status === 'Present' ? (
                    <CheckCircle className="h-5 w-5 text-[#6BCB77]" />
                  ) : activeDetailLog.status === 'Leave' || activeDetailLog.status === 'Holiday' ? (
                    <PlaneTakeoff className="h-5 w-5 text-[#F7C873]" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-[#F28B82]" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Attendance Status</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {activeDetailLog.status === 'Future' ? 'Unmarked (Future)' : activeDetailLog.status}
                  </p>
                  {activeDetailLog.holidayName && (
                    <p className="text-xs font-semibold text-[#8B5CF6] mt-1">Details: {activeDetailLog.holidayName}</p>
                  )}
                </div>
              </div>

              {/* Timing logs */}
              {!activeDetailLog.isFuture && activeDetailLog.status !== 'Holiday' && activeDetailLog.status !== 'Weekend' && (
                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-left">
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Clock In</p>
                    <p className="text-sm font-bold font-mono text-foreground mt-1">
                      {activeDetailLog.checkIn
                        ? new Date(`2000-01-01T${activeDetailLog.checkIn}`).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '--:--'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Clock Out</p>
                    <p className="text-sm font-bold font-mono text-foreground mt-1">
                      {activeDetailLog.checkOut
                        ? new Date(`2000-01-01T${activeDetailLog.checkOut}`).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : activeDetailLog.checkIn ? (
                          <span className="text-[#6BCB77] font-semibold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#6BCB77] animate-pulse" />
                            Active
                          </span>
                        ) : '--:--'}
                    </p>
                  </div>
                </div>
              )}

              {/* Working hours stat */}
              {!activeDetailLog.isFuture && activeDetailLog.status === 'Present' && (
                <div className="border-t border-border pt-4 text-left">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Computed Working Hours</p>
                  <p className="text-2xl font-extrabold font-mono text-foreground mt-1">
                    {activeDetailLog.workingHours !== null && activeDetailLog.workingHours !== undefined
                      ? `${Number(activeDetailLog.workingHours).toFixed(2)}h`
                      : '0.00h'}
                  </p>
                </div>
              )}

              {/* Information text banner */}
              <div className="border-t border-border pt-4 text-left flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
                <Info className="h-4.5 w-4.5 text-muted-foreground/80 mt-0.5 flex-shrink-0" />
                <span>
                  Clock logs sync directly from security check-points. Bypassed automatically during holidays or approved leaves.
                </span>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};
