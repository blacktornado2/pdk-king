import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Icon/button rendered inside the field on the right (e.g. show/hide password toggle). */
  trailingIcon?: ReactNode;
}

export function Input({ label, error, hint, trailingIcon, className = '', id, ...rest }: InputProps) {
  const inputId = id ?? rest.name;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-xs uppercase tracking-widest text-[var(--text-3)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          aria-label={label}
          className={
            'w-full bg-[var(--bg)] rounded-lg px-4 py-3 text-[var(--text-1)] ' +
            (trailingIcon ? 'pr-11 ' : '') +
            'placeholder-[var(--text-3)] focus:outline-none transition-colors border ' +
            (error ? 'border-red-500 focus:border-red-400' : 'border-[var(--border)] focus:border-[var(--accent)]') +
            ' ' + className
          }
          {...rest}
        />
        {trailingIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">{trailingIcon}</div>
        )}
      </div>
      {error
        ? <p className="text-red-400 text-xs mt-1">{error}</p>
        : hint && <p className="text-[var(--text-4)] text-xs mt-1">{hint}</p>}
    </div>
  );
}
