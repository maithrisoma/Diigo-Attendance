import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Calendar, Search, Plus, Edit2, Trash2, Milestone, RefreshCw, Check, AlertCircle } from 'lucide-react';
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

export const HolidayManagement: React.FC = () => {
  const { holidays, addHoliday, updateHoliday, removeHoliday } = useData();
  const { toast } = useToast();

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Modals state
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  // Forms state
  const [holidayForm, setHolidayForm] = useState<Omit<Holiday, 'id'>>({
    holiday_name: '',
    holiday_date: '',
    holiday_type: 'Festival Holiday',
    is_recurring: false,
  });
  const [error, setError] = useState('');

  // Suffix formatting
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  // Filtered holidays
  const filteredHolidays = useMemo(() => {
    return holidays
      .filter(h => {
        const matchesSearch = h.holiday_name.toLowerCase().includes(searchQuery.toLowerCase().trim());
        
        // Month filter match
        let matchesMonth = true;
        if (selectedMonth !== 'all') {
          const hMonth = new Date(h.holiday_date).getMonth();
          matchesMonth = hMonth.toString() === selectedMonth;
        }

        // Type filter match
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
    if (!holidayForm.holiday_name.trim()) {
      setError('Holiday Name is required');
      return false;
    }
    if (!holidayForm.holiday_date) {
      setError('Holiday Date is required');
      return false;
    }
    setError('');
    return true;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Mandatory national holidays check (Republic Day Jan 26, Independence Day Aug 15, Gandhi Jayanti Oct 2)
    let finalRecurring = holidayForm.is_recurring;
    const dateObj = new Date(holidayForm.holiday_date);
    const day = dateObj.getDate();
    const month = dateObj.getMonth(); // Jan = 0, Aug = 7, Oct = 9
    const name = holidayForm.holiday_name.toLowerCase();

    const isRepDay = (month === 0 && day === 26) || name.includes('republic');
    const isIndDay = (month === 7 && day === 15) || name.includes('independence');
    const isGandhiDay = (month === 9 && day === 2) || name.includes('gandhi');

    if (isRepDay || isIndDay || isGandhiDay) {
      finalRecurring = true; // force true
    }

    addHoliday({
      ...holidayForm,
      is_recurring: finalRecurring,
    });

    toast(`Added holiday "${holidayForm.holiday_name}" successfully!`, 'success');
    setAddOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHoliday || !validateForm()) return;

    let finalRecurring = holidayForm.is_recurring;
    const dateObj = new Date(holidayForm.holiday_date);
    const day = dateObj.getDate();
    const month = dateObj.getMonth();
    const name = holidayForm.holiday_name.toLowerCase();

    const isRepDay = (month === 0 && day === 26) || name.includes('republic');
    const isIndDay = (month === 7 && day === 15) || name.includes('independence');
    const isGandhiDay = (month === 9 && day === 2) || name.includes('gandhi');

    if (isRepDay || isIndDay || isGandhiDay) {
      finalRecurring = true;
    }

    updateHoliday(selectedHoliday.id, {
      ...holidayForm,
      is_recurring: finalRecurring,
    });

    toast(`Updated holiday "${holidayForm.holiday_name}"!`, 'success');
    setEditOpen(false);
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the holiday "${name}"?`)) {
      removeHoliday(id);
      toast(`Deleted holiday "${name}"`, 'success');
    }
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

  const openAdd = () => {
    resetForm();
    setAddOpen(true);
  };

  const resetForm = () => {
    setHolidayForm({
      holiday_name: '',
      holiday_date: '',
      holiday_type: 'Festival Holiday',
      is_recurring: false,
    });
    setSelectedHoliday(null);
    setError('');
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] font-display">
            Holiday Management
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Configure, update, and track corporate and public holidays observed across calendar cycles.
          </p>
        </div>
        <Button onClick={openAdd} className="flex items-center gap-1.5 shadow-md">
          <Plus className="h-4.5 w-4.5" />
          <span>Add Holiday</span>
        </Button>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <Card>
        <CardContent className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
          {/* Search bar */}
          <div className="w-full relative md:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground tracking-wide font-display mb-1.5 block">
              Search Holiday Name
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search holiday name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Month Filter */}
          <div className="w-full">
            <Select
              label="Filter by Month"
              options={MONTHS}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>

          {/* Holiday Type Filter */}
          <div className="w-full">
            <Select
              label="Holiday Type"
              options={[
                { value: 'all', label: 'All Types' },
                ...HOLIDAY_TYPES.map(t => ({ value: t, label: t })),
              ]}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            />
          </div>

          {/* Reset Filters button */}
          <button
            onClick={handleResetFilters}
            className="w-full h-10 px-4 py-2 bg-muted/10 hover:bg-muted/20 text-foreground border border-border rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-colors duration-150"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        </CardContent>
      </Card>

      {/* ── Holidays Table ── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Holiday Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHolidays.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-36 text-center text-muted-foreground text-sm">
                    No holiday records matched your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredHolidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell className="font-bold text-foreground flex items-center gap-2">
                      <Milestone className="h-4.5 w-4.5 text-primary" />
                      {holiday.holiday_name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground font-medium">
                      {fmtDate(holiday.holiday_date)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          holiday.holiday_type === 'National Holiday' 
                            ? 'Holiday' 
                            : holiday.holiday_type === 'Festival Holiday'
                            ? 'Leave'
                            : holiday.holiday_type === 'Company Holiday'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {holiday.holiday_type || 'Festival Holiday'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {holiday.is_recurring ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-primary dark:text-[#10B981] bg-[var(--calendar-present-bg)]/40 border border-primary/20 px-2 py-0.5 rounded-full w-max">
                          <Check className="h-3.5 w-3.5" />
                          Annual Repeat
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-muted-foreground">One-time Off</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(holiday)}
                          className="h-8.5 w-8.5 text-muted-foreground hover:text-primary hover:bg-muted/10"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(holiday.id, holiday.holiday_name)}
                          className="h-8.5 w-8.5 text-muted-foreground hover:text-destructive hover:bg-muted/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── MODALS ── */}

      {/* Add Holiday Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Create Default Holiday" size="sm">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="h-4.5 w-4.5 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Holiday Name</label>
            <Input
              placeholder="e.g. Maha Shivaratri"
              value={holidayForm.holiday_name}
              onChange={(e) => setHolidayForm(p => ({ ...p, holiday_name: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Holiday Date</label>
            <Input
              type="date"
              value={holidayForm.holiday_date}
              onChange={(e) => setHolidayForm(p => ({ ...p, holiday_date: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Holiday Type</label>
            <Select
              options={HOLIDAY_TYPES.map(t => ({ value: t, label: t }))}
              value={holidayForm.holiday_type}
              onChange={(e) => setHolidayForm(p => ({ ...p, holiday_type: e.target.value as any }))}
            />
          </div>

          <div className="flex items-center gap-2 pt-1.5">
            <input
              type="checkbox"
              id="is_recurring_add"
              checked={holidayForm.is_recurring}
              onChange={(e) => setHolidayForm(p => ({ ...p, is_recurring: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="is_recurring_add" className="text-xs font-bold text-muted-foreground cursor-pointer">
              Recurring annual holiday
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Add Holiday
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Holiday Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Update Holiday Record" size="sm">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="h-4.5 w-4.5 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Holiday Name</label>
            <Input
              placeholder="e.g. Holi"
              value={holidayForm.holiday_name}
              onChange={(e) => setHolidayForm(p => ({ ...p, holiday_name: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Holiday Date</label>
            <Input
              type="date"
              value={holidayForm.holiday_date}
              onChange={(e) => setHolidayForm(p => ({ ...p, holiday_date: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Holiday Type</label>
            <Select
              options={HOLIDAY_TYPES.map(t => ({ value: t, label: t }))}
              value={holidayForm.holiday_type}
              onChange={(e) => setHolidayForm(p => ({ ...p, holiday_type: e.target.value as any }))}
            />
          </div>

          <div className="flex items-center gap-2 pt-1.5">
            <input
              type="checkbox"
              id="is_recurring_edit"
              checked={holidayForm.is_recurring}
              onChange={(e) => setHolidayForm(p => ({ ...p, is_recurring: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="is_recurring_edit" className="text-xs font-bold text-muted-foreground cursor-pointer">
              Recurring annual holiday
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Update Holiday
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
