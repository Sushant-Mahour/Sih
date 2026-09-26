import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Input({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-text-secondary mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-muted">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={twMerge(
            clsx(
              'w-full bg-bg-base text-text-primary placeholder-text-muted border border-border-subtle rounded-lg px-3 py-2 text-sm transition duration-150',
              'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent',
              'disabled:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-60',
              Icon && 'pl-8',
              error && 'border-danger focus:border-danger focus:ring-danger',
              className
            )
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-text-muted">{helperText}</p>}
    </div>
  );
}

export function Select({
  label,
  error,
  helperText,
  options = [],
  className = '',
  id,
  value,
  onChange,
  allowOthers = false,
  othersPlaceholder = 'Please specify custom value...',
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : undefined);
  const [customValue, setCustomValue] = useState('');

  // Check if current value is 'others'
  const isOthersSelected = value === 'others' || (allowOthers && !options.some(o => (typeof o === 'object' ? o.value : o) === value));

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          className={twMerge(
            clsx(
              'w-full bg-bg-base text-text-primary border border-border-subtle rounded-lg px-3 py-2 text-sm transition duration-150 cursor-pointer appearance-none pr-8',
              'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent',
              'disabled:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-60',
              error && 'border-danger focus:border-danger focus:ring-danger',
              className
            )
          )}
          {...props}
        >
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val} className="bg-bg-base text-text-primary">
                {lbl}
              </option>
            );
          })}
          {allowOthers && !options.some(o => (typeof o === 'object' ? o.value : o) === 'others') && (
            <option value="others" className="bg-bg-base text-text-primary font-semibold">
              Others (Specify custom...)
            </option>
          )}
        </select>
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-text-muted">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {allowOthers && isOthersSelected && (
        <div className="pt-1">
          <input
            type="text"
            placeholder={othersPlaceholder}
            value={customValue}
            onChange={(e) => {
              setCustomValue(e.target.value);
              if (props.onCustomChange) props.onCustomChange(e.target.value);
            }}
            className="w-full bg-bg-base text-text-primary placeholder-text-muted border border-accent rounded-lg px-3 py-1.5 text-xs focus:outline-none"
          />
        </div>
      )}

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-text-muted">{helperText}</p>}
    </div>
  );
}

export default Input;
