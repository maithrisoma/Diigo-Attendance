import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Search, Calendar, RefreshCw } from 'lucide-react';

export const EmployeeHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const { attendance } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('06'); // Default June (anchor date)
  const [selectedYear, setSelectedYear] = useState('2026'); // Default 2026
  // Filter lists
  const monthOptions = [
    { value: 'all', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const yearOptions = [
    { value: 'all', label: 'All Years' },
    { value: '2026', label: '2026' },
    { value: '2025', label: '2025' },
  ];

  // Get own records and sort by date descending
  const filteredRecords = useMemo(() => {
    let records = attendance
      .filter((rec) => rec.employee_id === currentUser?.employee_id)
      .sort((a, b) => b.date.localeCompare(a.date));

    // Filter by year
    if (selectedYear !== 'all') {
      records = records.filter((rec) => rec.date.startsWith(selectedYear));
    }

    // Filter by month
    if (selectedMonth !== 'all') {
      records = records.filter((rec) => {
        const dateParts = rec.date.split('-');
        return dateParts[1] === selectedMonth;
      });
    }

    // Filter by search query (e.g. status, date string)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      records = records.filter(
        (rec) =>
          rec.date.includes(q) ||
          rec.status.toLowerCase().includes(q) ||
          (rec.check_in && rec.check_in.includes(q)) ||
          (rec.check_out && rec.check_out.includes(q))
      );
    }

    return records;
  }, [attendance, currentUser?.employee_id, selectedMonth, selectedYear, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMonth('all');
    setSelectedYear('all');
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
          Attendance History
        </h1>
        <p className="text-xs text-muted-foreground">
          Browse and filter your history of logged working days, check-in and check-out timestamps.
        </p>
      </div>

      {/* Filter Toolbar Card */}
      <Card>
        <CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-4 items-end">
          {/* Search Date / Status */}
          <div className="w-full md:flex-1 relative">
            <label className="text-xs font-semibold text-muted-foreground tracking-wide font-display mb-1.5 block">
              Search Records
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by date (YYYY-MM-DD) or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Month Selector */}
          <div className="w-full md:w-48">
            <Select
              label="Filter Month"
              options={monthOptions}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>

          {/* Year Selector */}
          <div className="w-full md:w-36">
            <Select
              label="Filter Year"
              options={yearOptions}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            />
          </div>

          {/* Reset Filters button */}
          <button
            onClick={handleResetFilters}
            className="w-full md:w-auto h-10 px-4 py-2 bg-muted/10 hover:bg-muted/20 text-foreground border border-border rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-colors duration-150"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead className="text-right">Working Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-36 text-center text-muted-foreground text-sm">
                    No attendance records found matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-semibold font-mono text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground/60" />
                      {new Date(rec.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          rec.status === 'Present'
                            ? 'success'
                            : rec.status === 'Half Day'
                            ? 'warning'
                            : rec.status === 'Absent'
                            ? 'danger'
                            : 'info'
                        }
                        className="px-2.5 py-0.5 font-semibold text-[11px]"
                      >
                        {rec.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {rec.check_in
                        ? new Date(`2000-01-01T${rec.check_in}`).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '--:--'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {rec.check_out
                        ? new Date(`2000-01-01T${rec.check_out}`).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : rec.check_in ? (
                          <span className="text-[var(--calendar-present-text)] font-semibold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--calendar-present-text)] animate-pulse" />
                            Active
                          </span>
                        ) : '--:--'}
                    </TableCell>
<<<<<<< Updated upstream
                    <TableCell className="text-right font-semibold font-mono text-sm text-foreground">
                      {rec.working_hours !== null ? `${rec.working_hours.toFixed(2)}h` : '--'}
=======
                    <TableCell className="text-right font-semibold font-mono text-sm text-slate-700">
                      {rec.working_hours !== null && rec.working_hours !== undefined ? `${Number(rec.working_hours).toFixed(2)}h` : '--'}
>>>>>>> Stashed changes
                    </TableCell>
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
