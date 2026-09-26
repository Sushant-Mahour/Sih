import React from 'react';
import { clsx } from 'clsx';
import { Card } from './Card';
import { Skeleton } from './Skeleton';

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  loading = false,
  className = ''
}) {
  const displayValue = value === null || value === undefined ? '—' : value;

  return (
    <Card className={clsx('p-4 border-border-subtle bg-bg-elevated', className)}>
      <div className="space-y-1">
        <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-text-muted truncate">
          {title}
        </p>

        <div className="flex items-baseline gap-2 pt-1">
          {loading ? (
            <Skeleton width="60px" height="28px" />
          ) : (
            <span className="text-[28px] font-semibold text-text-primary tracking-tight leading-none">
              {displayValue}
            </span>
          )}

          {trend && !loading && (
            <span
              className={clsx(
                'text-xs font-medium px-1.5 py-0.5 rounded-[4px]',
                trend.isPositive
                  ? 'bg-success-bg text-success'
                  : 'bg-danger-bg text-danger'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.text}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-[13px] text-text-secondary pt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
}

export default StatCard;
