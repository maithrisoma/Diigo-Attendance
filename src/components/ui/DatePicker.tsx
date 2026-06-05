import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" or "YYYY-MM-DD,YYYY-MM-DD" (for range)
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  selectsRange?: boolean;
  minDate?: string;
  maxDate?: string;
  error?: string;
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  selectsRange = false,
  minDate,
  maxDate,
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { startDateStr, endDateStr } = useMemo(() => {
    if (selectsRange) {
      const parts = value.split(',');
      return { startDateStr: parts[0] || '', endDateStr: parts[1] || '' };
    }
    return { startDateStr: value || '', endDateStr: '' };
  }, [value, selectsRange]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initialDate = useMemo(() => {
    if (startDateStr) return new Date(startDateStr);
    return new Date();
  }, [startDateStr]);

  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  const [hoverDateStr, setHoverDateStr] = useState<string | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (startDateStr) {
      const d = new Date(startDateStr);
      if (!isNaN(d.getTime())) {
        setViewMonth(d.getMonth());
        setViewYear(d.getFullYear());
      }
    }
  }, [startDateStr]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowYearPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = useMemo(() => {
    if (selectsRange) {
      if (!startDateStr) return '';
      const startFmt = formatDateString(startDateStr);
      if (!endDateStr) return `${startFmt} → ...`;
      return `${startFmt} → ${formatDateString(endDateStr)}`;
    }
    return startDateStr ? formatDateString(startDateStr) : '';
  }, [startDateStr, endDateStr, selectsRange]);

  function formatDateString(dateStr: string) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list = [];
    for (let y = currentYear - 30; y <= currentYear + 10; y++) list.push(y);
    return list;
  }, []);

  const daysGrid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const grid: { date: Date; isCurrentMonth: boolean }[] = [];
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      grid.push({ date: new Date(viewYear, viewMonth, -i), isCurrentMonth: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      grid.push({ date: new Date(viewYear, viewMonth, d), isCurrentMonth: true });
    }
    const remainder = grid.length % 7;
    if (remainder !== 0) {
      const endPadding = 7 - remainder;
      for (let i = 1; i <= endPadding; i++) {
        grid.push({ date: new Date(viewYear, viewMonth + 1, i), isCurrentMonth: false });
      }
    }
    return grid;
  }, [viewMonth, viewYear]);

  const isDateDisabled = (date: Date) => {
    const ds = toDateStr(date);
    if (minDate && ds < minDate) return true;
    if (maxDate && ds > maxDate) return true;
    return false;
  };

  function toDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    const dateStr = toDateStr(date);
    if (selectsRange) {
      if (!startDateStr || (startDateStr && endDateStr)) {
        onChange(`${dateStr},`);
      } else {
        if (dateStr < startDateStr) {
          onChange(`${dateStr},`);
        } else {
          onChange(`${startDateStr},${dateStr}`);
          setIsOpen(false);
        }
      }
    } else {
      onChange(dateStr);
      setIsOpen(false);
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handlePrevYear = () => setViewYear(y => y - 1);
  const handleNextYear = () => setViewYear(y => y + 1);

  const handleTodayClick = () => {
    const todayStr = toDateStr(today);
    if (isDateDisabled(today)) return;
    if (selectsRange) { onChange(`${todayStr},`); }
    else { onChange(todayStr); setIsOpen(false); }
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
    setShowYearPicker(false);
  };

  const handleClearClick = () => {
    onChange(selectsRange ? ',' : '');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedDate(startDateStr ? new Date(startDateStr) : new Date());
      }
      return;
    }
    const currentFocus = focusedDate || new Date();
    let nextFocus = new Date(currentFocus);
    switch (e.key) {
      case 'Escape':
        e.preventDefault(); setIsOpen(false); inputRef.current?.focus(); break;
      case 'Enter':
        e.preventDefault(); handleDateClick(currentFocus); break;
      case 'ArrowLeft':
        e.preventDefault(); nextFocus.setDate(currentFocus.getDate() - 1);
        setFocusedDate(nextFocus); setViewMonth(nextFocus.getMonth()); setViewYear(nextFocus.getFullYear()); break;
      case 'ArrowRight':
        e.preventDefault(); nextFocus.setDate(currentFocus.getDate() + 1);
        setFocusedDate(nextFocus); setViewMonth(nextFocus.getMonth()); setViewYear(nextFocus.getFullYear()); break;
      case 'ArrowUp':
        e.preventDefault(); nextFocus.setDate(currentFocus.getDate() - 7);
        setFocusedDate(nextFocus); setViewMonth(nextFocus.getMonth()); setViewYear(nextFocus.getFullYear()); break;
      case 'ArrowDown':
        e.preventDefault(); nextFocus.setDate(currentFocus.getDate() + 7);
        setFocusedDate(nextFocus); setViewMonth(nextFocus.getMonth()); setViewYear(nextFocus.getFullYear()); break;
    }
  };

  const isDateInRange = (dateStr: string) => {
    if (!selectsRange || !startDateStr) return false;
    const end = endDateStr || hoverDateStr;
    if (!end) return false;
    return dateStr > startDateStr && dateStr < end;
  };

  const isRangeStart = (dateStr: string) => selectsRange && dateStr === startDateStr && !!startDateStr;
  const isRangeEnd = (dateStr: string) => selectsRange && dateStr === endDateStr && !!endDateStr;

  return (
    <div ref={containerRef} className={`relative w-full flex flex-col space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-foreground/80 tracking-wide font-display text-left">
          {label}
        </label>
      )}

      {/* ── Trigger Input ── */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={displayValue}
          placeholder={placeholder}
          onClick={() => { setIsOpen(!isOpen); setShowYearPicker(false); }}
          onKeyDown={handleKeyDown}
          className={`flex h-10 w-full rounded-md border bg-card pl-10 pr-10 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 cursor-pointer text-left ${
            error
              ? 'border-rose-400 focus-visible:ring-rose-400'
              : 'border-input hover:border-[#7C6CF4] focus:border-[#7C6CF4]'
          } ${isOpen ? 'border-[#7C6CF4] ring-2 ring-[#7C6CF4]/20' : ''}`}
        />
        <CalendarIcon
          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors ${isOpen ? 'text-[#7C6CF4]' : 'text-muted-foreground'}`}
        />
        {value && value !== ',' && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClearClick(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-[#F3EEFF] text-muted-foreground hover:text-[#7C6CF4] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {error && <span className="text-xs text-rose-500 font-medium text-left">{error}</span>}

      {/* ── Calendar Popup ── */}
      {isOpen && (
        <div
          style={{
            borderRadius: '18px',
            boxShadow: '0 12px 40px rgba(109,116,201,0.18)',
            border: '1.5px solid #E9DDFC',
            backgroundColor: 'var(--card, #FFFFFF)',
          }}
          className="absolute left-0 mt-2 p-3 z-50 w-80 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200 select-none top-full overflow-hidden"
        >
          {showYearPicker ? (
            /* ── Year Picker Grid ── */
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => setShowYearPicker(false)}
                  className="text-xs font-bold text-[#7C6CF4] hover:bg-[#F3EEFF] px-2 py-1 rounded-lg transition-colors"
                >
                  ← Back
                </button>
                <span className="text-xs font-bold text-[#5B4FCF]">Select Year</span>
                <span className="w-12" />
              </div>
              <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {years.map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => { setViewYear(y); setShowYearPicker(false); }}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      y === viewYear
                        ? 'bg-[#7C6CF4] text-white shadow-sm'
                        : y === today.getFullYear()
                        ? 'border-2 border-[#7C6CF4] text-[#5B4FCF] bg-[#F8F5FF]'
                        : 'text-[#4B5563] hover:bg-[#F3EEFF] hover:text-[#5B4FCF]'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* ── Calendar Header ── */}
              <div className="flex items-center justify-between px-1">
                {/* Prev year / Prev month */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={handlePrevYear}
                    className="p-1.5 rounded-lg hover:bg-[#F3EEFF] text-[#7C6CF4] transition-colors"
                    title="Previous year"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg hover:bg-[#F3EEFF] text-[#7C6CF4] transition-colors"
                    title="Previous month"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Month / Year title — clickable to open year picker */}
                <button
                  type="button"
                  onClick={() => setShowYearPicker(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-[#F3EEFF] transition-colors group"
                >
                  <span className="text-sm font-bold text-[#5B4FCF] group-hover:text-[#7C6CF4]">
                    {MONTHS[viewMonth]}
                  </span>
                  <span className="text-sm font-bold text-[#7C6CF4]">{viewYear}</span>
                </button>

                {/* Next month / Next year */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg hover:bg-[#F3EEFF] text-[#7C6CF4] transition-colors"
                    title="Next month"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextYear}
                    className="p-1.5 rounded-lg hover:bg-[#F3EEFF] text-[#7C6CF4] transition-colors"
                    title="Next year"
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* ── Weekday Headers ── */}
              <div className="grid grid-cols-7 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <span
                    key={day}
                    className="text-[10px] font-bold text-[#6B7280] tracking-wider uppercase py-1"
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* ── Days Grid ── */}
              <div className="grid grid-cols-7 gap-y-1">
                {daysGrid.map((day, idx) => {
                  const dayStr = toDateStr(day.date);
                  const isDisabled = isDateDisabled(day.date);
                  const isToday = dayStr === toDateStr(today);
                  const isSelected =
                    dayStr === startDateStr || dayStr === endDateStr;
                  const inRange = isDateInRange(dayStr);
                  const rangeStart = isRangeStart(dayStr);
                  const rangeEnd = isRangeEnd(dayStr);
                  const isFocused = focusedDate && dayStr === toDateStr(focusedDate);
                  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

                  let cellClass =
                    'h-8 w-8 text-xs font-semibold rounded-xl flex items-center justify-center mx-auto relative cursor-pointer transition-all duration-100 ';

                  if (!day.isCurrentMonth) {
                    cellClass += 'opacity-25 text-[#6B7280] ';
                  } else if (isDisabled) {
                    cellClass += 'cursor-not-allowed opacity-20 text-[#6B7280] ';
                  } else if (isSelected) {
                    cellClass += 'bg-[#7C6CF4] text-white shadow-md scale-105 ';
                  } else if (inRange) {
                    cellClass += 'bg-[#EDE9FE] text-[#5B4FCF] rounded-none ';
                    if (rangeStart) cellClass += 'rounded-l-xl ';
                    if (rangeEnd) cellClass += 'rounded-r-xl ';
                  } else if (isToday) {
                    cellClass += 'border-2 border-[#7C6CF4] bg-[#F8F5FF] text-[#5B4FCF] font-bold ';
                  } else if (isWeekend) {
                    cellClass += 'text-[#9CA3AF] hover:bg-[#F3EEFF] hover:text-[#5B4FCF] ';
                  } else {
                    cellClass += 'text-[#4B5563] hover:bg-[#F3EEFF] hover:text-[#5B4FCF] ';
                  }

                  if (isFocused && !isSelected) {
                    cellClass += 'ring-2 ring-[#7C6CF4]/40 ';
                  }

                  // Dark mode
                  if (isSelected) {
                    cellClass += '[data-theme=dark]:bg-[#8B7DFF] ';
                  }
                  if (isToday && !isSelected) {
                    cellClass += '[data-theme=dark]:border-[#8B7DFF] [data-theme=dark]:text-[#C4B5FD] ';
                  }

                  return (
                    <div
                      key={idx}
                      className="flex justify-center"
                    >
                      <div
                        onClick={() => !isDisabled && handleDateClick(day.date)}
                        onMouseEnter={() => {
                          if (selectsRange && startDateStr && !endDateStr) {
                            setHoverDateStr(dayStr);
                          }
                        }}
                        className={cellClass}
                        tabIndex={-1}
                      >
                        {day.date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Footer ── */}
              <div
                style={{ borderTop: '1px solid #E9DDFC' }}
                className="flex justify-between items-center pt-2 mt-1"
              >
                <button
                  type="button"
                  onClick={handleTodayClick}
                  className="text-xs font-bold text-[#7C6CF4] hover:bg-[#F3EEFF] px-3 py-1.5 rounded-lg transition-colors"
                >
                  Today
                </button>
                <div className="flex items-center gap-1">
                  {/* Month quick selectors */}
                  <div className="flex gap-0.5">
                    {SHORT_MONTHS.map((m, i) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setViewMonth(i)}
                        className={`hidden lg:flex h-5 w-5 text-[9px] font-bold items-center justify-center rounded-md transition-colors ${
                          i === viewMonth
                            ? 'bg-[#7C6CF4] text-white'
                            : 'text-[#6B7280] hover:bg-[#F3EEFF] hover:text-[#5B4FCF]'
                        }`}
                      >
                        {m[0]}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearClick}
                  className="text-xs font-bold text-[#7C6CF4] hover:bg-[#F3EEFF] px-3 py-1.5 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
