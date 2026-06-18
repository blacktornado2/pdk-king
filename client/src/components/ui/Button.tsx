import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  loading?: boolean;
  compact?: boolean;
}

export function Button({
  variant = 'primary', loading, compact, children, className = '', disabled, ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-syne font-bold transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ' +
    'disabled:opacity-60 disabled:cursor-not-allowed';
  const size = compact ? 'px-4 py-2 rounded-md text-sm' : 'px-6 py-3 rounded-lg text-sm';
  const variants = {
    primary: 'bg-[var(--accent)] text-[#111111] hover:bg-[var(--accent-dark)]',
    ghost:
      'border border-[var(--border)] text-[var(--text-2)] ' +
      'hover:border-[var(--accent)] hover:text-[var(--accent)]',
  };

  return (
    <button {...rest} disabled={disabled || loading}
      className={`${base} ${size} ${variants[variant]} ${className}`}>
      {loading && (
        <span className="border-2 border-[var(--border)] border-t-current rounded-full w-4 h-4 animate-spin" />
      )}
      {children}
    </button>
  );
}
