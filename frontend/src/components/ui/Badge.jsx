import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  pulsing = false,
  className = '',
  ...props
}) {
  const variants = {
    default: 'bg-bg-subtle text-text-secondary border border-border-subtle',
    primary: 'bg-accent-subtle text-accent border border-accent/20',
    safe: 'bg-success-bg text-success border border-success/30',
    success: 'bg-success-bg text-success border border-success/30',
    warning: 'bg-warning-bg text-warning border border-warning/30',
    danger: 'bg-danger-bg text-danger border border-danger/30',
    emergency: 'bg-danger text-white font-semibold',
    neutral: 'bg-bg-subtle text-text-muted border border-border-subtle'
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[11px] font-medium leading-none',
    md: 'px-2 py-0.5 text-xs font-medium leading-normal',
    lg: 'px-2.5 py-1 text-xs font-semibold'
  };

  const normalizedVariant = ['low', 'safe', 'clear'].includes(variant)
    ? 'safe'
    : ['moderate', 'warning', 'restricted', 'caution_zone'].includes(variant)
    ? 'warning'
    : ['high', 'critical', 'danger', 'flooded', 'blocked'].includes(variant)
    ? 'danger'
    : variants[variant] ? variant : 'default';

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-[4px] font-medium',
          variants[normalizedVariant] || variants.default,
          sizes[size],
          className
        )
      )}
      {...props}
    >
      {pulsing && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 live-dot flex-shrink-0" />
      )}
      {children}
    </span>
  );
}

export function StatusPill({ status, label, className = '' }) {
  const statusMap = {
    in_transit: { variant: 'primary', text: 'In Transit', pulse: true },
    caution_zone: { variant: 'warning', text: 'Caution Zone', pulse: false },
    delayed: { variant: 'warning', text: 'Delayed', pulse: false },
    idle: { variant: 'neutral', text: 'Idle / Staging', pulse: false },
    delivered: { variant: 'success', text: 'Delivered', pulse: false },
    rerouted: { variant: 'warning', text: 'Rerouted', pulse: false },
    reported: { variant: 'warning', text: 'Reported', pulse: false },
    verified: { variant: 'primary', text: 'Verified', pulse: false },
    crew_dispatched: { variant: 'primary', text: 'Crew Dispatched', pulse: false },
    resolved: { variant: 'success', text: 'Resolved', pulse: false },
    clear: { variant: 'success', text: 'Clear', pulse: false },
    flooded: { variant: 'danger', text: 'Flooded', pulse: true },
    blocked: { variant: 'danger', text: 'Blocked', pulse: false },
    restricted: { variant: 'warning', text: 'Restricted', pulse: false }
  };

  const config = statusMap[status] || {
    variant: 'default',
    text: label || status?.replace('_', ' ') || 'Unknown',
    pulse: false
  };

  return (
    <Badge variant={config.variant} size="sm" pulsing={config.pulse} className={className}>
      {label || config.text}
    </Badge>
  );
}

export default Badge;
