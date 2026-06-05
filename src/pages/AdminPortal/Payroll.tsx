import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { TableWrapper, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DollarSign, Search, Receipt, ShieldCheck, Download, Plus, Check } from 'lucide-react';

export const Payroll: React.FC = () => {
  const { employees } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('June 2026');

  // Compute mock payroll data based on employee list
  const payrollList = useMemo(() => {
    return employees.map((emp) => {
      // Deterministic salary based on designation/id
      const basePay = emp.designation.includes('Director') ? 125000 : emp.designation.includes('Lead') ? 95000 : 75000;
      const allowance = Math.round(basePay * 0.12);
      const deductions = Math.round(basePay * 0.08);
      const netPay = basePay + allowance - deductions;

      return {
        id: emp.id,
        name: emp.name,
        employee_id: emp.employee_id,
        department: emp.department,
        designation: emp.designation,
        basePay,
        allowance,
        deductions,
        netPay,
        status: emp.id === 'emp_1' || emp.id === 'emp_3' ? 'Draft' : 'Released',
      };
    });
  }, [employees]);

  const filteredPayroll = useMemo(() => {
    return payrollList.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      p.employee_id.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [payrollList, searchQuery]);

  const totalDisbursement = useMemo(() => {
    return payrollList.reduce((sum, p) => sum + p.netPay, 0);
  }, [payrollList]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ── Executive Greeting Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-display">
            Payroll Ledger
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review monthly salary packages, active allowances, deductions, and payouts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="flex items-center gap-1.5 shadow-md">
            <Plus className="h-4.5 w-4.5" />
            <span>Process Payroll</span>
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Total Payroll */}
        <div className="bg-card border border-border/80 rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden flex justify-between items-center">
          <div className="text-left">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Disbursements</span>
            <h3 className="text-3xl font-black font-display text-foreground mt-2">${totalDisbursement.toLocaleString()}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Current Billing Cycle: {selectedMonth}</p>
          </div>
          <span className="p-3 bg-accent/10 text-accent rounded-2xl"><DollarSign className="h-6 w-6" /></span>
        </div>

        {/* Card 2: Employees Paid */}
        <div className="bg-card border border-border/80 rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden flex justify-between items-center">
          <div className="text-left">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Processed Rate</span>
            <h3 className="text-3xl font-black font-display text-foreground mt-2">
              {payrollList.filter(p => p.status === 'Released').length} / {payrollList.length}
            </h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Bank transfers successfully cleared</p>
          </div>
          <span className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl"><Check className="h-6 w-6" /></span>
        </div>

        {/* Card 3: Next Payout Date */}
        <div className="bg-card border border-border/80 rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden flex justify-between items-center">
          <div className="text-left">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Next Settlement</span>
            <h3 className="text-3xl font-black font-display text-foreground mt-2">June 30, 2026</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Standard auto-transfer trigger at 00:00 UTC</p>
          </div>
          <span className="p-3 bg-violet-500/10 text-violet-500 rounded-2xl"><Receipt className="h-6 w-6" /></span>
        </div>

      </div>

      {/* ── Filter Toolbar ── */}
      <Card>
        <CardContent className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          
          {/* Search */}
          <div className="w-full relative sm:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground tracking-wide font-display mb-1.5 block">
              Search Employee Payroll
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or employee id..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Month selector */}
          <div className="w-full">
            <label className="text-xs font-semibold text-muted-foreground tracking-wide font-display mb-1.5 block">
              Payroll Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full h-10 px-3 bg-muted/20 border border-border rounded-lg text-xs font-semibold focus:border-accent focus:ring-1 focus:ring-accent outline-none transition"
            >
              <option value="June 2026">June 2026</option>
              <option value="May 2026">May 2026</option>
              <option value="April 2026">April 2026</option>
            </select>
          </div>

        </CardContent>
      </Card>

      {/* ── Payroll Table ── */}
      <Card>
        <CardContent className="p-0">
          <TableWrapper>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Disbursement</TableHead>
                <TableHead>Payout Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayroll.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-36 text-center text-muted-foreground text-sm">
                    No matching employee payroll records.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayroll.map((pay) => (
                  <TableRow key={pay.id}>
                    <TableCell className="text-left py-4">
                      <p className="font-bold text-foreground">{pay.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{pay.employee_id} • {pay.department}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      ${pay.basePay.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-emerald-600">
                      +${pay.allowance.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-rose-600">
                      -${pay.deductions.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-extrabold text-foreground">
                      ${pay.netPay.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pay.status === 'Released' ? 'Present' : 'Leave'}>
                        {pay.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="h-8.5 px-3 flex items-center gap-1.5 ml-auto">
                        <Download className="h-3.5 w-3.5" />
                        <span className="text-[10px]">Payslip</span>
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
  );
};
