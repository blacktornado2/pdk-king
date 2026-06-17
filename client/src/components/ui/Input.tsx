import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', id, ...rest }: InputProps) {
  const inputId = id ?? rest.name;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-xs uppercase tracking-widest text-[var(--text-3)] mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-label={label}
        className={
          'w-full bg-[var(--bg)] rounded-lg px-4 py-3 text-[var(--text-1)] ' +
          'placeholder-[var(--text-3)] focus:outline-none transition-colors border ' +
          (error ? 'border-red-500 focus:border-red-400' : 'border-[var(--border)] focus:border-[var(--accent)]') +
          ' ' + className
        }
        {...rest}
      />
      {error
        ? <p className="text-red-400 text-xs mt-1">{error}</p>
        : hint && <p className="text-[var(--text-4)] text-xs mt-1">{hint}</p>}
    </div>
  );
}
