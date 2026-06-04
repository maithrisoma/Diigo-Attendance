import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee } from '../types';
import { INITIAL_EMPLOYEES } from '../utils/mockData';

interface AuthContextType {
  currentUser: Employee | null;
  isAuthenticated: boolean;
  login: (emailOrId: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  forgotPassword: (emailOrId: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (emailOrId: string, password: string): Promise<{ success: boolean; message: string }> => {
    if (!password) {
      return { success: false, message: 'Password is required' };
    }

    try {
      const savedEmployees = localStorage.getItem('employees');
      const employeesList: Employee[] = savedEmployees ? JSON.parse(savedEmployees) : INITIAL_EMPLOYEES;

      const user = employeesList.find(
        e => e.email.toLowerCase() === emailOrId.toLowerCase() || e.employee_id.toLowerCase() === emailOrId.toLowerCase()
      );

      if (user) {
        if (password === 'password') {
          localStorage.setItem('currentUser', JSON.stringify(user));
          setCurrentUser(user);
          return { success: true, message: 'Login successful' };
        } else {
          return { success: false, message: 'Invalid credentials. Password is "password"' };
        }
      }
      return { success: false, message: 'Employee not found.' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Failed to authenticate locally.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  const forgotPassword = async (emailOrId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const savedEmployees = localStorage.getItem('employees');
      const employeesList: Employee[] = savedEmployees ? JSON.parse(savedEmployees) : INITIAL_EMPLOYEES;

      const user = employeesList.find(
        e => e.email.toLowerCase() === emailOrId.toLowerCase() || e.employee_id.toLowerCase() === emailOrId.toLowerCase()
      );

      if (user) {
        return { success: true, message: `Password reset instructions sent to ${user.email}.` };
      }
      return { success: false, message: 'Employee not found.' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Failed to process request.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
        forgotPassword,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
