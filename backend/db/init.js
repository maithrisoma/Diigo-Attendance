const { Client, Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pgUser = process.env.PGUSER || 'postgres';
const pgPassword = process.env.PGPASSWORD || 'postgres';
const pgHost = process.env.PGHOST || 'localhost';
const pgPort = process.env.PGPORT || 5432;
const pgDatabase = process.env.PGDATABASE || 'dattendance';

async function init() {
  console.log('Connecting to default postgres database to check/create target database...');
  const client = new Client({
    user: pgUser,
    password: pgPassword,
    host: pgHost,
    port: pgPort,
    database: 'postgres',
  });

  try {
    await client.connect();
    
    // Check if database exists
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [pgDatabase]);
    if (res.rowCount === 0) {
      console.log(`Database "${pgDatabase}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${pgDatabase}"`);
      console.log(`Database "${pgDatabase}" created successfully.`);
    } else {
      console.log(`Database "${pgDatabase}" already exists.`);
    }
  } catch (err) {
    console.error('Error checking or creating database:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }

  console.log(`Connecting to database "${pgDatabase}" to run migrations and seed data...`);
  const pool = new Pool({
    user: pgUser,
    password: pgPassword,
    host: pgHost,
    port: pgPort,
    database: pgDatabase,
  });

  try {
    // Create Tables
    console.log('Creating tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        department VARCHAR(100) NOT NULL,
        designation VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee')),
        current_status VARCHAR(20) NOT NULL DEFAULT 'Absent' CHECK (current_status IN ('Present', 'Absent', 'Leave')),
        join_date DATE NOT NULL DEFAULT CURRENT_DATE,
        password VARCHAR(255) NOT NULL DEFAULT 'password'
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(50) REFERENCES employees(employee_id) ON DELETE CASCADE,
        date DATE NOT NULL,
        check_in TIME,
        check_out TIME,
        status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Leave', 'Half Day')),
        working_hours NUMERIC(5,2),
        UNIQUE(employee_id, date)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) REFERENCES employees(employee_id) ON DELETE CASCADE,
        leave_type VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected'))
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id VARCHAR(50) PRIMARY KEY,
        holiday_name VARCHAR(100) NOT NULL,
        holiday_date DATE NOT NULL UNIQUE,
        holiday_type VARCHAR(50) NOT NULL,
        is_recurring BOOLEAN DEFAULT FALSE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tables created successfully.');

    // Check if seeding is needed
    const empCheck = await pool.query('SELECT COUNT(*) FROM employees');
    const empCount = parseInt(empCheck.rows[0].count, 10);
    
    if (empCount === 0) {
      console.log('Database is empty. Seeding mock data...');
      
      const employees = [
        { id: '1', employee_id: 'HR001', name: 'Sarah Connor', email: 'admin@company.com', department: 'Human Resources', designation: 'HR Director', role: 'admin', current_status: 'Present', join_date: '2021-03-15', password: 'password' },
        { id: '2', employee_id: 'EMP001', name: 'John Doe', email: 'employee@company.com', department: 'Engineering', designation: 'Senior Developer', role: 'employee', current_status: 'Present', join_date: '2022-01-10', password: 'password' },
        { id: '3', employee_id: 'EMP002', name: 'Alice Smith', email: 'alice@company.com', department: 'Engineering', designation: 'Product Designer', role: 'employee', current_status: 'Present', join_date: '2022-07-01', password: 'password' },
        { id: '4', employee_id: 'EMP003', name: 'Bob Johnson', email: 'bob@company.com', department: 'Marketing', designation: 'Marketing Specialist', role: 'employee', current_status: 'Leave', join_date: '2023-02-20', password: 'password' },
        { id: '5', employee_id: 'EMP004', name: 'Charlie Brown', email: 'charlie@company.com', department: 'Sales', designation: 'Sales Executive', role: 'employee', current_status: 'Absent', join_date: '2023-06-05', password: 'password' },
        { id: '6', employee_id: 'EMP005', name: 'Diana Prince', email: 'diana@company.com', department: 'Engineering', designation: 'QA Lead', role: 'employee', current_status: 'Present', join_date: '2021-11-08', password: 'password' },
        { id: '7', employee_id: 'EMP006', name: 'Evan Wright', email: 'evan@company.com', department: 'Finance', designation: 'Chief Accountant', role: 'employee', current_status: 'Present', join_date: '2020-09-14', password: 'password' }
      ];

      for (const emp of employees) {
        await pool.query(
          `INSERT INTO employees (id, employee_id, name, email, department, designation, role, current_status, join_date, password)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [emp.id, emp.employee_id, emp.name, emp.email, emp.department, emp.designation, emp.role, emp.current_status, emp.join_date, emp.password]
        );
      }

      const holidays = [
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

      for (const h of holidays) {
        await pool.query(
          `INSERT INTO holidays (id, holiday_name, holiday_date, holiday_type, is_recurring)
           VALUES ($1, $2, $3, $4, $5)`,
          [h.id, h.holiday_name, h.holiday_date, h.holiday_type, h.is_recurring]
        );
      }

      const leaves = [
        { id: 'l1', employee_id: 'EMP003', leave_type: 'Annual Leave', start_date: '2026-06-01', end_date: '2026-06-05', status: 'Approved' },
        { id: 'l2', employee_id: 'EMP005', leave_type: 'Sick Leave', start_date: '2026-06-02', end_date: '2026-06-02', status: 'Approved' },
        { id: 'l3', employee_id: 'EMP001', leave_type: 'Casual Leave', start_date: '2026-06-10', end_date: '2026-06-12', status: 'Pending' },
        { id: 'l4', employee_id: 'EMP002', leave_type: 'Sick Leave', start_date: '2026-05-12', end_date: '2026-05-13', status: 'Approved' },
        { id: 'l5', employee_id: 'EMP006', leave_type: 'Annual Leave', start_date: '2026-06-15', end_date: '2026-06-18', status: 'Pending' },
      ];

      for (const l of leaves) {
        await pool.query(
          `INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [l.id, l.employee_id, l.leave_type, l.start_date, l.end_date, l.status]
        );
      }

      const activities = [
        { id: 'act1', type: 'leave_approve', user_name: 'Sarah Connor', message: 'Approved Annual Leave request for Bob Johnson (June 1 - June 5)', timestamp: '2026-06-02T18:30:00Z' },
        { id: 'act2', type: 'employee_add', user_name: 'Sarah Connor', message: 'Added new employee Evan Wright (EMP006) to Finance', timestamp: '2026-06-01T09:15:00Z' },
        { id: 'act3', type: 'leave_reject', user_name: 'Sarah Connor', message: 'Rejected Sick Leave request for John Doe (May 28)', timestamp: '2026-05-29T10:00:00Z' },
      ];

      for (const act of activities) {
        await pool.query(
          `INSERT INTO activity_log (id, type, user_name, message, timestamp)
           VALUES ($1, $2, $3, $4, $5)`,
          [act.id, act.type, act.user_name, act.message, act.timestamp]
        );
      }

      console.log('Generating 30 days of historical attendance data...');
      const records = generateHistoricalAttendanceData(employees, holidays, leaves);
      console.log(`Generated ${records.length} attendance records. Inserting...`);
      
      for (const rec of records) {
        await pool.query(
          `INSERT INTO attendance (id, employee_id, date, check_in, check_out, status, working_hours)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (employee_id, date) DO NOTHING`,
          [rec.id, rec.employee_id, rec.date, rec.check_in, rec.check_out, rec.status, rec.working_hours]
        );
      }
      
      console.log('Mock database seeded successfully.');
    } else {
      console.log('Database already seeded.');
    }

  } catch (err) {
    console.error('Error running migrations and seeding:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function generateHistoricalAttendanceData(employees, holidays, leaves) {
  const records = [];
  const today = new Date('2026-06-03');

  for (let i = 30; i >= 1; i--) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);
    const dateStr = targetDate.toISOString().split('T')[0];
    const dayOfWeek = targetDate.getDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    const isHoliday = holidays.find(h => h.holiday_date === dateStr);
    if (isHoliday) continue;
    
    employees.forEach(emp => {
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
      
      const rand = Math.random();
      let status = 'Present';
      let checkIn = null;
      let checkOut = null;
      let workingHours = null;
      
      if (rand < 0.88) {
        status = 'Present';
        const checkInHour = 8;
        const checkInMin = Math.floor(Math.random() * 45);
        const checkOutHour = 17 + Math.floor(Math.random() * 2);
        const checkOutMin = Math.floor(Math.random() * 15);
        
        checkIn = `${checkInHour.toString().padStart(2, '0')}:${checkInMin.toString().padStart(2, '0')}:00`;
        checkOut = `${checkOutHour.toString().padStart(2, '0')}:${checkOutMin.toString().padStart(2, '0')}:00`;
        workingHours = parseFloat((checkOutHour + checkOutMin / 60 - (checkInHour + checkInMin / 60)).toFixed(2));
      } else if (rand < 0.94) {
        status = 'Half Day';
        const checkInHour = 9;
        const checkInMin = Math.floor(Math.random() * 15);
        const checkOutHour = 13;
        const checkOutMin = Math.floor(Math.random() * 15);
        
        checkIn = `${checkInHour.toString().padStart(2, '0')}:${checkInMin.toString().padStart(2, '0')}:00`;
        checkOut = `${checkOutHour.toString().padStart(2, '0')}:${checkOutMin.toString().padStart(2, '0')}:00`;
        workingHours = 4.0;
      } else {
        status = 'Absent';
        checkIn = null;
        checkOut = null;
        workingHours = 0.0;
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

  const todayStr = '2026-06-03';
  employees.forEach(emp => {
    if (emp.employee_id === 'EMP003') {
      records.push({
        id: `att_${emp.employee_id}_${todayStr}`,
        employee_id: emp.employee_id,
        date: todayStr,
        check_in: null,
        check_out: null,
        status: 'Leave',
        working_hours: null,
      });
    } else if (emp.employee_id === 'EMP004') {
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
}

init();
