import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Check, X, Plane, Calendar, UserRound } from 'lucide-react';

export const LeaveManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { leaveRequests, employees, approveLeave, rejectLeave } = useData();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Map leave requests with employee details
  const leavesWithEmployee = useMemo(() => {
    return leaveRequests
      .map((req) => {
        const emp = employees.find((e) => e.employee_id === req.employee_id);
        return {
          ...req,
          employee_name: emp ? emp.name : 'Unknown Employee',
          department: emp ? emp.department : '--',
        };
      })
      .sort((a, b) => b.id.localeCompare(a.id)); // Newest first
  }, [leaveRequests, employees]);

  // Filter based on active tab
  const filteredLeaves = useMemo(() => {
    if (activeTab === 'all') return leavesWithEmployee;
    return leavesWithEmployee.filter((l) => l.status.toLowerCase() === activeTab);
  }, [leavesWithEmployee, activeTab]);

  const handleApprove = (id: string, name: string) => {
    if (!currentUser) return;
    approveLeave(id, currentUser.name);
    toast(`Approved leave request for ${name}`, 'success');
  };

  const handleReject = (id: string, name: string) => {
    if (!currentUser) return;
    rejectLeave(id, currentUser.name);
    toast(`Rejected leave request for ${name}`, 'success');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="Present" className="font-semibold text-xs px-2.5 py-0.5">Approved</Badge>;
      case 'Rejected':
        return <Badge variant="Absent" className="font-semibold text-xs px-2.5 py-0.5">Rejected</Badge>;
      case 'Pending':
      default:
        return <Badge variant="Leave" className="font-semibold text-xs px-2.5 py-0.5">Pending</Badge>;
    }
  };

  const tabs = [
    { id: 'all', label: 'All Requests' },
    { id: 'pending', label: 'Pending Approval' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
          Leave Management
        </h1>
        <p className="text-xs text-muted-foreground">
          Track employee leaves, approve or reject pending requests, and manage active calendars.
        </p>
      </div>

      {/* Tabs list navigation */}
      <div className="flex border-b border-border space-x-6 text-sm font-semibold">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-3 transition-colors duration-150 relative ${
              activeTab === t.id
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {t.id === 'pending' && leavesWithEmployee.filter((l) => l.status === 'Pending').length > 0 && (
              <span className="ml-1.5 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                {leavesWithEmployee.filter((l) => l.status === 'Pending').length}
              </span>
            )}
            {activeTab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Leave request list table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-36 text-center text-muted-foreground text-sm">
                    No leave requests found in this tab.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-semibold text-foreground flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                      {leave.employee_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-medium">{leave.department}</TableCell>
                    <TableCell className="text-foreground text-xs flex items-center gap-1.5">
                      <Plane className="h-3.5 w-3.5 text-muted-foreground" />
                      {leave.leave_type}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(leave.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(leave.end_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    <TableCell className="text-right">
                      {leave.status === 'Pending' ? (
                        <div className="flex justify-end space-x-1.5">
                          <Button
                            onClick={() => handleApprove(leave.id, leave.employee_name)}
                            size="sm"
                            className="bg-primary hover:opacity-90 text-primary-foreground font-bold h-8 px-2.5 border-transparent"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            <span>Approve</span>
                          </Button>
                          <Button
                            onClick={() => handleReject(leave.id, leave.employee_name)}
                            size="sm"
                            variant="destructive"
                            className="h-8 px-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            <X className="h-4 w-4 mr-1" />
                            <span>Reject</span>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Processed</span>
                      )}
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
