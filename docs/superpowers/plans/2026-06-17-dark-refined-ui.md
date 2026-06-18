# Dark Refined UI Adoption — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace PDF King's light/Inter/indigo UI with the "Dark Refined" design system (dark canvas, crimson accent, Syne/DM Sans/JetBrains Mono, the card recipe + framer-motion), with full light/dark + 6-accent theming.

**Architecture:** Runtime CSS-var tokens (defined in `index.css`, switched by `data-mode`/`data-theme` on `<html>`) referenced via Tailwind v4 arbitrary values. A `ThemeContext` flips those attributes, persists to localStorage, and exposes accent-glow strings for framer-motion. A shared component layer (Card, ToolCard, FileCard, Input, ResultPanel, etc.) is built once so the 14 pages compose it.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind v4 (`@tailwindcss/vite`), framer-motion (new), lucide-react, react-router v7, @dnd-kit, pdfjs-dist.

**Spec:** [`docs/superpowers/specs/2026-06-17-dark-refined-ui-design.md`](../specs/2026-06-17-dark-refined-ui-design.md). Visual source of truth: [`pdf-king-design-system.md`](../../../pdf-king-design-system.md).

## Global Constraints

- **Tokens only.** All bg/text/border use `var(--…)` via arbitrary values (`bg-[var(--surface)]`, `text-[var(--text-1)]`, `border-[var(--border)]`). The ONLY raw hex allowed is `text-[#111111]` (button text) and the hardcoded status colors `#22C55E` / `#EF4444` / `#F59E0B`.
- **Tailwind v4:** no `tailwind.config.js`. Fonts are registered in `@theme` in `index.css`; colors are plain-CSS runtime vars (NOT in `@theme`).
- **Typography:** headings/buttons/big-numbers `font-syne font-bold`; body default `font-sans` (DM Sans); technical text (filenames, sizes, page counts, %, status) `font-mono` (JetBrains Mono).
- **Card recipe (sacred):** `bg-[var(--surface)] rounded-xl border border-[var(--border)]` + `style={{ borderLeft: '3px solid var(--accent)' }}` + hover glow. Never invent new card styles.
- **Motion:** framer-motion. Variants declared at module scope in SCREAMING_SNAKE_CASE. Entrance fade-up (`y:20→0`, 0.5s); hover `scale:1.03` + accent glow.
- **react/react-dom** stay pinned to the exact same version (no caret) in `client/package.json`.
- **No backend/API/routing/feature changes.** Presentation only. Job-polling hooks, api service, dnd logic, pdfjs logic all unchanged.
- **Per-task gate:** `npm run build -w client` passes (runs `tsc -b && vite build`). Phase checkpoints additionally require visual verification in the running app (`npm run dev`), in both modes and across accents.
- After installing framer-motion, restart Vite (`vite --force`) — stale optimize-deps cache otherwise 504s.

## Verification note (read before starting)

This is a UI/design-system adoption in a client with **no test runner installed**. Per the spec, verification is the production build passing plus visual inspection of the real app. We do **not** add a test framework (YAGNI / not in spec). Each task therefore ends with a build + commit; each phase ends with a run-the-app visual checkpoint.

---

## File Structure

**Created:**
- `client/src/theme/accents.ts` — accent registry (key → rgb + dark hex + label)
- `client/src/theme/ThemeContext.tsx` — provider: mode/accent state, attribute sync, persistence, glow helpers
- `client/src/theme/useTheme.ts` — `useTheme()` hook
- `client/src/components/ui/motion.ts` — module-scope framer-motion variants
- `client/src/components/ui/Card.tsx`
- `client/src/components/ui/ToolCard.tsx`
- `client/src/components/ui/Pill.tsx`
- `client/src/components/ui/Input.tsx`
- `client/src/components/ui/ProgressBar.tsx`
- `client/src/components/ui/StatusBadge.tsx`
- `client/src/components/ui/EmptyState.tsx`
- `client/src/components/pdf/FileCard.tsx`
- `client/src/components/pdf/ResultPanel.tsx` — shared processing/done/failed block
- `client/src/components/layout/Footer.tsx` (+ inline ThemeSwitcher + ModeToggle)

**Modified:**
- `client/src/index.css` — full token rewrite
- `client/src/main.tsx` — wrap in `<ThemeProvider>`
- `client/src/App.tsx` — token shell + Footer
- `client/src/components/ui/Button.tsx`
- `client/src/components/layout/Navbar.tsx`
- `client/src/components/layout/PageWrapper.tsx`
- `client/src/components/pdf/UploadZone.tsx`
- `client/src/components/pdf/SortablePageCard.tsx`
- All 14 pages under `client/src/pages/`
- `CLAUDE.md`, `README.md` — point at the design doc

---

# PHASE 1 — FOUNDATION

## Task 1: Install framer-motion

**Files:** Modify: `client/package.json`

- [ ] **Step 1: Install**

```bash
npm install framer-motion -w client
```

- [ ] **Step 2: Verify it resolves and react stays pinned**

Run: `node -e "console.log(require('framer-motion/package.json').version)"`
Expected: prints a version (e.g. `11.x` / `12.x`).
Confirm `client/package.json` still has `react` and `react-dom` on the SAME exact version (no caret).

- [ ] **Step 3: Commit**

```bash
git add client/package.json package-lock.json
git commit -m "build: add framer-motion to client"
```

---

## Task 2: Rewrite index.css with Dark Refined tokens

**Files:** Modify: `client/src/index.css` (full replacement)

**Produces:** CSS vars consumed by every component — `--bg --bg-deep --bg-95 --surface --border --text-1..4 --accent --accent-dark --accent-05/10/20/25/30/40/70`; font utilities `font-syne`/`font-sans`/`font-mono`; `[data-mode="light"]` and six `[data-theme]` overrides.

- [ ] **Step 1: Replace the entire file**

```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');
@import "tailwindcss";

@theme {
  --font-syne: 'Syne', sans-serif;
  --font-sans: 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

:root {
  /* Accent — crimson default */
  --accent: #F43F5E; --accent-dark: #E11D48;
  --accent-05: rgba(244,63,94,0.05); --accent-10: rgba(244,63,94,0.10);
  --accent-20: rgba(244,63,94,0.20); --accent-25: rgba(244,63,94,0.25);
  --accent-30: rgba(244,63,94,0.30); --accent-40: rgba(244,63,94,0.40);
  --accent-70: rgba(244,63,94,0.70);

  /* Mode — dark default */
  --bg: #111111; --bg-deep: #0D0D0D; --bg-95: rgba(17,17,17,0.95);
  --surface: #1A1A1A; --border: #2A2A2A;
  --text-1: #FFFFFF; --text-2: #888888; --text-3: #555555; --text-4: #444444;
}

[data-mode="light"] {
  --bg: #F5F5F5; --bg-deep: #E8E8E8; --bg-95: rgba(245,245,245,0.95);
  --surface: #FFFFFF; --border: #D8D8D8;
  --text-1: #111111; --text-2: #555555; --text-3: #888888; --text-4: #AAAAAA;
}

[data-theme="crimson"] {
  --accent: #F43F5E; --accent-dark: #E11D48;
  --accent-05: rgba(244,63,94,0.05); --accent-10: rgba(244,63,94,0.10);
  --accent-20: rgba(244,63,94,0.20); --accent-25: rgba(244,63,94,0.25);
  --accent-30: rgba(244,63,94,0.30); --accent-40: rgba(244,63,94,0.40);
  --accent-70: rgba(244,63,94,0.70);
}
[data-theme="gold"] {
  --accent: #E8B84B; --accent-dark: #D4A83E;
  --accent-05: rgba(232,184,75,0.05); --accent-10: rgba(232,184,75,0.10);
  --accent-20: rgba(232,184,75,0.20); --accent-25: rgba(232,184,75,0.25);
  --accent-30: rgba(232,184,75,0.30); --accent-40: rgba(232,184,75,0.40);
  --accent-70: rgba(232,184,75,0.70);
}
[data-theme="blue"] {
  --accent: #60A5FA; --accent-dark: #3B82F6;
  --accent-05: rgba(96,165,250,0.05); --accent-10: rgba(96,165,250,0.10);
  --accent-20: rgba(96,165,250,0.20); --accent-25: rgba(96,165,250,0.25);
  --accent-30: rgba(96,165,250,0.30); --accent-40: rgba(96,165,250,0.40);
  --accent-70: rgba(96,165,250,0.70);
}
[data-theme="purple"] {
  --accent: #A78BFA; --accent-dark: #7C3AED;
  --accent-05: rgba(167,139,250,0.05); --accent-10: rgba(167,139,250,0.10);
  --accent-20: rgba(167,139,250,0.20); --accent-25: rgba(167,139,250,0.25);
  --accent-30: rgba(167,139,250,0.30); --accent-40: rgba(167,139,250,0.40);
  --accent-70: rgba(167,139,250,0.70);
}
[data-theme="green"] {
  --accent: #4ADE80; --accent-dark: #22C55E;
  --accent-05: rgba(74,222,128,0.05); --accent-10: rgba(74,222,128,0.10);
  --accent-20: rgba(74,222,128,0.20); --accent-25: rgba(74,222,128,0.25);
  --accent-30: rgba(74,222,128,0.30); --accent-40: rgba(74,222,128,0.40);
  --accent-70: rgba(74,222,128,0.70);
}
[data-theme="orange"] {
  --accent: #FB923C; --accent-dark: #F97316;
  --accent-05: rgba(251,146,60,0.05); --accent-10: rgba(251,146,60,0.10);
  --accent-20: rgba(251,146,60,0.20); --accent-25: rgba(251,146,60,0.25);
  --accent-30: rgba(251,146,60,0.30); --accent-40: rgba(251,146,60,0.40);
  --accent-70: rgba(251,146,60,0.70);
}

::selection { background-color: var(--accent); color: #fff; }

* { box-sizing: border-box; }

html, body {
  margin: 0;
  background: var(--bg);
  color: var(--text-1);
  font-family: 'DM Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 2: Build**

Run: `npm run build -w client`
Expected: PASS (no TS/CSS errors).

- [ ] **Step 3: Commit**

```bash
git add client/src/index.css
git commit -m "feat(ui): replace tokens with Dark Refined design system"
```

---

## Task 3: Accent registry

**Files:** Create: `client/src/theme/accents.ts`

**Produces:** `ACCENTS` array, `AccentKey` type, `DEFAULT_ACCENT`, `DEFAULT_MODE`.

- [ ] **Step 1: Create the file**

```ts
export type AccentKey = 'crimson' | 'gold' | 'blue' | 'purple' | 'green' | 'orange';
export type Mode = 'dark' | 'light';

export interface Accent {
  key: AccentKey;
  label: string;
  /** swatch color for the footer dot */
  swatch: string;
  /** rgb triplet used to build framer-motion glow strings */
  rgb: [number, number, number];
}

export const ACCENTS: Accent[] = [
  { key: 'crimson', label: 'Crimson', swatch: '#F43F5E', rgb: [244, 63, 94] },
  { key: 'gold',    label: 'Gold',    swatch: '#E8B84B', rgb: [232, 184, 75] },
  { key: 'blue',    label: 'Blue',    swatch: '#60A5FA', rgb: [96, 165, 250] },
  { key: 'purple',  label: 'Purple',  swatch: '#A78BFA', rgb: [167, 139, 250] },
  { key: 'green',   label: 'Green',   swatch: '#4ADE80', rgb: [74, 222, 128] },
  { key: 'orange',  label: 'Orange',  swatch: '#FB923C', rgb: [251, 146, 60] },
];

export const DEFAULT_ACCENT: AccentKey = 'crimson';
export const DEFAULT_MODE: Mode = 'dark';

export function accentByKey(key: AccentKey): Accent {
  return ACCENTS.find((a) => a.key === key) ?? ACCENTS[0];
}
```

- [ ] **Step 2: Build**

Run: `npm run build -w client`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add client/src/theme/accents.ts
git commit -m "feat(theme): add accent registry"
```

---

## Task 4: ThemeContext + useTheme + provider wiring

**Files:**
- Create: `client/src/theme/ThemeContext.tsx`, `client/src/theme/useTheme.ts`
- Modify: `client/src/main.tsx`

**Interfaces:**
- Consumes: `accents.ts` (`AccentKey`, `Mode`, `ACCENTS`, `accentByKey`, `DEFAULT_*`).
- Produces: `ThemeProvider`, `useTheme()` returning `{ mode, accent, setMode, setAccent, toggleMode, glow }` where `glow` is `{ r0: string; r35: string; r45: string; r50: string }`.

- [ ] **Step 1: Create `client/src/theme/ThemeContext.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `client/src/theme/useTheme.ts`**

```ts
import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
```

- [ ] **Step 3: Wrap the app in `client/src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './theme/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
```

- [ ] **Step 4: Build**

Run: `npm run build -w client`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/theme/ client/src/main.tsx
git commit -m "feat(theme): add ThemeContext, useTheme hook, and provider"
```

---

## Task 5: Motion variants module

**Files:** Create: `client/src/components/ui/motion.ts`

**Produces:** `HEADER_ANIM`, `cardVariants`, `FADE_UP`.

- [ ] **Step 1: Create the file**

```ts
import type { Variants } from 'framer-motion';

export const HEADER_ANIM = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};
```

- [ ] **Step 2: Build** — `npm run build -w client` → PASS.
- [ ] **Step 3: Commit**

```bash
git add client/src/components/ui/motion.ts
git commit -m "feat(ui): add module-scope motion variants"
```

---

## Task 6: Button rework

**Files:** Modify: `client/src/components/ui/Button.tsx`

**Interfaces:** Produces: `<Button variant="primary"|"ghost" loading? compact?>` (same props as today + optional `compact`). Primary = accent bg, `text-[#111111]`, Syne bold.

- [ ] **Step 1: Replace the file**

```tsx
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
```

- [ ] **Step 2: Build** — `npm run build -w client` → PASS.
- [ ] **Step 3: Commit**

```bash
git add client/src/components/ui/Button.tsx
git commit -m "feat(ui): restyle Button to Dark Refined"
```

---

## Task 7: Card primitive

**Files:** Create: `client/src/components/ui/Card.tsx`

**Interfaces:** Consumes `useTheme().glow`, `motion`. Produces: `<Card hover? index? className>` — recipe card; `hover` enables scale+glow, `index` staggers entrance.

- [ ] **Step 1: Create the file**

```tsx
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useTheme } from '../../theme/useTheme';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  index?: number;
}

export function Card({ children, className = '', hover = false, index = 0 }: CardProps) {
  const { glow } = useTheme();
  return (
    <motion.div
      className={`bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 ${className}`}
      style={{ borderLeft: '3px solid var(--accent)' }}
      custom={index}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={hover ? { scale: 1.03, boxShadow: `0 0 28px ${glow.r45}`, zIndex: 10 } : undefined}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Build** — `npm run build -w client` → PASS.
- [ ] **Step 3: Commit**

```bash
git add client/src/components/ui/Card.tsx
git commit -m "feat(ui): add Card recipe primitive"
```

---

## Task 8: ToolCard

**Files:** Create: `client/src/components/ui/ToolCard.tsx`

**Interfaces:** Consumes `useTheme().glow`, `lucide-react` icon, `react-router` `Link`. Produces: `<ToolCard to title description Icon index>`.

- [ ] **Step 1: Create the file**

```tsx
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '../../theme/useTheme';

interface ToolCardProps {
  to: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  index?: number;
}

export function ToolCard({ to, title, description, Icon, index = 0 }: ToolCardProps) {
  const { glow } = useTheme();
  return (
    <motion.div
      custom={index}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.03, boxShadow: `0 0 28px ${glow.r45}`, zIndex: 10 }}
    >
      <Link
        to={to}
        className="group flex flex-col gap-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6"
        style={{ borderLeft: '3px solid var(--accent)' }}
      >
        <div className="bg-[var(--bg)] border border-[var(--border)] p-3 rounded-lg w-fit">
          <Icon className="w-6 h-6 text-[var(--accent)]" aria-hidden />
        </div>
        <h3 className="font-syne font-bold text-xl text-[var(--text-1)] group-hover:text-[var(--accent)] transition-colors">
          {title}
        </h3>
        <p className="text-sm text-[var(--text-2)] leading-relaxed">{description}</p>
      </Link>
    </motion.div>
  );
}
```

- [ ] **Step 2: Build** — `npm run build -w client` → PASS.
- [ ] **Step 3: Commit**

```bash
git add client/src/components/ui/ToolCard.tsx
git commit -m "feat(ui): add ToolCard"
```

---

## Task 9: FileCard

**Files:** Create: `client/src/components/pdf/FileCard.tsx`

**Interfaces:** Produces: `<FileCard name meta? onRemove?>` — horizontal file row (doc §4.4). `meta` is mono text like `2.4 MB · 18 pages`.

- [ ] **Step 1: Create the file**

```tsx
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
```

- [ ] **Step 2: Build** — `npm run build -w client` → PASS.
- [ ] **Step 3: Commit**

```bash
git add client/src/components/pdf/FileCard.tsx
git commit -m "feat(ui): add FileCard row"
```

---

## Task 10: Pill + Input

**Files:** Create: `client/src/components/ui/Pill.tsx`, `client/src/components/ui/Input.tsx`

**Interfaces:** Produces `<Pill>` (tag) and `<Input label? error? hint? className>` (text/number/password input with label + error/hint). `Input` forwards all native input props.

- [ ] **Step 1: Create `Pill.tsx`**

```tsx
import type { ReactNode } from 'react';

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-2)] rounded-md px-3 py-1.5 text-sm">
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Create `Input.tsx`**

```tsx
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
```

- [ ] **Step 3: Build** — `npm run build -w client` → PASS.
- [ ] **Step 4: Commit**

```bash
git add client/src/components/ui/Pill.tsx client/src/components/ui/Input.tsx
git commit -m "feat(ui): add Pill and Input primitives"
```

---

## Task 11: ProgressBar + StatusBadge + EmptyState

**Files:** Create: `client/src/components/ui/ProgressBar.tsx`, `client/src/components/ui/StatusBadge.tsx`, `client/src/components/ui/EmptyState.tsx`

**Interfaces:**
- `<ProgressBar pct? label?>` — determinate motion bar if `pct` given, else indeterminate spinner.
- `<StatusBadge state="done"|"working"|"failed" label>`.
- `<EmptyState Icon title message action?>`.

- [ ] **Step 1: Create `ProgressBar.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `StatusBadge.tsx`**

```tsx
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
```

- [ ] **Step 3: Create `EmptyState.tsx`**

```tsx
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  Icon: LucideIcon;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Icon className="w-10 h-10 text-[var(--border)] mb-5" aria-hidden />
      <h3 className="font-syne font-bold text-lg text-[var(--text-1)] mb-2">{title}</h3>
      <p className="font-sans text-sm text-[var(--text-3)] max-w-xs mb-6">{message}</p>
      {action}
    </div>
  );
}
```

- [ ] **Step 4: Build** — `npm run build -w client` → PASS.
- [ ] **Step 5: Commit**

```bash
git add client/src/components/ui/ProgressBar.tsx client/src/components/ui/StatusBadge.tsx client/src/components/ui/EmptyState.tsx
git commit -m "feat(ui): add ProgressBar, StatusBadge, EmptyState"
```

---

## Task 12: ResultPanel (shared job-status block)

**Files:** Create: `client/src/components/pdf/ResultPanel.tsx`

**Why:** Every tool page repeats an identical processing/done/failed block. Extract it so Phase 2/3 pages drop ~40 lines each.

**Interfaces:** Consumes `Button`, `ProgressBar`, `lucide-react`. Produces:
`<ResultPanel status processingLabel doneLabel downloadUrl downloadLabel onReset resetLabel errorMsg? />`
where `status` is `'PENDING'|'PROCESSING'|'DONE'|'FAILED'`.

- [ ] **Step 1: Create the file**

```tsx
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';

type JobStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

interface ResultPanelProps {
  status: JobStatus;
  processingLabel: string;
  doneLabel: string;
  downloadUrl: string;
  downloadLabel: string;
  resetLabel: string;
  onReset: () => void;
  errorMsg?: string | null;
}

export function ResultPanel({
  status, processingLabel, doneLabel, downloadUrl, downloadLabel, resetLabel, onReset, errorMsg,
}: ResultPanelProps) {
  const processing = status === 'PENDING' || status === 'PROCESSING';
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      {processing && <ProgressBar label={processingLabel} />}

      {status === 'DONE' && (
        <>
          <CheckCircle2 className="w-12 h-12 text-[#22C55E]" aria-hidden />
          <p className="font-syne font-bold text-xl text-[var(--text-1)]">{doneLabel}</p>
          <div className="flex gap-3">
            <a href={downloadUrl}><Button>{downloadLabel}</Button></a>
            <Button variant="ghost" onClick={onReset}>{resetLabel}</Button>
          </div>
        </>
      )}

      {status === 'FAILED' && (
        <>
          <AlertCircle className="w-12 h-12 text-[#EF4444]" aria-hidden />
          <p className="font-mono text-sm text-[#EF4444]">{errorMsg ?? 'Something went wrong.'}</p>
          <Button variant="ghost" onClick={onReset}>Try again</Button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build** — `npm run build -w client` → PASS.
- [ ] **Step 3: Commit**

```bash
git add client/src/components/pdf/ResultPanel.tsx
git commit -m "feat(ui): add shared ResultPanel job-status block"
```

---

## Task 13: Navbar rework (frosted-on-scroll)

**Files:** Modify: `client/src/components/layout/Navbar.tsx`

Keep the existing `tools` array and icon-link nav. Change only styling + scroll behavior + logo.

- [ ] **Step 1: Replace the component body** (keep the imports + `tools` array exactly as they are today, then replace `export function Navbar()` through end of file with this):

```tsx
export function Navbar() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={
        'fixed top-0 left-0 w-full z-50 transition-all duration-300 ' +
        (scrolled
          ? 'bg-[var(--bg-95)] backdrop-blur-sm border-b border-[var(--border)]'
          : 'bg-transparent')
      }
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link to="/" className="font-syne font-bold text-lg text-[var(--text-1)] hover:text-[var(--accent)] transition-colors">
          PDF <span className="text-[var(--accent)]">King</span>
        </Link>
        <nav className="flex items-center gap-1">
          {tools.map((t) => {
            const Icon = t.icon;
            const active = pathname === t.path;
            return (
              <Link
                key={t.path}
                to={t.path}
                title={t.label}
                aria-label={t.label}
                className={
                  'p-2 rounded-md transition-colors ' +
                  (active
                    ? 'text-[var(--accent)] bg-[var(--accent-10)]'
                    : 'text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface)]')
                }
              >
                <Icon size={18} strokeWidth={2} aria-hidden />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Update the import line** at the top of the file to add React hooks:

Change `import { Link, useLocation } from 'react-router-dom';` to keep that line, and add directly below it:
```tsx
import { useEffect, useState } from 'react';
```

- [ ] **Step 3: Build** — `npm run build -w client` → PASS.
- [ ] **Step 4: Commit**

```bash
git add client/src/components/layout/Navbar.tsx
git commit -m "feat(ui): restyle Navbar with frosted-on-scroll header"
```

---

## Task 14: Footer with ThemeSwitcher + ModeToggle

**Files:** Create: `client/src/components/layout/Footer.tsx`

**Interfaces:** Consumes `useTheme()`, `ACCENTS`, `lucide-react` `Sun`/`Moon`.

- [ ] **Step 1: Create the file**

```tsx
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
```

- [ ] **Step 2: Build** — `npm run build -w client` → PASS.
- [ ] **Step 3: Commit**

```bash
git add client/src/components/layout/Footer.tsx
git commit -m "feat(ui): add Footer with theme + mode switchers"
```

---

## Task 15: App shell + PageWrapper rework

**Files:** Modify: `client/src/App.tsx`, `client/src/components/layout/PageWrapper.tsx`

- [ ] **Step 1: PageWrapper — replace the file**

```tsx
interface PageWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function PageWrapper({ title, description, children }: PageWrapperProps) {
  return (
    <main className="max-w-3xl mx-auto px-6 lg:px-12 pt-32 pb-24">
      <h1 className="font-syne font-bold text-4xl text-[var(--text-1)]">{title}</h1>
      <p className="mt-3 text-[var(--text-2)] text-sm leading-relaxed">{description}</p>
      <div className="mt-10">{children}</div>
    </main>
  );
}
```

- [ ] **Step 2: App.tsx — update the shell** (keep all route imports + `<Routes>` exactly; change only the wrapper div + add Footer). Add `import { Footer } from './components/layout/Footer';` with the other layout imports, then change:

```tsx
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        <Navbar />
        <div className="flex-1">
          <Routes>
            {/* ...all existing <Route> entries unchanged... */}
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
```

- [ ] **Step 3: Build** — `npm run build -w client` → PASS.
- [ ] **Step 4: Commit**

```bash
git add client/src/App.tsx client/src/components/layout/PageWrapper.tsx
git commit -m "feat(ui): token app shell + Footer + restyled PageWrapper"
```

---

## Task 16: UploadZone rework

**Files:** Modify: `client/src/components/pdf/UploadZone.tsx`

Keep the props (`multiple`, `onFiles`, `label`) and all handler logic. Add an `isDragging` state and swap to the doc's drop-zone recipe (§4.3).

- [ ] **Step 1: Replace the file**

```tsx
import { useRef, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { UploadCloud } from 'lucide-react';

interface UploadZoneProps {
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
}

export function UploadZone({ multiple = false, onFiles, label }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type === 'application/pdf');
    if (files.length) onFiles(files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = '';
  };

  const open = () => inputRef.current?.click();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload PDF"
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}
      className={
        'rounded-xl border-2 border-dashed bg-[var(--surface)] flex flex-col items-center justify-center ' +
        'text-center gap-4 py-20 px-6 transition-colors duration-200 cursor-pointer ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ' +
        (isDragging
          ? 'border-[var(--accent)] bg-[var(--accent-05)]'
          : 'border-[var(--border)] hover:border-[var(--accent-40)]')
      }
    >
      <div className="bg-[var(--bg)] border border-[var(--border)] p-4 rounded-lg">
        <UploadCloud className="w-8 h-8 text-[var(--accent)]" aria-hidden />
      </div>
      <p className="font-syne font-bold text-xl text-[var(--text-1)]">
        {label ?? (multiple ? 'Drop your PDFs here' : 'Drop your PDF here')}
      </p>
      <p className="text-sm text-[var(--text-2)]">
        or <span className="text-[var(--accent)] underline-offset-2 hover:underline">browse files</span>
      </p>
      <p className="font-mono text-[11px] text-[var(--text-4)]">PDF · up to 100 MB</p>
      <input ref={inputRef} type="file" accept="application/pdf" multiple={multiple}
        onChange={handleChange} className="hidden" />
    </div>
  );
}
```

- [ ] **Step 2: Build** — `npm run build -w client` → PASS.
- [ ] **Step 3: Commit**

```bash
git add client/src/components/pdf/UploadZone.tsx
git commit -m "feat(ui): restyle UploadZone drop zone"
```

---

## ✅ PHASE 1 CHECKPOINT (visual)

- [ ] Run `npm run dev`; open http://localhost:5173.
- [ ] Confirm: dark canvas, "PDF **King**" logo with crimson "King", frosted header on scroll, footer with 6 accent dots + sun/moon.
- [ ] Click each accent dot → whole app re-tints live. Click sun/moon → flips dark/light. Reload → both persist.
- [ ] No console errors. Commit nothing (verification only).

---

# PHASE 2 — PATTERN LOCK

## Task 17: Home page

**Files:** Modify: `client/src/pages/Home.tsx`

Replace the inline-SVG tool list with lucide icons + `ToolCard`, add hero + numbered band.

- [ ] **Step 1: Replace the file**

```tsx
import { Link } from 'react-router-dom';
import {
  Combine, Scissors, ArrowUpDown, Shrink, LockOpen, Lock, RotateCw,
  FileOutput, Images, Droplets, Hash, Info, PencilLine, type LucideIcon,
} from 'lucide-react';
import { ToolCard } from '../components/ui/ToolCard';
import { Button } from '../components/ui/Button';

const tools: { path: string; label: string; description: string; icon: LucideIcon }[] = [
  { path: '/merge', label: 'Merge PDFs', description: 'Combine multiple PDFs into one file, in any order.', icon: Combine },
  { path: '/split', label: 'Split PDF', description: 'Extract pages or split by range.', icon: Scissors },
  { path: '/reorder', label: 'Reorder Pages', description: 'Drag and drop pages into any order.', icon: ArrowUpDown },
  { path: '/compress', label: 'Compress PDF', description: 'Reduce file size without losing quality.', icon: Shrink },
  { path: '/unlock', label: 'Unlock PDF', description: 'Remove password protection from a PDF.', icon: LockOpen },
  { path: '/protect', label: 'Protect PDF', description: 'Password-protect your PDF with AES encryption.', icon: Lock },
  { path: '/rotate', label: 'Rotate Pages', description: 'Rotate pages by 90, 180, or 270°.', icon: RotateCw },
  { path: '/extract', label: 'Extract Pages', description: 'Pick specific pages and save them as a new PDF.', icon: FileOutput },
  { path: '/to-images', label: 'PDF to Images', description: 'Convert every page to JPEG or PNG, bundled as a ZIP.', icon: Images },
  { path: '/watermark', label: 'Add Watermark', description: 'Stamp diagonal text on every page.', icon: Droplets },
  { path: '/page-numbers', label: 'Add Page Numbers', description: 'Stamp page numbers at any position.', icon: Hash },
  { path: '/metadata', label: 'Metadata Editor', description: 'Edit title, author, subject, and keywords.', icon: Info },
  { path: '/edit', label: 'Edit PDF Text', description: 'Click any text and type a replacement.', icon: PencilLine },
];

const STEPS = [
  { n: '01', label: 'Upload' },
  { n: '02', label: 'Choose Tool' },
  { n: '03', label: 'Download' },
];

export function Home() {
  return (
    <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-40 pb-24">
      <section className="max-w-2xl">
        <h1 className="font-syne font-bold text-5xl lg:text-7xl leading-tight text-[var(--text-1)]">
          PDF tools that just work.
        </h1>
        <p className="mt-6 text-lg text-[var(--text-2)] leading-relaxed">
          Merge, split, reorder, compress, and unlock PDFs — fast, private, and free.
        </p>
        <div className="mt-8">
          <Link to="/merge"><Button>Get started</Button></Link>
        </div>
      </section>

      <section className="mt-20 flex flex-wrap gap-x-10 gap-y-3" aria-label="How it works">
        {STEPS.map((s) => (
          <p key={s.n} className="font-syne font-bold text-lg">
            <span className="text-[var(--accent)]">{s.n}</span>
            <span className="text-[var(--text-3)]"> — </span>
            <span className="text-[var(--text-1)]">{s.label}</span>
          </p>
        ))}
      </section>

      <section className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((t, i) => (
          <ToolCard key={t.path} to={t.path} title={t.label} description={t.description} Icon={t.icon} index={i % 3} />
        ))}
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Build** — `npm run build -w client` → PASS.
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Home.tsx
git commit -m "feat(ui): restyle Home with hero + ToolCard grid"
```

---

## Task 18: Merge page

**Files:** Modify: `client/src/pages/Merge.tsx`

Keep ALL state/handlers (`files`, `addFiles`, `removeFile`, `handleMerge`, `reset`, `useJobPolling`). Replace only the JSX: inline file rows → `FileCard`; status block → `ResultPanel`; error text → token styling.

- [ ] **Step 1: Update imports** — replace the component-import lines with:

```tsx
import { FileCard } from '../components/pdf/FileCard';
import { ResultPanel } from '../components/pdf/ResultPanel';
```
(keep `useState`, `PageWrapper`, `UploadZone`, `Button`, `useJobPolling`, `pdfApi`, `jobsApi`).

- [ ] **Step 2: Replace the `return (...)` JSX** with:

```tsx
  return (
    <PageWrapper title="Merge PDFs" description="Upload two or more PDFs to combine them into one file.">
      {!jobId && (
        <>
          <UploadZone multiple onFiles={addFiles} />

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              {files.map((f, i) => (
                <FileCard
                  key={i}
                  name={f.name}
                  meta={`${(f.size / 1024 / 1024).toFixed(1)} MB`}
                  onRemove={() => removeFile(i)}
                />
              ))}
            </div>
          )}

          {uploadError && <p className="mt-3 font-mono text-sm text-[#EF4444]">{uploadError}</p>}

          <div className="mt-8 flex gap-3">
            <Button onClick={handleMerge} disabled={files.length < 2} loading={uploading}>
              Merge {files.length > 0 ? `${files.length} PDFs` : 'PDFs'}
            </Button>
            {files.length > 0 && <Button variant="ghost" onClick={reset}>Clear</Button>}
          </div>

          {files.length === 1 && (
            <p className="mt-3 font-mono text-[11px] text-[var(--text-4)]">Add at least one more PDF to merge.</p>
          )}
        </>
      )}

      {jobId && job && (
        <ResultPanel
          status={job.status}
          processingLabel="Merging your PDFs…"
          doneLabel="Your merged PDF is ready!"
          downloadUrl={jobsApi.downloadUrl(jobId)}
          downloadLabel="Download PDF"
          resetLabel="Merge more"
          onReset={reset}
          errorMsg={job.errorMsg}
        />
      )}
    </PageWrapper>
  );
```

- [ ] **Step 3: Build** — `npm run build -w client` → PASS. (If `job.status` type mismatches `ResultPanel`'s `JobStatus`, confirm `client/src/types` job status union matches `'PENDING'|'PROCESSING'|'DONE'|'FAILED'`; they do per the schema.)
- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Merge.tsx
git commit -m "feat(ui): restyle Merge page"
```

---

## Task 19: Split page

**Files:** Modify: `client/src/pages/Split.tsx`

Keep ALL state/handlers and the `MODES` array. Replace JSX: file row → `FileCard`; mode radios → token card labels; text/number inputs → `Input`; status block → `ResultPanel`.

- [ ] **Step 1: Update imports** — add:

```tsx
import { FileCard } from '../components/pdf/FileCard';
import { ResultPanel } from '../components/pdf/ResultPanel';
import { Input } from '../components/ui/Input';
```

- [ ] **Step 2: Replace the selected-file block** (the `{!file ? <UploadZone…/> : <div…>…</div>}`) with:

```tsx
          {!file ? (
            <UploadZone onFiles={(f) => setFile(f[0])} />
          ) : (
            <FileCard
              name={file.name}
              meta={`${(file.size / 1024 / 1024).toFixed(1)} MB`}
              onRemove={() => setFile(null)}
            />
          )}
```

- [ ] **Step 3: Replace the mode-selector block** with token cards:

```tsx
          <div className="mt-8">
            <p className="text-xs uppercase tracking-widest text-[var(--text-3)] mb-3">Split mode</p>
            <div className="space-y-3">
              {MODES.map((m) => (
                <label key={m.id}
                  className={
                    'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ' +
                    (mode === m.id
                      ? 'border-[var(--accent)] bg-[var(--accent-05)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-40)]')
                  }
                  style={{ borderLeft: '3px solid var(--accent)' }}
                >
                  <input type="radio" name="mode" value={m.id} checked={mode === m.id}
                    onChange={() => setMode(m.id)} className="mt-1 accent-[var(--accent)]" />
                  <div>
                    <p className="font-syne font-bold text-[var(--text-1)]">{m.label}</p>
                    <p className="text-sm text-[var(--text-2)]">{m.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
```

- [ ] **Step 4: Replace the three input blocks** (EXTRACT/RANGES/EVERY_N) with `Input`:

```tsx
          <div className="mt-6">
            {mode === 'EXTRACT' && (
              <Input label="Page numbers" placeholder="e.g. 1, 3, 5-7, 10"
                value={pages} onChange={(e) => setPages(e.target.value)}
                hint="Separate with commas. Use hyphens for ranges." />
            )}
            {mode === 'RANGES' && (
              <Input label="Ranges (one PDF per range)" placeholder="e.g. 1-5, 6-10, 11-15"
                value={ranges} onChange={(e) => setRanges(e.target.value)}
                hint="Each range becomes a separate PDF inside the ZIP." />
            )}
            {mode === 'EVERY_N' && (
              <Input label="Pages per chunk" type="number" min={1} className="w-40"
                value={n} onChange={(e) => setN(e.target.value)}
                hint="Each chunk of this many pages becomes a PDF in the ZIP." />
            )}
          </div>
```

- [ ] **Step 5: Replace the error line + button row** with:

```tsx
          {uploadError && <p className="mt-3 font-mono text-sm text-[#EF4444]">{uploadError}</p>}

          <div className="mt-8 flex gap-3">
            <Button onClick={handleSplit} disabled={!canSubmit()} loading={uploading}>Split PDF</Button>
            {file && <Button variant="ghost" onClick={reset}>Clear</Button>}
          </div>
```

- [ ] **Step 6: Replace the `{jobId && (...)}` status block** with:

```tsx
      {jobId && job && (
        <ResultPanel
          status={job.status}
          processingLabel="Splitting your PDF…"
          doneLabel="Your file is ready!"
          downloadUrl={jobsApi.downloadUrl(jobId)}
          downloadLabel={downloadLabel}
          resetLabel="Split another"
          onReset={reset}
          errorMsg={job.errorMsg}
        />
      )}
```

- [ ] **Step 7: Build** — `npm run build -w client` → PASS.
- [ ] **Step 8: Commit**

```bash
git add client/src/pages/Split.tsx
git commit -m "feat(ui): restyle Split page"
```

---

## Task 20: SortablePageCard + Reorder page

**Files:** Modify: `client/src/components/pdf/SortablePageCard.tsx`, `client/src/pages/Reorder.tsx`

- [ ] **Step 1: SortablePageCard — replace the returned `<div>` className + label** (keep all dnd-kit logic + `style`):

```tsx
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden select-none cursor-grab active:cursor-grabbing hover:border-[var(--accent)] transition-colors"
      {...attributes}
      {...listeners}
    >
      <img src={thumbnail} alt={`Page ${pageLabel}`} className="w-full object-contain pointer-events-none" draggable={false} />
      <div className="absolute bottom-0 inset-x-0 bg-[var(--bg-95)] py-1 text-center">
        <span className="font-mono text-[11px] text-[var(--text-2)]">{pageLabel}</span>
      </div>
    </div>
```

- [ ] **Step 2: Reorder — add import** `import { ResultPanel } from '../components/pdf/ResultPanel';`

- [ ] **Step 3: Reorder — retoken the loading + meta + reset-order block:** replace the `{file && loading && (...)}` spinner with:

```tsx
          {file && loading && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full w-7 h-7 animate-spin" />
              <p className="font-mono text-[11px] text-[var(--text-3)]">Generating page previews…</p>
            </div>
          )}
```
and the thumb-error line → `<p className="font-mono text-sm text-[#EF4444] mt-4">{thumbError}</p>`, and the meta/reset row → :

```tsx
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[11px] text-[var(--text-3)]">{pageCount} pages · drag to reorder</p>
                <button onClick={() => setOrder(Array.from({ length: pageCount }, (_, i) => i))}
                  className="text-xs uppercase tracking-widest text-[var(--text-3)] hover:text-[var(--accent)] transition-colors">
                  Reset order
                </button>
              </div>
```

- [ ] **Step 4: Reorder — retoken button row** (the `uploadError` line, button row, and `isDefaultOrder` hint):

```tsx
              {uploadError && <p className="mt-3 font-mono text-sm text-[#EF4444]">{uploadError}</p>}
              <div className="mt-8 flex gap-3">
                <Button onClick={handleApply} disabled={isDefaultOrder} loading={uploading}>Apply new order</Button>
                <Button variant="ghost" onClick={reset}>Cancel</Button>
              </div>
              {isDefaultOrder && (
                <p className="mt-3 font-mono text-[11px] text-[var(--text-4)]">Move at least one page to enable apply.</p>
              )}
```

- [ ] **Step 5: Reorder — replace the `{jobId && (...)}` status block** with:

```tsx
      {jobId && job && (
        <ResultPanel
          status={job.status}
          processingLabel="Applying new page order…"
          doneLabel="Your reordered PDF is ready!"
          downloadUrl={jobsApi.downloadUrl(jobId)}
          downloadLabel="Download PDF"
          resetLabel="Reorder another"
          onReset={reset}
          errorMsg={job.errorMsg}
        />
      )}
```

- [ ] **Step 6: Build** — `npm run build -w client` → PASS.
- [ ] **Step 7: Commit**

```bash
git add client/src/pages/Reorder.tsx client/src/components/pdf/SortablePageCard.tsx
git commit -m "feat(ui): restyle Reorder page + SortablePageCard"
```

---

## ✅ PHASE 2 CHECKPOINT (visual)

- [ ] `npm run dev`. Verify Home (hero, `01/02/03` band, ToolCard grid with hover glow), Merge (drop zone, FileCard rows, ResultPanel), Split (mode cards, Input, ResultPanel), Reorder (token thumbnails, drag still works).
- [ ] Toggle light mode + 2-3 accents on each; confirm no raw-white/indigo leakage.
- [ ] **STOP for user review before Phase 3.**

---

# PHASE 3 — ROLLOUT (remaining 11 pages)

**Each Phase-3 task is the same mechanical transformation.** For the named page, read its current source, then apply this **class-translation table** and component swaps. Keep ALL state, handlers, hooks, and API calls unchanged.

**Class translation (apply to every Phase-3 page):**

| Current | Replace with |
|---|---|
| `bg-white` / `bg-gray-50` | `bg-[var(--surface)]` |
| `text-gray-900` (heading) | `text-[var(--text-1)]` + `font-syne font-bold` if a heading |
| `text-gray-700` / `text-gray-800` | `text-[var(--text-2)]` |
| `text-gray-500` / `text-gray-400` | `text-[var(--text-3)]` (or `text-[var(--text-4)]` for faint hints) |
| `border-gray-200/300` | `border-[var(--border)]` |
| `text-indigo-600` / `bg-indigo-*` / `ring-indigo-*` / `accent-indigo-600` | `…-[var(--accent)]` / `accent-[var(--accent)]` |
| `text-red-500` (error) | `font-mono text-sm text-[#EF4444]` |
| filenames / sizes / page counts / % | wrap in `font-mono` |
| uppercase mini-labels | `text-xs uppercase tracking-widest text-[var(--text-3)]` |

**Component swaps (apply where the page has the matching block):**
- Inline single/again file row → `<FileCard name meta onRemove />`.
- Any text/number/password field with a label → `<Input label hint error … />`.
- The processing/done/failed block (spinner + check + error, identical to Merge's) → `<ResultPanel status processingLabel doneLabel downloadUrl downloadLabel resetLabel onReset errorMsg />`.
- Any "no files / no results" block → `<EmptyState Icon title message action />`.
- `<button className="…bg-indigo…">` actions → `<Button>` / `<Button variant="ghost">`.

**Each task's steps are identical in shape:**
- [ ] Step 1: Read the page; add needed imports (`FileCard`, `ResultPanel`, `Input`, `Button`, `Pill`/`StatusBadge`/`EmptyState` as applicable).
- [ ] Step 2: Apply the class-translation table to every wrapper/label/text node.
- [ ] Step 3: Swap matching blocks for shared components (above).
- [ ] Step 4: Ensure the page heading goes through `PageWrapper` (already does) — no raw hex remains except `#111111`/status colors.
- [ ] Step 5: `npm run build -w client` → PASS.
- [ ] Step 6: Commit `git add client/src/pages/<Page>.tsx && git commit -m "feat(ui): restyle <Page> page"`.

Pages, with their page-specific controls to map:

- [ ] **Task 21 — Compress** (`pages/Compress.tsx`): single file → FileCard; quality radio/select options → token cards like Split's mode cards; ResultPanel ("Compressing your PDF…"). If it shows a result size, render it in `font-mono`.
- [ ] **Task 22 — Unlock** (`pages/Unlock.tsx`): single file → FileCard; password field → `<Input label="Password" type="password" />`; ResultPanel ("Unlocking your PDF…").
- [ ] **Task 23 — Protect** (`pages/Protect.tsx`): single file → FileCard; password (+ confirm) → `<Input type="password" />`, surface mismatch as `error`; ResultPanel ("Encrypting your PDF…").
- [ ] **Task 24 — Rotate** (`pages/Rotate.tsx`): single file → FileCard; rotation angle options (90/180/270) → token option cards or Pills; ResultPanel ("Rotating pages…").
- [ ] **Task 25 — Extract** (`pages/Extract.tsx`): single file → FileCard; page-range field → `<Input label="Pages" hint="e.g. 1, 4-6" />`; ResultPanel ("Extracting pages…").
- [ ] **Task 26 — PdfToImages** (`pages/PdfToImages.tsx`): single file → FileCard; format (JPEG/PNG) options → token cards/Pills; ResultPanel ("Converting to images…", download "Download ZIP").
- [ ] **Task 27 — Watermark** (`pages/Watermark.tsx`): single file → FileCard; text + opacity/position fields → `<Input>` and token option controls; ResultPanel ("Adding watermark…").
- [ ] **Task 28 — PageNumbers** (`pages/PageNumbers.tsx`): single file → FileCard; position/format fields → token controls; ResultPanel ("Adding page numbers…").
- [ ] **Task 29 — Metadata** (`pages/Metadata.tsx`): single file → FileCard; title/author/subject/keywords → four `<Input label … />`; ResultPanel ("Updating metadata…").
- [ ] **Task 30 — EditPdf** (`pages/EditPdf.tsx`): single file → FileCard; keep the pdfjs text-edit interaction logic intact, retoken only its container/overlay chrome via the translation table; ResultPanel ("Saving your edits…").

> If any page has a state/handler whose status type isn't exactly `'PENDING'|'PROCESSING'|'DONE'|'FAILED'`, do not change logic — pass `job.status` straight through; the union already matches `ResultPanel`'s `JobStatus`.

---

## ✅ PHASE 3 CHECKPOINT (visual)

- [ ] `npm run dev`; click through all 14 tool pages.
- [ ] Each renders correctly in dark + light, drop zones/inputs/result panels consistent, no indigo/gray/white leakage, no console errors.

---

# DOCS RECONCILIATION

## Task 31: Update CLAUDE.md + README

**Files:** Modify: `CLAUDE.md`, `README.md`

- [ ] **Step 1: CLAUDE.md** — in the Tech Stack table, change the Styling row note from "light-only" to reference dark-first theming. Replace the entire `## Design System` section body with a pointer:

```markdown
## Design System

The single source of truth is [`pdf-king-design-system.md`](pdf-king-design-system.md)
("Dark Refined"): dark-first canvas, single switchable accent (crimson default),
Syne / DM Sans / JetBrains Mono, the card recipe (surface + 3px accent left-border +
hover glow), framer-motion. Tokens are runtime CSS vars in `client/src/index.css`,
switched via `data-mode` / `data-theme` on `<html>` by `client/src/theme/ThemeContext`.
```

Also update the Font line under Design System (was Inter) — it's now covered by the pointer; remove the stale Inter/`#FAFAFA`/indigo bullet list.

- [ ] **Step 2: README.md** — if it has a design note, point it at `pdf-king-design-system.md` and mention framer-motion + theming in the tech table.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: point design system at Dark Refined doc"
```

---

# FINAL VERIFICATION

- [ ] `npm run build -w client` passes from clean.
- [ ] `npm run dev`; full click-through of Home + 14 pages in both modes + a couple accents; persistence across reload; no console errors.
- [ ] `grep -rn "indigo\|bg-white\|text-gray-\|#fafafa" client/src` returns nothing (except intended `#111111` / status hex). Fix any stragglers.

---

## Self-Review (completed by plan author)

- **Spec coverage:** token rewrite (T2) ✓, full theming context+toggles (T3/T4/T14) ✓, framer-motion (T1/T5) ✓, all shared components incl. Footer (T6–T16) ✓, foundation→pattern→rollout phasing ✓, Home+3 archetype pages (T17–T20) ✓, remaining 11 pages (T21–T30) ✓, docs reconciliation (T31) ✓, verification = build + run-app ✓, out-of-scope respected (no backend/api/logic changes) ✓.
- **Placeholder scan:** none — Phase-3 tasks give a concrete translation table + component-swap recipe + per-page control mapping rather than vague directives.
- **Type consistency:** `ResultPanel` `JobStatus` matches the Prisma `JobStatus` union used by `useJobPolling`; `useTheme().glow` (`r0/r35/r45/r50`) consumed by Card/ToolCard; `AccentKey`/`Mode` shared from `accents.ts` across context + Footer.
