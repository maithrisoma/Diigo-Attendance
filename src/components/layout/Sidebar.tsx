import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  CalendarDays,
  FileText,
  TrendingUp,
  Settings,
  LogOut,
  Clock,
  PlaneTakeoff,
  CalendarCheck,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/employees', label: 'Employees', icon: Users },
    { to: '/admin/registry', label: 'Attendance Registry', icon: ClipboardList },
    { to: '/admin/calendar', label: 'Attendance Calendar', icon: CalendarDays },
    { to: '/admin/leaves', label: 'Leave Management', icon: FileText },
    { to: '/admin/holidays', label: 'Holiday Management', icon: CalendarCheck },
    { to: '/admin/reports', label: 'Attendance Reports', icon: TrendingUp },
  ];

  const employeeLinks = [
    { to: '/employee/dashboard', label: 'Dashboard',          icon: LayoutDashboard },
    { to: '/employee/calendar',  label: 'Attendance Calendar',icon: Calendar },
    { to: '/employee/history',   label: 'Attendance History', icon: Clock },
    { to: '/employee/leaves',    label: 'Leave Requests',     icon: PlaneTakeoff },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r flex flex-col transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        color: 'var(--sidebar-text)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Brand logo */}
      <div className="h-16 px-6 border-b border-white/10 flex items-center space-x-2.5">
        <div 
          className="h-9 w-9 rounded-lg flex items-center justify-center shadow-sm"
          style={{ backgroundColor: 'var(--sidebar-active-bg)', color: 'var(--sidebar-text)' }}
        >
          <Clock className="h-5 w-5" />
        </div>
        <span className="font-bold text-lg font-display tracking-tight" style={{ color: 'var(--sidebar-text)' }}>
          DAttendance
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'var(--sidebar-text)' }}>
          v1.0
        </span>
      </div>

      {/* Profile summary in sidebar */}
      <div className="p-4 mx-4 my-3 rounded-xl border border-white/10 flex items-center space-x-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--sidebar-text)' }}>
        <div 
          className="h-10 w-10 rounded-full font-bold flex items-center justify-center font-display border"
          style={{ 
            backgroundColor: 'var(--sidebar-active-bg)', 
            borderColor: 'rgba(255, 255, 255, 0.25)',
            color: 'var(--sidebar-text)'
          }}
        >
          {currentUser.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold font-display truncate" style={{ color: 'var(--sidebar-text)' }}>
            {currentUser.name}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)', opacity: 0.7 }}>
            {currentUser.designation}
          </p>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'shadow-sm translate-x-1'
                  : 'opacity-80'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
              color: 'var(--sidebar-text)'
            })}
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              if (!target.classList.contains('active') && !target.style.backgroundColor) {
                target.style.backgroundColor = 'var(--sidebar-hover)';
              }
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              if (!target.classList.contains('active')) {
                // If NavLink is active, standard class style will handle it
                const isAct = target.getAttribute('class')?.includes('shadow-sm');
                target.style.backgroundColor = isAct ? 'var(--sidebar-active-bg)' : 'transparent';
              }
            }}
          >
            <link.icon className="h-4.5 w-4.5" style={{ color: 'var(--sidebar-text)' }} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer controls */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {isAdmin && (
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'shadow-sm'
                  : 'opacity-80 hover:bg-white/10'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: 'var(--sidebar-text)'
            })}
          >
            <Settings className="h-4.5 w-4.5" style={{ color: 'var(--sidebar-text)' }} />
            <span>Settings</span>
          </NavLink>
        )}
        <button
          onClick={logout}
          className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-rose-200 hover:bg-rose-950/30 transition-colors duration-150"
        >
          <LogOut className="h-4.5 w-4.5" style={{ color: 'var(--sidebar-text)' }} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
