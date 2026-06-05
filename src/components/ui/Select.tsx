import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  children,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-lilac-800 tracking-wide uppercase"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`input-lilac w-full h-11 px-4 text-sm appearance-none cursor-pointer ${className}`}
        {...props}
      >
        {options
          ? options.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      {error && (
        <p className="text-xs font-medium" style={{ color: '#7C3AED' }}>{error}</p>
      )}
    </div>
  );
};
