import React from 'react';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus-visible:ring-rose-500';
      case 'outline':
        return 'border border-border bg-transparent text-foreground hover:bg-muted/10 focus-visible:ring-ring';
      case 'secondary':
        return 'bg-secondary text-secondary-foreground hover:opacity-90 shadow-sm focus-visible:ring-secondary';
      case 'ghost':
        return 'hover:bg-muted/10 hover:text-foreground text-muted-foreground';
      case 'link':
        return 'text-primary underline-offset-4 hover:underline bg-transparent border-transparent p-0 shadow-none';
      case 'default':
      default:
        return 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm focus-visible:ring-ring';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-9 px-3 text-xs rounded-md';
      case 'lg':
        return 'h-11 px-8 text-base rounded-md';
      case 'icon':
        return 'h-10 w-10 p-0 rounded-md justify-center';
      case 'default':
      default:
        return 'h-10 px-4 py-2 text-sm rounded-md';
    }
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] ${getVariantClasses()} ${getSizeClasses()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
