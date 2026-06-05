import { Employee, AttendanceRecord, LeaveRequest, Holiday, ActivityLog } from '../types';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: '1',
    employee_id: 'HR001',
    name: 'Sarah Connor',
    email: 'admin@company.com',
    department: 'Human Resources',
    designation: 'HR Director',
    role: 'admin',
    current_status: 'Present',
    join_date: '2021-03-15',
  },
  {
    id: '2',
    employee_id: 'D01',
    name: 'John Doe',
    email: 'employee@company.com',
    department: 'Engineering',
    designation: 'Senior Developer',
    role: 'employee',
    current_status: 'Present',
    join_date: '2022-01-10',
  },
  {
    id: '3',
    employee_id: 'D02',
    name: 'Alice Smith',
    email: 'alice@company.com',
    department: 'Engineering',
    designation: 'Product Designer',
    role: 'employee',
    current_status: 'Present',
    join_date: '2022-07-01',
  },
  {
    id: '4',
    employee_id: 'D03',
    name: 'Bob Johnson',
    email: 'bob@company.com',
    department: 'Marketing',
    designation: 'Marketing Specialist',
    role: 'employee',
    current_status: 'Leave',
    join_date: '2023-02-20',
  },
  {
    id: '5',
    employee_id: 'D04',
    name: 'Charlie Brown',
    email: 'charlie@company.com',
    department: 'Sales',
    designation: 'Sales Executive',
    role: 'employee',
    current_status: 'Absent',
    join_date: '2023-06-05',
  },
  {
    id: '6',
    employee_id: 'D05',
    name: 'Diana Prince',
    email: 'diana@company.com',
    department: 'Engineering',
    designation: 'QA Lead',
    role: 'employee',
    current_status: 'Present',
    join_date: '2021-11-08',
  },
  {
    id: '7',
    employee_id: 'D06',
    name: 'Evan Wright',
    email: 'evan@company.com',
    department: 'Finance',
    designation: 'Chief Accountant',
    role: 'employee',
    current_status: 'Present',
    join_date: '2020-09-14',
  },
];

export const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'h1', holiday_name: "New Year's Day", holiday_date: '2026-01-01', holiday_type: 'Company Holiday', is_recurring: true },
  { id: 'h2', holiday_name: 'Republic Day', holiday_date: '2026-01-26', holiday_type: 'National Holiday', is_recurring: true },
  { id: 'h3', holiday_name: 'Maha Shivaratri', holiday_date: '2026-02-15', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h4', holiday_name: 'Holi', holiday_date: '2026-03-04', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h5', holiday_name: 'Ugadi', holiday_date: '2026-03-20', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h6', holiday_name: 'Ram Navami', holiday_date: '2026-03-27', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h7', holiday_name: 'Good Friday', holiday_date: '2026-04-03', holiday_type: 'Optional Holiday', is_recurring: false },
  { id: 'h8', holiday_name: 'Mahavir Jayanti', holiday_date: '2026-04-09', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h9', holiday_name: 'Buddha Purnima', holiday_date: '2026-05-02', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h10', holiday_name: 'Bakrid (Eid al-Adha)', holiday_date: '2026-05-27', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h11', holiday_name: 'Muharram', holiday_date: '2026-07-26', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h12', holiday_name: 'Independence Day', holiday_date: '2026-08-15', holiday_type: 'National Holiday', is_recurring: true },
  { id: 'h13', holiday_name: 'Janmashtami', holiday_date: '2026-09-04', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h14', holiday_name: 'Ganesh Chaturthi', holiday_date: '2026-09-15', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h15', holiday_name: 'Milad-un-Nabi (Eid-e-Milad)', holiday_date: '2026-09-25', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h16', holiday_name: 'Gandhi Jayanti', holiday_date: '2026-10-02', holiday_type: 'National Holiday', is_recurring: true },
  { id: 'h17', holiday_name: 'Dussehra (Vijayadashami)', holiday_date: '2026-10-20', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h18', holiday_name: 'Diwali', holiday_date: '2026-11-08', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h19', holiday_name: 'Govardhan Puja', holiday_date: '2026-11-09', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h20', holiday_name: 'Bhai Dooj', holiday_date: '2026-11-10', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h21', holiday_name: 'Guru Nanak Jayanti', holiday_date: '2026-11-24', holiday_type: 'Festival Holiday', is_recurring: false },
  { id: 'h22', holiday_name: 'Christmas Day', holiday_date: '2026-12-25', holiday_type: 'Company Holiday', is_recurring: true },
];

export const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: 'l1',
    employee_id: 'D03', // Bob Johnson
    leave_type: 'Annual Leave',
    start_date: '2026-06-01',
    end_date: '2026-06-05',
    status: 'Approved',
  },
  {
    id: 'l2',
    employee_id: 'D05', // Diana Prince
    leave_type: 'Sick Leave',
    start_date: '2026-06-02',
    end_date: '2026-06-02',
    status: 'Approved',
  },
  {
    id: 'l3',
    employee_id: 'D01', // John Doe
    leave_type: 'Casual Leave',
    start_date: '2026-06-10',
    end_date: '2026-06-12',
    status: 'Pending',
  },
  {
    id: 'l4',
    employee_id: 'D02', // Alice Smith
    leave_type: 'Sick Leave',
    start_date: '2026-05-12',
    end_date: '2026-05-13',
    status: 'Approved',
  },
  {
    id: 'l5',
    employee_id: 'D06', // Evan Wright
    leave_type: 'Annual Leave',
    start_date: '2026-06-15',
    end_date: '2026-06-18',
    status: 'Pending',
  },
];

export const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act1',
    type: 'leave_approve',
    user_name: 'Sarah Connor',
    message: 'Approved Annual Leave request for Bob Johnson (June 1 - June 5)',
    timestamp: '2026-06-02T18:30:00Z',
  },
  {
    id: 'act2',
    type: 'employee_add',
    user_name: 'Sarah Connor',
    message: 'Added new employee Evan Wright (D06) to Finance',
    timestamp: '2026-06-01T09:15:00Z',
  },
  {
    id: 'act3',
    type: 'leave_reject',
    user_name: 'Sarah Connor',
    message: 'Rejected Sick Leave request for John Doe (May 28)',
    timestamp: '2026-05-29T10:00:00Z',
  },
];

// Helper to generate date strings
const getFormattedDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Generate attendance history for the past 30 days (excluding today, which is June 3, 2026)
export const generateMockAttendance = (employees: Employee[], holidays: Holiday[], leaves: LeaveRequest[]): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date('2026-06-03'); // Anchor current date to the user metadata time
  
  // Start generating from 30 days ago
  for (let i = 30; i >= 1; i--) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);
    const dateStr = getFormattedDate(targetDate);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Skip weekends for active attendance, but they are gray in calendar
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }
    
    // Check if it is a holiday
    const isHoliday = holidays.find(h => h.holiday_date === dateStr);
    if (isHoliday) {
      continue; // Holidays don't need regular attendance records in db, or we can mark them
    }
    
    employees.forEach(emp => {
      // HR/Admin doesn't necessarily check-in/out, but let's generate for everyone for dashboard stats
      
      // Check if employee was on approved leave on this date
      const onLeave = leaves.find(
        leave =>
          leave.employee_id === emp.employee_id &&
          leave.status === 'Approved' &&
          dateStr >= leave.start_date &&
          dateStr <= leave.end_date
      );
      
      if (onLeave) {
        records.push({
          id: `att_${emp.employee_id}_${dateStr}`,
          employee_id: emp.employee_id,
          date: dateStr,
          check_in: null,
          check_out: null,
          status: 'Leave',
          working_hours: null,
        });
        return;
      }
      
      // Randomize check-ins for work days
      const rand = Math.random();
      let status: 'Present' | 'Absent' | 'Half Day' = 'Present';
      let checkIn: string | null = null;
      let checkOut: string | null = null;
      let workingHours: number | null = null;
      
      if (rand < 0.88) {
        // Present
        status = 'Present';
        // Check-in between 8:30 AM and 9:15 AM
        const checkInHour = 8;
        const checkInMin = Math.floor(Math.random() * 45); // 0 to 44
        // Check-out between 5:00 PM and 6:15 PM (17:00 to 18:15)
        const checkOutHour = 17 + Math.floor(Math.random() * 2); // 17 or 18
        const checkOutMin = Math.floor(Math.random() * 15);
        
        checkIn = `${checkInHour.toString().padStart(2, '0')}:${checkInMin.toString().padStart(2, '0')}:00`;
        checkOut = `${checkOutHour.toString().padStart(2, '0')}:${checkOutMin.toString().padStart(2, '0')}:00`;
        
        const decimalCheckIn = checkInHour + checkInMin / 60;
        const decimalCheckOut = checkOutHour + checkOutMin / 60;
        workingHours = parseFloat((decimalCheckOut - decimalCheckIn).toFixed(2));
      } else if (rand < 0.94) {
        // Half Day
        status = 'Half Day';
        const checkInHour = 9;
        const checkInMin = Math.floor(Math.random() * 15);
        const checkOutHour = 13;
        const checkOutMin = Math.floor(Math.random() * 15);
        
        checkIn = `${checkInHour.toString().padStart(2, '0')}:${checkInMin.toString().padStart(2, '0')}:00`;
        checkOut = `${checkOutHour.toString().padStart(2, '0')}:${checkOutMin.toString().padStart(2, '0')}:00`;
        workingHours = 4.0;
      } else {
        // Absent
        status = 'Absent';
        checkIn = null;
        checkOut = null;
        workingHours = 0;
      }
      
      records.push({
        id: `att_${emp.employee_id}_${dateStr}`,
        employee_id: emp.employee_id,
        date: dateStr,
        check_in: checkIn,
        check_out: checkOut,
        status,
        working_hours: workingHours,
      });
    });
  }
  
  // Seed today's morning attendance records (June 3, 2026)
  // Let's assume some employees checked in today
  const todayStr = getFormattedDate(today);
  employees.forEach(emp => {
    if (emp.employee_id === 'D03') { // Bob is on leave
      records.push({
        id: `att_${emp.employee_id}_${todayStr}`,
        employee_id: emp.employee_id,
        date: todayStr,
        check_in: null,
        check_out: null,
        status: 'Leave',
        working_hours: null,
      });
    } else if (emp.employee_id === 'D04') { // Charlie is absent
      records.push({
        id: `att_${emp.employee_id}_${todayStr}`,
        employee_id: emp.employee_id,
        date: todayStr,
        check_in: null,
        check_out: null,
        status: 'Absent',
        working_hours: 0,
      });
    } else {
      // Others checked in this morning, but haven't checked out yet!
      // This is dynamic and will allow employee role to "check out"
      records.push({
        id: `att_${emp.employee_id}_${todayStr}`,
        employee_id: emp.employee_id,
        date: todayStr,
        check_in: '09:05:00',
        check_out: null,
        status: 'Present',
        working_hours: null,
      });
    }
  });
  
  return records;
};
