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
        return 'bg-[var(--calendar-present-bg)] text-[#8EB69B] border-[#8EB69B]/40 hover:opacity-90';
      case 'danger':
      case 'Absent':
        return 'bg-[var(--calendar-absent-bg)] text-[#E88B8B] border-[#E88B8B]/40 hover:opacity-90';
      case 'warning':
      case 'Leave':
        return 'bg-[var(--calendar-leave-bg)] text-[#F3C969] border-[#F3C969]/40 hover:opacity-90';
      case 'pending':
      case 'Half Day':
        return 'bg-[var(--calendar-leave-bg)]/80 text-[#F3C969] border-[#F3C969]/30 hover:opacity-90';
      case 'info':
      case 'Holiday':
        return 'bg-[var(--calendar-holiday-bg)] text-[#87B5FF] border-[#87B5FF]/40 hover:opacity-90';
      case 'secondary':
      case 'outline':
      case 'Weekend':
        return 'bg-[var(--calendar-weekend-bg)] text-[#94A3B8] border-[#CFCFCF]/40 hover:opacity-90';
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
