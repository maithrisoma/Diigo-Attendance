import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import {
  ShieldAlert,
  UserCheck,
  Users,
  Lock,
  Search,
  Check,
  HelpCircle,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { Employee } from '../../types';

export const RoleManagement: React.FC = () => {
  const { employees, updateEmployee } = useData();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  const [newRole, setNewRole] = useState<string>('employee');

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const q = searchQuery.toLowerCase().trim();
      return q === '' ||
        emp.name.toLowerCase().includes(q) ||
        emp.employee_id.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q);
    });
  }, [employees, searchQuery]);

  const handleRoleChange = () => {
    if (!selectedUser) return;
    
    // Prevent self-role modification
    if (selectedUser.employee_id === currentUser?.employee_id) {
      toast('You cannot change your own role!', 'error');
      return;
    }

    updateEmployee(selectedUser.id, { role: newRole as any });
    toast(`Successfully changed ${selectedUser.name}'s role to ${newRole.toUpperCase()}`, 'success');
    setSelectedUser(null);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Super Admin', cls: 'bg-rose-500/10 text-rose-600 border-rose-500/20', icon: ShieldCheck };
      case 'hr':
        return { label: 'HR Portal', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: ShieldAlert };
      case 'employee':
      default:
        return { label: 'Employee', cls: 'bg-primary/10 text-primary-text border-primary/20', icon: UserCheck };
    }
  };

  const permissionMatrix = [
    {
      role: 'Employee',
      desc: 'Access to personal portals and checking logs.',
      icon: Users,
      color: 'border-primary/20 bg-primary/5',
      permissions: [
        'View Own Attendance Logs',
        'Clock Check-In & Check-Out',
        'View Attendance Calendar Dashboard',
        'Request Personal Leaves',
      ],
    },
    {
      role: 'HR Manager',
      desc: 'Access to staff directory and daily logs.',
      icon: ShieldAlert,
      color: 'border-amber-500/20 bg-amber-500/5',
      permissions: [
        'Register & Edit Employees',
        'View Global Attendance Registry & Calendar',
        'Review & Approve Leave Requests',
        'Generate General Attendance Reports',
      ],
    },
    {
      role: 'Super Admin',
      desc: 'Absolute system power and admin panels.',
      icon: Lock,
      color: 'border-rose-500/20 bg-rose-500/5',
      permissions: [
        'Add, Remove & Disable HR Accounts',
        'Manage System Roles & Permissions Matrix',
        'Configure System Settings & Rules',
        'View System Audit Logs & Live Activity Logs',
        'Manage Holiday Calendars & Global Policies',
      ],
    },
  ];

  return (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">User Roles & Permissions</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Define access scopes, assign system roles, and audit role hierarchies across the company.
        </p>
      </div>

      {/* Grid containing permissions cards and assign role panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Permission matrix cards (Spans 2) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Permission Matrix</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {permissionMatrix.map(m => {
              const Icon = m.icon;
              return (
                <Card key={m.role} className={`border ${m.color} flex flex-col justify-between hover:shadow-md transition-all duration-300`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-foreground" />
                      <CardTitle className="text-base font-bold font-display">{m.role}</CardTitle>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-normal">{m.desc}</p>
                  </CardHeader>
                  <CardContent className="pt-2 border-t border-border mt-3 flex-1 flex flex-col justify-between">
                    <ul className="space-y-2 text-xs">
                      {m.permissions.map((p, idx) => (
                        <li key={idx} className="flex gap-2 items-start text-muted-foreground font-semibold">
                          <Check className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Change Role Card (Spans 1) */}
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="border-b border-border bg-muted/5">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Change User Role</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {selectedUser ? (
              <div className="space-y-4">
                <div className="p-3 bg-muted/20 border border-border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{selectedUser.name}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{selectedUser.employee_id}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleLabel(selectedUser.role).cls}`}>
                    {getRoleLabel(selectedUser.role).label}
                  </span>
                </div>

                <Select
                  label="Assign New Portal Role"
                  options={[
                    { value: 'employee', label: 'Employee' },
                    { value: 'hr', label: 'HR Manager' },
                    { value: 'admin', label: 'Super Admin' },
                  ]}
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                />

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>Cancel</Button>
                  <Button size="sm" onClick={handleRoleChange}>Update Role</Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-xs space-y-3">
                <Shield className="h-8 w-8 mx-auto opacity-30" />
                <p>Select a user from the directory below to modify their portal access permissions.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Directory list of users and roles */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Staff Directory</h2>
        
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, ID or email…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition shadow-sm"
          />
        </div>

        {/* User list table */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Employee ID</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Email</th>
                  <th className="py-3 px-6">Current Role</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredEmployees.map(emp => {
                  const labelCfg = getRoleLabel(emp.role);
                  const RoleIcon = labelCfg.icon;
                  return (
                    <tr key={emp.id} className="hover:bg-muted/5 transition-colors">
                      <td className="py-3 px-6 font-semibold">{emp.name}</td>
                      <td className="py-3 px-6 font-mono text-xs">{emp.employee_id}</td>
                      <td className="py-3 px-6 text-muted-foreground">{emp.department}</td>
                      <td className="py-3 px-6 text-muted-foreground font-mono text-xs">{emp.email}</td>
                      <td className="py-3 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${labelCfg.cls}`}>
                          <RoleIcon className="h-3 w-3" />
                          {labelCfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(emp);
                            setNewRole(emp.role);
                          }}
                          disabled={emp.employee_id === currentUser?.employee_id}
                        >
                          Modify Role
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
