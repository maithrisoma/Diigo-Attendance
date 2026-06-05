import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../components/ui/Toast';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { DatePicker } from '../../components/ui/DatePicker';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Check,
  AlertCircle,
  CalendarDays,
  Flag,
  Star,
  Repeat,
} from 'lucide-react';
import { Holiday } from '../../types';

const HOLIDAY_TYPES = [
  'National Holiday',
  'Festival Holiday',
  'Company Holiday',
  'Optional Holiday',
];

const MONTHS = [
  { value: 'all', label: 'All Months' },
  { value: '0', label: 'January' },
  { value: '1', label: 'February' },
  { value: '2', label: 'March' },
  { value: '3', label: 'April' },
  { value: '4', label: 'May' },
  { value: '5', label: 'June' },
  { value: '6', label: 'July' },
  { value: '7', label: 'August' },
  { value: '8', label: 'September' },
  { value: '9', label: 'October' },
  { value: '10', label: 'November' },
  { value: '11', label: 'December' },
];

const TYPE_BADGE_MAP: Record<string, React.ReactNode> = {
  'National Holiday': (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
      <Flag className="h-3 w-3" />National
    </span>
  ),
  'Festival Holiday': (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
      <Star className="h-3 w-3" />Festival
    </span>
  ),
  'Company Holiday': (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
      <CalendarDays className="h-3 w-3" />Company
    </span>
  ),
  'Optional Holiday': (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
      <CalendarDays className="h-3 w-3" />Optional
    </span>
  ),
};

export const HolidayManagement: React.FC = () => {
  const { holidays, addHoliday, updateHoliday, removeHoliday } = useData();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  const [holidayForm, setHolidayForm] = useState<Omit<Holiday, 'id'>>({
    holiday_name: '',
    holiday_date: '',
    holiday_type: 'Festival Holiday',
    is_recurring: false,
  });
  const [error, setError] = useState('');

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  const getDayName = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { weekday: 'short' });

  const filteredHolidays = useMemo(() => {
    return holidays
      .filter((h) => {
        const matchesSearch = h.holiday_name.toLowerCase().includes(searchQuery.toLowerCase().trim());
        let matchesMonth = true;
        if (selectedMonth !== 'all') {
          matchesMonth = new Date(h.holiday_date).getMonth().toString() === selectedMonth;
        }
        const matchesType = selectedType === 'all' || h.holiday_type === selectedType;
        return matchesSearch && matchesMonth && matchesType;
      })
      .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
  }, [holidays, searchQuery, selectedMonth, selectedType]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMonth('all');
    setSelectedType('all');
  };

  const validateForm = () => {
    if (!holidayForm.holiday_name.trim()) { setError('Holiday Name is required'); return false; }
    if (!holidayForm.holiday_date) { setError('Holiday Date is required'); return false; }
    setError('');
    return true;
  };

  const applyRecurringLogic = (form: typeof holidayForm) => {
    const dateObj = new Date(form.holiday_date);
    const day = dateObj.getDate();
    const month = dateObj.getMonth();
    const name = form.holiday_name.toLowerCase();
    if (
      (month === 0 && day === 26) || name.includes('republic') ||
      (month === 7 && day === 15) || name.includes('independence') ||
      (month === 9 && day === 2) || name.includes('gandhi')
    ) {
      return true;
    }
    return form.is_recurring;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    addHoliday({ ...holidayForm, is_recurring: applyRecurringLogic(holidayForm) });
    toast(`Added holiday "${holidayForm.holiday_name}" successfully!`, 'success');
    setAddOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHoliday || !validateForm()) return;
    updateHoliday(selectedHoliday.id, { ...holidayForm, is_recurring: applyRecurringLogic(holidayForm) });
    toast(`Updated holiday "${holidayForm.holiday_name}"!`, 'success');
    setEditOpen(false);
    resetForm();
  };

  const handleDeleteConfirm = () => {
    if (!selectedHoliday) return;
    removeHoliday(selectedHoliday.id);
    toast(`Deleted holiday "${selectedHoliday.holiday_name}"`, 'success');
    setDeleteOpen(false);
    setSelectedHoliday(null);
  };

  const openEdit = (h: Holiday) => {
    setSelectedHoliday(h);
    setHolidayForm({
      holiday_name: h.holiday_name,
      holiday_date: h.holiday_date,
      holiday_type: h.holiday_type || 'Festival Holiday',
      is_recurring: !!h.is_recurring,
    });
    setEditOpen(true);
  };

  const openDelete = (h: Holiday) => {
    setSelectedHoliday(h);
    setDeleteOpen(true);
  };

  const resetForm = () => {
    setHolidayForm({ holiday_name: '', holiday_date: '', holiday_type: 'Festival Holiday', is_recurring: false });
    setSelectedHoliday(null);
    setError('');
  };

  // KPIs
  const nationalCount = holidays.filter((h) => h.holiday_type === 'National Holiday').length;
  const festivalCount = holidays.filter((h) => h.holiday_type === 'Festival Holiday').length;
  const recurringCount = holidays.filter((h) => h.is_recurring).length;

  return (
    <div className="space-y-6 text-left">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            Holiday Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure, update, and track corporate and public holidays across the calendar.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setAddOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
        >
          <Plus className="h-4 w-4" />
          Add Holiday
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Holidays', value: holidays.length, icon: CalendarDays, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'National', value: nationalCount, icon: Flag, color: 'text-rose-600', bg: 'bg-rose-500/10' },
          { label: 'Festival', value: festivalCount, icon: Star, color: 'text-amber-600', bg: 'bg-amber-500/10' },
          { label: 'Annual Recurring', value: recurringCount, icon: Repeat, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 shadow-sm"
          >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${kpi.bg}`}>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground leading-none">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row gap-3 shadow-sm flex-wrap items-end">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search holiday name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-border bg-muted/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        {/* Month Filter */}
        <div className="min-w-[150px]">
          <Select label="" options={MONTHS} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
        </div>

        {/* Type Filter */}
        <div className="min-w-[160px]">
          <Select
            label=""
            options={[{ value: 'all', label: 'All Types' }, ...HOLIDAY_TYPES.map((t) => ({ value: t, label: t }))]}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          />
        </div>

        {/* Reset */}
        <button
          onClick={handleResetFilters}
          className="h-10 px-4 py-2 bg-muted/10 hover:bg-muted/20 text-foreground border border-border rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {/* ── Holidays Table ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden text-foreground">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-4 px-6">Holiday Name</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6 text-center">Recurring</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredHolidays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-muted-foreground text-xs">
                    No holiday records matched your filters.
                  </td>
                </tr>
              ) : (
                filteredHolidays.map((holiday) => (
                  <tr key={holiday.id} className="hover:bg-muted/5 transition-colors">
                    {/* Holiday Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs flex-shrink-0">
                          <CalendarDays className="h-4 w-4" />
                        </div>
                        <p className="font-semibold text-foreground">{holiday.holiday_name}</p>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6">
                      <p className="font-mono text-xs text-foreground font-semibold">{fmtDate(holiday.holiday_date)}</p>
                      <p className="text-[11px] text-muted-foreground">{getDayName(holiday.holiday_date)}</p>
                    </td>

                    {/* Type */}
                    <td className="py-4 px-6">
                      {TYPE_BADGE_MAP[holiday.holiday_type] ?? (
                        <span className="text-xs text-muted-foreground">{holiday.holiday_type}</span>
                      )}
                    </td>

                    {/* Recurring */}
                    <td className="py-4 px-6 text-center">
                      {holiday.is_recurring ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          <Repeat className="h-3 w-3" />
                          Annual
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-muted-foreground">One-time</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(holiday)}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/10 transition"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDelete(holiday)}
                          className="p-1.5 rounded-lg border border-rose-100 text-rose-500 hover:bg-rose-500/10 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredHolidays.length > 0 && (
          <div className="border-t border-border px-6 py-3 flex items-center justify-between text-xs text-muted-foreground bg-muted/5">
            <span>
              Showing <span className="font-semibold text-foreground">{filteredHolidays.length}</span> of{' '}
              <span className="font-semibold text-foreground">{holidays.length}</span> holidays
            </span>
            <span className="font-semibold text-primary">
              {nationalCount} National · {festivalCount} Festival · {recurringCount} Recurring
            </span>
          </div>
        )}
      </div>

      {/* ── Add Holiday Modal ── */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add New Holiday" size="sm">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Holiday Name</label>
            <Input
              placeholder="e.g. Diwali"
              value={holidayForm.holiday_name}
              onChange={(e) => setHolidayForm((p) => ({ ...p, holiday_name: e.target.value }))}
            />
          </div>
          <DatePicker
            label="Holiday Date"
            value={holidayForm.holiday_date}
            onChange={(val) => setHolidayForm((p) => ({ ...p, holiday_date: val }))}
          />
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Holiday Type</label>
            <Select
              options={HOLIDAY_TYPES.map((t) => ({ value: t, label: t }))}
              value={holidayForm.holiday_type}
              onChange={(e) => setHolidayForm((p) => ({ ...p, holiday_type: e.target.value as any }))}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_recurring_add"
              checked={holidayForm.is_recurring}
              onChange={(e) => setHolidayForm((p) => ({ ...p, is_recurring: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="is_recurring_add" className="text-xs font-semibold text-muted-foreground cursor-pointer">
              Recurring annual holiday
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">Add Holiday</Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Holiday Modal ── */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Holiday" size="sm">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Holiday Name</label>
            <Input
              placeholder="e.g. Holi"
              value={holidayForm.holiday_name}
              onChange={(e) => setHolidayForm((p) => ({ ...p, holiday_name: e.target.value }))}
            />
          </div>
          <DatePicker
            label="Holiday Date"
            value={holidayForm.holiday_date}
            onChange={(val) => setHolidayForm((p) => ({ ...p, holiday_date: val }))}
          />
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Holiday Type</label>
            <Select
              options={HOLIDAY_TYPES.map((t) => ({ value: t, label: t }))}
              value={holidayForm.holiday_type}
              onChange={(e) => setHolidayForm((p) => ({ ...p, holiday_type: e.target.value as any }))}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_recurring_edit"
              checked={holidayForm.is_recurring}
              onChange={(e) => setHolidayForm((p) => ({ ...p, is_recurring: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="is_recurring_edit" className="text-xs font-semibold text-muted-foreground cursor-pointer">
              Recurring annual holiday
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Holiday?" size="sm">
        {selectedHoliday && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 border border-rose-100">
              <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{selectedHoliday.holiday_name}</p>
                <p className="text-xs text-slate-500">{fmtDate(selectedHoliday.holiday_date)} · {selectedHoliday.holiday_type}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-normal">
              Are you sure you want to delete this holiday? This action{' '}
              <span className="text-rose-600 font-semibold">cannot be undone</span>.
            </p>
            <div className="flex gap-3 pt-1 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button type="button" variant="destructive" size="sm" onClick={handleDeleteConfirm}>Delete Holiday</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
