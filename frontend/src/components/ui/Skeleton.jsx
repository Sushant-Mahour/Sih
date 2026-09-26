import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Skeleton({ className = '', variant = 'text', width, height }) {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  return (
    <div
      style={{ width, height }}
      className={twMerge(
        clsx(
          'animate-pulse bg-border-subtle/70',
          variants[variant] || variants.text,
          className
        )
      )}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-4 rounded-lg border border-border-subtle bg-bg-elevated space-y-3">
      <Skeleton width="40%" height="12px" />
      <Skeleton width="60%" height="28px" />
      <Skeleton width="50%" height="12px" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full space-y-2 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="flex-1" height="24px" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
