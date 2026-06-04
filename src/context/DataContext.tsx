import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, AttendanceRecord, LeaveRequest, Holiday, ActivityLog, AttendanceStatus } from '../types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_HOLIDAYS,
  INITIAL_LEAVES,
  INITIAL_ACTIVITIES,
  generateMockAttendance,
} from '../utils/mockData';

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

  useEffect(() => {
    let storedHolidays = localStorage.getItem('holidays');
    let loadedHolidays: Holiday[] = [];
    if (!storedHolidays) {
      localStorage.setItem('holidays', JSON.stringify(INITIAL_HOLIDAYS));
      loadedHolidays = INITIAL_HOLIDAYS;
    } else {
      loadedHolidays = JSON.parse(storedHolidays);
      if (loadedHolidays.length === 0 || !loadedHolidays.some(h => h.hasOwnProperty('holiday_type'))) {
        localStorage.setItem('holidays', JSON.stringify(INITIAL_HOLIDAYS));
        loadedHolidays = INITIAL_HOLIDAYS;
      }
    }
    setHolidays(loadedHolidays);

    // Load leave requests
    let storedLeaves = localStorage.getItem('leave_requests');
    let loadedLeaves: LeaveRequest[] = [];
    if (!storedLeaves) {
      localStorage.setItem('leave_requests', JSON.stringify(INITIAL_LEAVES));
      loadedLeaves = INITIAL_LEAVES;
    } else {
      loadedLeaves = JSON.parse(storedLeaves);
    }
    setLeaveRequests(loadedLeaves);

    // Load employees
    let storedEmployees = localStorage.getItem('employees');
    let loadedEmployees: Employee[] = [];
    if (!storedEmployees) {
      localStorage.setItem('employees', JSON.stringify(INITIAL_EMPLOYEES));
      loadedEmployees = INITIAL_EMPLOYEES;
    } else {
      loadedEmployees = JSON.parse(storedEmployees);
    }
    setEmployees(loadedEmployees);

    // Load attendance
    let storedAttendance = localStorage.getItem('attendance');
    let loadedAttendance: AttendanceRecord[] = [];
    if (!storedAttendance) {
      // Generate historical attendance from seed data
      const mockAttendance = generateMockAttendance(loadedEmployees, loadedHolidays, loadedLeaves);
      localStorage.setItem('attendance', JSON.stringify(mockAttendance));
      loadedAttendance = mockAttendance;
    } else {
      loadedAttendance = JSON.parse(storedAttendance);
    }
    setAttendance(loadedAttendance);

    // Load activities
    let storedActivities = localStorage.getItem('activities');
    let loadedActivities: ActivityLog[] = [];
    if (!storedActivities) {
      localStorage.setItem('activities', JSON.stringify(INITIAL_ACTIVITIES));
      loadedActivities = INITIAL_ACTIVITIES;
    } else {
      loadedActivities = JSON.parse(storedActivities);
    }
    setActivities(loadedActivities);
  }, []);

  // Helper to log activities
  const logActivity = (type: ActivityLog['type'], userName: string, message: string) => {
    const newActivity: ActivityLog = {
      id: `act_${Date.now()}`,
      type,
      user_name: userName,
      message,
      timestamp: new Date().toISOString(),
    };
    const updatedActivities = [newActivity, ...activities];
    setActivities(updatedActivities);
    localStorage.setItem('activities', JSON.stringify(updatedActivities));
  };

  // Helper to get formatted local time
  const getFormattedTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };

  const getTodayDateStr = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Check In
  const checkIn = (employeeId: string) => {
    const todayStr = getTodayDateStr();
    const timeStr = getFormattedTime();
    
    // Find employee
    const empIndex = employees.findIndex(e => e.employee_id === employeeId);
    if (empIndex === -1) return;
    
    const emp = employees[empIndex];
    
    // Check if record already exists for today
    const existingIndex = attendance.findIndex(a => a.employee_id === employeeId && a.date === todayStr);
    
    let updatedAttendance = [...attendance];
    
    if (existingIndex !== -1) {
      // If it exists, update it (maybe they checked in again or were marked absent)
      updatedAttendance[existingIndex] = {
        ...updatedAttendance[existingIndex],
        check_in: timeStr,
        status: 'Present',
      };
    } else {
      // Create new record
      updatedAttendance.push({
        id: `att_${employeeId}_${todayStr}`,
        employee_id: employeeId,
        date: todayStr,
        check_in: timeStr,
        check_out: null,
        status: 'Present',
        working_hours: null,
      });
    }
    
    // Update employee's status in memory
    const updatedEmployees = [...employees];
    updatedEmployees[empIndex] = {
      ...emp,
      current_status: 'Present',
    };
    
    setAttendance(updatedAttendance);
    setEmployees(updatedEmployees);
    
    localStorage.setItem('attendance', JSON.stringify(updatedAttendance));
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
    
    logActivity('check_in', emp.name, `${emp.name} (${emp.employee_id}) checked in at ${timeStr}`);
  };

  // Check Out
  const checkOut = (employeeId: string) => {
    const todayStr = getTodayDateStr();
    const timeStr = getFormattedTime();
    
    // Find employee
    const empIndex = employees.findIndex(e => e.employee_id === employeeId);
    if (empIndex === -1) return;
    
    const emp = employees[empIndex];
    
    // Find active attendance record
    const existingIndex = attendance.findIndex(a => a.employee_id === employeeId && a.date === todayStr);
    if (existingIndex === -1) return;
    
    const record = attendance[existingIndex];
    if (!record.check_in) return;
    
    // Calculate working hours
    const [inH, inM, inS] = record.check_in.split(':').map(Number);
    const [outH, outM, outS] = timeStr.split(':').map(Number);
    
    const checkInDecimal = inH + inM / 60 + (inS || 0) / 3600;
    const checkOutDecimal = outH + outM / 60 + (outS || 0) / 3600;
    
    let hours = checkOutDecimal - checkInDecimal;
    if (hours < 0) hours += 24; // Handle checkouts past midnight
    const workingHours = parseFloat(hours.toFixed(2));
    
    // Determine status (e.g. less than 5 hours is half day)
    const status: AttendanceStatus = workingHours < 5 ? 'Half Day' : 'Present';
    
    let updatedAttendance = [...attendance];
    updatedAttendance[existingIndex] = {
      ...record,
      check_out: timeStr,
      status,
      working_hours: workingHours,
    };
    
    // Update employee status
    const updatedEmployees = [...employees];
    updatedEmployees[empIndex] = {
      ...emp,
      current_status: 'Present', // Still technically present today
    };
    
    setAttendance(updatedAttendance);
    setEmployees(updatedEmployees);
    
    localStorage.setItem('attendance', JSON.stringify(updatedAttendance));
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
    
    logActivity('check_out', emp.name, `${emp.name} (${emp.employee_id}) checked out at ${timeStr}. Total hours: ${workingHours}`);
  };

  // Apply for Leave (Employee)
  const applyForLeave = (employeeId: string, leaveType: string, startDate: string, endDate: string) => {
    const emp = employees.find(e => e.employee_id === employeeId);
    if (!emp) return;

    const newRequest: LeaveRequest = {
      id: `l_${Date.now()}`,
      employee_id: employeeId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      status: 'Pending',
    };

    const updatedLeaves = [...leaveRequests, newRequest];
    setLeaveRequests(updatedLeaves);
    localStorage.setItem('leave_requests', JSON.stringify(updatedLeaves));
    
    logActivity('leave_approve', emp.name, `${emp.name} requested ${leaveType} from ${startDate} to ${endDate}`);
  };

  // Add Employee (Admin)
  const addEmployee = (empData: Omit<Employee, 'id' | 'current_status'>) => {
    const newEmp: Employee = {
      ...empData,
      id: `emp_${Date.now()}`,
      current_status: 'Absent', // default when added
    };
    
    const updatedEmployees = [...employees, newEmp];
    setEmployees(updatedEmployees);
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
    
    logActivity('employee_add', 'Sarah Connor', `Added new employee ${newEmp.name} (${newEmp.employee_id}) in ${newEmp.department}`);
  };

  // Edit Employee (Admin)
  const updateEmployee = (id: string, updatedFields: Partial<Employee>) => {
    const empIndex = employees.findIndex(e => e.id === id);
    if (empIndex === -1) return;
    
    const original = employees[empIndex];
    const updated = { ...original, ...updatedFields };
    
    const updatedEmployees = [...employees];
    updatedEmployees[empIndex] = updated;
    setEmployees(updatedEmployees);
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
    
    // If the employee_id was changed, we should ideally update the attendance records and leaves as well
    if (updatedFields.employee_id && updatedFields.employee_id !== original.employee_id) {
      const updatedAttendance = attendance.map(a => 
        a.employee_id === original.employee_id 
          ? { ...a, employee_id: updatedFields.employee_id! } 
          : a
      );
      setAttendance(updatedAttendance);
      localStorage.setItem('attendance', JSON.stringify(updatedAttendance));
      
      const updatedLeaves = leaveRequests.map(l => 
        l.employee_id === original.employee_id 
          ? { ...l, employee_id: updatedFields.employee_id! } 
          : l
      );
      setLeaveRequests(updatedLeaves);
      localStorage.setItem('leave_requests', JSON.stringify(updatedLeaves));
    }
    
    logActivity('employee_edit', 'Sarah Connor', `Updated details for ${updated.name} (${updated.employee_id})`);
  };

  // Remove Employee (Admin)
  const removeEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    
    const updatedEmployees = employees.filter(e => e.id !== id);
    setEmployees(updatedEmployees);
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
    
    // Also remove their attendance & leaves to clean up mock database
    const updatedAttendance = attendance.filter(a => a.employee_id !== emp.employee_id);
    setAttendance(updatedAttendance);
    localStorage.setItem('attendance', JSON.stringify(updatedAttendance));
    
    const updatedLeaves = leaveRequests.filter(l => l.employee_id !== emp.employee_id);
    setLeaveRequests(updatedLeaves);
    localStorage.setItem('leave_requests', JSON.stringify(updatedLeaves));
    
    logActivity('employee_remove', 'Sarah Connor', `Removed employee ${emp.name} (${emp.employee_id}) from the system`);
  };

  // Approve Leave (Admin)
  const approveLeave = (id: string, hrName: string) => {
    const leaveIndex = leaveRequests.findIndex(l => l.id === id);
    if (leaveIndex === -1) return;
    
    const request = leaveRequests[leaveIndex];
    const emp = employees.find(e => e.employee_id === request.employee_id);
    if (!emp) return;
    
    // Update request status
    const updatedLeaves = [...leaveRequests];
    updatedLeaves[leaveIndex] = {
      ...request,
      status: 'Approved',
    };
    
    setLeaveRequests(updatedLeaves);
    localStorage.setItem('leave_requests', JSON.stringify(updatedLeaves));
    
    // Generate leave attendance records for all dates in the range
    const start = new Date(request.start_date);
    const end = new Date(request.end_date);
    
    let updatedAttendance = [...attendance];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      
      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      // Remove any existing attendance record for this day and add a Leave record
      updatedAttendance = updatedAttendance.filter(a => !(a.employee_id === request.employee_id && a.date === dateStr));
      updatedAttendance.push({
        id: `att_${request.employee_id}_${dateStr}`,
        employee_id: request.employee_id,
        date: dateStr,
        check_in: null,
        check_out: null,
        status: 'Leave',
        working_hours: null,
      });
    }
    
    // Update employee status if the leave includes today
    const todayStr = getTodayDateStr();
    let updatedEmployees = [...employees];
    if (todayStr >= request.start_date && todayStr <= request.end_date) {
      const empIndex = employees.findIndex(e => e.employee_id === request.employee_id);
      if (empIndex !== -1) {
        updatedEmployees[empIndex] = {
          ...emp,
          current_status: 'Leave',
        };
        setEmployees(updatedEmployees);
        localStorage.setItem('employees', JSON.stringify(updatedEmployees));
      }
    }
    
    setAttendance(updatedAttendance);
    localStorage.setItem('attendance', JSON.stringify(updatedAttendance));
    
    logActivity('leave_approve', hrName, `Approved ${request.leave_type} for ${emp.name} (${request.start_date} to ${request.end_date})`);
  };

  // Reject Leave (Admin)
  const rejectLeave = (id: string, hrName: string) => {
    const leaveIndex = leaveRequests.findIndex(l => l.id === id);
    if (leaveIndex === -1) return;
    
    const request = leaveRequests[leaveIndex];
    const emp = employees.find(e => e.employee_id === request.employee_id);
    if (!emp) return;
    
    // Update request status
    const updatedLeaves = [...leaveRequests];
    updatedLeaves[leaveIndex] = {
      ...request,
      status: 'Rejected',
    };
    
    setLeaveRequests(updatedLeaves);
    localStorage.setItem('leave_requests', JSON.stringify(updatedLeaves));
    
    logActivity('leave_reject', hrName, `Rejected ${request.leave_type} for ${emp.name} (${request.start_date} to ${request.end_date})`);
  };

  // Add Holiday
  const addHoliday = (newH: Omit<Holiday, 'id'>) => {
    const holiday: Holiday = {
      ...newH,
      id: `h_${Date.now()}`,
    };
    const updated = [...holidays, holiday];
    setHolidays(updated);
    localStorage.setItem('holidays', JSON.stringify(updated));
    logActivity('employee_add', 'HR Manager', `Added holiday: ${newH.holiday_name} on ${newH.holiday_date}`);
  };

  // Update Holiday
  const updateHoliday = (id: string, updatedH: Partial<Holiday>) => {
    const updated = holidays.map(h => {
      if (h.id === id) {
        return { ...h, ...updatedH };
      }
      return h;
    });
    setHolidays(updated);
    localStorage.setItem('holidays', JSON.stringify(updated));
    const h = holidays.find(x => x.id === id);
    logActivity('employee_edit', 'HR Manager', `Updated holiday: ${h?.holiday_name} details`);
  };

  // Remove Holiday
  const removeHoliday = (id: string) => {
    const h = holidays.find(x => x.id === id);
    const updated = holidays.filter(x => x.id !== id);
    setHolidays(updated);
    localStorage.setItem('holidays', JSON.stringify(updated));
    if (h) {
      logActivity('employee_remove', 'HR Manager', `Removed holiday: ${h.holiday_name}`);
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
