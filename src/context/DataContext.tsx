import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, AttendanceRecord, LeaveRequest, Holiday, ActivityLog, Announcement, Notification } from '../types';
import { useAuth } from './AuthContext';

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

  // Employee Actions
  checkIn: (employeeId: string) => void;
  checkOut: (employeeId: string) => void;
  applyForLeave: (employeeId: string, leaveType: string, startDate: string, endDate: string) => void;
  
  // HR/Admin Actions
  addEmployee: (employee: Omit<Employee, 'id' | 'current_status'>) => void;
  updateEmployee: (id: string, updatedEmployee: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
  approveLeave: (id: string, hrName: string) => void;
  rejectLeave: (id: string, hrName: string) => void;
  
  // Holiday Management Actions
  addHoliday: (holiday: Omit<Holiday, 'id'>) => void;
  updateHoliday: (id: string, updatedHoliday: Partial<Holiday>) => void;
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
      });
      if (res.ok) {
        await fetchInitialData();
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error approving leave:', err);
    }
  };

  // Reject Leave (Admin)
  const rejectLeave = async (id: string, hrName: string) => {
    try {
      const res = await fetch(`/api/leaves/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hrName })
      });
      if (res.ok) {
        await fetchInitialData();
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Error rejecting leave:', err);
    }
  };

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
