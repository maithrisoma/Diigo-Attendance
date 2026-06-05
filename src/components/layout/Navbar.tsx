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
  AlertCircle,
  Search,
  Clock
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
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const formattedDate = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Leave Approval':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'Leave Rejection':
        return <XCircle className="h-4 w-4 text-rose-500" />;
      case 'Leave Request':
        return <PlaneTakeoff className="h-4 w-4 text-orange-500" />;
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
    } else if (type === 'Leave Request') {
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

  const initials = currentUser.name.split(' ').map(n => n[0]).join('');

  return (
    <header
      className="sticky top-0 z-30 h-16 flex items-center justify-between px-6"
      style={{
        background: 'rgba(247,242,255,0.85)',
        borderBottom: '1px solid #E2E8F0',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-2 rounded-xl hover:bg-lilac-200/60 transition-colors text-lilac-600"
        >
          <Menu className="h-5 w-5" />
        </button>
        {/* Search */}
        <div className="hidden md:flex items-center relative w-72">
          <Search className="absolute left-3.5 h-4 w-4" style={{ color: '#CBD5E1' }} />
          <input
            type="text"
            placeholder="Search employees, reports…"
            className="w-full h-9 pl-10 pr-4 rounded-full text-xs font-medium placeholder:text-lilac-400 outline-none transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.80)',
              border: '1.5px solid #E2E8F0',
              color: '#0F172A',
            }}
            onFocus={e => {
              (e.target as HTMLInputElement).style.borderColor = '#2563EB';
              (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)';
            }}
            onBlur={e => {
              (e.target as HTMLInputElement).style.borderColor = '#E2E8F0';
              (e.target as HTMLInputElement).style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Clock */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: 'rgba(255,255,255,0.80)',
            border: '1.5px solid #E2E8F0',
            color: '#475569',
          }}
        >
          <Clock className="h-3.5 w-3.5" style={{ color: '#3B82F6' }} />
          <span className="font-mono" style={{ color: '#0F172A' }}>{formattedTime}</span>
          <span className="text-[10px] opacity-70">{formattedDate}</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full transition-all hover:bg-lilac-200/60 flex items-center justify-center"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          style={{ color: '#2563EB' }}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 transition-transform duration-300 hover:rotate-12 text-[#334155]" />
          ) : (
            <Sun className="h-5 w-5 transition-transform duration-300 hover:rotate-45 text-amber-400" />
          )}
        </button>

        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className={`relative p-2 rounded-full transition-all hover:bg-lilac-200/60 ${
              wiggle ? 'animate-wiggle text-primary' : ''
            }`}
            style={{ color: '#2563EB' }}
          >
            <Bell className="h-5 w-5" />
            {unreadNotificationsCount > 0 && (
              <span
                className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)' }}
              >
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
              <div
                className="absolute right-0 mt-2 w-80 rounded-2xl shadow-lilac-lg overflow-hidden z-40 animate-fadeInUp"
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1.5px solid #E2E8F0',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Header */}
                <div
                  className="px-5 py-4 flex items-center justify-between border-b"
                  style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}
                >
                  <h3 className="font-bold text-sm" style={{ color: '#0F172A' }}>Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadNotificationsCount > 0 && (
                      <span
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ background: '#F1F5F9', color: '#1D4ED8' }}
                      >
                        {unreadNotificationsCount} New
                      </span>
                    )}
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await markAllNotificationsRead();
                        }}
                        className="text-[10px] hover:underline font-bold"
                        style={{ color: '#1D4ED8' }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification Items */}
                <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: '#F1F5F9' }}>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs" style={{ color: '#60A5FA' }}>
                      No notifications available.
                    </div>
                  ) : (
                    notifications.map((not) => {
                      const isUnread = !not.is_read;
                      return (
                        <div
                          key={not.id}
                          onClick={() => handleNotificationClick(not)}
                          className="p-3 cursor-pointer transition-colors flex gap-2.5 items-start text-left hover:bg-lilac-50"
                          style={{ background: isUnread ? 'rgba(196,181,253,0.1)' : 'transparent' }}
                        >
                          <div className="mt-0.5 p-1 rounded" style={{ background: 'rgba(196,181,253,0.2)' }}>
                            {getNotificationIcon(not.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <p
                                className="text-xs leading-relaxed"
                                style={{
                                  color: '#0F172A',
                                  fontWeight: isUnread ? 'bold' : 'normal',
                                }}
                              >
                                {not.title}
                              </p>
                              {isUnread && (
                                <span
                                  className="h-1.5 w-1.5 rounded-full flex-shrink-0 mt-1.5"
                                  style={{ background: '#2563EB' }}
                                />
                              )}
                            </div>
                            <p className="text-[11px] line-clamp-2 mt-0.5" style={{ color: '#475569' }}>
                              {not.message}
                            </p>
                            <p className="text-[9px] mt-1" style={{ color: '#60A5FA' }}>
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
        <div className="h-6 w-px" style={{ background: '#E2E8F0' }} />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-lilac-200/60 transition-colors"
          >
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)' }}
            >
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold leading-none" style={{ color: '#0F172A' }}>{currentUser.name}</p>
              <p className="text-[10px] mt-0.5 capitalize" style={{ color: '#60A5FA' }}>{currentUser.role} Account</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5" style={{ color: '#CBD5E1' }} />
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)} />
              <div
                className="absolute right-0 mt-2 w-52 rounded-2xl shadow-lilac-lg overflow-hidden z-40 animate-fadeInUp"
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1.5px solid #E2E8F0',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="p-4 border-b" style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}>
                  <p className="text-xs font-bold truncate" style={{ color: '#0F172A' }}>{currentUser.name}</p>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: '#60A5FA' }}>{currentUser.email}</p>
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs" style={{ color: '#60A5FA' }}>
                    <User className="h-3.5 w-3.5" style={{ color: '#CBD5E1' }} />
                    <span>ID: {currentUser.employee_id}</span>
                  </div>
                  <button
                    onClick={() => { setShowProfileMenu(false); logout(); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-lilac-200/60 flex items-center gap-2 transition-colors"
                    style={{ color: '#1D4ED8' }}
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
