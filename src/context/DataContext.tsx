import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, AttendanceRecord, LeaveRequest, Holiday, ActivityLog, AttendanceStatus } from '../types';


interface DataContextType {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  holidays: Holiday[];
  activities: ActivityLog[];
  
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  const refreshAllData = async () => {
    try {
      const [empRes, attRes, leaveRes, holRes, actRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/attendance'),
        fetch('/api/leaves'),
        fetch('/api/holidays'),
        fetch('/api/activities')
      ]);

      if (empRes.ok) setEmployees(await empRes.json());
      if (attRes.ok) setAttendance(await attRes.json());
      if (leaveRes.ok) setLeaveRequests(await leaveRes.json());
      if (holRes.ok) setHolidays(await holRes.json());
      if (actRes.ok) setActivities(await actRes.json());
    } catch (err) {
      console.error('Error fetching data from API:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Check In
  const checkIn = async (employeeId: string) => {
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });
      if (res.ok) await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Check Out
  const checkOut = async (employeeId: string) => {
    try {
      const res = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });
      if (res.ok) await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Apply for Leave (Employee)
  const applyForLeave = async (employeeId: string, leaveType: string, startDate: string, endDate: string) => {
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, leaveType, startDate, endDate }),
      });
      if (res.ok) await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Add Employee (Admin)
  const addEmployee = async (empData: Omit<Employee, 'id' | 'current_status'>) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empData),
      });
      if (res.ok) await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Employee (Admin)
  const updateEmployee = async (id: string, updatedFields: Partial<Employee>) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Remove Employee (Admin)
  const removeEmployee = async (id: string) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Approve Leave (Admin)
  const approveLeave = async (id: string, hrName: string) => {
    try {
      const res = await fetch(`/api/leaves/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hrName }),
      });
      if (res.ok) await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Reject Leave (Admin)
  const rejectLeave = async (id: string, hrName: string) => {
    try {
      const res = await fetch(`/api/leaves/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hrName }),
      });
      if (res.ok) await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Add Holiday
  const addHoliday = async (newH: Omit<Holiday, 'id'>) => {
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newH),
      });
      if (res.ok) await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Update Holiday
  const updateHoliday = async (id: string, updatedH: Partial<Holiday>) => {
    try {
      const res = await fetch(`/api/holidays/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedH),
      });
      if (res.ok) await refreshAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Remove Holiday
  const removeHoliday = async (id: string) => {
    try {
      const res = await fetch(`/api/holidays/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) await refreshAllData();
    } catch (err) {
      console.error(err);
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
