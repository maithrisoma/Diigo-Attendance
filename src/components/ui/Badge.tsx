import React from 'react';

type BadgeVariant = 
  | 'default' 
  | 'secondary' 
  | 'outline' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'pending'
  | 'Present'
  | 'Absent'
  | 'Leave'
  | 'Half Day'
  | 'Holiday'
  | 'Weekend';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '', ...props }) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
      case 'Present':
        return 'bg-[var(--calendar-present-bg)] text-[var(--calendar-present-text)] border-[var(--calendar-present-border)] hover:opacity-90';
      case 'danger':
      case 'Absent':
        return 'bg-[var(--calendar-absent-bg)] text-[var(--calendar-absent-text)] border-[var(--calendar-absent-border)] hover:opacity-90';
      case 'warning':
      case 'Leave':
        return 'bg-[var(--calendar-leave-bg)] text-[var(--calendar-leave-text)] border-[var(--calendar-leave-border)] hover:opacity-90';
      case 'pending':
      case 'Half Day':
        return 'bg-[var(--calendar-halfday-bg)] text-[var(--calendar-halfday-text)] border-[var(--calendar-halfday-border)] hover:opacity-90';
      case 'info':
      case 'Holiday':
        return 'bg-[var(--calendar-holiday-bg)] text-[var(--calendar-holiday-text)] border-[var(--calendar-holiday-border)] hover:opacity-90';
      case 'secondary':
      case 'outline':
      case 'Weekend':
        return 'bg-[var(--calendar-weekend-bg)] text-[var(--calendar-weekend-text)] border-[var(--calendar-weekend-border)] hover:opacity-90';
      case 'default':
      default:
        return 'bg-primary text-primary-foreground border-transparent hover:opacity-90';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-150 ${getVariantClasses()} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
