import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-[6px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const variants = {
    primary: 'bg-accent hover:bg-accent-hover text-white border border-transparent shadow-sm',
    secondary: 'bg-bg-subtle hover:bg-bg-elevated text-text-primary border border-border-subtle hover:border-border-strong',
    outline: 'bg-transparent hover:bg-bg-subtle text-text-primary border border-border-subtle hover:border-border-strong',
    ghost: 'bg-transparent hover:bg-bg-subtle text-text-secondary hover:text-text-primary border border-transparent',
    danger: 'bg-danger hover:bg-red-700 text-white border border-transparent shadow-sm',
    dangerOutline: 'bg-transparent hover:bg-danger-bg text-danger border border-danger/40 hover:border-danger',
    success: 'bg-success hover:bg-emerald-700 text-white border border-transparent shadow-sm',
    warning: 'bg-warning hover:bg-amber-700 text-white border border-transparent shadow-sm'
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs gap-1.5 min-h-[30px]',
    md: 'px-3.5 py-1.5 text-sm gap-2 min-h-[36px]',
    lg: 'px-4 py-2 text-sm gap-2 min-h-[40px]'
  };

  return (
    <button
      type={type}
      className={twMerge(clsx(baseStyles, variants[variant] || variants.primary, sizes[size], className))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon className={clsx(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      ) : null}
      {children}
    </button>
  );
}

export default Button;
