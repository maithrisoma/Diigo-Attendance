import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { ChevronLeft, ChevronRight, Info, CalendarDays, Clock, Timer, Milestone } from 'lucide-react';

export const EmployeeCalendar: React.FC = () => {
  const { currentUser } = useAuth();
  const { attendance, holidays } = useData();

  const [currentMonth, setCurrentMonth] = useState(new Date('2026-06-03').getMonth()); // Default to June (from anchor)
  const [currentYear, setCurrentYear] = useState(new Date('2026-06-03').getFullYear()); // Default to 2026

  // Selected date modal states
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    status: string;
    checkIn: string | null;
    checkOut: string | null;
    workingHours: number | null;
    holidayName?: string;
  } | null>(null);



  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Get days structure
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday, etc.
  };

  const totalDays = getDaysInMonth(currentMonth, currentYear);
  const startOffset = getFirstDayOfMonth(currentMonth, currentYear);

  // Generate calendar days
  const calendarDays: Array<{
    dayNumber: number | null;
    dateString: string | null;
    status: 'Present' | 'Absent' | 'Half Day' | 'Leave' | 'Holiday' | 'Weekend' | 'Future' | 'None';
    record?: any;
    holidayName?: string;
  }> = [];

  // Offset padding
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push({
      dayNumber: null,
      dateString: null,
      status: 'None',
    });
  }

  const today = new Date('2026-06-03');
  const todayStr = today.toISOString().split('T')[0];

  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(currentYear, currentMonth, day);
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const dayOfWeek = d.getDay();
    const isFuture = dateStr > todayStr;

    // Check if it is a holiday
    const holiday = holidays.find(h => h.holiday_date === dateStr);
    
    // Check if weekend
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Find attendance record
    const record = attendance.find(
      a => a.employee_id === currentUser?.employee_id && a.date === dateStr
    );

    let status: typeof calendarDays[0]['status'] = 'None';
    
    if (isFuture) {
      status = 'Future';
    } else if (holiday) {
      status = 'Holiday';
    } else if (isWeekend) {
      status = 'Weekend';
    } else if (record) {
      status = record.status;
    } else {
      // Past weekday with no check-in is marked Absent
      status = 'Absent';
    }

    calendarDays.push({
      dayNumber: day,
      dateString: dateStr,
      status,
      record,
      holidayName: holiday?.holiday_name,
    });
  }

  const getDayStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-[var(--calendar-present-bg)] text-[var(--calendar-present-text)] border-[var(--calendar-present-border)] hover:opacity-90';
      case 'Absent':
        return 'bg-[var(--calendar-absent-bg)] text-[var(--calendar-absent-text)] border-[var(--calendar-absent-border)] hover:opacity-90';
      case 'Half Day':
        return 'bg-[var(--calendar-halfday-bg)] text-[var(--calendar-halfday-text)] border-[var(--calendar-halfday-border)] hover:opacity-90';
      case 'Leave':
        return 'bg-[var(--calendar-leave-bg)] text-[var(--calendar-leave-text)] border-[var(--calendar-leave-border)] hover:opacity-90';
      case 'Holiday':
        return 'bg-[var(--calendar-holiday-bg)] text-[var(--calendar-holiday-text)] border-[var(--calendar-holiday-border)] hover:opacity-90';
      case 'Weekend':
        return 'bg-[var(--calendar-weekend-bg)] text-[var(--calendar-weekend-text)] border-[var(--calendar-weekend-border)] hover:opacity-90';
      case 'Future':
        return 'bg-card/20 text-muted-foreground/30 border-dashed border-border cursor-not-allowed';
      default:
        return 'bg-transparent text-transparent border-transparent cursor-default pointer-events-none';
    }
  };

  const handleDayClick = (day: typeof calendarDays[0]) => {
    if (!day.dateString || day.status === 'Future') return;

    setSelectedDayDetail({
      dateStr: day.dateString,
      status: day.status === 'Weekend' ? 'Weekend (Non-Working)' : day.status,
      checkIn: day.record?.check_in || null,
      checkOut: day.record?.check_out || null,
      workingHours: day.record?.working_hours || null,
      holidayName: day.holidayName,
    });
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            Attendance Calendar
          </h1>
          <p className="text-xs text-muted-foreground">
            View your monthly check-in history in a calendar grid. Click any day to see shifts details.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2.5 bg-card p-3 rounded-lg border border-border shadow-card text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-present" /> Present</div>
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-absent" /> Absent</div>
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-leave" /> Leave</div>
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-halfday" /> Half Day</div>
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-holiday" /> Holiday</div>
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-weekend" /> Weekend</div>
        </div>
      </div>

      {/* Main Calendar Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/5 pb-4">
          <CardTitle className="text-base font-semibold font-display">
            {monthNames[currentMonth]} {currentYear}
          </CardTitle>
          <div className="flex space-x-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 border border-border hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 border border-border hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 font-display uppercase tracking-wider mb-3">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const isToday = day.dateString === todayStr;
              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={`h-16 md:h-24 p-2 rounded-lg border flex flex-col justify-between transition-all duration-200 select-none cursor-pointer ${getDayStatusColor(
                    day.status
                  )} ${isToday ? 'ring-2 ring-primary border-primary' : ''}`}
                >
                  {day.dayNumber !== null ? (
                    <>
                      <span className="text-xs font-bold font-mono self-start">{day.dayNumber}</span>
                      <span className="hidden md:block text-[9.5px] font-bold text-right truncate">
                        {day.status === 'Holiday' ? 'Holiday' : day.status}
                      </span>
                    </>
                  ) : (
                    <div />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Date Detail Modal */}
      <Modal
        isOpen={!!selectedDayDetail}
        onClose={() => setSelectedDayDetail(null)}
        title="Shift Attendance Detail"
        size="sm"
      >
        {selectedDayDetail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Date</span>
              <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {new Date(selectedDayDetail.dateStr).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Status</span>
              <Badge
                variant={
                  selectedDayDetail.status === 'Present'
                    ? 'success'
                    : selectedDayDetail.status === 'Half Day'
                    ? 'warning'
                    : selectedDayDetail.status === 'Absent'
                    ? 'danger'
                    : selectedDayDetail.status.includes('Leave')
                    ? 'info'
                    : selectedDayDetail.status.includes('Holiday')
                    ? 'info'
                    : 'secondary'
                }
                className="px-3 py-0.5 text-xs font-semibold"
              >
                {selectedDayDetail.holidayName
                  ? `Holiday: ${selectedDayDetail.holidayName}`
                  : selectedDayDetail.status}
              </Badge>
            </div>

            {selectedDayDetail.checkIn && (
              <>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Clock In</span>
                  <span className="text-sm font-bold text-foreground font-mono flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {new Date(`2000-01-01T${selectedDayDetail.checkIn}`).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Clock Out</span>
                  <span className="text-sm font-bold text-foreground font-mono flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {selectedDayDetail.checkOut ? (
                      new Date(`2000-01-01T${selectedDayDetail.checkOut}`).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    ) : (
                      <span className="text-muted-foreground font-medium">Active Shift</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Working Hours</span>
                  <span className="text-sm font-bold text-primary font-mono flex items-center gap-1.5">
                    <Timer className="h-4 w-4 text-primary/70" />
                    {selectedDayDetail.workingHours !== null ? (
                      `${Number(selectedDayDetail.workingHours).toFixed(2)} hrs`
                    ) : (
                      <span className="text-muted-foreground font-medium">Running...</span>
                    )}
                  </span>
                </div>
              </>
            )}

            {selectedDayDetail.status === 'Absent' && (
              <div className="p-3 bg-[var(--calendar-absent-bg)]/30 border border-[#E88B8B]/20 rounded-lg flex gap-2">
                <Info className="h-4 w-4 text-[#E88B8B] mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-[#E88B8B] leading-normal font-medium">
                  No attendance record registered on this date. If you were present, contact HR to regularize your attendance.
                </p>
              </div>
            )}

            {selectedDayDetail.holidayName && (
              <div className="p-3 bg-[var(--calendar-holiday-bg)]/30 border border-[#87B5FF]/20 rounded-lg flex gap-2">
                <Milestone className="h-4 w-4 text-[#87B5FF] mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-[#87B5FF] leading-normal font-medium">
                  This date was marked as a company holiday: <span className="font-semibold">{selectedDayDetail.holidayName}</span>. Enjoy your off-day!
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
