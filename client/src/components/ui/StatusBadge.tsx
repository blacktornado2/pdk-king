type State = 'done' | 'working' | 'failed';
const DOT: Record<State, string> = {
  done: 'bg-[#22C55E] animate-pulse',
  working: 'bg-[#F59E0B]',
  failed: 'bg-[#EF4444]',
};

export function StatusBadge({ state, label }: { state: State; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-2)]">
      <span className={`w-2 h-2 rounded-full ${DOT[state]}`} />
      {label}
    </span>
  );
}
