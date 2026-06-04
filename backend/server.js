const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Helper to log activities
async function logActivity(type, userName, message) {
  const id = `act_${Date.now()}`;
  const timestamp = new Date().toISOString();
  try {
    await pool.query(
      `INSERT INTO activity_log (id, type, user_name, message, timestamp) VALUES ($1, $2, $3, $4, $5)`,
      [id, type, userName, message, timestamp]
    );
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
    const result = await pool.query(
      `SELECT id, employee_id, name, email, department, designation, role, current_status, TO_CHAR(join_date, 'YYYY-MM-DD') as join_date, password 
       FROM employees 
       WHERE LOWER(email) = $1 OR LOWER(employee_id) = $1`,
      [normalizedInput]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Invalid Employee ID or Email' });
    }

    const user = result.rows[0];
    if (password !== user.password) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Try using "password".' });
    }

    delete user.password;
    return res.json({ success: true, message: 'Login successful', user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { emailOrId } = req.body;
  const normalizedInput = emailOrId.toLowerCase().trim();
  try {
    const result = await pool.query(
      `SELECT email FROM employees WHERE LOWER(email) = $1 OR LOWER(employee_id) = $1`,
      [normalizedInput]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found in registry' });
    }

    return res.json({
      success: true,
      message: `Password reset instructions have been sent to ${result.rows[0].email}. (Demo note: password is "password")`
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// --- Employees Endpoints ---
app.get('/api/employees', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, employee_id, name, email, department, designation, role, current_status, TO_CHAR(join_date, 'YYYY-MM-DD') as join_date 
       FROM employees ORDER BY join_date ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/employees', async (req, res) => {
  const { employee_id, name, email, department, designation, role, join_date } = req.body;
  const id = `emp_${Date.now()}`;
  const status = 'Absent';
  
  try {
    const result = await pool.query(
      `INSERT INTO employees (id, employee_id, name, email, department, designation, role, current_status, join_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, employee_id, name, email, department, designation, role, current_status, TO_CHAR(join_date, 'YYYY-MM-DD') as join_date`,
      [id, employee_id, name, email, department, designation, role, status, join_date || new Date().toISOString().split('T')[0]]
    );

    await logActivity('employee_add', 'Sarah Connor', `Added new employee ${name} (${employee_id}) in ${department}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { employee_id, name, email, department, designation, role, current_status, join_date } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const origResult = await client.query('SELECT employee_id, name FROM employees WHERE id = $1', [id]);
    if (origResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Employee not found' });
    }
    const original = origResult.rows[0];

    const result = await client.query(
      `UPDATE employees 
       SET employee_id = COALESCE($1, employee_id),
           name = COALESCE($2, name),
           email = COALESCE($3, email),
           department = COALESCE($4, department),
           designation = COALESCE($5, designation),
           role = COALESCE($6, role),
           current_status = COALESCE($7, current_status),
           join_date = COALESCE($8, join_date)
       WHERE id = $9
       RETURNING id, employee_id, name, email, department, designation, role, current_status, TO_CHAR(join_date, 'YYYY-MM-DD') as join_date`,
      [employee_id, name, email, department, designation, role, current_status, join_date, id]
    );

    const updated = result.rows[0];

    if (employee_id && employee_id !== original.employee_id) {
      await client.query('UPDATE attendance SET employee_id = $1 WHERE employee_id = $2', [employee_id, original.employee_id]);
      await client.query('UPDATE leave_requests SET employee_id = $1 WHERE employee_id = $2', [employee_id, original.employee_id]);
    }

    await client.query('COMMIT');

    await logActivity('employee_edit', 'Sarah Connor', `Updated details for ${updated.name} (${updated.employee_id})`);
    res.json(updated);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const origResult = await pool.query('SELECT employee_id, name FROM employees WHERE id = $1', [id]);
    if (origResult.rowCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const emp = origResult.rows[0];

    await pool.query('DELETE FROM employees WHERE id = $1', [id]);
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
    const result = await pool.query(
      `SELECT id, employee_id, TO_CHAR(date, 'YYYY-MM-DD') as date, check_in, check_out, status, working_hours 
       FROM attendance ORDER BY date DESC`
    );
    res.json(result.rows);
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
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const empResult = await client.query('SELECT name FROM employees WHERE employee_id = $1', [employeeId]);
    if (empResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Employee not found' });
    }
    const emp = empResult.rows[0];

    const attId = `att_${employeeId}_${todayStr}`;
    const checkRecord = await client.query('SELECT 1 FROM attendance WHERE employee_id = $1 AND date = $2', [employeeId, todayStr]);

    if (checkRecord.rowCount > 0) {
      await client.query(
        `UPDATE attendance SET check_in = $1, status = 'Present' WHERE employee_id = $2 AND date = $3`,
        [timeStr, employeeId, todayStr]
      );
    } else {
      await client.query(
        `INSERT INTO attendance (id, employee_id, date, check_in, check_out, status, working_hours)
         VALUES ($1, $2, $3, $4, null, 'Present', null)`,
        [attId, employeeId, todayStr, timeStr]
      );
    }

    await client.query(`UPDATE employees SET current_status = 'Present' WHERE employee_id = $1`, [employeeId]);

    await client.query('COMMIT');

    await logActivity('check_in', emp.name, `${emp.name} (${employeeId}) checked in at ${timeStr}`);
    res.json({ message: 'Checked in successfully', time: timeStr });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

app.post('/api/attendance/check-out', async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const empResult = await client.query('SELECT name FROM employees WHERE employee_id = $1', [employeeId]);
    if (empResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Employee not found' });
    }
    const emp = empResult.rows[0];

    const attResult = await client.query('SELECT check_in FROM attendance WHERE employee_id = $1 AND date = $2', [employeeId, todayStr]);
    if (attResult.rowCount === 0 || !attResult.rows[0].check_in) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No check-in record found for today' });
    }

    const checkIn = attResult.rows[0].check_in;
    const [inH, inM, inS] = checkIn.split(':').map(Number);
    const [outH, outM, outS] = timeStr.split(':').map(Number);

    const checkInDecimal = inH + inM / 60 + (inS || 0) / 3600;
    const checkOutDecimal = outH + outM / 60 + (outS || 0) / 3600;

    let hours = checkOutDecimal - checkInDecimal;
    if (hours < 0) hours += 24;
    const workingHours = parseFloat(hours.toFixed(2));
    const status = workingHours < 5 ? 'Half Day' : 'Present';

    await client.query(
      `UPDATE attendance 
       SET check_out = $1, status = $2, working_hours = $3 
       WHERE employee_id = $4 AND date = $5`,
      [timeStr, status, workingHours, employeeId, todayStr]
    );

    await client.query(`UPDATE employees SET current_status = 'Present' WHERE employee_id = $1`, [employeeId]);

    await client.query('COMMIT');

    await logActivity('check_out', emp.name, `${emp.name} (${employeeId}) checked out at ${timeStr}. Total hours: ${workingHours}`);
    res.json({ message: 'Checked out successfully', time: timeStr, workingHours, status });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

// --- Leave Requests Endpoints ---
app.get('/api/leaves', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, employee_id, leave_type, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, status 
       FROM leave_requests ORDER BY start_date DESC`
    );
    res.json(result.rows);
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
    const empResult = await pool.query('SELECT name FROM employees WHERE employee_id = $1', [employeeId]);
    if (empResult.rowCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const emp = empResult.rows[0];

    const result = await pool.query(
      `INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, employee_id, leave_type, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, status`,
      [id, employeeId, leaveType, startDate, endDate, status]
    );

    await logActivity('leave_approve', emp.name, `${emp.name} requested ${leaveType} from ${startDate} to ${endDate}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/leaves/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { hrName } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const leaveResult = await client.query(
      `SELECT employee_id, leave_type, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date 
       FROM leave_requests WHERE id = $1`,
      [id]
    );
    if (leaveResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Leave request not found' });
    }
    const request = leaveResult.rows[0];

    const empResult = await client.query('SELECT name FROM employees WHERE employee_id = $1', [request.employee_id]);
    if (empResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Employee not found' });
    }
    const emp = empResult.rows[0];

    await client.query(`UPDATE leave_requests SET status = 'Approved' WHERE id = $1`, [id]);

    const start = new Date(request.start_date);
    const end = new Date(request.end_date);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();

      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      await client.query('DELETE FROM attendance WHERE employee_id = $1 AND date = $2', [request.employee_id, dateStr]);
      
      const attId = `att_${request.employee_id}_${dateStr}`;
      await client.query(
        `INSERT INTO attendance (id, employee_id, date, check_in, check_out, status, working_hours)
         VALUES ($1, $2, $3, null, null, 'Leave', null)`,
        [attId, request.employee_id, dateStr]
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (todayStr >= request.start_date && todayStr <= request.end_date) {
      await client.query(`UPDATE employees SET current_status = 'Leave' WHERE employee_id = $1`, [request.employee_id]);
    }

    await client.query('COMMIT');

    await logActivity('leave_approve', hrName || 'HR Manager', `Approved ${request.leave_type} for ${emp.name} (${request.start_date} to ${request.end_date})`);
    res.json({ message: 'Leave approved successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

app.put('/api/leaves/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { hrName } = req.body;

  try {
    const leaveResult = await pool.query(
      `SELECT employee_id, leave_type, TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(end_date, 'YYYY-MM-DD') as end_date 
       FROM leave_requests WHERE id = $1`,
      [id]
    );
    if (leaveResult.rowCount === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    const request = leaveResult.rows[0];

    const empResult = await pool.query('SELECT name FROM employees WHERE employee_id = $1', [request.employee_id]);
    const emp = empResult.rows[0];

    await pool.query(`UPDATE leave_requests SET status = 'Rejected' WHERE id = $1`, [id]);
    await logActivity('leave_reject', hrName || 'HR Manager', `Rejected ${request.leave_type} for ${emp.name} (${request.start_date} to ${request.end_date})`);
    res.json({ message: 'Leave request rejected successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Holidays Endpoints ---
app.get('/api/holidays', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, holiday_name, TO_CHAR(holiday_date, 'YYYY-MM-DD') as holiday_date, holiday_type, is_recurring 
       FROM holidays ORDER BY holiday_date ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/holidays', async (req, res) => {
  const { holiday_name, holiday_date, holiday_type, is_recurring } = req.body;
  const id = `h_${Date.now()}`;

  try {
    const result = await pool.query(
      `INSERT INTO holidays (id, holiday_name, holiday_date, holiday_type, is_recurring)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, holiday_name, TO_CHAR(holiday_date, 'YYYY-MM-DD') as holiday_date, holiday_type, is_recurring`,
      [id, holiday_name, holiday_date, holiday_type, is_recurring || false]
    );

    await logActivity('employee_add', 'HR Manager', `Added holiday: ${holiday_name} on ${holiday_date}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/holidays/:id', async (req, res) => {
  const { id } = req.params;
  const { holiday_name, holiday_date, holiday_type, is_recurring } = req.body;

  try {
    const result = await pool.query(
      `UPDATE holidays
       SET holiday_name = COALESCE($1, holiday_name),
           holiday_date = COALESCE($2, holiday_date),
           holiday_type = COALESCE($3, holiday_type),
           is_recurring = COALESCE($4, is_recurring)
       WHERE id = $5
       RETURNING id, holiday_name, TO_CHAR(holiday_date, 'YYYY-MM-DD') as holiday_date, holiday_type, is_recurring`,
      [holiday_name, holiday_date, holiday_type, is_recurring, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }

    await logActivity('employee_edit', 'HR Manager', `Updated holiday: ${result.rows[0].holiday_name} details`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/holidays/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const hResult = await pool.query('SELECT holiday_name FROM holidays WHERE id = $1', [id]);
    if (hResult.rowCount === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    const holidayName = hResult.rows[0].holiday_name;

    await pool.query('DELETE FROM holidays WHERE id = $1', [id]);
    await logActivity('employee_remove', 'HR Manager', `Removed holiday: ${holidayName}`);
    res.json({ message: 'Holiday deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Activity Logs Endpoints ---
app.get('/api/activities', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, user_name, message, timestamp 
       FROM activity_log ORDER BY timestamp DESC`
    );
    res.json(result.rows);
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
    const result = await pool.query(
      `INSERT INTO activity_log (id, type, user_name, message, timestamp)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, type, user_name, message, timestamp`,
      [id, type, userName, message, timestamp]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'DAttendance API Server is running', status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
