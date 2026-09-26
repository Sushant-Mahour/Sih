import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Table({
  headers = [],
  children,
  className = '',
  stickyFirstColumn = false
}) {
  return (
    <div className={twMerge(clsx('w-full overflow-x-auto rounded-lg border border-border-subtle bg-bg-elevated', className))}>
      <table className="w-full text-left text-sm border-collapse">
        {headers && headers.length > 0 && (
          <thead className="bg-bg-subtle text-xs font-semibold text-text-secondary border-b border-border-subtle">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={clsx(
                    'px-3.5 py-2.5 font-medium whitespace-nowrap',
                    stickyFirstColumn && i === 0 ? 'sticky left-0 bg-bg-subtle z-10' : ''
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        {headers && headers.length > 0 ? (
          <tbody className="divide-y divide-border-subtle text-text-primary text-xs">
            {children}
          </tbody>
        ) : (
          children
        )}
      </table>
    </div>
  );
}

export function TableHead({ children, className = '' }) {
  return (
    <thead className={twMerge(clsx('bg-bg-subtle text-xs font-semibold text-text-secondary border-b border-border-subtle', className))}>
      {children}
    </thead>
  );
}

export function TableHeader({ children, className = '' }) {
  return (
    <th className={twMerge(clsx('px-3.5 py-2.5 font-medium whitespace-nowrap text-xs text-text-secondary', className))}>
      {children}
    </th>
  );
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={twMerge(clsx('divide-y divide-border-subtle text-text-primary text-xs', className))}>
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className = '',
  onClick,
  selected = false
}) {
  return (
    <tr
      onClick={onClick}
      className={twMerge(
        clsx(
          'transition-colors duration-100',
          onClick && 'cursor-pointer hover:bg-bg-subtle/80',
          selected ? 'bg-accent-subtle/40' : '',
          className
        )
      )}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className = '',
  sticky = false,
  colSpan
}) {
  return (
    <td
      colSpan={colSpan}
      className={twMerge(
        clsx(
          'px-3.5 py-2.5 align-middle',
          sticky ? 'sticky left-0 bg-bg-elevated z-10' : '',
          className
        )
      )}
    >
      {children}
    </td>
  );
}

export default Table;
