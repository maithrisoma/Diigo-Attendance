import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, AttendanceRecord, LeaveRequest, Holiday, ActivityLog, AttendanceStatus } from '../types';
import { API_BASE_URL } from '../config';
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

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
      });
      saveToStorage('leaveRequests', updated);
      return updated;
    });
  };

  const rejectLeave = (id: string, hrName: string) => {
    setLeaveRequests(prev => {
      const updated = prev.map(l => {
        if (l.id === id) {
          const emp = employees.find(e => e.employee_id === l.employee_id);
          if (emp) logActivity('leave_reject', hrName, `Rejected ${l.leave_type} request for ${emp.name}.`);
          return { ...l, status: 'Rejected' as const };
        }
        return l;
      });
      saveToStorage('leaveRequests', updated);
      return updated;
    });
  };

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
