# PDF King — "Dark Refined" UI Adoption — Design Spec

**Date:** 2026-06-17
**Status:** Approved (design); pending implementation plan
**Source of truth for visuals:** [`pdf-king-design-system.md`](../../../pdf-king-design-system.md)

## Goal

Replace PDF King's current light-only / Inter / indigo UI with the **"Dark Refined"**
design system documented in `pdf-king-design-system.md` (dark-first canvas, single
crimson accent, Syne / DM Sans / JetBrains Mono typography, the "card recipe" with a
3px accent left-border + hover glow, restrained framer-motion animation).

This is a **presentation-only** overhaul. No backend, API, processor, routing, or
feature changes.

## Decisions (locked with the user)

1. **Full theming.** A `ThemeContext` driving a light/dark **mode** toggle and a
   6-option **accent** switcher (crimson default + gold/blue/purple/green/orange),
   both persisted to `localStorage`. Toggles live in the footer.
2. **framer-motion** is added as a dependency to match the doc's motion (entrance
   fade-ups, hover scale+glow, spring pills, animated progress bars) 1:1.
3. **Foundation + pattern first** rollout: build the system and shared components,
   lock the look on a few representative pages, then roll out the rest.

## Constraints / context

- **Tailwind v4** (`@tailwindcss/vite`). No `tailwind.config.js` — theme config is
  CSS-based via `@theme`. The doc's v3-style config must be adapted (see Token
  Architecture).
- Existing client uses hardcoded utility classes (`bg-white`, `text-indigo-600`,
  `text-gray-500`) and inline SVGs. There is **no CSS-var token layer today** — it
  must be introduced.
- `lucide-react`, `react-router-dom` v7, `zustand`, `@dnd-kit/*`, `pdfjs-dist` are
  already present and stay.
- 14 tool pages exist under `client/src/pages/` plus `Home`, wired in
  `client/src/App.tsx`.

## Token Architecture (the key technical decision)

The doc's tokens must switch at **runtime** when `data-mode` / `data-theme` change on
`<html>`. In Tailwind v4:

- **Chosen approach — runtime CSS vars + arbitrary values.** Define `--bg`,
  `--surface`, `--border`, `--accent`, `--accent-05..70`, `--text-1..4` in plain CSS
  blocks (`:root`, `[data-mode="light"]`, and each `[data-theme="…"]`) exactly as the
  doc specifies, and reference them in components via arbitrary values:
  `bg-[var(--surface)]`, `text-[var(--text-1)]`, `border-[var(--border)]`. Only the
  **font families** are registered in `@theme` (`--font-syne`, `--font-sans`,
  `--font-mono`) so `font-syne` / `font-mono` utilities resolve.
- **Rejected — colors in `@theme`.** v4 compiles `@theme` values to fixed output;
  they cannot switch at runtime, so live mode/accent switching would break. Not viable
  given decision #1.

### `client/src/index.css` rewrite
- Remove the Inter import and the indigo/light `@theme` color tokens.
- Add the Google Fonts import: `Syne 400;600;700;800` · `DM Sans 400;500 (+italic)` ·
  `JetBrains Mono 400;500`.
- Add `@theme { --font-syne; --font-sans; --font-mono; }`.
- Add the full token blocks from the doc §1: `:root` (dark default),
  `[data-mode="light"]`, and the six `[data-theme="…"]` accent overrides (each with its
  full `--accent-05..70` rgba ramp).
- Add `::selection` and base `html, body` (background `var(--bg)`, color `var(--text-1)`,
  `font-family: 'DM Sans'`).

## Theme System (new units)

- `client/src/theme/ThemeContext.tsx` — React context holding `mode` (`dark`|`light`)
  and `theme` (accent key). On change: set `document.documentElement` `data-mode` /
  `data-theme` and persist both to `localStorage`. Reads persisted values on init
  (default `dark` + `crimson`). Exposes accent-glow helpers derived from the active
  accent: `r0`, `r35`, `r45`, `r50` (rgba strings) for framer-motion hover shadows.
- `client/src/theme/useTheme.ts` — `useTheme()` hook; throws if used outside provider.
- `client/src/theme/accents.ts` — the accent registry (key → rgba base) so glow
  helpers and the switcher dots share one source.
- Provider wraps the app in `client/src/main.tsx`.

**Boundaries:** pages/components consume only `useTheme()`. Token values live in CSS;
the context only flips attributes + exposes glow strings.

## Shared Component Layer

New/reworked primitives under `client/src/components/` so the 14 pages don't repeat
recipes. Each is independently understandable and token-only (no raw dark hex except
`text-[#111111]` button text).

| Component | File | Purpose | Doc § |
|---|---|---|---|
| `Button` (rework) | `components/ui/Button.tsx` | primary (accent bg, `text-[#111111]`, Syne bold) + ghost; loading spinner uses accent | §4.5/4.6 |
| `Card` | `components/ui/Card.tsx` | the recipe: surface + 1px border + 3px accent left-border + hover glow (motion) | §4.1 |
| `ToolCard` | `components/ui/ToolCard.tsx` | icon container + Syne title (accent on hover) + description | §4.2 |
| `FileCard` | `components/pdf/FileCard.tsx` | horizontal file row: icon, Syne filename (truncate), mono `size · pages`, remove btn (hover red) | §4.4 |
| `Pill` | `components/ui/Pill.tsx` | tag/filter pill, spring hover | §4.7 |
| `Input` | `components/ui/Input.tsx` | token input with default/error/focus states + error/success text | §4.8 |
| `ProgressBar` | `components/ui/ProgressBar.tsx` | determinate motion bar + mono caption; indeterminate spinner variant | §4.9 |
| `StatusBadge` | `components/ui/StatusBadge.tsx` | pill badge with state dot (green/amber/red) | §4.10 |
| `EmptyState` | `components/ui/EmptyState.tsx` | icon + Syne headline + message + ghost action | §4.13 |
| `motion.ts` | `components/ui/motion.ts` | module-scope variants `HEADER_ANIM`, `cardVariants` | §5 |
| `Navbar` (rework) | `components/layout/Navbar.tsx` | frosted-on-scroll header (`bg-[var(--bg-95)] backdrop-blur` when scrolled), "PDF **King**" logo with crimson "King" | §4.11 |
| `Footer` (new) | `components/layout/Footer.tsx` | accent gradient top edge + `ThemeSwitcher` (accent dots) + `ModeToggle` (sun/moon) + mono copyright | §4.12 |
| `PageWrapper` (rework) | `components/layout/PageWrapper.tsx` | dark canvas, Syne heading, muted uppercase label, token spacing | §3 |

`UploadZone` is reworked to the doc's drop-zone recipe (§4.3): dashed token border that
lights to accent on drag-over, icon container, Syne prompt, mono hint. Its file-row
rendering is extracted into `FileCard`.

`App.tsx` shell gains the `Footer` and switches the wrapper background from `bg-[#fafafa]`
to `bg-[var(--bg)]`.

## Phasing

### Phase 1 — Foundation
- Install `framer-motion`.
- Rewrite `index.css` (tokens, fonts, base).
- Build `theme/` (context, hook, accents) and wrap app in `main.tsx`.
- Build `motion.ts` and all shared components in the table above.
- Rework `Navbar`, build `Footer`, rework `PageWrapper`, update `App.tsx` shell.
- **Checkpoint:** run the app; verify the shell renders and the footer mode/accent
  toggles switch the whole app live (dark↔light, all 6 accents).

### Phase 2 — Pattern lock
Restyle, using only the shared layer:
- **Home** — hero (`font-syne` h1 + tagline + CTA), numbered `01 Upload / 02 Tool /
  03 Download` band, `ToolCard` grid (`grid-cols-1 sm:2 lg:3 gap-6`).
- **Merge** — multi-file flow: `UploadZone` → `FileCard` list → primary CTA.
- **Split** — options form archetype: `Input` (page range) + radio/options + CTA.
- **Reorder** — restyle `SortablePageCard` (dnd-kit) to the card recipe; keep DnD logic.

These three cover every UI archetype the other pages reuse (multi-file list, options
form, drag grid).
- **Checkpoint:** run the app; review Home + the 3 pages before touching the rest.

### Phase 3 — Rollout
Apply the locked pattern to the remaining 11 pages: Compress, Unlock, Protect, Rotate,
Extract, PdfToImages, Watermark, PageNumbers, Metadata, EditPdf. Each composes existing
shared components; no new primitives expected.
- **Checkpoint:** run the app; spot-check each page renders in light + dark.

## Docs reconciliation

- `CLAUDE.md` — update the "Design System" and Font lines (currently Inter / `#FAFAFA`
  / indigo `#4F46E5`, light-only) to point at `pdf-king-design-system.md` as the single
  source of truth, so the two no longer contradict.
- `README.md` — update any design note to match.

## Out of scope (YAGNI)

- No backend / API / processor / Prisma / queue changes.
- No new tools, routes, or feature behavior.
- No changes to `pdfjs-dist` thumbnail logic beyond restyling its container.
- No new accent beyond the doc's six; no second brand hue.

## Verification

- After each phase, run the app (`npm run dev`) and confirm the actual screens render
  correctly in the **real app**, in both modes and across accents — not just a build/typecheck.
- Existing build (`npm run build -w client`) passes.

## Success criteria

- Every screen uses CSS-var tokens (no raw dark hex except `text-[#111111]`).
- Mode + accent switching works live and persists across reloads.
- Cards follow the recipe; headings/buttons are Syne, technical text is JetBrains Mono.
- All 14 tool pages + Home + shell match the "Dark Refined" language.
- `CLAUDE.md` / `README.md` no longer contradict the design system doc.
