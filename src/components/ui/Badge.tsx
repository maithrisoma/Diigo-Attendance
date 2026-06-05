import React from 'react';

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'Present'
  | 'Absent'
  | 'Leave'
  | 'Holiday'
  | 'Half Day';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; color: string; border?: string }> = {
  default:     { bg: '#2563EB', color: '#fff' },
  secondary:   { bg: '#DBEAFE', color: '#1E40AF' },
  outline:     { bg: 'transparent', color: '#2563EB', border: '2px solid #E2E8F0' },
  destructive: { bg: '#FEE2E2', color: '#B91C1C' },
  success:     { bg: '#DCFCE7', color: '#166534' },
  warning:     { bg: '#FEF3C7', color: '#D97706' },
  danger:      { bg: '#FEE2E2', color: '#B91C1C' },
  info:        { bg: '#E0F2FE', color: '#0369A1' },
  Present:     { bg: '#DCFCE7', color: '#15803D' },
  Absent:      { bg: '#FEE2E2', color: '#B91C1C' },
  Leave:       { bg: '#FEF3C7', color: '#B45309' },
  Holiday:    { bg: '#DBEAFE', color: '#1D4ED8' },
  "Half Day":{ bg: '#CFFAFE', color: '#0369A1', border: '2px solid #06B6D4' }
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
  style: styleProp,
  ...props
}) => {
  const vs = VARIANT_STYLES[variant] ?? VARIANT_STYLES.default;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${className}`}
      style={{
        background: vs.bg,
        color: vs.color,
        border: vs.border,
        ...styleProp,
      }}
      {...props}
    >
      {children}
    </span>
  );
};
