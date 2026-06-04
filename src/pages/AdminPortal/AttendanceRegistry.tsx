import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Calendar, Search, RefreshCw, Clock } from 'lucide-react';
import { AttendanceStatus } from '../../types';

export const AttendanceRegistry: React.FC = () => {
  const { employees, attendance, holidays } = useData();

  // Filters State
  const [selectedDate, setSelectedDate] = useState('2026-06-03'); // Default to anchor date
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Department options for filtering
  const departments = useMemo(() => {
    const list = Array.from(new Set(employees.map(e => e.department)));
    return [{ value: 'all', label: 'All Departments' }, ...list.map(d => ({ value: d, label: d }))];
  }, [employees]);

  // Status options for filtering
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'Present', label: 'Present' },
    { value: 'Absent', label: 'Absent' },
    { value: 'Half Day', label: 'Half Day' },
    { value: 'Leave', label: 'On Leave' },
  ];

  // Compute daily registry records dynamically
  const registryRecords = useMemo(() => {
    const targetDate = selectedDate;
    const targetDateObj = new Date(targetDate);
    const dayOfWeek = targetDateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holiday = holidays.find(h => h.holiday_date === targetDate);

    // Fetch all attendance logs on that specific date
    const dayRecords = attendance.filter(a => a.date === targetDate);

    // Map each employee to their record on this date
    const mapped = employees.map(emp => {
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
        status = 'Leave'; // Or represent as Holiday
      } else if (isWeekend) {
        status = 'Leave'; // Weekend default
      }

      return {
        id: `reg_${emp.employee_id}_${targetDate}`,
        employee_name: emp.name,
        employee_id: emp.employee_id,
        department: emp.department,
        check_in: checkIn,
        check_out: checkOut,
        status: rec ? rec.status : (holiday ? ('Leave' as AttendanceStatus) : ('Absent' as AttendanceStatus)),
        isHoliday: !!holiday,
        holidayName: holiday?.holiday_name,
        isWeekend,
      };
    });

    // Apply search and select filters
    return mapped.filter(rec => {
      const matchesSearch =
        searchQuery === '' ||
        rec.employee_name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        rec.employee_id.toLowerCase().includes(searchQuery.toLowerCase().trim());
      
      const matchesDept = selectedDept === 'all' || rec.department === selectedDept;
      
      const matchesStatus =
        selectedStatus === 'all' ||
        rec.status === selectedStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, attendance, holidays, selectedDate, selectedDept, selectedStatus, searchQuery]);

  const handleResetFilters = () => {
    setSelectedDate('2026-06-03');
    setSelectedDept('all');
    setSelectedStatus('all');
    setSearchQuery('');
  };

  const getStatusBadge = (rec: typeof registryRecords[0]) => {
    if (rec.isHoliday) {
      return <Badge variant="Holiday" className="font-semibold text-xs px-2 py-0.5">Holiday: {rec.holidayName}</Badge>;
    }
    if (rec.status === 'Present') {
      return <Badge variant="Present" className="font-semibold text-xs px-2.5 py-0.5">Present</Badge>;
    }
    if (rec.status === 'Half Day') {
      return <Badge variant="Half Day" className="font-semibold text-xs px-2.5 py-0.5">Half Day</Badge>;
    }
    if (rec.status === 'Leave') {
      return <Badge variant="Leave" className="font-semibold text-xs px-2.5 py-0.5">On Leave</Badge>;
    }
    // Absent
    return <Badge variant="Absent" className="font-semibold text-xs px-2.5 py-0.5">Absent</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
          Attendance Registry
        </h1>
        <p className="text-xs text-muted-foreground">
          View daily check-in logs for all employee records. Check clock timings and active status flags.
        </p>
      </div>

      {/* Filter toolbar */}
      <Card>
        <CardContent className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
          {/* Date Selector */}
          <div className="w-full relative">
            <label className="text-xs font-semibold text-slate-700 tracking-wide font-display mb-1.5 block">
              Registry Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Search Query */}
          <div className="w-full relative">
            <label className="text-xs font-semibold text-slate-700 tracking-wide font-display mb-1.5 block">
              Search Employee
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Department Filter */}
          <div className="w-full">
            <Select
              label="Filter Department"
              options={departments}
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full">
            <Select
              label="Filter Status"
              options={statusOptions}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
          </div>

          {/* Reset Filters button */}
          <button
            onClick={handleResetFilters}
            className="w-full h-10 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-colors duration-150"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        </CardContent>
      </Card>

      {/* Registry Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Check In Time</TableHead>
                <TableHead>Check Out Time</TableHead>
                <TableHead>Attendance Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registryRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-muted-foreground text-sm">
                    No registry logs found on this date.
                  </TableCell>
                </TableRow>
              ) : (
                registryRecords.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-semibold text-slate-900">{rec.employee_name}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-slate-700">{rec.employee_id}</TableCell>
                    <TableCell className="text-slate-600 text-xs font-medium">{rec.department}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {rec.check_in ? (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(`2000-01-01T${rec.check_in}`).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      ) : (
                        '--:--'
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {rec.check_out ? (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(`2000-01-01T${rec.check_out}`).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      ) : rec.check_in ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active Shift
                        </span>
                      ) : (
                        '--:--'
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(rec)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
