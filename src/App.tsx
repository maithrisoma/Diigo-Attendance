import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './components/ui/Toast';

// Layout
import { MainLayout } from './components/layout/MainLayout';
import { AdminRoute, HRRoute, EmployeeRoute } from './components/layout/RouteGuards';

// Pages
import { Login } from './pages/Login';

// Employee Portal Pages
import { EmployeeDashboard } from './pages/EmployeePortal/EmployeeDashboard';
import { EmployeeCalendar } from './pages/EmployeePortal/EmployeeCalendar';
import { EmployeeHistory } from './pages/EmployeePortal/EmployeeHistory';
import { EmployeeLeave } from './pages/EmployeePortal/EmployeeLeave';
import { EmployeeAnnouncements } from './pages/EmployeePortal/EmployeeAnnouncements';

// Admin/HR Portal Pages
import { AdminDashboard } from './pages/AdminPortal/AdminDashboard';
import { EmployeeDirectory } from './pages/AdminPortal/EmployeeDirectory';
import { EmployeeProfile } from './pages/AdminPortal/EmployeeProfile';
import { AttendanceRegistry } from './pages/AdminPortal/AttendanceRegistry';
import { AttendanceCalendar } from './pages/AdminPortal/AttendanceCalendar';
import { LeaveManagement } from './pages/AdminPortal/LeaveManagement';
import { HolidayManagement } from './pages/AdminPortal/HolidayManagement';
import { Reports } from './pages/AdminPortal/Reports';
import { Settings } from './pages/AdminPortal/Settings';
import { AnnouncementsBoard } from './pages/AdminPortal/AnnouncementsBoard';

// New Super Admin Portal Pages
import { HRManagement } from './pages/AdminPortal/HRManagement';
import { RoleManagement } from './pages/AdminPortal/RoleManagement';
import { ActivityLogs } from './pages/AdminPortal/ActivityLogs';
import { NotificationsPage } from './pages/AdminPortal/NotificationsPage';

// Helper component for root route redirect
const RootRedirect: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (currentUser.role === 'hr') {
    return <Navigate to="/hr/dashboard" replace />;
  } else {
    return <Navigate to="/employee/dashboard" replace />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />

              {/* Private routes wrapped in layout */}
              <Route path="/" element={<MainLayout />}>
                {/* Root redirect logic */}
                <Route index element={<RootRedirect />} />

                {/* Employee Portal Guarded Routes */}
                <Route
                  path="employee/dashboard"
                  element={
                    <EmployeeRoute>
                      <EmployeeDashboard />
                    </EmployeeRoute>
                  }
                />
                <Route
                  path="employee/calendar"
                  element={
                    <EmployeeRoute>
                      <EmployeeCalendar />
                    </EmployeeRoute>
                  }
                />
                <Route
                  path="employee/history"
                  element={
                    <EmployeeRoute>
                      <EmployeeHistory />
                    </EmployeeRoute>
                  }
                />
                <Route
                  path="employee/leaves"
                  element={
                    <EmployeeRoute>
                      <EmployeeLeave />
                    </EmployeeRoute>
                  }
                />
                <Route
                  path="employee/announcements"
                  element={
                    <EmployeeRoute>
                      <EmployeeAnnouncements />
                    </EmployeeRoute>
                  }
                />

                {/* HR Portal Guarded Routes */}
                <Route
                  path="hr/dashboard"
                  element={
                    <HRRoute>
                      <AdminDashboard />
                    </HRRoute>
                  }
                />
                <Route
                  path="hr/employees"
                  element={
                    <HRRoute>
                      <EmployeeDirectory />
                    </HRRoute>
                  }
                />
                <Route
                  path="hr/employees/:id"
                  element={
                    <HRRoute>
                      <EmployeeProfile />
                    </HRRoute>
                  }
                />
                <Route
                  path="hr/registry"
                  element={
                    <HRRoute>
                      <AttendanceRegistry />
                    </HRRoute>
                  }
                />
                <Route
                  path="hr/calendar"
                  element={
                    <HRRoute>
                      <AttendanceCalendar />
                    </HRRoute>
                  }
                />
                <Route
                  path="hr/leaves"
                  element={
                    <HRRoute>
                      <LeaveManagement />
                    </HRRoute>
                  }
                />
                <Route
                  path="hr/reports"
                  element={
                    <HRRoute>
                      <Reports />
                    </HRRoute>
                  }
                />
                <Route
                  path="hr/announcements"
                  element={
                    <HRRoute>
                      <AnnouncementsBoard />
                    </HRRoute>
                  }
                />
                <Route
                  path="hr/holidays"
                  element={
                    <HRRoute>
                      <HolidayManagement />
                    </HRRoute>
                  }
                />

                {/* Super Admin Portal Guarded Routes */}
                <Route
                  path="admin/dashboard"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/employees"
                  element={
                    <AdminRoute>
                      <EmployeeDirectory />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/employees/:id"
                  element={
                    <AdminRoute>
                      <EmployeeProfile />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/hrs"
                  element={
                    <AdminRoute>
                      <HRManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/registry"
                  element={
                    <AdminRoute>
                      <AttendanceRegistry />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/calendar"
                  element={
                    <AdminRoute>
                      <AttendanceCalendar />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/leaves"
                  element={
                    <AdminRoute>
                      <LeaveManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/holidays"
                  element={
                    <AdminRoute>
                      <HolidayManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/reports"
                  element={
                    <AdminRoute>
                      <Reports />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/roles"
                  element={
                    <AdminRoute>
                      <RoleManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/settings"
                  element={
                    <AdminRoute>
                      <Settings />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/activities"
                  element={
                    <AdminRoute>
                      <ActivityLogs />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/notifications"
                  element={
                    <AdminRoute>
                      <NotificationsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/announcements"
                  element={
                    <AdminRoute>
                      <AnnouncementsBoard />
                    </AdminRoute>
                  }
                />
              </Route>

              {/* Fallback redirect */}
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
