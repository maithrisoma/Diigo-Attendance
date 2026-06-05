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
  default:     { bg: '#A78BFA', color: '#fff' },
  secondary:   { bg: '#EDE9FE', color: '#6D28D9' },
  outline:     { bg: 'transparent', color: '#7C3AED', border: '2px solid #D8B4FE' },
  destructive: { bg: '#DDD6FE', color: '#4C1D95' },
  success:     { bg: '#EDE9FE', color: '#6D28D9' },   // lilac-toned "success"
  warning:     { bg: '#DDD6FE', color: '#7C3AED' },   // lilac-toned "warning"
  danger:      { bg: '#F2EBFF', color: '#9879E9' },   // lilac-toned "danger"
  info:        { bg: '#EDE9FE', color: '#8B5CF6' },   // lilac-toned "info"
  Present:     { bg: '#EDE9FE', color: '#6D28D9' },
  Absent:      { bg: '#F2EBFF', color: '#9879E9' },
  Leave:       { bg: '#DDD6FE', color: '#7C3AED' },
  Holiday:    { bg: '#C4B5FD', color: '#4C1D95' },
  "Half Day":{ bg: '#EDE9FE', color: '#5B21B6', border: '2px solid #D8B4FE' }
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
