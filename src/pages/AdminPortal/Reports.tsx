import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { TableWrapper, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Calendar, Download, Printer, BarChart3, TrendingUp, Users, Clock } from 'lucide-react';

export const Reports: React.FC = () => {
  const { employees, attendance, holidays } = useData();
  const { toast } = useToast();

  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState('2026-06-03'); // Default anchor
  
  // States for generated report
  const [generated, setGenerated] = useState(false);

  const reportTypeOptions = [
    { value: 'daily', label: 'Daily Report' },
    { value: 'weekly', label: 'Weekly Summary' },
    { value: 'monthly', label: 'Monthly Summary' },
  ];

  // Helper to generate dates for a range
  const getDateRange = (type: 'daily' | 'weekly' | 'monthly', anchorStr: string) => {
    const dates: string[] = [];
    const anchor = new Date(anchorStr);

    if (type === 'daily') {
      dates.push(anchorStr);
    } else if (type === 'weekly') {
      // Get the 5 weekdays of the week corresponding to the anchor date
      const day = anchor.getDay();
      const diff = anchor.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(anchor.setDate(diff));

      for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
      }
    } else {
      // Monthly: get all dates in the month of the anchor date
      const year = anchor.getFullYear();
      const month = anchor.getMonth();
      const numDays = new Date(year, month + 1, 0).getDate();

      for (let i = 1; i <= numDays; i++) {
        const d = new Date(year, month, i);
        const dayOfWeek = d.getDay();
        // Standard workdays Mon-Fri
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          dates.push(d.toISOString().split('T')[0]);
        }
      }
    }
    return dates;
  };

  // Generate metrics based on selection
  const reportData = useMemo(() => {
    if (!generated) return null;

    const dates = getDateRange(reportType, selectedDate);
    
    // Filter attendance records falling within dates
    const rangeAttendance = attendance.filter((a) => dates.includes(a.date));

    // Calculate aggregated metrics per employee
    const employeeSummaries = employees.map((emp) => {
      let present = 0;
      let halfDay = 0;
      let absent = 0;
      let leave = 0;
      let totalHours = 0;
      let hoursCount = 0;

      dates.forEach((dateStr) => {
        const rec = rangeAttendance.find((a) => a.employee_id === emp.employee_id && a.date === dateStr);
        const isHoliday = holidays.some(h => h.holiday_date === dateStr);

        if (rec) {
          if (rec.status === 'Present') {
            present++;
            if (rec.working_hours) {
              totalHours += Number(rec.working_hours);
              hoursCount++;
            }
          } else if (rec.status === 'Half Day') {
            halfDay++;
            if (rec.working_hours) {
              totalHours += Number(rec.working_hours);
              hoursCount++;
            }
          } else if (rec.status === 'Leave') {
            leave++;
          } else {
            absent++;
          }
        } else {
          if (isHoliday) {
            leave++;
          } else {
            absent++; // weekday no logs
          }
        }
      });

      const avgHours = hoursCount > 0 ? parseFloat((totalHours / hoursCount).toFixed(2)) : 0;
      const totalPresence = present + halfDay;
      const rate = dates.length > 0 ? Math.round((totalPresence / dates.length) * 100) : 0;

      return {
        id: emp.id,
        name: emp.name,
        employee_id: emp.employee_id,
        department: emp.department,
        present: totalPresence,
        absent,
        leave,
        rate,
        avgHours,
      };
    });

    // Compute Overall KPI Card Metrics
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLeave = 0;
    let grandHours = 0;
    let grandHoursCount = 0;

    employeeSummaries.forEach((emp) => {
      totalPresent += emp.present;
      totalAbsent += emp.absent;
      totalLeave += emp.leave;
      if (emp.avgHours > 0) {
        grandHours += emp.avgHours;
        grandHoursCount++;
      }
    });

    const totalDaysCount = dates.length;
    const totalPossiblePresences = employees.length * totalDaysCount;
    const overallRate = totalPossiblePresences > 0 ? Math.round((totalPresent / totalPossiblePresences) * 100) : 0;
    const avgOfficeHours = grandHoursCount > 0 ? parseFloat((grandHours / grandHoursCount).toFixed(2)) : 0;

    // Compute Department Metrics
    const depts = Array.from(new Set(employees.map((e) => e.department)));
    const departmentSummaries = depts.map((dept) => {
      const deptEmps = employeeSummaries.filter((e) => e.department === dept);
      let deptPresent = 0;
      let deptAbsent = 0;
      let deptLeave = 0;

      deptEmps.forEach((e) => {
        deptPresent += e.present;
        deptAbsent += e.absent;
        deptLeave += e.leave;
      });

      const totalPoss = deptEmps.length * totalDaysCount;
      const rate = totalPoss > 0 ? Math.round((deptPresent / totalPoss) * 100) : 0;

      return {
        name: dept,
        present: deptPresent,
        absent: deptAbsent,
        leave: deptLeave,
        rate,
        employeesCount: deptEmps.length,
      };
    });

    return {
      overallRate,
      presentCount: totalPresent,
      absentCount: totalAbsent,
      leaveCount: totalLeave,
      avgOfficeHours,
      employeeSummaries,
      departmentSummaries,
      datesCount: totalDaysCount,
    };
  }, [generated, reportType, selectedDate, employees, attendance, holidays]);

  const handleGenerate = () => {
    setGenerated(true);
    toast(`Generated ${reportType} report successfully.`, 'success');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!reportData) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Employee Attendance Summary Report\n';
    csvContent += `Report Type,${reportType.toUpperCase()}\n`;
    csvContent += `Generated Date,${selectedDate}\n\n`;
    csvContent += 'Employee ID,Employee Name,Department,Present Days,Absent Days,Leave Days,Attendance Rate (%),Avg Hours\n';

    reportData.employeeSummaries.forEach((emp) => {
      csvContent += `"${emp.employee_id}","${emp.name}","${emp.department}",${emp.present},${emp.absent},${emp.leave},${emp.rate}%,${emp.avgHours}h\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${reportType}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast('CSV downloaded successfully', 'success');
  };

  // Print PDF Trigger
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            Attendance Reports
          </h1>
          <p className="text-xs text-muted-foreground">
            Analyze historical presence rates and compile daily, weekly, or monthly summaries for export.
          </p>
        </div>
      </div>

      {/* Report parameters input card */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:flex-1">
            <Select
              label="Report Periodicity"
              options={reportTypeOptions}
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value as any);
                setGenerated(false);
              }}
            />
          </div>

          <div className="w-full sm:flex-1 relative">
            <label className="text-xs font-semibold text-foreground tracking-wide font-display mb-1.5 block">
              Reference Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setGenerated(false);
                }}
                className="pl-9"
              />
            </div>
          </div>

          <Button onClick={handleGenerate} className="w-full sm:w-auto h-10 px-6 font-semibold bg-primary">
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {/* Generated Report Display */}
      {generated && reportData && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Action buttons toolbar (hidden when printing) */}
          <div className="flex justify-end space-x-3 print:hidden">
            <Button variant="outline" className="flex items-center space-x-2 text-foreground border-border" onClick={handleExportCSV}>
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
            <Button className="flex items-center space-x-2 bg-primary hover:bg-[var(--primary-hover)] text-primary-foreground font-semibold" onClick={handlePrintPDF}>
              <Printer className="h-4 w-4" />
              <span>Print Report / PDF</span>
            </Button>
          </div>

          {/* PRINT-ONLY HEADER */}
          <div className="hidden print:block text-center space-y-2 border-b border-border pb-6 mb-4">
            <h1 className="text-3xl font-bold font-display text-foreground">Diigo Attendance Summary Report</h1>
            <p className="text-sm text-muted-foreground font-medium capitalize">
              Report Range: {reportType} summary around {new Date(selectedDate).toLocaleDateString()} ({reportData.datesCount} working days computed)
            </p>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Overall Rate</p>
                <p className="text-3xl font-bold text-primary font-display">{reportData.overallRate}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Present Logs</p>
                <p className="text-3xl font-bold text-[var(--calendar-present-text)] font-display">{reportData.presentCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Absent Logs</p>
                <p className="text-3xl font-bold text-[var(--calendar-absent-text)] font-display">{reportData.absentCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center space-y-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Avg Office hours</p>
                <p className="text-3xl font-bold text-foreground font-display font-mono">{reportData.avgOfficeHours}h</p>
              </CardContent>
            </Card>
          </div>

          {/* Department Breakdown table */}
          <Card>
            <CardHeader className="border-b border-border bg-muted/5 py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Department Attendance Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TableWrapper>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department Name</TableHead>
                    <TableHead className="text-center">Staff Count</TableHead>
                    <TableHead className="text-center">Total Present Logs</TableHead>
                    <TableHead className="text-center">Total Absent Logs</TableHead>
                    <TableHead className="text-right">Attendance Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.departmentSummaries.map((dept, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-semibold text-foreground">{dept.name}</TableCell>
                      <TableCell className="text-center text-muted-foreground font-mono">{dept.employeesCount}</TableCell>
                      <TableCell className="text-center text-[var(--calendar-present-text)] font-mono font-semibold">{dept.present}</TableCell>
                      <TableCell className="text-center text-[var(--calendar-absent-text)] font-mono font-semibold">{dept.absent}</TableCell>
                      <TableCell className="text-right font-bold text-foreground font-mono">{dept.rate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableWrapper>
            </CardContent>
          </Card>

          {/* Detail Staff table */}
          <Card>
            <CardHeader className="border-b border-border bg-muted/5 py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Employee-wise Attendance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TableWrapper>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Present Days</TableHead>
                    <TableHead className="text-center">Absent Days</TableHead>
                    <TableHead className="text-center">Leave Days</TableHead>
                    <TableHead className="text-center">Avg Hours</TableHead>
                    <TableHead className="text-right">Presence Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.employeeSummaries.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">{emp.employee_id}</TableCell>
                      <TableCell className="font-semibold text-foreground">{emp.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs font-medium">{emp.department}</TableCell>
                      <TableCell className="text-center text-[var(--calendar-present-text)] font-mono font-semibold">{emp.present}</TableCell>
                      <TableCell className="text-center text-[var(--calendar-absent-text)] font-mono font-semibold">{emp.absent}</TableCell>
                      <TableCell className="text-center text-[var(--calendar-holiday-text)] font-mono font-semibold">{emp.leave}</TableCell>
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">{emp.avgHours}h</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={emp.rate >= 90 ? 'success' : emp.rate >= 75 ? 'warning' : 'danger'}
                          className="font-bold text-xs font-mono"
                        >
                          {emp.rate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableWrapper>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
};
