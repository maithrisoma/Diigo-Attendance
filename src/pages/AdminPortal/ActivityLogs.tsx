import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Search, Scroll, Shield, Users, Clock, History } from 'lucide-react';

export const ActivityLogs: React.FC = () => {
  const { activities, employees } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedModule, setSelectedModule] = useState('all');

  const getActionAndModule = (type: string, message: string) => {
    const msg = message.toLowerCase();
    let action = 'System Action';
    let module = 'System';

    if (type.startsWith('leave_')) {
      module = 'Leaves';
      if (type === 'leave_approve') {
        action = msg.includes('requested') ? 'Leave Requested' : 'Leave Approved';
      } else {
        action = 'Leave Rejected';
      }
    } else if (msg.includes('holiday')) {
      module = 'Holidays';
      if (msg.includes('added')) action = 'Holiday Added';
      else if (msg.includes('updated')) action = 'Holiday Updated';
      else action = 'Holiday Removed';
    } else if (type.startsWith('employee_')) {
      module = 'Directory';
      if (type === 'employee_add') action = 'Staff Created';
      else if (type === 'employee_edit') action = 'Staff Updated';
      else action = 'Staff Deleted';
    } else if (type === 'check_in') {
      module = 'Attendance';
      action = 'Check In';
    } else if (type === 'check_out') {
      module = 'Attendance';
      action = 'Check Out';
    }

    return { action, module };
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Super Admin', cls: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
      case 'hr':
        return { label: 'HR Manager', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      case 'employee':
      default:
        return { label: 'Employee', cls: 'bg-primary/10 text-primary-text border-primary/20' };
    }
  };

  const mappedLogs = useMemo(() => {
    return activities.map(act => {
      // Find role of the actor
      const actor = employees.find(e => e.name === act.user_name);
      
      // Default roles for seeded mock actions that don't match active employee names
      let role = 'employee';
      if (actor) {
        role = actor.role;
      } else if (act.user_name === 'Sarah Connor' || act.user_name === 'HR Manager') {
        role = 'hr';
      } else if (act.user_name === 'Admin' || act.user_name === 'Super Admin') {
        role = 'admin';
      }

      const { action, module } = getActionAndModule(act.type, act.message);

      return {
        ...act,
        role,
        action,
        module,
      };
    });
  }, [activities, employees]);

  const filteredLogs = useMemo(() => {
    return mappedLogs.filter(log => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = q === '' ||
        log.user_name.toLowerCase().includes(q) ||
        log.message.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q);
      const matchRole = selectedRole === 'all' || log.role === selectedRole;
      const matchModule = selectedModule === 'all' || log.module === selectedModule;
      return matchSearch && matchRole && matchModule;
    });
  }, [mappedLogs, searchQuery, selectedRole, selectedModule]);

  return (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">System Audit Logs</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Track and audit all administrative actions, check-in records, and leave request operations in real-time.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by action, user or details…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-border bg-muted/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-lg border border-border bg-muted/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition sm:w-48"
        >
          <option value="all">All Actor Roles</option>
          <option value="admin">Super Admin</option>
          <option value="hr">HR Manager</option>
          <option value="employee">Employee</option>
        </select>
        <select
          value={selectedModule}
          onChange={e => setSelectedModule(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-lg border border-border bg-muted/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition sm:w-40"
        >
          <option value="all">All Modules</option>
          <option value="Attendance">Attendance</option>
          <option value="Leaves">Leaves</option>
          <option value="Holidays">Holidays</option>
          <option value="Directory">Directory</option>
          <option value="System">System</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-4 px-6">User (Actor)</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Action</th>
                <th className="py-4 px-6">Module</th>
                <th className="py-4 px-6 font-mono">Timestamp</th>
                <th className="py-4 px-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground text-xs">
                    No matching activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const rBadge = getRoleBadge(log.role);
                  return (
                    <tr key={log.id} className="hover:bg-muted/5 transition-colors">
                      <td className="py-4 px-6 font-semibold flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                          {log.user_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        {log.user_name}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${rBadge.cls}`}>
                          {rBadge.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-foreground">{log.action}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          log.module === 'Attendance' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          log.module === 'Leaves' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          log.module === 'Holidays' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          log.module === 'Directory' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {log.module}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleDateString()}{' '}
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 px-6 text-xs text-muted-foreground leading-normal max-w-xs truncate" title={log.message}>
                        {log.message}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
