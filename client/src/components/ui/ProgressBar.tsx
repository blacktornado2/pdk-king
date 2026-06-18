import { motion } from 'framer-motion';

export function ProgressBar({ pct, label }: { pct?: number; label?: string }) {
  if (pct === undefined) {
    return (
      <div className="flex items-center gap-3">
        <span className="border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full w-5 h-5 animate-spin" />
        {label && <p className="font-mono text-[11px] text-[var(--text-3)]">{label}</p>}
      </div>
    );
  }
  return (
    <div className="w-full" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
        <motion.div className="h-full bg-[var(--accent)] rounded-full"
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ ease: 'easeOut' }} />
      </div>
      {label && <p className="font-mono text-[11px] text-[var(--text-3)] mt-2">{label}</p>}
    </div>
  );
}
