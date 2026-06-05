import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import {
  UserPlus,
  Edit2,
  Trash2,
  UserX,
  UserCheck,
  ShieldCheck,
  Search,
  Building2,
  Mail,
  UserCheck2,
} from 'lucide-react';
import { Employee } from '../../types';

export const HRManagement: React.FC = () => {
  const { employees, addEmployee, updateEmployee, removeEmployee } = useData();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedHR, setSelectedHR] = useState<Employee | null>(null);

  const [hrForm, setHRForm] = useState({
    employee_id: '',
    name: '',
    email: '',
    department: 'Human Resources',
    designation: 'HR Coordinator',
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const deptOptions = [
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Administration', label: 'Administration' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Finance', label: 'Finance' },
  ];

  // Filter only HR users
  const hrs = useMemo(() => {
    return employees.filter(e => e.role === 'hr');
  }, [employees]);

  const filteredHRs = useMemo(() => {
    return hrs.filter(hr => {
      const q = searchQuery.toLowerCase().trim();
      return q === '' ||
        hr.name.toLowerCase().includes(q) ||
        hr.employee_id.toLowerCase().includes(q) ||
        hr.email.toLowerCase().includes(q) ||
        hr.designation.toLowerCase().includes(q);
    });
  }, [hrs, searchQuery]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!hrForm.employee_id.trim()) errs.employee_id = 'HR Employee ID is required';
    else if (employees.some(e => e.employee_id === hrForm.employee_id && e.id !== selectedHR?.id))
      errs.employee_id = 'Employee ID already exists';
    if (!hrForm.name.trim()) errs.name = 'Full Name is required';
    if (!hrForm.email.trim()) errs.email = 'Email Address is required';
    else if (!/\S+@\S+\.\S+/.test(hrForm.email)) errs.email = 'Invalid email address';
    else if (employees.some(e => e.email === hrForm.email && e.id !== selectedHR?.id))
      errs.email = 'Email already registered';
    if (!hrForm.designation.trim()) errs.designation = 'Designation is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const resetForm = () => {
    setHRForm({
      employee_id: '',
      name: '',
      email: '',
      department: 'Human Resources',
      designation: 'HR Coordinator',
    });
    setFormErrors({});
    setSelectedHR(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Role is hardcoded to 'hr'
    addEmployee({
      ...hrForm,
      role: 'hr',
    });
    
    toast(`Added HR Personnel ${hrForm.name} successfully!`, 'success');
    setAddOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHR || !validateForm()) return;
    
    updateEmployee(selectedHR.id, {
      ...hrForm,
      role: 'hr',
    });
    
    toast(`Updated HR Personnel details for ${hrForm.name}!`, 'success');
    setEditOpen(false);
    resetForm();
  };

  const handleDeleteConfirm = () => {
    if (!selectedHR) return;
    removeEmployee(selectedHR.id);
    toast(`Removed HR Personnel ${selectedHR.name} from directory`, 'success');
    setDeleteConfirmOpen(false);
    setSelectedHR(null);
  };

  const toggleHRAccess = (hr: Employee) => {
    const nextStatus = hr.status === 'Inactive' ? 'Active' : 'Inactive';
    updateEmployee(hr.id, { status: nextStatus });
    toast(`HR access for ${hr.name} has been ${nextStatus === 'Active' ? 'Enabled' : 'Disabled'}`, 'success');
  };

  const openEdit = (hr: Employee) => {
    setSelectedHR(hr);
    setHRForm({
      employee_id: hr.employee_id,
      name: hr.name,
      email: hr.email,
      department: hr.department,
      designation: hr.designation,
    });
    setEditOpen(true);
  };

  const openDelete = (hr: Employee) => {
    setSelectedHR(hr);
    setDeleteConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">HR Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage HR system access, disable portal privileges, and register new HR roles.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setAddOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
        >
          <UserPlus className="h-4 w-4" />
          Add HR Personnel
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search HR by name, ID, email or designation…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-border bg-muted/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden text-foreground">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-4 px-6">HR Personnel</th>
                <th className="py-4 px-6">Employee ID</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6 text-center">Access Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredHRs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                    No HR users found in the registry.
                  </td>
                </tr>
              ) : (
                filteredHRs.map(hr => (
                  <tr key={hr.id} className="hover:bg-muted/5 transition-colors">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                        {hr.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{hr.name}</p>
                        <p className="text-[11px] text-muted-foreground">{hr.designation}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">{hr.employee_id}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary-text">
                        <Building2 className="h-3 w-3" />
                        {hr.department}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        {hr.email}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        hr.status !== 'Inactive'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      }`}>
                        {hr.status !== 'Inactive' ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleHRAccess(hr)}
                          className={`p-1.5 rounded-lg border transition ${
                            hr.status !== 'Inactive'
                              ? 'border-rose-200 text-rose-500 hover:bg-rose-500/10'
                              : 'border-emerald-200 text-emerald-500 hover:bg-emerald-500/10'
                          }`}
                          title={hr.status !== 'Inactive' ? 'Disable HR Access' : 'Enable HR Access'}
                        >
                          {hr.status !== 'Inactive' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(hr)}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/10 transition"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDelete(hr)}
                          className="p-1.5 rounded-lg border border-rose-100 text-rose-500 hover:bg-rose-500/10 transition"
                          title="Delete"
                          disabled={hr.employee_id === currentUser?.employee_id}
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
      </div>

      {/* Register HR Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Register HR Access Portal" size="md">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="HR Employee ID" placeholder="e.g. HR002" value={hrForm.employee_id}
              onChange={e => setHRForm(p => ({ ...p, employee_id: e.target.value }))} error={formErrors.employee_id} />
            <Input label="Full Name" placeholder="e.g. Sarah Connor" value={hrForm.name}
              onChange={e => setHRForm(p => ({ ...p, name: e.target.value }))} error={formErrors.name} />
          </div>
          <Input label="Email Address" type="email" placeholder="e.g. sarah@company.com" value={hrForm.email}
            onChange={e => setHRForm(p => ({ ...p, email: e.target.value }))} error={formErrors.email} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Department" options={deptOptions} value={hrForm.department}
              onChange={e => setHRForm(p => ({ ...p, department: e.target.value }))} />
            <Input label="Designation" placeholder="e.g. HR Recruiter" value={hrForm.designation}
              onChange={e => setHRForm(p => ({ ...p, designation: e.target.value }))} error={formErrors.designation} />
          </div>
          <div className="flex gap-3 pt-3 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">Register HR Personnel</Button>
          </div>
        </form>
      </Modal>

      {/* Edit HR Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit HR Details" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="HR Employee ID" value={hrForm.employee_id} disabled />
            <Input label="Full Name" placeholder="e.g. Sarah Connor" value={hrForm.name}
              onChange={e => setHRForm(p => ({ ...p, name: e.target.value }))} error={formErrors.name} />
          </div>
          <Input label="Email Address" type="email" placeholder="e.g. sarah@company.com" value={hrForm.email}
            onChange={e => setHRForm(p => ({ ...p, email: e.target.value }))} error={formErrors.email} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Department" options={deptOptions} value={hrForm.department}
              onChange={e => setHRForm(p => ({ ...p, department: e.target.value }))} />
            <Input label="Designation" placeholder="e.g. HR Recruiter" value={hrForm.designation}
              onChange={e => setHRForm(p => ({ ...p, designation: e.target.value }))} error={formErrors.designation} />
          </div>
          <div className="flex gap-3 pt-3 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete HR Modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Remove HR Personnel?" size="sm">
        {selectedHR && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 border border-rose-100">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                {selectedHR.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{selectedHR.name}</p>
                <p className="text-xs text-slate-500">{selectedHR.employee_id} · {selectedHR.department}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-normal">
              Are you sure you want to remove this HR user? This action <span className="text-rose-600 font-semibold">cannot be undone</span> and their admin access privileges will be revoked.
            </p>
            <div className="flex gap-3 pt-1 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
              <Button type="button" variant="destructive" size="sm" onClick={handleDeleteConfirm}>Remove HR</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
