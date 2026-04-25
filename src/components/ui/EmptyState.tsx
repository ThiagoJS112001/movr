import type { ElementType, ReactNode } from 'react';

interface EmptyStateProps {
  icon: ElementType;
  message: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Standardized empty state — centered icon + message + optional description + optional CTA.
 * Matches the pattern used in PersonalDashboard and throughout the app.
 */
export default function EmptyState({ icon: Icon, message, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 gap-3 text-center">
      <Icon size={36} className="opacity-30" />
      <div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>
        {description && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
