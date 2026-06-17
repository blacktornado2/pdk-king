import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  Icon: LucideIcon;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Icon className="w-10 h-10 text-[var(--border)] mb-5" aria-hidden />
      <h3 className="font-syne font-bold text-lg text-[var(--text-1)] mb-2">{title}</h3>
      <p className="font-sans text-sm text-[var(--text-3)] max-w-xs mb-6">{message}</p>
      {action}
    </div>
  );
}
