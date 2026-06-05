import React from 'react';

// ── Generic data-driven Table ─────────────────────────────────────────────────
interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableDataProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
  emptyMessage?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  className = '',
  emptyMessage = 'No data available',
}: TableDataProps<T>) {
  return (
    <div className={`overflow-hidden rounded-2xl border shadow-lilac-sm ${className}`} style={{ borderColor: 'rgba(216,180,254,0.5)' }}>
      <div className="overflow-x-auto">
        <table className="w-full table-lilac">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className={col.className || ''}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-sm" style={{ color: '#C4B5FD' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={String(col.key)}>
                      {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Named sub-components (used by existing pages) ─────────────────────────────

interface BaseProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const TableHeader: React.FC<BaseProps> = ({ children, className = '', ...props }) => (
  <thead className={className} {...props}>{children}</thead>
);

export const TableBody: React.FC<BaseProps> = ({ children, className = '', ...props }) => (
  <tbody className={className} {...props}>{children}</tbody>
);

export const TableRow: React.FC<BaseProps> = ({ children, className = '', ...props }) => (
  <tr
    className={`transition-colors hover:bg-[rgba(196,181,253,0.10)] border-b ${className}`}
    style={{ borderColor: 'rgba(216,180,254,0.25)' }}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<BaseProps> = ({ children, className = '', ...props }) => (
  <th
    className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${className}`}
    style={{ color: '#4C1D95', background: 'linear-gradient(135deg, #F2EBFF, #EDE9FE)', borderBottom: '1.5px solid #D8B4FE' }}
    {...props}
  >
    {children}
  </th>
);

export const TableCell: React.FC<BaseProps & { colSpan?: number }> = ({ children, className = '', colSpan, ...props }) => (
  <td
    className={`px-4 py-3 text-sm ${className}`}
    style={{ color: '#4C1D95' }}
    colSpan={colSpan}
    {...props}
  >
    {children}
  </td>
);

// ── Wrapper table element for use with named sub-components ───────────────────
export const TableWrapper: React.FC<BaseProps> = ({ children, className = '', ...props }) => (
  <div className={`overflow-hidden rounded-2xl border shadow-lilac-sm ${className}`} style={{ borderColor: 'rgba(216,180,254,0.5)' }}>
    <div className="overflow-x-auto">
      <table className="w-full table-lilac" {...props}>{children}</table>
    </div>
  </div>
);
