import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { TableWrapper, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { ChevronLeft, ChevronRight, Users, UserCheck, UserX, PlaneTakeoff, Clock, CalendarDays } from 'lucide-react';
import { AttendanceStatus } from '../../types';

export const AttendanceCalendar: React.FC = () => {
  const { employees, attendance, holidays } = useData();

  const [currentMonth, setCurrentMonth] = useState(new Date('2026-06-03').getMonth()); // Default June
  const [currentYear, setCurrentYear] = useState(new Date('2026-06-03').getFullYear()); // Default 2026

  // Selected date modal states
  const [detailDate, setDetailDate] = useState<string | null>(null);
  
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

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const totalDays = getDaysInMonth(currentMonth, currentYear);
  const startOffset = getFirstDayOfMonth(currentMonth, currentYear);

  // Compute daily totals for the calendar cells
  const calendarDays = useMemo(() => {
    const todayStr = new Date('2026-06-03').toISOString().split('T')[0];
    const days: Array<{
      dayNumber: number | null;
      dateStr: string | null;
      present: number;
      absent: number;
      leave: number;
      isWeekend: boolean;
      holidayName?: string;
      isFuture: boolean;
    }> = [];

    // Offset padding
    for (let i = 0; i < startOffset; i++) {
      days.push({
        dayNumber: null,
        dateStr: null,
        present: 0,
        absent: 0,
        leave: 0,
        isWeekend: false,
        isFuture: false,
      });
    }

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(currentYear, currentMonth, day);
      const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFuture = dateStr > todayStr;

      // Find holidays
      const holiday = holidays.find(h => h.holiday_date === dateStr);

      // Find records for this date
      const dayRecords = attendance.filter(a => a.date === dateStr);

      let present = 0;
      let absent = 0;
      let leave = 0;

      if (!isFuture) {
        employees.forEach(emp => {
          const rec = dayRecords.find(r => r.employee_id === emp.employee_id);
          if (rec) {
            if (rec.status === 'Present' || rec.status === 'Half Day') {
              present++;
            } else if (rec.status === 'Leave') {
              leave++;
            } else {
              absent++;
            }
          } else {
            if (holiday) {
              leave++; // Holiday counts as leave/off
            } else if (isWeekend) {
              leave++; // Weekend off
            } else {
              absent++; // weekday no check-in
            }
          }
        });
      }

      days.push({
        dayNumber: day,
        dateStr,
        present,
        absent,
        leave,
        isWeekend,
        holidayName: holiday?.holiday_name,
        isFuture,
      });
    }

    return days;
  }, [currentMonth, currentYear, employees, attendance, holidays, totalDays, startOffset]);

  // Click handler to open date details modal
  const handleDateClick = (day: typeof calendarDays[0]) => {
    if (!day.dateStr || day.isFuture) return;
    setDetailDate(day.dateStr);
  };

  // Generate records inside detail modal for the selected date
  const selectedDateDetails = useMemo(() => {
    if (!detailDate) return [];

    const dayRecords = attendance.filter(a => a.date === detailDate);
    const holiday = holidays.find(h => h.holiday_date === detailDate);
    const dayOfWeek = new Date(detailDate).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return employees.map(emp => {
      const rec = dayRecords.find(r => r.employee_id === emp.employee_id);
      
      let status: AttendanceStatus = 'Absent';
      let checkIn: string | null = null;
      let checkOut: string | null = null;
      let workingHours: number | null = null;

      if (rec) {
        status = rec.status;
        checkIn = rec.check_in;
        checkOut = rec.check_out;
        workingHours = rec.working_hours;
      } else if (holiday) {
        status = 'Leave';
      } else if (isWeekend) {
        status = 'Leave';
      }

      return {
        name: emp.name,
        department: emp.department,
        status,
        checkIn,
        checkOut,
        workingHours,
        isHoliday: !!holiday,
        isWeekend,
      };
    });
  }, [detailDate, employees, attendance, holidays]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            Calendar Overview
          </h1>
          <p className="text-xs text-muted-foreground">
            Monitor daily headcount distributions (Present, Absent, Leaves) directly inside a monthly layout.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 bg-card p-3 rounded-xl border border-border shadow-card text-xs font-semibold text-foreground/80">
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--calendar-present-text)]" /> Present</div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--calendar-absent-text)]" /> Absent</div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--calendar-leave-text)]" /> Leave / Off</div>
        </div>
      </div>

      {/* Monthly grid calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/5 pb-4">
          <CardTitle className="text-base font-semibold font-display">
            {monthNames[currentMonth]} {currentYear}
          </CardTitle>
          <div className="flex space-x-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 border border-border bg-card hover:bg-muted/10 rounded-lg text-foreground/85 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 border border-border bg-card hover:bg-muted/10 rounded-lg text-foreground/85 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-muted-foreground font-display uppercase tracking-wider mb-3">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const isToday = day.dateStr === '2026-06-03';
              return (
                <div
                  key={idx}
                  onClick={() => handleDateClick(day)}
                  className={`h-20 md:h-28 p-2 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                    day.dayNumber === null
                      ? 'bg-transparent border-transparent pointer-events-none'
                      : day.isFuture
                      ? 'bg-muted/5 text-muted-foreground/30 border-dashed border-border cursor-not-allowed'
                      : day.isWeekend
                      ? 'bg-[var(--calendar-weekend-bg)] border-[var(--calendar-weekend-border)] text-muted-foreground cursor-pointer hover:opacity-85'
                      : 'bg-card border-border text-foreground cursor-pointer hover:bg-muted/5'
                  } ${isToday ? 'ring-2 ring-primary border-primary' : ''}`}
                >
                {day.dayNumber !== null && (
                  <>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold font-mono">{day.dayNumber}</span>
                      {day.holidayName && (
                        <span className="bg-[var(--calendar-holiday-bg)] text-[var(--calendar-holiday-text)] border border-[var(--calendar-holiday-border)] text-[8px] font-bold px-1 rounded truncate max-w-[45px] md:max-w-none">
                          {day.holidayName}
                        </span>
                      )}
                    </div>
                    
                    {!day.isFuture && (
                      <div className="flex flex-col space-y-0.5 md:space-y-1 text-[10px] md:text-xs font-bold font-mono">
                        <div className="text-[var(--calendar-present-text)] flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--calendar-present-text)] hidden md:block" />
                          <span>P: {day.present}</span>
                        </div>
                        <div className="text-[var(--calendar-absent-text)] flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--calendar-absent-text)] hidden md:block" />
                          <span>A: {day.absent}</span>
                        </div>
                        <div className="text-[var(--calendar-leave-text)] flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--calendar-leave-text)] hidden md:block" />
                          <span>L: {day.leave}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily breakdown detail Modal */}
      <Modal
        isOpen={!!detailDate}
        onClose={() => setDetailDate(null)}
        title={`Attendance Registry: ${detailDate ? new Date(detailDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}`}
        size="xl"
      >
        <div className="space-y-4">
          <TableWrapper>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead className="text-right">Working Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedDateDetails.map((rec, i) => (
                <TableRow key={i}>
                  <TableCell className="font-semibold text-foreground">{rec.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-medium">{rec.department}</TableCell>
                  <TableCell>
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
                      className="px-2.5 py-0.5 text-[10.5px] font-semibold"
                    >
                      {rec.status === 'Leave' && rec.isHoliday ? 'Holiday Off' : rec.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {rec.checkIn
                      ? new Date(`2000-01-01T${rec.checkIn}`).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--:--'}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {rec.checkOut
                      ? new Date(`2000-01-01T${rec.checkOut}`).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : rec.checkIn ? (
                        <span className="text-[var(--calendar-present-text)] font-bold animate-pulse">Active</span>
                      ) : '--:--'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-foreground font-semibold">
                    {rec.workingHours !== null && rec.workingHours !== undefined ? `${Number(rec.workingHours).toFixed(2)}h` : '--'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableWrapper>
        </div>
      </Modal>
    </div>
  );
};
