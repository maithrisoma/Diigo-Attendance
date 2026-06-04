import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface RouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<RouteProps> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return <>{children}</>;
};

export const EmployeeRoute: React.FC<RouteProps> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser?.role !== 'employee') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};
