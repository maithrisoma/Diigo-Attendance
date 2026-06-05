import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div
    className={`glass-card ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`p-6 flex flex-col space-y-1.5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <h3
    className={`font-bold text-lg leading-none tracking-tight text-lilac-900 ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-lilac-600 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div
    className={`p-6 pt-0 flex items-center border-t border-lilac-300/40 mt-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);
