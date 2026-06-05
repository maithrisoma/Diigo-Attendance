import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-lilac-800 tracking-wide uppercase"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-lilac w-full h-11 px-4 text-sm ${error ? 'border-lilac-700 bg-lilac-50' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs font-medium text-lilac-700 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-lilac-600 inline-block" />
          {error}
        </p>
      )}
    </div>
  );
};
