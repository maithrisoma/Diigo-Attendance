import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './components/ui/Toast';

// Layout
import { MainLayout } from './components/layout/MainLayout';
import { AdminRoute, EmployeeRoute } from './components/layout/RouteGuards';

// Pages
import { Login } from './pages/Login';

// Employee Portal Pages
import { EmployeeDashboard } from './pages/EmployeePortal/EmployeeDashboard';
import { EmployeeCalendar } from './pages/EmployeePortal/EmployeeCalendar';
import { EmployeeHistory } from './pages/EmployeePortal/EmployeeHistory';
import { EmployeeLeave } from './pages/EmployeePortal/EmployeeLeave';

// Admin Portal Pages
import { AdminDashboard } from './pages/AdminPortal/AdminDashboard';
import { EmployeeDirectory } from './pages/AdminPortal/EmployeeDirectory';
import { EmployeeProfile } from './pages/AdminPortal/EmployeeProfile';
import { AttendanceRegistry } from './pages/AdminPortal/AttendanceRegistry';
import { AttendanceCalendar } from './pages/AdminPortal/AttendanceCalendar';
import { LeaveManagement } from './pages/AdminPortal/LeaveManagement';
import { HolidayManagement } from './pages/AdminPortal/HolidayManagement';
import { Reports } from './pages/AdminPortal/Reports';
import { Settings } from './pages/AdminPortal/Settings';

// Helper component for root route redirect
const RootRedirect: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
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

                {/* Admin/HR Portal Guarded Routes */}
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
                  path="admin/settings"
                  element={
                    <AdminRoute>
                      <Settings />
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
