import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  status?: 'present' | 'absent' | 'leave' | 'holiday' | 'halfday';
  holidayName?: string;
}

interface LiveCalendarProps {
  /** attendance records keyed by date string YYYY-MM-DD */
  attendanceByDate?: Record<string, { status: string }>;
  /** holiday dates keyed by YYYY-MM-DD */
  holidayByDate?: Record<string, string>;
  /** compact mode for sidebar/widget use */
  compact?: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function buildCalendarGrid(year: number, month: number): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: CalendarDay[] = [];

  // Fill leading days from previous month
  for (let i = 0; i < firstDay.getDay(); i++) {
    const d = new Date(year, month, -(firstDay.getDay() - i - 1));
    days.push({ date: d, isCurrentMonth: false, isToday: false, isWeekend: d.getDay() === 0 || d.getDay() === 6 });
  }

  // Fill current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    });
  }

  // Fill trailing days to complete last week row
  const remainder = days.length % 7;
  if (remainder !== 0) {
    for (let i = 1; i <= 7 - remainder; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, isToday: false, isWeekend: d.getDay() === 0 || d.getDay() === 6 });
    }
  }

  return days;
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const LiveCalendar: React.FC<LiveCalendarProps> = ({
  attendanceByDate = {},
  holidayByDate = {},
  compact = false,
}) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const grid = useMemo(() => {
    const days = buildCalendarGrid(viewYear, viewMonth);
    return days.map(day => {
      const ds = toDateStr(day.date);
      const att = attendanceByDate[ds];
      const hol = holidayByDate[ds];
      let status: CalendarDay['status'] = undefined;
      let holidayName: string | undefined = undefined;

      if (hol) {
        status = 'holiday';
        holidayName = hol;
      } else if (att) {
        const s = att.status?.toLowerCase();
        if (s === 'present') status = 'present';
        else if (s === 'absent') status = 'absent';
        else if (s === 'leave') status = 'leave';
        else if (s === 'half day') status = 'halfday';
      }
      return { ...day, status, holidayName };
    });
  }, [viewYear, viewMonth, attendanceByDate, holidayByDate]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  const statusStyles: Record<string, string> = {
    present:  'bg-[var(--calendar-present-bg)] text-[var(--calendar-present-text)] ring-1 ring-[var(--calendar-present-border)]',
    absent:   'bg-[var(--calendar-absent-bg)] text-[var(--calendar-absent-text)] ring-1 ring-[var(--calendar-absent-border)]',
    leave:    'bg-[var(--calendar-leave-bg)] text-[var(--calendar-leave-text)] ring-1 ring-[var(--calendar-leave-border)]',
    holiday:  'bg-[var(--calendar-holiday-bg)] text-[var(--calendar-holiday-text)] ring-1 ring-[var(--calendar-holiday-border)]',
    halfday:  'bg-[var(--calendar-halfday-bg)] text-[var(--calendar-halfday-text)] ring-1 ring-[var(--calendar-halfday-border)]',
  };

  const cellSize = compact ? 'h-8 w-8 text-[11px]' : 'h-9 w-9 text-xs';
  const dayNameSize = compact ? 'text-[10px]' : 'text-[11px]';

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className={`font-bold text-foreground font-display ${compact ? 'text-sm' : 'text-base'}`}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
          {(viewYear !== today.getFullYear() || viewMonth !== today.getMonth()) && (
            <button
              onClick={goToday}
              className="text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full transition-colors"
            >
              Today
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded-lg hover:bg-muted/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-lg hover:bg-muted/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className={`text-center font-bold text-muted-foreground ${dayNameSize} py-1`}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {grid.map((day, i) => {
          const ds = toDateStr(day.date);
          const isFuture = day.date > today;

          let cellCls = `${cellSize} rounded-lg flex items-center justify-center mx-auto font-medium transition-all duration-150 relative group cursor-default`;

          if (!day.isCurrentMonth) {
            cellCls += ' text-muted-foreground/30';
          } else if (day.isToday) {
            cellCls += ' bg-primary text-primary-foreground font-bold shadow-sm ring-2 ring-primary/40';
          } else if (day.status) {
            cellCls += ' ' + statusStyles[day.status];
          } else if (day.isWeekend) {
            cellCls += ' text-muted-foreground/50';
          } else if (isFuture) {
            cellCls += ' text-foreground/60 hover:bg-muted/10';
          } else {
            cellCls += ' text-foreground hover:bg-muted/10';
          }

          return (
            <div key={`${ds}-${i}`} className="flex justify-center relative">
              <div className={cellCls} title={day.holidayName || day.status || ''}>
                {day.date.getDate()}
                {/* Holiday dot indicator */}
                {day.status === 'holiday' && day.isCurrentMonth && !day.isToday && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[var(--calendar-holiday-text)]" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-4 pt-3 border-t border-border">
          {[
            { key: 'present',  label: 'Present',  dot: 'bg-[var(--calendar-present-text)]' },
            { key: 'absent',   label: 'Absent',   dot: 'bg-[var(--calendar-absent-text)]' },
            { key: 'leave',    label: 'Leave',    dot: 'bg-[var(--calendar-leave-text)]' },
            { key: 'holiday',  label: 'Holiday',  dot: 'bg-[var(--calendar-holiday-text)]' },
            { key: 'halfday',  label: 'Half Day', dot: 'bg-[var(--calendar-halfday-text)]' },
          ].map(({ key, label, dot }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
              <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
