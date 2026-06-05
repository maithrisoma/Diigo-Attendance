import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Menu, Bell, ChevronDown, User, Search, Clock } from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { currentUser, logout } = useAuth();
  const { activities, leaveRequests } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const formattedDate = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const pendingLeavesCount = isAdmin ? leaveRequests.filter(r => r.status === 'Pending').length : 0;
  const relevantActivities = isAdmin
    ? activities.slice(0, 5)
    : activities.filter(act => act.message.includes(currentUser.name)).slice(0, 5);
  const totalNotifications = pendingLeavesCount + relevantActivities.length;
  const initials = currentUser.name.split(' ').map(n => n[0]).join('');

  return (
    <header
      className="sticky top-0 z-30 h-16 flex items-center justify-between px-6"
      style={{
        background: 'rgba(247,242,255,0.85)',
        borderBottom: '1px solid #D8B4FE',
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
          <Search className="absolute left-3.5 h-4 w-4" style={{ color: '#C4B5FD' }} />
          <input
            type="text"
            placeholder="Search employees, reports…"
            className="w-full h-9 pl-10 pr-4 rounded-full text-xs font-medium placeholder:text-lilac-400 outline-none transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.80)',
              border: '1.5px solid #D8B4FE',
              color: '#4C1D95',
            }}
            onFocus={e => {
              (e.target as HTMLInputElement).style.borderColor = '#8B5CF6';
              (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)';
            }}
            onBlur={e => {
              (e.target as HTMLInputElement).style.borderColor = '#D8B4FE';
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
            border: '1.5px solid #DDD6FE',
            color: '#6D5A9C',
          }}
        >
          <Clock className="h-3.5 w-3.5" style={{ color: '#A78BFA' }} />
          <span className="font-mono" style={{ color: '#4C1D95' }}>{formattedTime}</span>
          <span className="text-[10px] opacity-70">{formattedDate}</span>
        </div>

        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
            className="relative p-2 rounded-full transition-all hover:bg-lilac-200/60"
            style={{ color: '#8B5CF6' }}
          >
            <Bell className="h-5 w-5" />
            {totalNotifications > 0 && (
              <span
                className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#A78BFA,#7C3AED)' }}
              >
                {totalNotifications}
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
                  border: '1.5px solid #D8B4FE',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div
                  className="px-5 py-4 flex items-center justify-between border-b"
                  style={{ borderColor: '#DDD6FE', background: '#F7F2FF' }}
                >
                  <h3 className="font-bold text-sm" style={{ color: '#4C1D95' }}>Notifications</h3>
                  {totalNotifications > 0 && (
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: '#EDE9FE', color: '#7C3AED' }}
                    >
                      {totalNotifications} New
                    </span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: '#EDE9FE' }}>
                  {isAdmin && pendingLeavesCount > 0 && (
                    <div className="p-3" style={{ background: '#F2EBFF' }}>
                      <p className="text-xs font-bold" style={{ color: '#6D28D9' }}>Pending Actions</p>
                      <p className="text-xs mt-0.5" style={{ color: '#7C3AED' }}>
                        {pendingLeavesCount} leave requests need approval.
                      </p>
                    </div>
                  )}
                  {relevantActivities.length === 0 ? (
                    <div className="p-6 text-center text-xs" style={{ color: '#9879E9' }}>
                      No recent activities.
                    </div>
                  ) : (
                    relevantActivities.map(act => (
                      <div key={act.id} className="p-3 flex gap-2 hover:bg-lilac-50 transition-colors">
                        <div
                          className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: '#A78BFA' }}
                        />
                        <div>
                          <p className="text-xs leading-relaxed" style={{ color: '#4C1D95' }}>{act.message}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: '#9879E9' }}>
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

        <div className="h-6 w-px" style={{ background: '#DDD6FE' }} />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-lilac-200/60 transition-colors"
          >
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#A78BFA,#8B5CF6)' }}
            >
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold leading-none" style={{ color: '#4C1D95' }}>{currentUser.name}</p>
              <p className="text-[10px] mt-0.5 capitalize" style={{ color: '#9879E9' }}>{currentUser.role} Account</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5" style={{ color: '#C4B5FD' }} />
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)} />
              <div
                className="absolute right-0 mt-2 w-52 rounded-2xl shadow-lilac-lg overflow-hidden z-40 animate-fadeInUp"
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1.5px solid #D8B4FE',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="p-4 border-b" style={{ borderColor: '#DDD6FE', background: '#F7F2FF' }}>
                  <p className="text-xs font-bold truncate" style={{ color: '#4C1D95' }}>{currentUser.name}</p>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: '#9879E9' }}>{currentUser.email}</p>
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs" style={{ color: '#9879E9' }}>
                    <User className="h-3.5 w-3.5" style={{ color: '#C4B5FD' }} />
                    <span>ID: {currentUser.employee_id}</span>
                  </div>
                  <button
                    onClick={() => { setShowProfileMenu(false); logout(); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl hover:bg-lilac-200/60 flex items-center gap-2 transition-colors"
                    style={{ color: '#7C3AED' }}
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
