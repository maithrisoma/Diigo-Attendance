import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Menu,
  Bell,
  ChevronDown,
  Check,
  User,
  Sun,
  Moon,
  Megaphone,
  PlaneTakeoff,
  CalendarCheck,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { currentUser, logout } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;
  const [prevUnreadCount, setPrevUnreadCount] = useState(unreadNotificationsCount);
  const [wiggle, setWiggle] = useState(false);

  useEffect(() => {
    if (unreadNotificationsCount > prevUnreadCount) {
      setWiggle(true);
      const t = setTimeout(() => setWiggle(false), 600);
      return () => clearTimeout(t);
    }
    setPrevUnreadCount(unreadNotificationsCount);
  }, [unreadNotificationsCount, prevUnreadCount]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (!localStorage.getItem('theme-reset-v2')) {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('theme-reset-v2', 'true');
      return 'light';
    }
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Leave Approval':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'Leave Rejection':
        return <XCircle className="h-4 w-4 text-rose-500" />;
      case 'Holiday Notice':
        return <CalendarCheck className="h-4 w-4 text-blue-500" />;
      case 'New Announcement':
      case 'Policy Update':
      case 'Holiday Announcement':
        return <Megaphone className="h-4 w-4 text-indigo-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  const handleNotificationClick = async (not: any) => {
    setShowNotifications(false);
    if (!not.is_read) {
      await markNotificationRead(not.id);
    }

    const role = currentUser?.role;
    const type = not.type;

    if (type === 'Leave Approval' || type === 'Leave Rejection') {
      if (role === 'admin') navigate('/admin/leaves');
      else if (role === 'hr') navigate('/hr/leaves');
      else navigate('/employee/leaves');
    } else if (type === 'Holiday Notice') {
      if (role === 'admin') navigate('/admin/holidays');
      else if (role === 'hr') navigate('/hr/holidays');
      else navigate('/employee/calendar');
    } else {
      // Announcements
      if (role === 'admin') navigate('/admin/announcements');
      else if (role === 'hr') navigate('/hr/announcements');
      else navigate('/employee/announcements');
    }
  };

  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-30 h-16 bg-card text-card-foreground border-b border-border flex items-center justify-between px-6 shadow-sm">
      {/* Left side: Mobile menu toggle */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-muted-foreground hover:text-foreground focus:outline-none md:hidden p-1.5 rounded-lg hover:bg-muted/10 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right side: Themes, Notifications, Profile */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-full transition-all focus:outline-none flex items-center justify-center"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 transition-transform duration-300 hover:rotate-12 text-[#334155]" />
          ) : (
            <Sun className="h-5 w-5 transition-transform duration-300 hover:rotate-45 text-amber-400" />
          )}
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className={`relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-full transition-all focus:outline-none ${
              wiggle ? 'animate-wiggle text-primary' : ''
            }`}
          >
            <Bell className="h-5 w-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-card animate-bounce">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Dropdown Container */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-card text-card-foreground border border-border rounded-xl shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/5">
                  <h3 className="font-semibold text-sm font-display text-foreground">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadNotificationsCount > 0 && (
                      <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                        {unreadNotificationsCount} New
                      </span>
                    )}
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await markAllNotificationsRead();
                        }}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification Items */}
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      No notifications available.
                    </div>
                  ) : (
                    notifications.map((not) => {
                      const isUnread = !not.is_read;
                      return (
                        <div
                          key={not.id}
                          onClick={() => handleNotificationClick(not)}
                          className={`p-3 hover:bg-muted/10 cursor-pointer transition-colors flex gap-2.5 items-start text-left ${
                            isUnread ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="mt-0.5 p-1 bg-muted/10 rounded">
                            {getNotificationIcon(not.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <p className={`text-xs leading-relaxed ${
                                isUnread ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'
                              }`}>
                                {not.title}
                              </p>
                              {isUnread && (
                                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                              {not.message}
                            </p>
                            <p className="text-[9px] text-muted-foreground/80 mt-1">
                              {new Date(not.created_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2 p-1.5 hover:bg-muted/10 rounded-lg transition-colors focus:outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center font-display border border-primary/20 text-sm shadow-inner">
              {currentUser.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-foreground leading-none">{currentUser.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{currentUser.role} Account</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {/* Dropdown Menu */}
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
