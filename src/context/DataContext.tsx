import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, AttendanceRecord, LeaveRequest, Holiday, ActivityLog, AttendanceStatus, Announcement, Notification } from '../types';
import { API_BASE_URL } from '../config';
import { useAuth } from './AuthContext';
import {
  INITIAL_EMPLOYEES,
  INITIAL_HOLIDAYS,
  INITIAL_LEAVES,
  INITIAL_ACTIVITIES,
  generateMockAttendance,
} from '../utils/mockData';

// Helper: wrapper around fetch to prefix API base URL for "/api" routes
const originalFetch = window.fetch;
const fetchWithBase = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (typeof input === 'string' && input.startsWith('/api')) {
    return originalFetch(`${API_BASE_URL}${input}`, init);
  }
  return originalFetch(input, init);
};

interface DataContextType {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  holidays: Holiday[];
  activities: ActivityLog[];
  announcements: Announcement[];
  notifications: Notification[];
  
  // Fetch helpers
  fetchAnnouncements: () => Promise<void>;
  fetchNotifications: () => Promise<void>;

  // Employee actions
  checkIn: (employeeId: string) => void;
  checkOut: (employeeId: string) => void;
  applyForLeave: (employeeId: string, leaveType: string, startDate: string, endDate: string) => void;

  // HR/Admin actions
  addEmployee: (employee: Omit<Employee, 'id' | 'current_status'>) => void;
  updateEmployee: (id: string, updatedEmployee: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
  approveLeave: (id: string, hrName: string) => void;
  rejectLeave: (id: string, hrName: string) => void;

  // Holiday management
  addHoliday: (newH: Omit<Holiday, 'id'>) => void;
  updateHoliday: (id: string, updatedH: Partial<Holiday>) => void;
  removeHoliday: (id: string) => void;

  // Announcements CRUD
  addAnnouncement: (annData: Omit<Announcement, 'id' | 'created_at'>) => Promise<void>;
  updateAnnouncement: (id: string, updatedFields: Partial<Announcement>) => Promise<void>;
  removeAnnouncement: (id: string) => Promise<void>;

  // Notifications Actions
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchInitialData = async () => {
    try {
      const [resEmp, resAtt, resLeaves, resHolidays, resAct] = await Promise.all([
        fetch('/api/employees').then(r => r.json()),
        fetch('/api/attendance').then(r => r.json()),
        fetch('/api/leaves').then(r => r.json()),
        fetch('/api/holidays').then(r => r.json()),
        fetch('/api/activities').then(r => r.json())
      ]);
      setEmployees(resEmp);
      setAttendance(resAtt);
      setLeaveRequests(resLeaves);
      setHolidays(resHolidays);
      setActivities(resAct);
    } catch (err) {
      console.error('Failed to fetch initial data from backend:', err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const url = currentUser 
        ? `/api/announcements?employeeId=${currentUser.employee_id}&role=${currentUser.role}&department=${encodeURIComponent(currentUser.department)}`
        : '/api/announcements';
      const data = await fetch(url).then(r => r.json());
      setAnnouncements(data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    try {
      const data = await fetch(`/api/notifications/${currentUser.employee_id}`).then(r => r.json());
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

<<<<<<< HEAD
  // Load from localStorage or fallback to mock seeds
  useEffect(() => {
    const savedEmployees = localStorage.getItem('employees');
    const savedHolidays = localStorage.getItem('holidays');
    const savedLeaves = localStorage.getItem('leaveRequests');
    const savedActivities = localStorage.getItem('activities');
    const savedAttendance = localStorage.getItem('attendance');

    // Migration check – if legacy IDs exist, clear storage
    if (savedEmployees && savedEmployees.includes('EMP001')) {
      localStorage.clear();
    }

    const employeesList = savedEmployees ? JSON.parse(savedEmployees) : INITIAL_EMPLOYEES;
    const holidaysList = savedHolidays ? JSON.parse(savedHolidays) : INITIAL_HOLIDAYS;
    const leavesList = savedLeaves ? JSON.parse(savedLeaves) : INITIAL_LEAVES;
    const activitiesList = savedActivities ? JSON.parse(savedActivities) : INITIAL_ACTIVITIES;
    const attendanceList = savedAttendance
      ? JSON.parse(savedAttendance)
      : generateMockAttendance(employeesList, holidaysList, leavesList);

    setEmployees(employeesList);
    setHolidays(holidaysList);
    setLeaveRequests(leavesList);
    setActivities(activitiesList);
    setAttendance(attendanceList);
  }, []);

  // Utility to persist a key
  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Activity logger
  const logActivity = (type: string, user_name: string, message: string) => {
    setActivities(prev => {
      const updated: ActivityLog[] = [
        { id: 'act-' + Math.random().toString(36).substring(2, 11), type: type as any, user_name, message, timestamp: new Date().toISOString() },
        ...prev,
      ];
      saveToStorage('activities', updated);
      return updated;
    });
  };

  // --- Employee actions ---
  const checkIn = (employeeId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const checkInTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    setAttendance(prev => {
      const idx = prev.findIndex(a => a.employee_id === employeeId && a.date === todayStr);
      const updated = idx > -1 ? prev.map((rec, i) => (i === idx ? { ...rec, check_in: checkInTime, status: 'Present' as AttendanceStatus } : rec)) : [
        ...prev,
        { id: 'att-' + Math.random().toString(36).substring(2, 11), employee_id: employeeId, date: todayStr, check_in: checkInTime, check_out: null, status: 'Present' as AttendanceStatus, working_hours: null },
      ];
      saveToStorage('attendance', updated);
      return updated;
    });
    setEmployees(prev => {
      const updated = prev.map(e => (e.employee_id === employeeId ? { ...e, current_status: 'Present' as const } : e));
      saveToStorage('employees', updated);
      return updated;
    });
    const emp = employees.find(e => e.employee_id === employeeId);
    if (emp) logActivity('check_in', emp.name, `${emp.name} checked in at ${checkInTime}.`);
  };

  const checkOut = (employeeId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const checkOutTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    setAttendance(prev => {
      const idx = prev.findIndex(a => a.employee_id === employeeId && a.date === todayStr);
      if (idx === -1) return prev;
      const rec = prev[idx];
      const [inH, inM, inS] = (rec.check_in || '09:00:00').split(':').map(Number);
      const [outH, outM, outS] = checkOutTime.split(':').map(Number);
      const inDate = new Date(); inDate.setHours(inH, inM, inS || 0);
      const outDate = new Date(); outDate.setHours(outH, outM, outS || 0);
      const diffMs = outDate.getTime() - inDate.getTime();
      const workingHours = diffMs > 0 ? parseFloat((diffMs / 3600000).toFixed(2)) : 0;
      const updated = prev.map((r, i) => (i === idx ? { ...r, check_out: checkOutTime, working_hours: workingHours } : r));
      saveToStorage('attendance', updated);
      return updated;
    });
    setEmployees(prev => {
      const updated = prev.map(e => (e.employee_id === employeeId ? { ...e, current_status: 'Present' as const } : e));
      saveToStorage('employees', updated);
      return updated;
    });
    const emp = employees.find(e => e.employee_id === employeeId);
    if (emp) logActivity('check_out', emp.name, `${emp.name} checked out at ${checkOutTime}.`);
  };

  const applyForLeave = (employeeId: string, leaveType: string, startDate: string, endDate: string) => {
    const newLeave: LeaveRequest = {
      id: 'leave-' + Math.random().toString(36).substring(2, 11),
      employee_id: employeeId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      status: 'Pending',
    };
    setLeaveRequests(prev => {
      const updated = [...prev, newLeave];
      saveToStorage('leaveRequests', updated);
      return updated;
    });
    const emp = employees.find(e => e.employee_id === employeeId);
    if (emp) logActivity('leave_apply', emp.name, `${emp.name} applied for ${leaveType} leave (${startDate} to ${endDate}).`);
  };

  // --- Admin actions ---
  const addEmployee = (empData: Omit<Employee, 'id' | 'current_status'>) => {
    const newEmp: Employee = { ...empData, id: 'emp-' + Math.random().toString(36).substring(2, 11), current_status: 'Absent' };
    setEmployees(prev => {
      const updated = [...prev, newEmp];
      saveToStorage('employees', updated);
      return updated;
    });
    logActivity('employee_add', 'Admin', `Added new employee ${newEmp.name} (${newEmp.employee_id}) to ${newEmp.department}.`);
  };

  const updateEmployee = (id: string, updatedFields: Partial<Employee>) => {
    setEmployees(prev => {
      const updated = prev.map(e => (e.id === id ? { ...e, ...updatedFields } : e));
      saveToStorage('employees', updated);
      return updated;
    });
    const emp = employees.find(e => e.id === id);
    if (emp) logActivity('employee_edit', 'Admin', `Updated details for employee ${emp.name} (${emp.employee_id}).`);
  };

  const removeEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    setEmployees(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveToStorage('employees', updated);
      return updated;
    });
    if (emp) logActivity('employee_remove', 'Admin', `Removed employee ${emp.name} (${emp.employee_id}).`);
  };

  const approveLeave = (id: string, hrName: string) => {
    setLeaveRequests(prev => {
      const updated = prev.map(l => {
        if (l.id === id) {
          const emp = employees.find(e => e.employee_id === l.employee_id);
          if (emp) {
            logActivity('leave_approve', hrName, `Approved ${l.leave_type} request for ${emp.name} (${l.start_date} to ${l.end_date}).`);
            const todayStr = new Date().toISOString().split('T')[0];
            if (todayStr >= l.start_date && todayStr <= l.end_date) {
              setEmployees(prevEmps => {
                const updatedEmps = prevEmps.map(e => (e.employee_id === l.employee_id ? { ...e, current_status: 'Leave' as const } : e));
                saveToStorage('employees', updatedEmps);
                return updatedEmps;
              });
            }
          }
          return { ...l, status: 'Approved' as const };
        }
        return l;
=======
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    fetchNotifications();
  }, [currentUser]);

  // Check In
  const checkIn = async (employeeId: string) => {
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      if (res.ok) {
        await fetchInitialData();
      }
    } catch (err) {
      console.error('Error during check-in:', err);
    }
  };

  // Check Out
  const checkOut = async (employeeId: string) => {
    try {
      const res = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      if (res.ok) {
        await fetchInitialData();
      }
    } catch (err) {
      console.error('Error during check-out:', err);
    }
  };

  // Apply for Leave (Employee)
  const applyForLeave = async (employeeId: string, leaveType: string, startDate: string, endDate: string) => {
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, leaveType, startDate, endDate })
      });
      if (res.ok) {
        await fetchInitialData();
      }
    } catch (err) {
      console.error('Error applying for leave:', err);
    }
  };

  // Add Employee (Admin)
  const addEmployee = async (empData: Omit<Employee, 'id' | 'current_status'>) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empData)
      });
      if (res.ok) {
        await fetchInitialData();
      }
    } catch (err) {
      console.error('Error adding employee:', err);
    }
  };

  // Edit Employee (Admin)
  const updateEmployee = async (id: string, updatedFields: Partial<Employee>) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        await fetchInitialData();
      }
    } catch (err) {
      console.error('Error updating employee:', err);
    }
  };

  // Remove Employee (Admin)
  const removeEmployee = async (id: string) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchInitialData();
      }
    } catch (err) {
      console.error('Error removing employee:', err);
    }
  };

  // Approve Leave (Admin)
  const approveLeave = async (id: string, hrName: string) => {
    try {
      const res = await fetch(`/api/leaves/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hrName })
>>>>>>> 2ca4c95fcedcb40f6697faae85b722902ce0c4e7
      });
      if (res.ok) {
        await fetchInitialData();
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error approving leave:', err);
    }
  };

<<<<<<< HEAD
  const rejectLeave = (id: string, hrName: string) => {
    setLeaveRequests(prev => {
      const updated = prev.map(l => {
        if (l.id === id) {
          const emp = employees.find(e => e.employee_id === l.employee_id);
          if (emp) logActivity('leave_reject', hrName, `Rejected ${l.leave_type} request for ${emp.name}.`);
          return { ...l, status: 'Rejected' as const };
        }
        return l;
=======
  // Reject Leave (Admin)
  const rejectLeave = async (id: string, hrName: string) => {
    try {
      const res = await fetch(`/api/leaves/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hrName })
>>>>>>> 2ca4c95fcedcb40f6697faae85b722902ce0c4e7
      });
      if (res.ok) {
        await fetchInitialData();
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error rejecting leave:', err);
    }
  };

<<<<<<< HEAD
  // --- Holiday management ---
  const addHoliday = (newH: Omit<Holiday, 'id'>) => {
    const holiday: Holiday = { ...newH, id: 'h-' + Math.random().toString(36).substring(2, 11) };
    setHolidays(prev => {
      const updated = [...prev, holiday];
      saveToStorage('holidays', updated);
      return updated;
    });
    logActivity('holiday_add', 'Admin', `Added new holiday "${holiday.holiday_name}" on ${holiday.holiday_date}.`);
  };

  const updateHoliday = (id: string, updatedH: Partial<Holiday>) => {
    setHolidays(prev => {
      const updated = prev.map(h => (h.id === id ? { ...h, ...updatedH } : h));
      saveToStorage('holidays', updated);
      return updated;
    });
    const hol = holidays.find(h => h.id === id);
    if (hol) logActivity('holiday_edit', 'Admin', `Updated holiday "${hol.holiday_name}" details.`);
  };

  const removeHoliday = (id: string) => {
    const hol = holidays.find(h => h.id === id);
    setHolidays(prev => {
      const updated = prev.filter(h => h.id !== id);
      saveToStorage('holidays', updated);
      return updated;
    });
    if (hol) logActivity('holiday_remove', 'Admin', `Removed holiday "${hol.holiday_name}" scheduled for ${hol.holiday_date}.`);
=======
  // Add Holiday
  const addHoliday = async (newH: Omit<Holiday, 'id'>) => {
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newH)
      });
      if (res.ok) {
        await fetchInitialData();
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error adding holiday:', err);
    }
  };

  // Update Holiday
  const updateHoliday = async (id: string, updatedH: Partial<Holiday>) => {
    try {
      const res = await fetch(`/api/holidays/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedH)
      });
      if (res.ok) {
        await fetchInitialData();
      }
    } catch (err) {
      console.error('Error updating holiday:', err);
    }
  };

  // Remove Holiday
  const removeHoliday = async (id: string) => {
    try {
      const res = await fetch(`/api/holidays/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchInitialData();
      }
    } catch (err) {
      console.error('Error removing holiday:', err);
    }
  };

  // Announcements CRUD
  const addAnnouncement = async (annData: Omit<Announcement, 'id' | 'created_at'>) => {
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annData)
      });
      if (res.ok) {
        await fetchAnnouncements();
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error adding announcement:', err);
    }
  };

  const updateAnnouncement = async (id: string, updatedFields: Partial<Announcement>) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        await fetchAnnouncements();
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error updating announcement:', err);
    }
  };

  const removeAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchAnnouncements();
      }
    } catch (err) {
      console.error('Error removing announcement:', err);
    }
  };

  // Notifications Actions
  const markNotificationRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT'
      });
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications/read-all/${currentUser.employee_id}`, {
        method: 'PUT'
      });
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
>>>>>>> 2ca4c95fcedcb40f6697faae85b722902ce0c4e7
  };

  return (
    <DataContext.Provider
      value={{
        employees,
        attendance,
        leaveRequests,
        holidays,
        activities,
        announcements,
        notifications,
        fetchAnnouncements,
        fetchNotifications,
        checkIn,
        checkOut,
        applyForLeave,
        addEmployee,
        updateEmployee,
        removeEmployee,
        approveLeave,
        rejectLeave,
        addHoliday,
        updateHoliday,
        removeHoliday,
        addAnnouncement,
        updateAnnouncement,
        removeAnnouncement,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
