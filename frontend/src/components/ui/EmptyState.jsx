import React from 'react';
import { FileQuestion } from 'lucide-react';

export function EmptyState({
  icon: Icon = FileQuestion,
  title = 'No records found',
  description = 'There are no items to display matching the current criteria.',
  action,
  className = ''
}) {
  return (
    <div className={`p-8 text-center flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-bg-subtle/30 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-bg-subtle flex items-center justify-center text-text-muted mb-3 border border-border-subtle">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-text-primary mb-1">{title}</h4>
      <p className="text-xs text-text-muted max-w-sm mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export default EmptyState;
