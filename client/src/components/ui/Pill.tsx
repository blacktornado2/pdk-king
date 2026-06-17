import type { ReactNode } from 'react';

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-2)] rounded-md px-3 py-1.5 text-sm">
      {children}
    </span>
  );
}
