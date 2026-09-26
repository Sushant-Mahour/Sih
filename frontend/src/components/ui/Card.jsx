import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({
  children,
  className = '',
  header,
  headerAction,
  title,
  actionSlot,
  footer,
  onClick,
  hoverable = false,
  padding = true,
  ...props
}) {
  const isClickable = Boolean(onClick) || hoverable;
  const headerContent = header || title;
  const actionContent = headerAction || actionSlot;

  return (
    <div
      onClick={onClick}
      className={twMerge(
        clsx(
          'bg-bg-elevated border border-border-subtle rounded-lg transition-all duration-150 overflow-hidden',
          isClickable && 'cursor-pointer hover:border-border-strong hover:shadow-sm',
          className
        )
      )}
      {...props}
    >
      {headerContent && (
        <div className="px-4 py-3 border-b border-border-subtle flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
          <div className="font-semibold text-text-primary text-sm tracking-tight flex items-center gap-2 min-w-0">
            {headerContent}
          </div>
          {actionContent && <div className="flex items-center gap-2 flex-shrink-0 ml-auto">{actionContent}</div>}
        </div>
      )}
      <div className={clsx(padding ? 'p-4' : '')}>{children}</div>
      {footer && (
        <div className="px-4 py-2.5 border-t border-border-subtle bg-bg-subtle/50 rounded-b-lg flex items-center justify-between text-xs text-text-secondary">
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;
