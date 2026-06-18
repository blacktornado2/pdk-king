import { createContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ACCENTS, accentByKey, DEFAULT_ACCENT, DEFAULT_MODE,
  type AccentKey, type Mode,
} from './accents';

export interface Glow { r0: string; r35: string; r45: string; r50: string; }

export interface ThemeValue {
  mode: Mode;
  accent: AccentKey;
  setMode: (m: Mode) => void;
  setAccent: (a: AccentKey) => void;
  toggleMode: () => void;
  glow: Glow;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeValue | null>(null);

const MODE_KEY = 'pdfking.mode';
const ACCENT_KEY = 'pdfking.accent';

function readMode(): Mode {
  const v = localStorage.getItem(MODE_KEY);
  return v === 'light' || v === 'dark' ? v : DEFAULT_MODE;
}
function readAccent(): AccentKey {
  const v = localStorage.getItem(ACCENT_KEY);
  return ACCENTS.some((a) => a.key === v) ? (v as AccentKey) : DEFAULT_ACCENT;
}
function makeGlow(accent: AccentKey): Glow {
  const [r, g, b] = accentByKey(accent).rgb;
  return {
    r0: `rgba(${r},${g},${b},0)`,
    r35: `rgba(${r},${g},${b},0.35)`,
    r45: `rgba(${r},${g},${b},0.45)`,
    r50: `rgba(${r},${g},${b},0.5)`,
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(readMode);
  const [accent, setAccent] = useState<AccentKey>(readAccent);

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', accent);
    localStorage.setItem(ACCENT_KEY, accent);
  }, [accent]);

  const value = useMemo<ThemeValue>(() => ({
    mode, accent, setMode, setAccent,
    toggleMode: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
    glow: makeGlow(accent),
  }), [mode, accent]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
