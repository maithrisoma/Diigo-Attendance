import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

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
  /** called when a date cell is clicked */
  onDateClick?: (dateStr: string) => void;
  /** currently selected/highlighted date */
  selectedDate?: string;
}

const DAY_NAMES_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_COMPACT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function buildCalendarGrid(year: number, month: number): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: CalendarDay[] = [];

  for (let i = 0; i < firstDay.getDay(); i++) {
    const d = new Date(year, month, -(firstDay.getDay() - i - 1));
    days.push({ date: d, isCurrentMonth: false, isToday: false, isWeekend: d.getDay() === 0 || d.getDay() === 6 });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);
    days.push({ date, isCurrentMonth: true, isToday: date.getTime() === today.getTime(), isWeekend: date.getDay() === 0 || date.getDay() === 6 });
  }
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

const STATUS_STYLES: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
  present:  { bg: '#EAF8EC', text: '#2E7D32', ring: '#6BCB77', dot: '#6BCB77' },
  absent:   { bg: '#FDECEC', text: '#C62828', ring: '#F28B82', dot: '#F28B82' },
  leave:    { bg: '#FFF6E1', text: '#EF6C00', ring: '#F7C873', dot: '#F7C873' },
  holiday:  { bg: '#ECF4FF', text: '#1565C0', ring: '#8AB4F8', dot: '#8AB4F8' },
  halfday:  { bg: '#FFF7D6', text: '#B8860B', ring: '#FFD166', dot: '#FFD166' },
};

const DARK_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  present:  { bg: '#153322', text: '#86EFAC' },
  absent:   { bg: '#3F1F1F', text: '#FCA5A5' },
  leave:    { bg: '#3F2E12', text: '#FDE047' },
  holiday:  { bg: '#182845', text: '#93C5FD' },
  halfday:  { bg: '#3F3512', text: '#FFE082' },
};

export const LiveCalendar: React.FC<LiveCalendarProps> = ({
  attendanceByDate = {},
  holidayByDate = {},
  compact = false,
  onDateClick,
  selectedDate,
}) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const years = useMemo(() => {
    const current = today.getFullYear();
    const list = [];
    for (let y = current - 10; y <= current + 5; y++) list.push(y);
    return list;
  }, []);

  const grid = useMemo(() => {
    const days = buildCalendarGrid(viewYear, viewMonth);
    return days.map(day => {
      const ds = toDateStr(day.date);
      const att = attendanceByDate[ds];
      const hol = holidayByDate[ds];
      let status: CalendarDay['status'] = undefined;
      let holidayName: string | undefined = undefined;
      if (hol) { status = 'holiday'; holidayName = hol; }
      else if (att) {
        const s = att.status?.toLowerCase();
        if (s === 'present') status = 'present';
        else if (s === 'absent') status = 'absent';
        else if (s === 'leave') status = 'leave';
        else if (s === 'half day') status = 'halfday';
      }
      return { ...day, status, holidayName };
    });
  }, [viewYear, viewMonth, attendanceByDate, holidayByDate]);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const prevYear = () => setViewYear(y => y - 1);
  const nextYear = () => setViewYear(y => y + 1);
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setShowYearPicker(false); };

  const dayNames = compact ? DAY_NAMES_COMPACT : DAY_NAMES_FULL;
  const cellSize = compact ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs';

  return (
    <div className="select-none">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3">

        {/* Left nav: prev year + prev month */}
        <div className="flex items-center gap-0.5">
          {!compact && (
            <button
              onClick={prevYear}
              className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#2563EB] transition-colors"
              title="Previous year"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#2563EB] transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Month / Year — click to toggle year picker */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowYearPicker(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-[#F1F5F9] transition-colors group"
          >
            <span className={`font-bold text-[#1D4ED8] group-hover:text-[#2563EB] ${compact ? 'text-sm' : 'text-base'}`}>
              {MONTH_NAMES[viewMonth]}
            </span>
            <span className={`font-bold text-[#2563EB] ${compact ? 'text-sm' : 'text-base'}`}>
              {viewYear}
            </span>
          </button>
          {(viewYear !== today.getFullYear() || viewMonth !== today.getMonth()) && (
            <button
              onClick={goToday}
              className="text-[10px] font-bold text-[#2563EB] bg-[#F1F5F9] hover:bg-[#F1F5F9] px-2 py-0.5 rounded-full transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* Right nav: next month + next year */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#2563EB] transition-colors"
            title="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          {!compact && (
            <button
              onClick={nextYear}
              className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#2563EB] transition-colors"
              title="Next year"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Year Picker (inline) ── */}
      {showYearPicker && (
        <div
          style={{ borderRadius: '14px', border: '1.5px solid #E9DDFC' }}
          className="mb-3 p-2.5 bg-[#F8F5FF] overflow-hidden"
        >
          <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {years.map(y => (
              <button
                key={y}
                type="button"
                onClick={() => { setViewYear(y); setShowYearPicker(false); }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  y === viewYear
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : y === today.getFullYear()
                    ? 'border-2 border-[#2563EB] text-[#1D4ED8] bg-white'
                    : 'text-[#4B5563] hover:bg-[#F1F5F9] hover:text-[#1D4ED8]'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Weekday Headers ── */}
      <div className="grid grid-cols-7 mb-1.5">
        {dayNames.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className={`text-center font-bold text-[#6B7280] py-1 ${compact ? 'text-[9px]' : 'text-[11px]'}`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar Grid ── */}
      <div className="grid grid-cols-7 gap-y-1">
        {grid.map((day, i) => {
          const ds = toDateStr(day.date);
          const isFuture = day.date > today;
          const isSelected = selectedDate && ds === selectedDate;
          const st = day.status;
          const styleInfo = st ? STATUS_STYLES[st] : null;

          let baseClass = `${cellSize} rounded-xl flex items-center justify-center mx-auto font-semibold transition-all duration-150 relative`;

          if (onDateClick && day.isCurrentMonth) {
            baseClass += ' cursor-pointer';
          } else {
            baseClass += ' cursor-default';
          }

          let inlineStyle: React.CSSProperties = {};

          if (!day.isCurrentMonth) {
            baseClass += ' text-[#6B7280] opacity-20';
          } else if (isSelected) {
            baseClass += ' bg-[#2563EB] text-white shadow-md scale-105';
          } else if (day.isToday) {
            baseClass += ' border-2 border-[#2563EB] bg-[#F8F5FF] text-[#1D4ED8] font-bold';
          } else if (st && styleInfo) {
            inlineStyle = {
              backgroundColor: styleInfo.bg,
              color: styleInfo.text,
              boxShadow: `0 0 0 1.5px ${styleInfo.ring}50`,
            };
            baseClass += ' hover:scale-105';
          } else if (day.isWeekend) {
            baseClass += ' text-[#9CA3AF] hover:bg-[#F1F5F9] hover:text-[#1D4ED8]';
          } else if (isFuture) {
            baseClass += ' text-[#9CA3AF] hover:bg-[#F1F5F9] hover:text-[#1D4ED8]';
          } else {
            baseClass += ' text-[#4B5563] hover:bg-[#F1F5F9] hover:text-[#1D4ED8]';
          }

          return (
            <div key={`${ds}-${i}`} className="flex justify-center relative">
              <div
                className={baseClass}
                style={inlineStyle}
                title={day.holidayName || (st ? st.charAt(0).toUpperCase() + st.slice(1) : '') || ''}
                onClick={() => day.isCurrentMonth && onDateClick && onDateClick(ds)}
              >
                {day.date.getDate()}
                {/* Status dot for compact view */}
                {compact && st && day.isCurrentMonth && !day.isToday && !isSelected && (
                  <span
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full"
                    style={{ backgroundColor: styleInfo?.dot }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer: Today shortcut + Legend ── */}
      {!compact && (
        <div
          style={{ borderTop: '1px solid #E9DDFC' }}
          className="mt-3 pt-3"
        >
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {[
              { key: 'present',  label: 'Present' },
              { key: 'absent',   label: 'Absent' },
              { key: 'leave',    label: 'Leave' },
              { key: 'holiday',  label: 'Holiday' },
              { key: 'halfday',  label: 'Half Day' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_STYLES[key]?.dot }}
                />
                <span className="text-[11px] text-[#6B7280] font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
