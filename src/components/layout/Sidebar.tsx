import React from 'react';
import { NavLink } from 'react-router-dom';
import diigoLogo from '../../diigo_logo.png';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  FileText,
  TrendingUp,
  Settings,
  LogOut,
  Clock,
  PlaneTakeoff,
  BarChart3,
  CreditCard,
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
    { to: '/admin/dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/admin/registry',   label: 'Attendance',      icon: ClipboardList },
    { to: '/admin/employees',  label: 'Employees',       icon: Users },
    { to: '/admin/leaves',     label: 'Leave Mgmt',      icon: FileText },
    { to: '/admin/analytics',  label: 'Analytics',       icon: BarChart3 },
    { to: '/admin/reports',    label: 'Reports',         icon: TrendingUp },
    { to: '/admin/payroll',    label: 'Payroll',         icon: CreditCard },
    { to: '/admin/settings',   label: 'Settings',        icon: Settings },
  ];

  const employeeLinks = [
    { to: '/employee/dashboard', label: 'Dashboard',         icon: LayoutDashboard },
    { to: '/employee/calendar',  label: 'Calendar',          icon: Calendar },
    { to: '/employee/history',   label: 'History',           icon: Clock },
    { to: '/employee/leaves',    label: 'Leave Requests',    icon: PlaneTakeoff },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;
  const initials = currentUser.name.split(' ').map(n => n[0]).join('');

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand */}
      <div
        className="h-16 px-5 flex items-center justify-between border-b"
        style={{ borderColor: 'var(--lilac-border)' }}
      >
        <img src={diigoLogo} alt="Diigo Logo" className="h-9 object-contain" />
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
          style={{ background: '#DDD6FE', color: '#4C1D95' }}
        >
          HRMS
        </span>
      </div>

      {/* Profile card */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
          style={{ background: 'rgba(196,181,253,0.18)', borderColor: 'var(--lilac-border)' }}
        >
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
              color: '#fff',
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: '#4C1D95' }}>
              {currentUser.name}
            </p>
            <p className="text-[11px] truncate" style={{ color: '#6D5A9C' }}>
              {currentUser.designation}
            </p>
          </div>
        </div>
      </div>

      {/* Nav label */}
      <p
        className="px-6 pt-2 pb-1 text-[10px] font-bold tracking-widest uppercase"
        style={{ color: '#C4B5FD' }}
      >
        Navigation
      </p>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
                isActive
                  ? 'nav-active-glow'
                  : ''
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'linear-gradient(135deg, rgba(167,139,250,0.22), rgba(139,92,246,0.18))' : 'transparent',
              color: isActive ? '#7C3AED' : '#6D5A9C',
              border: isActive ? '1.5px solid rgba(196,181,253,0.5)' : '1.5px solid transparent',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full"
                    style={{ background: 'linear-gradient(180deg, #A78BFA, #8B5CF6)' }}
                  />
                )}
                <link.icon
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: isActive ? '#8B5CF6' : '#9879E9' }}
                />
                <span>{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div
        className="p-4 border-t"
        style={{ borderColor: 'var(--lilac-border)' }}
      >
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-lilac-200/60"
          style={{ color: '#6D5A9C' }}
        >
          <LogOut className="h-4 w-4" style={{ color: '#A78BFA' }} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
