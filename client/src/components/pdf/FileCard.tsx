import { FileText, X } from 'lucide-react';

interface FileCardProps {
  name: string;
  meta?: string;
  onRemove?: () => void;
}

export function FileCard({ name, meta, onRemove }: FileCardProps) {
  return (
    <div
      className="flex items-center gap-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4"
      style={{ borderLeft: '3px solid var(--accent)' }}
    >
      <div className="bg-[var(--bg)] border border-[var(--border)] p-3 rounded-lg">
        <FileText className="w-5 h-5 text-[var(--accent)]" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-syne font-bold text-[var(--text-1)] truncate">{name}</p>
        {meta && <p className="font-mono text-[11px] text-[var(--text-3)]">{meta}</p>}
      </div>
      {onRemove && (
        <button onClick={onRemove} aria-label={`Remove ${name}`}
          className="text-[var(--text-3)] hover:text-[#EF4444] transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
