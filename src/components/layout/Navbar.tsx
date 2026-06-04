import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Menu, Bell, ChevronDown, Check, User, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/Button';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { currentUser, logout } = useAuth();
  const { activities, leaveRequests } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  
  // Calculate notifications
  // For admin: number of pending leave requests + recent activities
  // For employee: recent activities involving them
  const pendingLeavesCount = isAdmin
    ? leaveRequests.filter((r) => r.status === 'Pending').length
    : 0;
  
  const relevantActivities = isAdmin
    ? activities.slice(0, 5)
    : activities
        .filter((act) => act.message.includes(currentUser.name))
        .slice(0, 5);

  const totalNotifications = pendingLeavesCount + relevantActivities.length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-card text-card-foreground border-b border-border flex items-center justify-between px-6 shadow-sm">
      {/* Left side: Mobile menu toggle & page title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-muted-foreground hover:text-foreground focus:outline-none md:hidden p-1.5 rounded-lg hover:bg-muted/10 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

      </div>

      {/* Right side: Notifications & User profile */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-full transition-all focus:outline-none flex items-center justify-center"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 transition-transform duration-300 hover:rotate-12 text-[#7B337E]" />
          ) : (
            <Sun className="h-5 w-5 transition-transform duration-300 hover:rotate-45 text-[#F5D5E0]" />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-full transition-all focus:outline-none"
          >
            <Bell className="h-5 w-5" />
            {totalNotifications > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-card animate-bounce">
                {totalNotifications}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-card text-card-foreground border border-border rounded-xl shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/5">
                  <h3 className="font-semibold text-sm font-display text-foreground">Notifications</h3>
                  {totalNotifications > 0 && (
                    <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                      {totalNotifications} New
                    </span>
                  )}
                </div>
                
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {isAdmin && pendingLeavesCount > 0 && (
                    <div className="p-3 bg-amber-500/10 hover:bg-amber-500/15 transition-colors">
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Pending Actions</p>
                      <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                        There are {pendingLeavesCount} pending leave requests requiring approval.
                      </p>
                    </div>
                  )}

                  {relevantActivities.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No recent activities.
                    </div>
                  ) : (
                    relevantActivities.map((act) => (
                      <div key={act.id} className="p-3 hover:bg-muted/10 transition-colors flex gap-2">
                        <div className="mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground font-medium leading-relaxed">
                            {act.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-border" />

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2 p-1.5 hover:bg-muted/10 rounded-lg transition-colors focus:outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center font-display border border-primary/20 text-sm shadow-inner">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-foreground leading-none">{currentUser.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{currentUser.role} Account</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-card text-card-foreground border border-border rounded-xl shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="p-3 border-b border-border bg-muted/5">
                  <p className="text-xs font-semibold text-foreground truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{currentUser.email}</p>
                </div>
                <div className="p-1">
                  <div className="flex items-center space-x-2 px-3 py-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>ID: {currentUser.employee_id}</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-500/10 rounded-lg font-medium flex items-center space-x-2"
                  >
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
