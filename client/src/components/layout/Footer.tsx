import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../theme/useTheme';
import { ACCENTS } from '../../theme/accents';

export function Footer() {
  const { mode, accent, setAccent, toggleMode } = useTheme();
  return (
    <footer className="bg-[var(--bg-deep)] border-t border-[var(--border)] mt-24">
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-40)] to-transparent" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <p className="font-mono text-[11px] text-[var(--text-4)]">
          © {new Date().getFullYear()} PDF King
        </p>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2" role="group" aria-label="Accent color">
            {ACCENTS.map((a) => (
              <button
                key={a.key}
                onClick={() => setAccent(a.key)}
                aria-label={a.label}
                aria-pressed={accent === a.key}
                className={
                  'w-4 h-4 rounded-full transition-transform hover:scale-125 ' +
                  (accent === a.key ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-deep)] ring-[var(--text-2)]' : '')
                }
                style={{ backgroundColor: a.swatch }}
              />
            ))}
          </div>
          <button
            onClick={toggleMode}
            aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="text-[var(--text-2)] hover:text-[var(--accent)] transition-colors"
          >
            {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </footer>
  );
}
