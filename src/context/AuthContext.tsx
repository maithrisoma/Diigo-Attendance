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
    // Simple password validation for demo: "password" or anything matches for mock
    // If the user inputs a specific seed password, we can check it
    if (!password) {
      return { success: false, message: 'Password is required' };
    }

    // Retrieve active employees from localStorage or fallback to seed
    const storedEmployees = localStorage.getItem('employees');
    const employees: Employee[] = storedEmployees ? JSON.parse(storedEmployees) : INITIAL_EMPLOYEES;

    const normalizedInput = emailOrId.toLowerCase().trim();
    const user = employees.find(
      (emp) =>
        emp.email.toLowerCase() === normalizedInput ||
        emp.employee_id.toLowerCase() === normalizedInput
    );

    if (!user) {
      return { success: false, message: 'Invalid Employee ID or Email' };
    }

    // Accept "password" as the mock password for all accounts
    if (password !== 'password') {
      return { success: false, message: 'Incorrect password. Try using "password".' };
    }

    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    return { success: true, message: 'Login successful' };
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  const forgotPassword = async (emailOrId: string): Promise<{ success: boolean; message: string }> => {
    const storedEmployees = localStorage.getItem('employees');
    const employees: Employee[] = storedEmployees ? JSON.parse(storedEmployees) : INITIAL_EMPLOYEES;

    const normalizedInput = emailOrId.toLowerCase().trim();
    const user = employees.find(
      (emp) =>
        emp.email.toLowerCase() === normalizedInput ||
        emp.employee_id.toLowerCase() === normalizedInput
    );

    if (!user) {
      return { success: false, message: 'User not found in registry' };
    }

    return { 
      success: true, 
      message: `Password reset instructions have been sent to ${user.email}. (Demo note: password is "password")` 
    };
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
