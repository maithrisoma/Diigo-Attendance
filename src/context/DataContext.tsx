import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, AttendanceRecord, LeaveRequest, Holiday, ActivityLog } from '../types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_HOLIDAYS,
  INITIAL_LEAVES,
  INITIAL_ACTIVITIES,
  generateMockAttendance
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

  // Load from localStorage on mount, and seed if not present
  useEffect(() => {
<<<<<<< Updated upstream
    let savedEmployees = localStorage.getItem('employees');
    let savedHolidays = localStorage.getItem('holidays');
    let savedLeaves = localStorage.getItem('leaveRequests');
    let savedActivities = localStorage.getItem('activities');
    let savedAttendance = localStorage.getItem('attendance');

    // MIGRATION: If we have old employee IDs starting with EMP, clear localStorage to force re-seed with D0x IDs
    if (savedEmployees && savedEmployees.includes('EMP001')) {
      localStorage.removeItem('employees');
      localStorage.removeItem('holidays');
      localStorage.removeItem('leaveRequests');
      localStorage.removeItem('activities');
      localStorage.removeItem('attendance');
      localStorage.removeItem('currentUser'); // also clear current active user session

      savedEmployees = null;
      savedHolidays = null;
      savedLeaves = null;
      savedActivities = null;
      savedAttendance = null;
    }
=======
    const savedEmployees = localStorage.getItem('employees');
    const savedHolidays = localStorage.getItem('holidays');
    const savedLeaves = localStorage.getItem('leaveRequests');
    const savedActivities = localStorage.getItem('activities');
    const savedAttendance = localStorage.getItem('attendance');
>>>>>>> Stashed changes

    let parsedEmployees = INITIAL_EMPLOYEES;
    let parsedHolidays = INITIAL_HOLIDAYS;
    let parsedLeaves = INITIAL_LEAVES;
    let parsedActivities = INITIAL_ACTIVITIES;
    let parsedAttendance: AttendanceRecord[] = [];

    if (savedEmployees) {
      try { parsedEmployees = JSON.parse(savedEmployees); } catch (e) { console.error(e); }
    } else {
      localStorage.setItem('employees', JSON.stringify(INITIAL_EMPLOYEES));
    }

    if (savedHolidays) {
      try { parsedHolidays = JSON.parse(savedHolidays); } catch (e) { console.error(e); }
    } else {
      localStorage.setItem('holidays', JSON.stringify(INITIAL_HOLIDAYS));
    }

    if (savedLeaves) {
      try { parsedLeaves = JSON.parse(savedLeaves); } catch (e) { console.error(e); }
    } else {
      localStorage.setItem('leaveRequests', JSON.stringify(INITIAL_LEAVES));
    }

    if (savedActivities) {
      try { parsedActivities = JSON.parse(savedActivities); } catch (e) { console.error(e); }
    } else {
      localStorage.setItem('activities', JSON.stringify(INITIAL_ACTIVITIES));
    }

    if (savedAttendance) {
      try { parsedAttendance = JSON.parse(savedAttendance); } catch (e) { console.error(e); }
    } else {
      parsedAttendance = generateMockAttendance(parsedEmployees, parsedHolidays, parsedLeaves);
      localStorage.setItem('attendance', JSON.stringify(parsedAttendance));
    }

    setEmployees(parsedEmployees);
    setHolidays(parsedHolidays);
    setLeaveRequests(parsedLeaves);
    setActivities(parsedActivities);
    setAttendance(parsedAttendance);
  }, []);

  // Helper to persist updated state
  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Helper to log activities
  const logActivity = (type: string, user_name: string, message: string) => {
    setActivities(prev => {
      const updated: ActivityLog[] = [
        {
          id: 'act-' + Math.random().toString(36).substring(2, 11),
          type: type as any,
          user_name,
          message,
          timestamp: new Date().toISOString(),
        },
        ...prev
      ];
      saveToStorage('activities', updated);
      return updated;
    });
  };

  // Check In
  const checkIn = (employeeId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const checkInTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    setAttendance(prev => {
      const existingIdx = prev.findIndex(a => a.employee_id === employeeId && a.date === todayStr);
      let updated = [...prev];
      if (existingIdx > -1) {
        updated[existingIdx] = {
          ...updated[existingIdx],
          check_in: checkInTime,
          status: 'Present'
        };
      } else {
        const newRecord: AttendanceRecord = {
          id: 'att-' + Math.random().toString(36).substring(2, 11),
          employee_id: employeeId,
          date: todayStr,
          check_in: checkInTime,
          check_out: null,
          status: 'Present',
          working_hours: null,
        };
        updated.push(newRecord);
      }
      saveToStorage('attendance', updated);
      return updated;
    });

    setEmployees(prev => {
      const updated = prev.map(e => {
        if (e.employee_id === employeeId) {
          logActivity('check_in', e.name, `${e.name} checked in at ${checkInTime}.`);
          return { ...e, current_status: 'Present' as const };
        }
        return e;
      });
      saveToStorage('employees', updated);
      return updated;
    });
  };

  // Check Out
  const checkOut = (employeeId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const checkOutTime = new Date().toLocaleTimeString('en-US', { hour12: false });

    setAttendance(prev => {
      const existingIdx = prev.findIndex(a => a.employee_id === employeeId && a.date === todayStr);
      if (existingIdx === -1) return prev;

      const record = prev[existingIdx];
      const checkInTime = record.check_in || '09:00:00';
      
      // Calculate working hours
      const [inH, inM, inS] = checkInTime.split(':').map(Number);
      const [outH, outM, outS] = checkOutTime.split(':').map(Number);
      const inDate = new Date(); inDate.setHours(inH, inM, inS || 0);
      const outDate = new Date(); outDate.setHours(outH, outM, outS || 0);
      const diffMs = outDate.getTime() - inDate.getTime();
      const workingHours = diffMs > 0 ? parseFloat((diffMs / 3600000).toFixed(2)) : 0;

      const updated = [...prev];
      updated[existingIdx] = {
        ...record,
        check_out: checkOutTime,
        working_hours: workingHours
      };
      saveToStorage('attendance', updated);
      return updated;
    });

    setEmployees(prev => {
      const updated = prev.map(e => {
        if (e.employee_id === employeeId) {
          logActivity('check_out', e.name, `${e.name} checked out at ${checkOutTime}.`);
          return { ...e, current_status: 'Present' as const };
        }
        return e;
      });
      saveToStorage('employees', updated);
      return updated;
    });
  };

  // Apply for Leave (Employee)
  const applyForLeave = (employeeId: string, leaveType: string, startDate: string, endDate: string) => {
    const emp = employees.find(e => e.employee_id === employeeId);
    const newLeave: LeaveRequest = {
      id: 'leave-' + Math.random().toString(36).substring(2, 11),
      employee_id: employeeId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      status: 'Pending'
    };

    setLeaveRequests(prev => {
      const updated = [...prev, newLeave];
      saveToStorage('leaveRequests', updated);
      return updated;
    });

    if (emp) {
      logActivity('leave_approve', emp.name, `${emp.name} applied for ${leaveType} leave (${startDate} to ${endDate}).`);
    }
  };

  // Add Employee (Admin)
  const addEmployee = (empData: Omit<Employee, 'id' | 'current_status'>) => {
    const newEmp: Employee = {
      ...empData,
      id: 'emp-' + Math.random().toString(36).substring(2, 11),
      current_status: 'Absent'
    };

    setEmployees(prev => {
      const updated = [...prev, newEmp];
      saveToStorage('employees', updated);
      return updated;
    });

    logActivity('employee_add', 'Admin', `Added new employee ${newEmp.name} (${newEmp.employee_id}) to ${newEmp.department}.`);
  };

  // Edit Employee (Admin)
  const updateEmployee = (id: string, updatedFields: Partial<Employee>) => {
    setEmployees(prev => {
      const updated = prev.map(e => {
        if (e.id === id) {
          const merged = { ...e, ...updatedFields };
          logActivity('employee_edit', 'Admin', `Updated details for employee ${merged.name} (${merged.employee_id}).`);
          return merged;
        }
        return e;
      });
      saveToStorage('employees', updated);
      return updated;
    });
  };

  // Remove Employee (Admin)
  const removeEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    setEmployees(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveToStorage('employees', updated);
      return updated;
    });

    if (emp) {
      logActivity('employee_remove', 'Admin', `Removed employee ${emp.name} (${emp.employee_id}).`);
    }
  };

  // Approve Leave (Admin)
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
                const updatedEmps = prevEmps.map(e => e.employee_id === l.employee_id ? { ...e, current_status: 'Leave' as const } : e);
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

  // Reject Leave (Admin)
  const rejectLeave = (id: string, hrName: string) => {
    setLeaveRequests(prev => {
      const updated = prev.map(l => {
        if (l.id === id) {
          const emp = employees.find(e => e.employee_id === l.employee_id);
          if (emp) {
            logActivity('leave_reject', hrName, `Rejected ${l.leave_type} request for ${emp.name}.`);
          }
          return { ...l, status: 'Rejected' as const };
        }
        return l;
      });
      saveToStorage('leaveRequests', updated);
      return updated;
    });
  };

  // Add Holiday
  const addHoliday = (newH: Omit<Holiday, 'id'>) => {
    const holiday: Holiday = {
      ...newH,
      id: 'h-' + Math.random().toString(36).substring(2, 11),
    };

    setHolidays(prev => {
      const updated = [...prev, holiday];
      saveToStorage('holidays', updated);
      return updated;
    });

    logActivity('employee_edit', 'Admin', `Added new holiday "${holiday.holiday_name}" on ${holiday.holiday_date}.`);
  };

  // Update Holiday
  const updateHoliday = (id: string, updatedH: Partial<Holiday>) => {
    setHolidays(prev => {
      const updated = prev.map(h => {
        if (h.id === id) {
          const merged = { ...h, ...updatedH };
          logActivity('employee_edit', 'Admin', `Updated holiday "${merged.holiday_name}" details.`);
          return merged;
        }
        return h;
      });
      saveToStorage('holidays', updated);
      return updated;
    });
  };

  // Remove Holiday
  const removeHoliday = (id: string) => {
    const hol = holidays.find(h => h.id === id);
    setHolidays(prev => {
      const updated = prev.filter(h => h.id !== id);
      saveToStorage('holidays', updated);
      return updated;
    });

    if (hol) {
      logActivity('employee_edit', 'Admin', `Removed holiday "${hol.holiday_name}" scheduled for ${hol.holiday_date}.`);
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
