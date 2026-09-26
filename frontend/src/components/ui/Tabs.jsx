import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  variant = 'pill' // 'pill' | 'underline'
}) {
  if (variant === 'underline') {
    return (
      <div className={twMerge(clsx('flex items-center gap-4 border-b border-border-subtle', className))}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 py-2.5 px-1 text-xs font-medium border-b-2 transition-colors cursor-pointer select-none',
                isActive
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={clsx(
                    'px-1.5 py-0.2 rounded text-[10px] font-semibold',
                    isActive ? 'bg-accent text-white' : 'bg-bg-subtle text-text-muted border border-border-subtle'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 p-1 bg-bg-subtle border border-border-subtle rounded-lg',
          className
        )
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer select-none',
              isActive
                ? 'bg-bg-elevated text-accent font-semibold shadow-sm border border-border-subtle'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded text-[10px] font-semibold',
                  isActive
                    ? 'bg-accent-subtle text-accent'
                    : 'bg-bg-base text-text-muted border border-border-subtle'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
