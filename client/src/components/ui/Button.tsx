import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  loading?: boolean;
}

export function Button({ variant = 'primary', loading, children, className = '', disabled, ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5',
  };

  return (
    <button {...rest} disabled={disabled || loading} className={`${base} ${variants[variant]} ${className}`}>
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
        </svg>
      )}
      {children}
    </button>
  );
}
