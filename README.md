# DAttendance — Enterprise Attendance Registry Portal

A modern, production-quality HR Management System (HRMS) built with **React + TypeScript + Tailwind CSS**. The system supports two fully-featured user portals with role-based access control — all frontend-only with localStorage persistence.

---

## 🚀 Quick Start

```bash
npm install
npm start
```

Open **http://localhost:3001** (or 3000 if not in use) in your browser.

---

## 🔐 Demo Login Credentials

> Universal password for all accounts: **`password`**

| Role | Employee ID | Email | Name |
|------|------------|-------|------|
| **HR / Admin** | `HR001` | `admin@company.com` | Sarah Connor |
| **Employee** | `EMP001` | `employee@company.com` | John Doe |
| Employee | `EMP002` | `alice@company.com` | Alice Smith |
| Employee | `EMP003` | `bob@company.com` | Bob Johnson |
| Employee | `EMP004` | `charlie@company.com` | Charlie Brown |

---

## 👤 PORTAL 1 — Employee Portal

> Accessed automatically after logging in with an Employee account.

### Dashboard (`/employee/dashboard`)
- **Welcome Banner** — Shows employee name, designation, and department
- **Live Digital Clock** — Real-time current time display
- **Clock In Button** — Marks attendance with exact timestamp
- **Clock Out Button** — Ends shift and auto-calculates working hours
- **Live Running Timer** — Shows elapsed hours:minutes:seconds while shift is active
- **Status Indicators** — Present / Absent / Half Day / On Leave / Holiday / Weekend
- **KPI Cards** — Today's Status, Check-In Time, Check-Out Time, Total Working Hours

### Attendance Calendar (`/employee/calendar`)
- **Monthly Calendar Grid** — Navigate between months with Prev/Next controls
- **Color-Coded Days:**
  - 🟢 Green = Present
  - 🔴 Red = Absent
  - 🟡 Yellow = Half Day
  - 🔵 Blue = Leave
  - 🟣 Purple = Holiday
  - ⚫ Gray = Weekend
- **Day Detail Modal** — Click any date to see: Date, Status, Clock-In, Clock-Out, Working Hours

### Attendance History (`/employee/history`)
- **Attendance Log Table** — All historical records in reverse chronological order
- **Month Filter** — Filter records by specific month
- **Year Filter** — Filter by year (2025, 2026)
- **Search** — Search by date string or status keyword
- **Reset Filters** — One-click clear all filters
- **Live Shift Indicator** — Active shifts show a pulsing green dot

---

## 🛡️ PORTAL 2 — HR / Admin Portal

> Accessed automatically after logging in with the Admin account.

### Dashboard (`/admin/dashboard`)
- **KPI Summary Cards:**
  - Total Employees registered
  - Present Today count
  - Absent Today count
  - On Leave count
  - Daily Attendance Percentage
- **📊 Attendance Share Donut Chart** — Visual distribution of Present / Absent / Leave for today
- **📈 Weekly Trend Area Chart** — Check-in volume for the last 5 working days
- **📊 Department-wise Bar Chart** — Horizontal bars showing each department's attendance %
- **🔔 Real-time Activity Feed** — Timeline of all system events (Clock-ins, Clock-outs, Leave approvals, New hires)

### Employee Directory (`/admin/employees`)
- **Employee Table** — ID, Name, Department, Designation, Email, Current Status
- **Search** — Instantly filter by name, ID, email, or designation
- **Filter by Department** — Engineering, Marketing, Sales, HR, Finance
- **Filter by Status** — Present / Absent / On Leave
- **➕ Add Employee** — Form modal to register new staff with all fields
- **✏️ Edit Employee** — Update name, email, department, designation, role
- **👁️ View Profile** — Read-only employee detail card
- **🗑️ Delete Employee** — Removes employee and all their records

### Attendance Registry (`/admin/registry`)
- **Daily Attendance Log Table** — All employees' check-in/out timings for any selected date
- **Date Picker** — Navigate to any past/future date
- **Search by Employee** — Filter rows by name or employee ID
- **Department Filter** — Show only specific department records
- **Status Filter** — Present / Absent / Half Day / On Leave
- **Active Shift Indicator** — Employees mid-shift show a pulsing green "Active" indicator

### Attendance Calendar (`/admin/calendar`)
- **Monthly Calendar Grid** — Navigate months with Prev/Next
- **Each Day Cell Shows:**
  - **P:** Present count
  - **A:** Absent count
  - **L:** Leave / Off count
- **Day Detail Modal** — Click any date to open a full breakdown table showing every employee's name, department, status, clock-in, clock-out, and working hours

### Leave Management (`/admin/leaves`)
- **Tab Navigation** — All Requests / Pending Approval / Approved / Rejected
- **Pending Badge Counter** — Red badge shows count of unreviewed requests
- **Leave Table** — Employee Name, Department, Leave Type, Start Date, End Date, Status
- **✅ Approve Button** — Instantly marks leave as Approved and fills attendance calendar with Leave records
- **❌ Reject Button** — Marks request as Rejected
- **Processed State** — Approved/Rejected rows show "Processed" label

### Attendance Reports (`/admin/reports`)
- **Report Type Selector** — Daily / Weekly / Monthly
- **Date Picker** — Choose the reference date/period
- **Generate Report Button** — Computes all metrics on demand
- **KPI Summary** — Overall Rate %, Total Present Logs, Total Absent Logs, Avg Office Hours
- **Department Breakdown Table** — Staff count, Present/Absent logs, Attendance % per department
- **Employee-wise Table** — Per-employee breakdown: Present Days, Absent Days, Leave Days, Avg Hours, Presence Rate badge
- **📥 Export CSV** — Downloads as `.csv` (opens directly in Excel)
- **🖨️ Print / PDF** — Triggers browser print dialog with a formatted report layout

### Settings (`/admin/settings`)
**Tab: Shift Timings**
- Standard Check-In time
- Standard Check-Out time
- Grace Period (minutes before late)
- Half-Day threshold (minimum hours)

**Tab: Company Holidays**
- View all configured company holidays
- Add new holidays with name and date
- Delete existing holidays (reflects immediately on all calendars)

**Tab: Security & Access**
- Documents the role-based access control (RBAC) policy
- Admin vs Employee permissions overview

---

## 🏗️ Project Structure

```
src/
├── types/index.ts                  # TypeScript interfaces
├── utils/mockData.ts               # Seed data + 30-day attendance generator
├── context/
│   ├── AuthContext.tsx             # Login, logout, session persistence
│   └── DataContext.tsx             # All CRUD + business logic + localStorage
├── components/
│   ├── ui/
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Table.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   └── Toast.tsx               # Sliding notifications
│   └── layout/
│       ├── Sidebar.tsx             # Dynamic nav based on user role
│       ├── Navbar.tsx              # Top bar with notifications + profile
│       ├── MainLayout.tsx          # Page wrapper with sidebar + content
│       └── RouteGuards.tsx         # AdminRoute + EmployeeRoute guards
├── pages/
│   ├── Login.tsx                   # Login + Forgot Password
│   ├── EmployeePortal/
│   │   ├── EmployeeDashboard.tsx
│   │   ├── EmployeeCalendar.tsx
│   │   └── EmployeeHistory.tsx
│   └── AdminPortal/
│       ├── AdminDashboard.tsx
│       ├── EmployeeDirectory.tsx
│       ├── AttendanceRegistry.tsx
│       ├── AttendanceCalendar.tsx
│       ├── LeaveManagement.tsx
│       ├── Reports.tsx
│       └── Settings.tsx
└── App.tsx                         # Router + Providers
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 19 + TypeScript | Core framework |
| React Router v7 | Client-side routing |
| Tailwind CSS v3 | Utility-first styling |
| Recharts | Dashboard charts |
| Lucide React | Icon library |
| localStorage | Data persistence (no backend) |

---

## 📝 Notes

- All data is stored in browser `localStorage` — clearing browser storage resets to seed data.
- The app seeds **30 days of realistic historical attendance** automatically on first load.
- Role-based guards redirect employees away from admin routes and vice versa.
- The app is **100% frontend-only** — no backend server, database, or API required.
