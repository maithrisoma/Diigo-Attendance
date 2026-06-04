export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: 'admin' | 'employee';
  current_status: 'Present' | 'Absent' | 'Leave';
  join_date?: string; // YYYY-MM-DD
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Half Day';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string; // YYYY-MM-DD
  check_in: string | null; // HH:MM:SS
  check_out: string | null; // HH:MM:SS
  status: AttendanceStatus;
  working_hours: number | null;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Holiday {
  id: string;
  holiday_name: string;
  holiday_date: string; // YYYY-MM-DD
  holiday_type: 'National Holiday' | 'Festival Holiday' | 'Company Holiday' | 'Optional Holiday';
  is_recurring?: boolean;
}

export interface ActivityLog {
  id: string;
  type: 'check_in' | 'check_out' | 'leave_approve' | 'leave_reject' | 'employee_add' | 'employee_remove' | 'employee_edit';
  user_name: string;
  message: string;
  timestamp: string; // ISO string
}
