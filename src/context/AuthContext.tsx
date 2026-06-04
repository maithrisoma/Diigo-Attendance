import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee } from '../types';

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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrId, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        setCurrentUser(data.user);
        return { success: true, message: data.message || 'Login successful' };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Server is currently offline or unreachable.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  const forgotPassword = async (emailOrId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrId }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Failed to process forgot password request.' };
      }
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Server is currently offline or unreachable.' };
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
