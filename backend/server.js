const express = require('express');
const cors = require('cors');
require('dotenv').config();
const prisma = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Helper to log activities
async function logActivity(type, userName, message) {
  const id = `act_${Date.now()}`;
  try {
    await prisma.activityLog.create({
      data: {
        id,
        type,
        user_name: userName,
        message,
        timestamp: new Date()
      }
    });
  } catch (err) {
    console.error('Error logging activity:', err.message);
  }
}

// --- Auth Endpoints ---
app.post('/api/auth/login', async (req, res) => {
  const { emailOrId, password } = req.body;
  if (!emailOrId || !password) {
    return res.status(400).json({ success: false, message: 'Employee ID or Email and password are required' });
  }

  const normalizedInput = emailOrId.toLowerCase().trim();
  try {
    const user = await prisma.employee.findFirst({
      where: {
        OR: [
          { email: normalizedInput },
          { employee_id: normalizedInput }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Invalid Employee ID or Email' });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact the administrator.' });
    }

    if (password !== user.password) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Try using "password".' });
    }

    const formattedUser = {
      ...user,
      join_date: user.join_date.toISOString().split('T')[0]
    };
    delete formattedUser.password;
    return res.json({ success: true, message: 'Login successful', user: formattedUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { emailOrId } = req.body;
  const normalizedInput = emailOrId.toLowerCase().trim();
  try {
    const user = await prisma.employee.findFirst({
      where: {
        OR: [
          { email: normalizedInput },
          { employee_id: normalizedInput }
        ]
      },
      select: { email: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in registry' });
    }

    return res.json({
      success: true,
      message: `Password reset instructions have been sent to ${user.email}. (Demo note: password is "password")`
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// --- Employees Endpoints ---
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { join_date: 'asc' }
    });
    const formatted = employees.map(emp => {
      const formattedEmp = {
        ...emp,
        join_date: emp.join_date.toISOString().split('T')[0]
      };
      delete formattedEmp.password;
      return formattedEmp;
    });
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/employees', async (req, res) => {
  const { employee_id, name, email, department, designation, role, join_date } = req.body;
  const id = `emp_${Date.now()}`;
  const status = 'Absent';
  const dateStr = join_date || new Date().toISOString().split('T')[0];
  
  try {
    const newEmp = await prisma.employee.create({
      data: {
        id,
        employee_id,
        name,
        email,
        department,
        designation,
        role,
        current_status: status,
        join_date: new Date(dateStr)
      }
    });

    await logActivity('employee_add', 'Sarah Connor', `Added new employee ${name} (${employee_id}) in ${department}`);
    
    const formatted = {
      ...newEmp,
      join_date: newEmp.join_date.toISOString().split('T')[0]
    };
    delete formatted.password;
    res.status(201).json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { employee_id, name, email, department, designation, role, current_status, join_date, status } = req.body;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const original = await tx.employee.findUnique({
        where: { id }
      });
      if (!original) {
        throw new Error('Employee not found');
      }

      const updateData = {};
      if (employee_id !== undefined) updateData.employee_id = employee_id;
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (department !== undefined) updateData.department = department;
      if (designation !== undefined) updateData.designation = designation;
      if (role !== undefined) updateData.role = role;
      if (current_status !== undefined) updateData.current_status = current_status;
      if (join_date !== undefined) updateData.join_date = new Date(join_date);
      if (status !== undefined) updateData.status = status;

      const resEmp = await tx.employee.update({
        where: { id },
        data: updateData
      });

      return resEmp;
    });

    await logActivity('employee_edit', 'Sarah Connor', `Updated details for ${updated.name} (${updated.employee_id})`);
    
    const formatted = {
      ...updated,
      join_date: updated.join_date.toISOString().split('T')[0]
    };
    delete formatted.password;
    res.json(formatted);
  } catch (err) {
    console.error(err);
    if (err.message === 'Employee not found') {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const emp = await prisma.employee.findUnique({
      where: { id },
      select: { employee_id: true, name: true }
    });
    if (!emp) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await prisma.employee.delete({
      where: { id }
    });

    await logActivity('employee_remove', 'Sarah Connor', `Removed employee ${emp.name} (${emp.employee_id}) from the system`);
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Attendance Endpoints ---
app.get('/api/attendance', async (req, res) => {
  try {
    const attendance = await prisma.attendance.findMany({
      orderBy: { date: 'desc' }
    });
    const formatted = attendance.map(rec => ({
      ...rec,
      date: rec.date.toISOString().split('T')[0]
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/attendance/check-in', async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDate = new Date(todayStr);
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.findUnique({
        where: { employee_id: employeeId }
      });
      if (!emp) {
        throw new Error('Employee not found');
      }

      const attId = `att_${employeeId}_${todayStr}`;
      const checkRecord = await tx.attendance.findUnique({
        where: {
          employee_id_date: {
            employee_id: employeeId,
            date: todayDate
          }
        }
      });

      if (checkRecord) {
        await tx.attendance.update({
          where: {
            employee_id_date: {
              employee_id: employeeId,
              date: todayDate
            }
          },
          data: {
            check_in: timeStr,
            status: 'Present'
          }
        });
      } else {
        await tx.attendance.create({
          data: {
            id: attId,
            employee_id: employeeId,
            date: todayDate,
            check_in: timeStr,
            status: 'Present'
          }
        });
      }

      await tx.employee.update({
        where: { employee_id: employeeId },
        data: { current_status: 'Present' }
      });

      return { name: emp.name };
    });

    await logActivity('check_in', result.name, `${result.name} (${employeeId}) checked in at ${timeStr}`);
    res.json({ message: 'Checked in successfully', time: timeStr });
  } catch (err) {
    console.error(err);
    if (err.message === 'Employee not found') {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/attendance/check-out', async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDate = new Date(todayStr);
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.findUnique({
        where: { employee_id: employeeId }
      });
      if (!emp) {
        throw new Error('Employee not found');
      }

      const attRecord = await tx.attendance.findUnique({
        where: {
          employee_id_date: {
            employee_id: employeeId,
            date: todayDate
          }
        }
      });

      if (!attRecord || !attRecord.check_in) {
        throw new Error('No check-in record found for today');
      }

      const checkIn = attRecord.check_in;
      const [inH, inM, inS] = checkIn.split(':').map(Number);
      const [outH, outM, outS] = timeStr.split(':').map(Number);

      const checkInDecimal = inH + inM / 60 + (inS || 0) / 3600;
      const checkOutDecimal = outH + outM / 60 + (outS || 0) / 3600;

      let hours = checkOutDecimal - checkInDecimal;
      if (hours < 0) hours += 24;
      const workingHours = parseFloat(hours.toFixed(2));
      const status = workingHours < 5 ? 'Half Day' : 'Present';

      await tx.attendance.update({
        where: {
          employee_id_date: {
            employee_id: employeeId,
            date: todayDate
          }
        },
        data: {
          check_out: timeStr,
          status,
          working_hours: workingHours
        }
      });

      await tx.employee.update({
        where: { employee_id: employeeId },
        data: { current_status: 'Present' }
      });

      return { name: emp.name, workingHours, status };
    });

    await logActivity('check_out', result.name, `${result.name} (${employeeId}) checked out at ${timeStr}. Total hours: ${result.workingHours}`);
    res.json({ message: 'Checked out successfully', time: timeStr, workingHours: result.workingHours, status: result.status });
  } catch (err) {
    console.error(err);
    if (err.message === 'Employee not found') {
      return res.status(404).json({ error: 'Employee not found' });
    }
    if (err.message === 'No check-in record found for today') {
      return res.status(400).json({ error: 'No check-in record found for today' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Leave Requests Endpoints ---
app.get('/api/leaves', async (req, res) => {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      orderBy: { start_date: 'desc' }
    });
    const formatted = leaves.map(l => ({
      ...l,
      start_date: l.start_date.toISOString().split('T')[0],
      end_date: l.end_date.toISOString().split('T')[0]
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/leaves', async (req, res) => {
  const { employeeId, leaveType, startDate, endDate } = req.body;
  const id = `l_${Date.now()}`;
  const status = 'Pending';

  try {
    const emp = await prisma.employee.findUnique({
      where: { employee_id: employeeId }
    });
    if (!emp) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        id,
        employee_id: employeeId,
        leave_type: leaveType,
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        status
      }
    });

    await logActivity('leave_approve', emp.name, `${emp.name} requested ${leaveType} from ${startDate} to ${endDate}`);
    
    const formatted = {
      ...leave,
      start_date: leave.start_date.toISOString().split('T')[0],
      end_date: leave.end_date.toISOString().split('T')[0]
    };
    res.status(201).json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/leaves/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { hrName } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.findUnique({
        where: { id }
      });
      if (!request) {
        throw new Error('Leave request not found');
      }

      const emp = await tx.employee.findUnique({
        where: { employee_id: request.employee_id }
      });
      if (!emp) {
        throw new Error('Employee not found');
      }

      await tx.leaveRequest.update({
        where: { id },
        data: { status: 'Approved' }
      });

      const start = new Date(request.start_date);
      const end = new Date(request.end_date);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dateObj = new Date(dateStr);
        const dayOfWeek = d.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        await tx.attendance.deleteMany({
          where: {
            employee_id: request.employee_id,
            date: dateObj
          }
        });

        const attId = `att_${request.employee_id}_${dateStr}`;
        await tx.attendance.create({
          data: {
            id: attId,
            employee_id: request.employee_id,
            date: dateObj,
            status: 'Leave'
          }
        });
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const requestStartStr = request.start_date.toISOString().split('T')[0];
      const requestEndStr = request.end_date.toISOString().split('T')[0];
      if (todayStr >= requestStartStr && todayStr <= requestEndStr) {
        await tx.employee.update({
          where: { employee_id: request.employee_id },
          data: { current_status: 'Leave' }
        });
      }

      return { empName: emp.name, request };
    });

    const requestStartStr = result.request.start_date.toISOString().split('T')[0];
    const requestEndStr = result.request.end_date.toISOString().split('T')[0];
    await logActivity('leave_approve', hrName || 'HR Manager', `Approved ${result.request.leave_type} for ${result.empName} (${requestStartStr} to ${requestEndStr})`);
    
    try {
      await prisma.notification.create({
        data: {
          id: `not_approve_${Date.now()}`,
          user_id: result.request.employee_id,
          title: 'Leave Request Approved',
          message: `Your requested leave (${result.request.leave_type}) from ${requestStartStr} to ${requestEndStr} was approved by ${hrName || 'HR Manager'}.`,
          type: 'Leave Approval',
          is_read: false,
          created_at: new Date()
        }
      });
    } catch (nErr) {
      console.error('Error logging leave approval notification:', nErr.message);
    }

    res.json({ message: 'Leave approved successfully' });
  } catch (err) {
    console.error(err);
    if (err.message === 'Leave request not found' || err.message === 'Employee not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/leaves/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { hrName } = req.body;

  try {
    const request = await prisma.leaveRequest.findUnique({
      where: { id }
    });
    if (!request) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    const emp = await prisma.employee.findUnique({
      where: { employee_id: request.employee_id }
    });

    await prisma.leaveRequest.update({
      where: { id },
      data: { status: 'Rejected' }
    });

    const requestStartStr = request.start_date.toISOString().split('T')[0];
    const requestEndStr = request.end_date.toISOString().split('T')[0];
    await logActivity('leave_reject', hrName || 'HR Manager', `Rejected ${request.leave_type} for ${emp.name} (${requestStartStr} to ${requestEndStr})`);
    
    try {
      await prisma.notification.create({
        data: {
          id: `not_reject_${Date.now()}`,
          user_id: request.employee_id,
          title: 'Leave Request Rejected',
          message: `Your requested leave (${request.leave_type}) from ${requestStartStr} to ${requestEndStr} was rejected by ${hrName || 'HR Manager'}.`,
          type: 'Leave Rejection',
          is_read: false,
          created_at: new Date()
        }
      });
    } catch (nErr) {
      console.error('Error logging leave rejection notification:', nErr.message);
    }

    res.json({ message: 'Leave request rejected successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Holidays Endpoints ---
app.get('/api/holidays', async (req, res) => {
  try {
    const holidays = await prisma.holiday.findMany({
      orderBy: { holiday_date: 'asc' }
    });
    const formatted = holidays.map(h => ({
      ...h,
      holiday_date: h.holiday_date.toISOString().split('T')[0]
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/holidays', async (req, res) => {
  const { holiday_name, holiday_date, holiday_type, is_recurring } = req.body;
  const id = `h_${Date.now()}`;

  try {
    const holiday = await prisma.holiday.create({
      data: {
        id,
        holiday_name,
        holiday_date: new Date(holiday_date),
        holiday_type,
        is_recurring: is_recurring || false
      }
    });

    await logActivity('employee_add', 'HR Manager', `Added holiday: ${holiday_name} on ${holiday_date}`);
    
    try {
      const emps = await prisma.employee.findMany({
        where: { status: { not: 'Inactive' } }
      });
      const formattedDate = new Date(holiday_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      for (const emp of emps) {
        await prisma.notification.create({
          data: {
            id: `not_hol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: emp.employee_id,
            title: 'New Holiday Notice',
            message: `Holiday announced: ${holiday_name} on ${formattedDate}.`,
            type: 'Holiday Notice',
            is_read: false,
            created_at: new Date()
          }
        });
      }
    } catch (nErr) {
      console.error('Error logging holiday notification:', nErr.message);
    }

    const formatted = {
      ...holiday,
      holiday_date: holiday.holiday_date.toISOString().split('T')[0]
    };
    res.status(201).json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/holidays/:id', async (req, res) => {
  const { id } = req.params;
  const { holiday_name, holiday_date, holiday_type, is_recurring } = req.body;

  try {
    const original = await prisma.holiday.findUnique({
      where: { id }
    });
    if (!original) {
      return res.status(404).json({ error: 'Holiday not found' });
    }

    const updateData = {};
    if (holiday_name !== undefined) updateData.holiday_name = holiday_name;
    if (holiday_date !== undefined) updateData.holiday_date = new Date(holiday_date);
    if (holiday_type !== undefined) updateData.holiday_type = holiday_type;
    if (is_recurring !== undefined) updateData.is_recurring = is_recurring;

    const updated = await prisma.holiday.update({
      where: { id },
      data: updateData
    });

    const formatted = {
      ...updated,
      holiday_date: updated.holiday_date.toISOString().split('T')[0]
    };

    await logActivity('employee_edit', 'HR Manager', `Updated holiday: ${formatted.holiday_name} details`);
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/holidays/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const holiday = await prisma.holiday.findUnique({
      where: { id }
    });
    if (!holiday) {
      return res.status(404).json({ error: 'Holiday not found' });
    }

    await prisma.holiday.delete({
      where: { id }
    });

    await logActivity('employee_remove', 'HR Manager', `Removed holiday: ${holiday.holiday_name}`);
    res.json({ message: 'Holiday deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Activity Logs Endpoints ---
app.get('/api/activities', async (req, res) => {
  try {
    const activities = await prisma.activityLog.findMany({
      orderBy: { timestamp: 'desc' }
    });
    res.json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/activities', async (req, res) => {
  const { type, userName, message } = req.body;
  const id = `act_${Date.now()}`;
  const timestamp = new Date().toISOString();

  try {
    const log = await prisma.activityLog.create({
      data: {
        id,
        type,
        user_name: userName,
        message,
        timestamp: new Date(timestamp)
      }
    });
    res.status(201).json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Helper to create notifications for a published announcement
async function createNotificationsForAnnouncement(ann) {
  if (!ann.is_active) return;
  try {
    const emps = await prisma.employee.findMany({
      where: { status: { not: 'Inactive' } }
    });

    const targetEmps = emps.filter(emp => {
      const aud = ann.target_audience;
      if (aud === 'All Employees') return true;
      if (aud === 'HR Only') return emp.role === 'hr' || emp.role === 'admin';
      if (aud.startsWith('Department:')) {
        const dept = aud.replace('Department:', '').trim();
        return emp.department === dept;
      }
      if (aud.startsWith('Employee:')) {
        const ids = aud.replace('Employee:', '').split(',').map(id => id.trim());
        return ids.includes(emp.employee_id);
      }
      return false;
    });

    for (const emp of targetEmps) {
      await prisma.notification.create({
        data: {
          id: `not_ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: emp.employee_id,
          title: ann.title,
          message: ann.content.length > 100 ? ann.content.substring(0, 100) + '...' : ann.content,
          type: ann.category === 'Holiday Notice' ? 'Holiday Notice' : ann.category === 'Policy Update' ? 'Policy Update' : 'New Announcement',
          is_read: false,
          created_at: new Date()
        }
      });
    }
  } catch (err) {
    console.error('Error generating notifications for announcement:', err.message);
  }
}

// --- Announcements Endpoints ---
app.get('/api/announcements', async (req, res) => {
  const { employeeId, role, department } = req.query;
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { created_at: 'desc' }
    });

    if (!role) {
      return res.json(announcements);
    }

    if (role === 'admin' || role === 'hr') {
      return res.json(announcements);
    }

    // Filter for employee portal view
    const filtered = announcements.filter(ann => {
      if (!ann.is_active) return false;

      // Check if expired
      if (ann.expires_at && new Date(ann.expires_at) < new Date()) {
        return false;
      }

      const aud = ann.target_audience;
      if (aud === 'All Employees') return true;
      if (aud === 'HR Only') return false;
      if (aud.startsWith('Department:')) {
        const dept = aud.replace('Department:', '').trim();
        return dept === department;
      }
      if (aud.startsWith('Employee:')) {
        const ids = aud.replace('Employee:', '').split(',').map(id => id.trim());
        return ids.includes(employeeId);
      }
      return false;
    });

    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/announcements', async (req, res) => {
  const { title, content, category, priority, target_audience, created_by, expires_at, is_active, is_pinned } = req.body;
  const id = `ann_${Date.now()}`;
  try {
    const ann = await prisma.announcement.create({
      data: {
        id,
        title,
        content,
        category,
        priority,
        target_audience,
        created_by,
        expires_at: expires_at ? new Date(expires_at) : null,
        is_active: is_active !== undefined ? is_active : true,
        is_pinned: is_pinned !== undefined ? is_pinned : false,
        created_at: new Date()
      }
    });

    if (ann.is_active) {
      await createNotificationsForAnnouncement(ann);
    }

    res.status(201).json(ann);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/announcements/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, category, priority, target_audience, expires_at, is_active, is_pinned } = req.body;
  try {
    const original = await prisma.announcement.findUnique({ where: { id } });
    if (!original) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;
    if (target_audience !== undefined) updateData.target_audience = target_audience;
    if (expires_at !== undefined) updateData.expires_at = expires_at ? new Date(expires_at) : null;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;

    const updated = await prisma.announcement.update({
      where: { id },
      data: updateData
    });

    if (updated.is_active && !original.is_active) {
      await createNotificationsForAnnouncement(updated);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/announcements/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const original = await prisma.announcement.findUnique({ where: { id } });
    if (!original) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    await prisma.announcement.delete({ where: { id } });
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Notifications Endpoints ---
app.get('/api/notifications/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: employeeId },
      orderBy: { created_at: 'desc' }
    });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.notification.update({
      where: { id },
      data: { is_read: true }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/notifications/read-all/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  try {
    const result = await prisma.notification.updateMany({
      where: { user_id: employeeId, is_read: false },
      data: { is_read: true }
    });
    res.json({ success: true, count: result.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.notification.delete({ where: { id } });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Google Calendar Integration ---
const { google } = require('googleapis');

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Generate Google OAuth consent URL
app.get('/api/google/auth-url', (req, res) => {
  const { employeeId } = req.query;
  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  const oauth2Client = getOAuth2Client();
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: employeeId // Pass employeeId through OAuth state
  });

  res.json({ url });
});

// OAuth callback - exchange code for tokens
app.get('/api/google/callback', async (req, res) => {
  const { code, state: employeeId } = req.query;

  if (!code || !employeeId) {
    return res.status(400).send('Missing authorization code or employee ID');
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in DB
    await prisma.googleToken.upsert({
      where: { employee_id: employeeId },
      update: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || '',
        token_type: tokens.token_type || 'Bearer',
        expiry_date: BigInt(tokens.expiry_date || 0),
      },
      create: {
        id: `gt_${Date.now()}`,
        employee_id: employeeId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || '',
        token_type: tokens.token_type || 'Bearer',
        expiry_date: BigInt(tokens.expiry_date || 0),
      }
    });

    // Redirect back to frontend with success
    res.redirect('http://localhost:3000/employee/calendar?google=connected');
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect('http://localhost:3000/employee/calendar?google=error');
  }
});

// Check if employee has connected Google Calendar
app.get('/api/google/status/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  try {
    const token = await prisma.googleToken.findUnique({
      where: { employee_id: employeeId }
    });
    res.json({ connected: !!token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Disconnect Google Calendar
app.delete('/api/google/disconnect/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  try {
    await prisma.googleToken.deleteMany({
      where: { employee_id: employeeId }
    });
    res.json({ message: 'Google Calendar disconnected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Helper: get authenticated Google Calendar client for an employee
async function getCalendarClient(employeeId) {
  const tokenRecord = await prisma.googleToken.findUnique({
    where: { employee_id: employeeId }
  });
  if (!tokenRecord) {
    throw new Error('Google Calendar not connected');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokenRecord.access_token,
    refresh_token: tokenRecord.refresh_token,
    token_type: tokenRecord.token_type,
    expiry_date: Number(tokenRecord.expiry_date)
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (tokens) => {
    const updateData = {
      access_token: tokens.access_token || tokenRecord.access_token,
      expiry_date: BigInt(tokens.expiry_date || 0)
    };
    if (tokens.refresh_token) {
      updateData.refresh_token = tokens.refresh_token;
    }
    await prisma.googleToken.update({
      where: { employee_id: employeeId },
      data: updateData
    });
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Sync attendance, leaves, and holidays to Google Calendar
app.post('/api/google/sync/:employeeId', async (req, res) => {
  const { employeeId } = req.params;

  try {
    const calendar = await getCalendarClient(employeeId);

    // Fetch employee data
    const emp = await prisma.employee.findUnique({ where: { employee_id: employeeId } });
    if (!emp) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Fetch attendance records (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employee_id: employeeId,
        date: { gte: thirtyDaysAgo }
      }
    });

    // Fetch approved leaves
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        employee_id: employeeId,
        status: 'Approved'
      }
    });

    // Fetch upcoming holidays
    const today = new Date();
    const holidays = await prisma.holiday.findMany({
      where: {
        holiday_date: { gte: today }
      }
    });

    let synced = { attendance: 0, leaves: 0, holidays: 0 };

    // Sync attendance records
    for (const rec of attendanceRecords) {
      const dateStr = rec.date.toISOString().split('T')[0];
      const summary = `[DAttendance] ${rec.status}${rec.check_in ? ` | In: ${rec.check_in}` : ''}${rec.check_out ? ` | Out: ${rec.check_out}` : ''}`;

      const event = {
        summary,
        description: `Attendance status: ${rec.status}\nCheck-in: ${rec.check_in || 'N/A'}\nCheck-out: ${rec.check_out || 'N/A'}\nWorking hours: ${rec.working_hours || 'N/A'}`,
        start: { date: dateStr },
        end: { date: dateStr },
        colorId: rec.status === 'Present' ? '10' : rec.status === 'Half Day' ? '5' : '11' // Green, Yellow, Red
      };

      try {
        // Search for existing event to avoid duplicates
        const existing = await calendar.events.list({
          calendarId: 'primary',
          timeMin: `${dateStr}T00:00:00Z`,
          timeMax: `${dateStr}T23:59:59Z`,
          q: '[DAttendance]'
        });

        if (existing.data.items && existing.data.items.length > 0) {
          // Update existing event
          await calendar.events.update({
            calendarId: 'primary',
            eventId: existing.data.items[0].id,
            requestBody: event
          });
        } else {
          await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event
          });
        }
        synced.attendance++;
      } catch (e) {
        console.error(`Failed to sync attendance for ${dateStr}:`, e.message);
      }
    }

    // Sync approved leaves
    for (const leave of leaves) {
      const startStr = leave.start_date.toISOString().split('T')[0];
      const endDate = new Date(leave.end_date);
      endDate.setDate(endDate.getDate() + 1); // Google Calendar end dates are exclusive
      const endStr = endDate.toISOString().split('T')[0];

      const event = {
        summary: `[DAttendance] Leave: ${leave.leave_type}`,
        description: `Approved ${leave.leave_type} leave`,
        start: { date: startStr },
        end: { date: endStr },
        colorId: '5' // Yellow/Banana
      };

      try {
        const existing = await calendar.events.list({
          calendarId: 'primary',
          timeMin: `${startStr}T00:00:00Z`,
          timeMax: `${startStr}T23:59:59Z`,
          q: `[DAttendance] Leave: ${leave.leave_type}`
        });

        if (!existing.data.items || existing.data.items.length === 0) {
          await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event
          });
        }
        synced.leaves++;
      } catch (e) {
        console.error(`Failed to sync leave:`, e.message);
      }
    }

    // Sync holidays
    for (const holiday of holidays) {
      const dateStr = holiday.holiday_date.toISOString().split('T')[0];
      const endDate = new Date(holiday.holiday_date);
      endDate.setDate(endDate.getDate() + 1);
      const endStr = endDate.toISOString().split('T')[0];

      const event = {
        summary: `[DAttendance] Holiday: ${holiday.holiday_name}`,
        description: `${holiday.holiday_type}`,
        start: { date: dateStr },
        end: { date: endStr },
        colorId: '9' // Blue/Blueberry
      };

      try {
        const existing = await calendar.events.list({
          calendarId: 'primary',
          timeMin: `${dateStr}T00:00:00Z`,
          timeMax: `${dateStr}T23:59:59Z`,
          q: `[DAttendance] Holiday: ${holiday.holiday_name}`
        });

        if (!existing.data.items || existing.data.items.length === 0) {
          await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event
          });
        }
        synced.holidays++;
      } catch (e) {
        console.error(`Failed to sync holiday:`, e.message);
      }
    }

    await logActivity('google_sync', emp.name, `${emp.name} synced calendar to Google (${synced.attendance} attendance, ${synced.leaves} leaves, ${synced.holidays} holidays)`);
    res.json({ message: 'Sync completed', synced });
  } catch (err) {
    console.error('Google sync error:', err);
    if (err.message === 'Google Calendar not connected') {
      return res.status(401).json({ error: 'Google Calendar not connected. Please connect first.' });
    }
    res.status(500).json({ error: 'Failed to sync with Google Calendar' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'DAttendance API Server is running (Prisma/SQLite)', status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
