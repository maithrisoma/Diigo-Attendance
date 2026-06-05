import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Building2,
  ShieldCheck,
  CreditCard,
  X,
  Users,
  CheckCircle2,
  XCircle,
  Clock3,
  Mail,
  MoreHorizontal,
  Briefcase,
} from 'lucide-react';
import { Employee } from '../../types';

// ─── Department colour map ───────────────────────────────────────────────────
const DEPT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Engineering:      { bg: 'bg-primary/10', text: 'text-primary-text', dot: 'bg-primary' },
  Marketing:        { bg: 'bg-primary/10', text: 'text-primary-text', dot: 'bg-primary' },
  Sales:            { bg: 'bg-primary/10', text: 'text-primary-text', dot: 'bg-primary' },
  'Human Resources':{ bg: 'bg-primary/10', text: 'text-primary-text', dot: 'bg-primary' },
  Finance:          { bg: 'bg-primary/10', text: 'text-primary-text', dot: 'bg-primary' },
};

const getDeptColor = (dept: string) =>
  DEPT_COLORS[dept] ?? { bg: 'bg-muted/10', text: 'text-muted-foreground', dot: 'bg-muted' };

// ─── Avatar initials ─────────────────────────────────────────────────────────
const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

// ─── Avatar background gradient by name ──────────────────────────────────────
const AVATAR_GRADIENTS = [
  'from-violet-300 to-violet-400',
  'from-purple-300 to-purple-400',
  'from-indigo-300 to-indigo-400',
  'from-violet-400 to-purple-400',
  'from-purple-400 to-indigo-400',
  'from-indigo-400 to-violet-400',
];
const getAvatarGradient = (name: string) =>
  AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Present: { label: 'Present', icon: CheckCircle2,  cls: 'text-[var(--calendar-present-text)] bg-[var(--calendar-present-bg)] border-[var(--calendar-present-border)]' },
  Absent:  { label: 'Absent',  icon: XCircle,       cls: 'text-[var(--calendar-absent-text)] bg-[var(--calendar-absent-bg)] border-[var(--calendar-absent-border)]' },
  Leave:   { label: 'On Leave',icon: Clock3,         cls: 'text-[var(--calendar-leave-text)] bg-[var(--calendar-leave-bg)] border-[var(--calendar-leave-border)]' },
};

const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.Absent;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const EmployeeDirectory: React.FC = () => {
  const { employees, addEmployee, updateEmployee, removeEmployee } = useData();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedDept, setSelectedDept]   = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [addOpen, setAddOpen]               = useState(false);
  const [editOpen, setEditOpen]             = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedEmp, setSelectedEmp]       = useState<Employee | null>(null);
  const [openMenuId, setOpenMenuId]         = useState<string | null>(null);

  const [empForm, setEmpForm] = useState<Omit<Employee, 'id' | 'current_status'>>({
    employee_id: '', name: '', email: '', department: 'Engineering', designation: '', role: 'employee',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ── Derived options ───────────────────────────────────────────────────────
  const departments = useMemo(() => {
    const list = Array.from(new Set(employees.map(e => e.department)));
    return [{ value: 'all', label: 'All Departments' }, ...list.map(d => ({ value: d, label: d }))];
  }, [employees]);

  const deptOptions = [
    { value: 'Engineering',      label: 'Engineering' },
    { value: 'Marketing',        label: 'Marketing' },
    { value: 'Sales',            label: 'Sales' },
    { value: 'Human Resources',  label: 'Human Resources' },
    { value: 'Finance',          label: 'Finance' },
  ];
  const roleOptions = useMemo(() => {
    if (currentUser?.role === 'hr') {
      return [{ value: 'employee', label: 'Employee' }];
    }
    return [
      { value: 'employee', label: 'Employee' },
      { value: 'hr',       label: 'HR Manager' },
      { value: 'admin',    label: 'Super Admin' },
    ];
  }, [currentUser]);
  const statusOptions = [
    { value: 'all',     label: 'All Statuses' },
    { value: 'Present', label: 'Present' },
    { value: 'Absent',  label: 'Absent' },
    { value: 'Leave',   label: 'On Leave' },
  ];

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filteredEmployees = useMemo(() => {
    const baseList = currentUser?.role === 'hr'
      ? employees.filter(e => e.role === 'employee')
      : employees;
    return baseList.filter(emp => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = q === '' ||
        emp.name.toLowerCase().includes(q) ||
        emp.employee_id.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q);
      const matchDept   = selectedDept   === 'all' || emp.department     === selectedDept;
      const matchStatus = selectedStatus === 'all' || emp.current_status === selectedStatus;
      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchQuery, selectedDept, selectedStatus, currentUser]);

  // ── Summary counts ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const list = currentUser?.role === 'hr'
      ? employees.filter(e => e.role === 'employee')
      : employees;
    return {
      total:   list.length,
      present: list.filter(e => e.current_status === 'Present').length,
      absent:  list.filter(e => e.current_status === 'Absent').length,
      leave:   list.filter(e => e.current_status === 'Leave').length,
    };
  }, [employees, currentUser]);

  // ── Form validation ───────────────────────────────────────────────────────
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!empForm.employee_id.trim()) errs.employee_id = 'Employee ID is required';
    else if (employees.some(e => e.employee_id === empForm.employee_id && e.id !== selectedEmp?.id))
      errs.employee_id = 'Employee ID already exists';
    if (!empForm.name.trim()) errs.name = 'Name is required';
    if (!empForm.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(empForm.email)) errs.email = 'Invalid email address';
    else if (employees.some(e => e.email === empForm.email && e.id !== selectedEmp?.id))
      errs.email = 'Email already registered';
    if (!empForm.designation.trim()) errs.designation = 'Designation is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const resetForm = () => {
    setEmpForm({ employee_id: '', name: '', email: '', department: 'Engineering', designation: '', role: 'employee' });
    setFormErrors({});
    setSelectedEmp(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const finalForm = currentUser?.role === 'hr' ? { ...empForm, role: 'employee' as const } : empForm;
    addEmployee(finalForm);
    toast(`Added ${empForm.name} successfully!`, 'success');
    setAddOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !validateForm()) return;
    const finalForm = currentUser?.role === 'hr' ? { ...empForm, role: 'employee' as const } : empForm;
    updateEmployee(selectedEmp.id, finalForm);
    toast(`Updated details for ${empForm.name}!`, 'success');
    setEditOpen(false);
    resetForm();
  };

  const handleDeleteConfirm = () => {
    if (!selectedEmp) return;
    removeEmployee(selectedEmp.id);
    toast(`Removed ${selectedEmp.name} from directory`, 'success');
    setDeleteConfirmOpen(false);
    setSelectedEmp(null);
  };

  const openEdit = (emp: Employee, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedEmp(emp);
    setEmpForm({ employee_id: emp.employee_id, name: emp.name, email: emp.email, department: emp.department, designation: emp.designation, role: emp.role });
    setEditOpen(true);
  };

  const openDelete = (emp: Employee, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedEmp(emp);
    setDeleteConfirmOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            {currentUser?.role === 'hr' ? 'Employee Directory' : 'Staff Directory (HR & Employees)'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredEmployees.length} of {currentUser?.role === 'hr' ? employees.filter(e => e.role === 'employee').length : employees.length} staff members shown
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setAddOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
        >
          <UserPlus className="h-4 w-4" />
          {currentUser?.role === 'hr' ? 'Add Employee' : 'Add Staff / HR'}
        </button>
      </div>

      {/* ── Summary stats strip ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: currentUser?.role === 'hr' ? 'Total Employees' : 'Total Staff',  value: stats.total,   icon: Users,          cls: 'text-primary',                          bg: 'bg-primary/10' },
          { label: 'Present Today',value: stats.present, icon: CheckCircle2,   cls: 'text-[var(--calendar-present-text)]',   bg: 'bg-[var(--calendar-present-bg)]' },
          { label: 'Absent Today', value: stats.absent,  icon: XCircle,        cls: 'text-[var(--calendar-absent-text)]',    bg: 'bg-[var(--calendar-absent-bg)]' },
          { label: 'On Leave',     value: stats.leave,   icon: Clock3,         cls: 'text-[var(--calendar-leave-text)]',     bg: 'bg-[var(--calendar-leave-bg)]' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 shadow-sm text-foreground">
              <div className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${s.cls}`} />
              </div>
              <div>
                <p className="text-2xl font-bold font-display leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filter toolbar ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, ID, email or designation…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-border bg-muted/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
        <select
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-lg border border-border bg-muted/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition sm:w-48"
        >
          {departments.map(d => <option key={d.value} value={d.value} className="bg-card text-foreground">{d.label}</option>)}
        </select>
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-lg border border-border bg-muted/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition sm:w-40"
        >
          {statusOptions.map(s => <option key={s.value} value={s.value} className="bg-card text-foreground">{s.label}</option>)}
        </select>
      </div>

      {/* ── Card grid ──────────────────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* Card grid */}
        <div className="flex-1 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEmployees.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
              <Users className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No employees found matching your filters.</p>
            </div>
          ) : (
            filteredEmployees.map(emp => {
              const dept      = getDeptColor(emp.department);
              const gradient  = getAvatarGradient(emp.name);

              return (
                <div
                  key={emp.id}
                  onClick={() => navigate(currentUser?.role === 'hr' ? `/hr/employees/${emp.id}` : `/admin/employees/${emp.id}`)}
                  className="group relative rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-[#6D74C9]/40 transition-all duration-200 cursor-pointer text-foreground flex flex-col justify-between min-h-[175px] border-t-2 border-t-[#6D74C9]/15"
                >
                  {/* Top Row: Avatar, Name, Status Badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar */}
                      <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${gradient} text-white text-xs font-bold flex items-center justify-center shrink-0 border border-border/10 shadow-sm`}>
                        {getInitials(emp.name)}
                      </div>
                      
                      {/* Name and Designation summary */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-bold text-foreground text-sm leading-tight font-display truncate" title={emp.name}>
                            {emp.name}
                          </h3>
                        </div>
                        {emp.role === 'admin' && (
                          <span className="text-[9px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded mt-0.5 inline-block shrink-0">
                            Super Admin
                          </span>
                        )}
                        {emp.role === 'hr' && (
                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded mt-0.5 inline-block shrink-0">
                            HR
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      <StatusChip status={emp.current_status} />
                    </div>
                  </div>

                  {/* Middle Row: Designation, Department, Employee ID */}
                  <div className="mt-3.5 space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5 shrink-0 text-[#6D74C9]/70" />
                      <span className="font-medium text-foreground truncate" title={emp.designation}>{emp.designation}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-[#6D74C9]/70" />
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${dept.bg} ${dept.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${dept.dot}`} />
                        {emp.department}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CreditCard className="h-3.5 w-3.5 shrink-0 text-[#6D74C9]/70" />
                      <span className="font-mono font-semibold text-[11px] text-foreground">{emp.employee_id}</span>
                    </div>
                  </div>

                  {/* Bottom Row: Email & Quick Actions */}
                  <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between text-xs gap-2">
                    {/* Email */}
                    <div className="flex items-center gap-1.5 text-muted-foreground min-w-0 flex-1">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-[#6D74C9]/70" />
                      <span className="truncate text-muted-foreground/90 font-medium" title={emp.email}>{emp.email}</span>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 shrink-0 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(currentUser?.role === 'hr' ? `/hr/employees/${emp.id}` : `/admin/employees/${emp.id}`);
                        }}
                        className="px-2 py-1 rounded text-[#6D74C9] hover:bg-[#6D74C9]/10 font-bold transition-colors"
                        title="View Profile"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(emp, e);
                        }}
                        className="px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/10 font-bold transition-colors"
                        title="Edit Employee"
                      >
                        Edit
                      </button>

                      {/* More Options Dropdown */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === emp.id ? null : emp.id);
                          }}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors"
                          title="More Options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {openMenuId === emp.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                              }}
                            />
                            <div className="absolute right-0 bottom-full mb-1.5 w-40 rounded-lg border border-border bg-card shadow-lg p-1 z-20 animate-in fade-in slide-in-from-bottom-1 duration-150">
                              {emp.employee_id !== 'HR001' && emp.employee_id !== currentUser?.employee_id && (emp.role === 'employee' || currentUser?.role === 'admin') ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    openDelete(emp, e);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded text-xs text-rose-500 hover:bg-rose-500/10 font-semibold flex items-center gap-2 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Remove Employee
                                </button>
                              ) : (
                                <div className="px-2.5 py-1.5 text-xs text-muted-foreground italic">
                                  No extra actions
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Add Employee Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title={currentUser?.role === 'hr' ? "Register New Employee" : "Register New Staff (HR or Employee)"} size="md">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Employee ID" placeholder="e.g. D07" value={empForm.employee_id}
              onChange={e => setEmpForm(p => ({ ...p, employee_id: e.target.value }))} error={formErrors.employee_id} />
            <Input label="Full Name" placeholder="e.g. Clark Kent" value={empForm.name}
              onChange={e => setEmpForm(p => ({ ...p, name: e.target.value }))} error={formErrors.name} />
          </div>
          <Input label="Email Address" type="email" placeholder="e.g. clark@company.com" value={empForm.email}
            onChange={e => setEmpForm(p => ({ ...p, email: e.target.value }))} error={formErrors.email} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Department" options={deptOptions} value={empForm.department}
              onChange={e => setEmpForm(p => ({ ...p, department: e.target.value }))} />
            <Input label="Designation" placeholder="e.g. Junior Developer" value={empForm.designation}
              onChange={e => setEmpForm(p => ({ ...p, designation: e.target.value }))} error={formErrors.designation} />
          </div>
          {currentUser?.role !== 'hr' && (
            <Select label="Portal User Role" options={roleOptions} value={empForm.role}
              onChange={e => setEmpForm(p => ({ ...p, role: e.target.value as 'admin' | 'hr' | 'employee' }))} />
          )}
          <div className="flex gap-3 pt-3 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">{currentUser?.role === 'hr' ? 'Register Employee' : 'Register Staff'}</Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Employee Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title={currentUser?.role === 'hr' ? "Edit Employee Details" : "Edit Staff Details"} size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Employee ID" value={empForm.employee_id} disabled
              onChange={e => setEmpForm(p => ({ ...p, employee_id: e.target.value }))} error={formErrors.employee_id} />
            <Input label="Full Name" placeholder="e.g. Clark Kent" value={empForm.name}
              onChange={e => setEmpForm(p => ({ ...p, name: e.target.value }))} error={formErrors.name} />
          </div>
          <Input label="Email Address" type="email" placeholder="e.g. clark@company.com" value={empForm.email}
            onChange={e => setEmpForm(p => ({ ...p, email: e.target.value }))} error={formErrors.email} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Department" options={deptOptions} value={empForm.department}
              onChange={e => setEmpForm(p => ({ ...p, department: e.target.value }))} />
            <Input label="Designation" placeholder="e.g. Junior Developer" value={empForm.designation}
              onChange={e => setEmpForm(p => ({ ...p, designation: e.target.value }))} error={formErrors.designation} />
          </div>
          {currentUser?.role !== 'hr' && (
            <Select label="Portal User Role" options={roleOptions} value={empForm.role}
              onChange={e => setEmpForm(p => ({ ...p, role: e.target.value as 'admin' | 'hr' | 'employee' }))} />
          )}
          <div className="flex gap-3 pt-3 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ────────────────────────────────────────────── */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Remove Staff Member?" size="sm">
        {selectedEmp && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 border border-rose-100">
              <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarGradient(selectedEmp.name)} text-white text-sm font-bold flex items-center justify-center flex-shrink-0`}>
                {getInitials(selectedEmp.name)}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{selectedEmp.name}</p>
                <p className="text-xs text-slate-500">{selectedEmp.employee_id} · {selectedEmp.department}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-normal">
              Are you sure you want to remove this staff member? This action <span className="text-rose-600 font-semibold">cannot be undone</span> and all associated attendance records will be deleted.
            </p>
            <div className="flex gap-3 pt-1 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
              <Button type="button" variant="destructive" size="sm" onClick={handleDeleteConfirm}>Remove Staff</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
