import React from 'react';
import { NavLink } from 'react-router-dom';
import diigoLogo from '../../diigo_logo.png';
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
      className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r flex flex-col transition-transform duration-300 md:translate-x-0 bg-card border-border ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand logo */}
      <div className="h-16 px-6 border-b border-border flex items-center justify-between">
        <img src={diigoLogo} alt="Diigo Logo" className="h-8 object-contain dark:brightness-110" />
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted/10 text-muted-foreground uppercase">
          v1.0
        </span>
      </div>

      {/* Profile summary in sidebar */}
      <div className="p-4 mx-4 my-3 rounded-xl border border-border flex items-center space-x-3 bg-muted/5">
        <div className="h-10 w-10 rounded-full font-bold flex items-center justify-center font-display border border-border bg-primary text-primary-foreground">
          {currentUser.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold font-display truncate text-foreground">
            {currentUser.name}
          </p>
          <p className="text-xs truncate text-muted-foreground">
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
              `flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative ${
                isActive
                  ? 'bg-secondary text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/5 hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r bg-[#334155] dark:bg-primary-foreground" />
                )}
                <link.icon className={`h-4.5 w-4.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer controls */}
      <div className="p-4 border-t border-border space-y-2">
        {isAdmin && (
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 relative ${
                isActive
                  ? 'bg-secondary text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/5 hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r bg-[#334155] dark:bg-primary-foreground" />
                )}
                <Settings className={`h-4.5 w-4.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>Settings</span>
              </>
            )}
          </NavLink>
        )}
        <button
          onClick={logout}
          className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors duration-150"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
