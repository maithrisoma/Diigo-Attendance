import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
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
} from 'lucide-react';
import { Employee } from '../../types';

// ─── Department colour map ───────────────────────────────────────────────────
const DEPT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Engineering:      { bg: 'bg-lilac-200', text: 'text-lilac-900', dot: 'bg-lilac-600' },
  Marketing:        { bg: 'bg-lilac-300', text: 'text-lilac-900', dot: 'bg-lilac-700' },
  Sales:            { bg: 'bg-lilac-200', text: 'text-lilac-900', dot: 'bg-lilac-500' },
  'Human Resources':{ bg: 'bg-lilac-300', text: 'text-lilac-900', dot: 'bg-lilac-600' },
  Finance:          { bg: 'bg-lilac-200', text: 'text-lilac-900', dot: 'bg-lilac-700' },
};

const getDeptColor = (dept: string) =>
  DEPT_COLORS[dept] ?? { bg: 'bg-lilac-100', text: 'text-lilac-700', dot: 'bg-lilac-400' };

// ─── Avatar initials ─────────────────────────────────────────────────────────
const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

// ─── Avatar background gradient by name ──────────────────────────────────────
const AVATAR_GRADIENTS = [
  'from-lilac-400 to-lilac-500',
  'from-lilac-500 to-lilac-600',
  'from-lilac-300 to-lilac-500',
  'from-lilac-400 to-lilac-700',
  'from-lilac-500 to-lilac-700',
  'from-lilac-600 to-lilac-800',
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
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedDept, setSelectedDept]   = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [addOpen, setAddOpen]               = useState(false);
  const [editOpen, setEditOpen]             = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedEmp, setSelectedEmp]       = useState<Employee | null>(null);

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
  const roleOptions = [
    { value: 'employee', label: 'Employee' },
    { value: 'admin',    label: 'HR / Admin' },
  ];
  const statusOptions = [
    { value: 'all',     label: 'All Statuses' },
    { value: 'Present', label: 'Present' },
    { value: 'Absent',  label: 'Absent' },
    { value: 'Leave',   label: 'On Leave' },
  ];

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filteredEmployees = useMemo(() =>
    employees.filter(emp => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = q === '' ||
        emp.name.toLowerCase().includes(q) ||
        emp.employee_id.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q);
      const matchDept   = selectedDept   === 'all' || emp.department     === selectedDept;
      const matchStatus = selectedStatus === 'all' || emp.current_status === selectedStatus;
      return matchSearch && matchDept && matchStatus;
    }),
  [employees, searchQuery, selectedDept, selectedStatus]);

  // ── Summary counts ────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:   employees.length,
    present: employees.filter(e => e.current_status === 'Present').length,
    absent:  employees.filter(e => e.current_status === 'Absent').length,
    leave:   employees.filter(e => e.current_status === 'Leave').length,
  }), [employees]);

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
    addEmployee(empForm);
    toast(`Added ${empForm.name} successfully!`, 'success');
    setAddOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !validateForm()) return;
    updateEmployee(selectedEmp.id, empForm);
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
          <h1 className="text-2xl font-black tracking-tight" style={{ color: '#4C1D95' }}>Employee Directory</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9879E9' }}>
            {filteredEmployees.length} of {employees.length} employees shown
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setAddOpen(true); }}
          className="btn-lilac flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
        >
          <UserPlus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      {/* ── Summary stats strip ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff',   value: stats.total,   accent: '#6D28D9' },
          { label: 'Present Today', value: stats.present, accent: '#7C3AED' },
          { label: 'Absent Today',  value: stats.absent,  accent: '#9879E9' },
          { label: 'On Leave',      value: stats.leave,   accent: '#A78BFA' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-2xl font-black" style={{ color: s.accent }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9879E9' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter toolbar ──────────────────────────────────────────────────── */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#C4B5FD' }} />
          <input
            type="text"
            placeholder="Search by name, ID, email or designation…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-lilac w-full pl-9 pr-4 py-2.5 text-sm"
          />
        </div>
        <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="input-lilac px-3 py-2.5 text-sm sm:w-48">
          {departments.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="input-lilac px-3 py-2.5 text-sm sm:w-40">
          {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                  onClick={() => navigate(`/admin/employees/${emp.id}`)}
                  className="group glass-card cursor-pointer hover:-translate-y-1"
                >
                  {/* Top colour banner */}
                  <div className={`h-16 bg-gradient-to-r ${gradient} relative`}>
                    {/* Edit / Delete quick actions */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => openEdit(emp, e)}
                        className="h-7 w-7 rounded-lg bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card transition shadow"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-foreground" />
                      </button>
                      {emp.employee_id !== 'HR001' && (
                        <button
                          onClick={e => openDelete(emp, e)}
                          className="h-7 w-7 rounded-lg bg-white/80 backdrop-blur flex items-center justify-center hover:bg-lilac-200 transition shadow"
                          title="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" style={{ color: '#8B5CF6' }} />
                        </button>
                      )}
                    </div>

                    {/* Role badge */}
                    {emp.role === 'admin' && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.9)', color: '#7C3AED' }}>
                        <ShieldCheck className="h-3 w-3" /> Admin
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="px-4 pb-4">
                    <div className={`-mt-8 mb-3 h-14 w-14 rounded-full bg-gradient-to-br ${gradient} text-white text-base font-bold flex items-center justify-center ring-4 ring-card shadow-md`}>
                      {getInitials(emp.name)}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <h3 className="font-bold text-foreground text-sm leading-tight font-display">{emp.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{emp.designation}</p>
                      </div>

                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${dept.bg} ${dept.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${dept.dot}`} />
                        {emp.department}
                      </span>

                      <div className="flex items-center justify-between pt-1 border-t border-border">
                        <span className="font-mono text-[11px] text-muted-foreground font-medium">{emp.employee_id}</span>
                        <StatusChip status={emp.current_status} />
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
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Register New Employee" size="md">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Employee ID" placeholder="e.g. EMP007" value={empForm.employee_id}
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
          <Select label="Portal User Role" options={roleOptions} value={empForm.role}
            onChange={e => setEmpForm(p => ({ ...p, role: e.target.value as 'admin' | 'employee' }))} />
          <div className="flex gap-3 pt-3 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">Register Employee</Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Employee Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Employee Details" size="md">
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
          <Select label="Portal User Role" options={roleOptions} value={empForm.role}
            onChange={e => setEmpForm(p => ({ ...p, role: e.target.value as 'admin' | 'employee' }))} />
          <div className="flex gap-3 pt-3 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ────────────────────────────────────────────── */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Remove Employee?" size="sm">
        {selectedEmp && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: '#F2EBFF', border: '1px solid #DDD6FE' }}>
              <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarGradient(selectedEmp.name)} text-white text-sm font-bold flex items-center justify-center flex-shrink-0`}>
                {getInitials(selectedEmp.name)}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#4C1D95' }}>{selectedEmp.name}</p>
                <p className="text-xs" style={{ color: '#9879E9' }}>{selectedEmp.employee_id} · {selectedEmp.department}</p>
              </div>
            </div>
            <p className="text-sm leading-normal" style={{ color: '#6D5A9C' }}>
              Are you sure you want to remove this employee? This action <span style={{ color: '#7C3AED', fontWeight: 600 }}>cannot be undone</span>.
            </p>
            <div className="flex gap-3 pt-1 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
              <Button type="button" variant="destructive" size="sm" onClick={handleDeleteConfirm}>Remove Employee</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
