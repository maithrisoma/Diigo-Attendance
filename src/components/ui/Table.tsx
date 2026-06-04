import React from 'react';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}
interface TableSectionProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}
interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}
interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export const Table: React.FC<TableProps> = ({ children, className = '', ...props }) => {
  return (
    <div className="relative w-full overflow-auto">
      <table className={`w-full caption-bottom text-sm border-collapse bg-card ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<TableSectionProps> = ({ children, className = '', ...props }) => {
  return (
    <thead className={`border-b border-border bg-[var(--table-header-bg)] [&_tr]:border-b ${className}`} {...props}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<TableSectionProps> = ({ children, className = '', ...props }) => {
  return (
    <tbody className={`[&_tr:last-child]:border-0 bg-card ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<TableRowProps> = ({ children, className = '', ...props }) => {
  return (
    <tr
      className={`border-b border-border transition-colors hover:bg-[var(--table-row-hover-bg)] ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableHead: React.FC<TableHeadProps> = ({ children, className = '', ...props }) => {
  return (
    <th
      className={`h-12 px-4 text-left align-middle font-bold text-foreground [&:has([role=checkbox])]:pr-0 font-display ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

export const TableCell: React.FC<TableCellProps> = ({ children, className = '', ...props }) => {
  return (
    <td className={`p-4 align-middle text-foreground border-b border-border [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>
      {children}
    </td>
  );
};
