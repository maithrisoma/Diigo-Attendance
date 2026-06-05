import React from 'react';

type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
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
  const base =
    'inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] ripple';

  const variants: Record<ButtonVariant, string> = {
    default:
      'bg-gradient-to-r from-lilac-500 to-lilac-600 text-white shadow-lilac hover:from-lilac-600 hover:to-lilac-700 hover:shadow-lilac-lg rounded-full',
    destructive:
      'bg-gradient-to-r from-lilac-700 to-lilac-900 text-white shadow-lilac hover:from-lilac-800 hover:to-lilac-900 rounded-full',
    outline:
      'border-2 border-lilac-400 bg-white/80 text-lilac-900 hover:bg-lilac-100 hover:border-lilac-500 rounded-full',
    secondary:
      'bg-lilac-200 text-lilac-900 hover:bg-lilac-300 rounded-full shadow-lilac-sm',
    ghost:
      'hover:bg-lilac-100 text-lilac-700 hover:text-lilac-900 rounded-xl',
    link:
      'text-lilac-600 underline-offset-4 hover:underline bg-transparent border-transparent p-0 shadow-none rounded-none',
  };

  const sizes: Record<ButtonSize, string> = {
    default: 'h-10 px-5 py-2 text-sm',
    sm:      'h-8 px-4 text-xs',
    lg:      'h-12 px-8 text-base',
    icon:    'h-10 w-10 p-0 rounded-full',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
