import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { TableWrapper, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Calendar, Plus, Clock, Settings2, ShieldCheck, Milestone, Trash2 } from 'lucide-react';
import { Holiday } from '../../types';

export const Settings: React.FC = () => {
  const { holidays } = useData();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'shifts' | 'holidays' | 'security'>('shifts');

  // Holidays state management
  const [localHolidays, setLocalHolidays] = useState<Holiday[]>(() => {
    const saved = localStorage.getItem('holidays');
    return saved ? JSON.parse(saved) : holidays;
  });

  const [addHolidayOpen, setAddHolidayOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '' });
  const [error, setError] = useState('');

  // Shift States
  const [shiftTimings, setShiftTimings] = useState({
    checkInStart: '09:00',
    checkOutStart: '17:00',
    halfDayThreshold: '5.0',
    gracePeriod: '15',
  });

  const handleShiftSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Shift configurations updated successfully', 'success');
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!holidayForm.name.trim() || !holidayForm.date) {
      setError('Please provide both holiday name and date');
      return;
    }

    const newHoliday: Holiday = {
      id: `h_${Date.now()}`,
      holiday_name: holidayForm.name.trim(),
      holiday_date: holidayForm.date,
      holiday_type: 'Company Holiday',
    };

    const updated = [...localHolidays, newHoliday].sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
    setLocalHolidays(updated);
    localStorage.setItem('holidays', JSON.stringify(updated));

    // Log activity
    const savedActivities = localStorage.getItem('activities');
    const activities = savedActivities ? JSON.parse(savedActivities) : [];
    const newAct = {
      id: `act_${Date.now()}`,
      type: 'employee_add', // custom reuse
      user_name: 'Sarah Connor',
      message: `Added new company holiday: ${newHoliday.holiday_name} (${newHoliday.holiday_date})`,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('activities', JSON.stringify([newAct, ...activities]));

    toast(`Successfully added holiday "${newHoliday.holiday_name}"!`, 'success');
    setAddHolidayOpen(false);
    setHolidayForm({ name: '', date: '' });
  };

  const handleDeleteHoliday = (id: string, name: string) => {
    const updated = localHolidays.filter(h => h.id !== id);
    setLocalHolidays(updated);
    localStorage.setItem('holidays', JSON.stringify(updated));
    toast(`Removed holiday "${name}"`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
          System Settings
        </h1>
        <p className="text-xs text-muted-foreground">
          Configure corporate shift timings, add public/company holidays, and manage database permissions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('shifts')}
          className={`pb-3 transition-colors duration-150 relative ${
            activeTab === 'shifts' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Shift Timings</span>
          {activeTab === 'shifts' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
        </button>

        <button
          onClick={() => setActiveTab('holidays')}
          className={`pb-3 transition-colors duration-150 relative ${
            activeTab === 'holidays' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Company Holidays</span>
          {activeTab === 'holidays' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 transition-colors duration-150 relative ${
            activeTab === 'security' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Security & Access</span>
          {activeTab === 'security' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
        </button>
      </div>

      {/* Content panel */}
      <div className="animate-in fade-in duration-300">
        
        {/* SHIFTS CONFIG TAB */}
        {activeTab === 'shifts' && (
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Shift Schedule Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleShiftSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Standard Check-In</label>
                    <Input
                      type="time"
                      value={shiftTimings.checkInStart}
                      onChange={(e) => setShiftTimings(p => ({ ...p, checkInStart: e.target.value }))}
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Standard Check-Out</label>
                    <Input
                      type="time"
                      value={shiftTimings.checkOutStart}
                      onChange={(e) => setShiftTimings(p => ({ ...p, checkOutStart: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Grace Period (Minutes)</label>
                    <Input
                      type="number"
                      value={shiftTimings.gracePeriod}
                      onChange={(e) => setShiftTimings(p => ({ ...p, gracePeriod: e.target.value }))}
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Half-Day Threshold (Hours)</label>
                    <Input
                      type="number"
                      step="0.5"
                      value={shiftTimings.halfDayThreshold}
                      onChange={(e) => setShiftTimings(p => ({ ...p, halfDayThreshold: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button type="submit">
                    Save Shift Configurations
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* HOLIDAYS TAB */}
        {activeTab === 'holidays' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setAddHolidayOpen(true)} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Holiday</span>
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <TableWrapper>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Holiday Name</TableHead>
                      <TableHead>Holiday Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localHolidays.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center h-28 text-sm text-muted-foreground">
                          No corporate holidays configured.
                        </TableCell>
                      </TableRow>
                    ) : (
                      localHolidays.map((holiday) => (
                        <TableRow key={holiday.id}>
                          <TableCell className="font-semibold text-foreground flex items-center gap-2">
                            <Milestone className="h-4 w-4 text-primary" />
                            {holiday.holiday_name}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {new Date(holiday.holiday_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteHoliday(holiday.id, holiday.holiday_name)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-muted/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </TableWrapper>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Access Credentials Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-foreground/80 leading-normal">
              <p>
                DAttendance operates on role-based access control (RBAC). Employees possess restricted views of check-ins and history. HR / Admin accounts have full read and write access to directories, approvals, registries, and reports.
              </p>
              
              <div className="p-3 bg-muted/5 border border-border rounded-lg flex gap-2">
                <ShieldCheck className="h-5 w-5 text-[var(--calendar-present-text)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Mock Sandbox Environment</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    For verification convenience, password authentication matches any ID with password <code className="bg-muted/10 px-1 py-0.5 rounded font-mono text-primary font-bold">password</code>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Add Holiday Modal */}
      <Modal isOpen={addHolidayOpen} onClose={() => setAddHolidayOpen(false)} title="Add Company Holiday" size="sm">
        <form onSubmit={handleAddHoliday} className="space-y-4">
          <Input
            label="Holiday Name"
            placeholder="e.g. Labor Day"
            value={holidayForm.name}
            onChange={(e) => setHolidayForm(p => ({ ...p, name: e.target.value }))}
            error={error}
          />
          <Input
            label="Holiday Date"
            type="date"
            value={holidayForm.date}
            onChange={(e) => setHolidayForm(p => ({ ...p, date: e.target.value }))}
          />

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddHolidayOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Add Holiday
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
