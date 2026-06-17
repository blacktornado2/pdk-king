# PDF King — Design System ("Dark Refined")

> Single source of truth for PDF King's UI. Adapted from the "Dark Refined" language used in Ankit Bhardwaj's portfolio: dark-first, single warm accent (crimson), Syne display + DM Sans body + JetBrains Mono for technical text, surface cards with a 3px accent left-border and an accent glow on hover. Hand this file to Claude or any design tool when building new screens.

## 0. Design DNA (read first)

PDF King should feel like a **precise, premium tool** — calm dark canvas, one accent, generous spacing, restrained motion. Five rules carry 90% of the look:

1. **Dark canvas, one accent.** Background is near-black; crimson (`--accent`) is the *only* saturated brand colour. Use it sparingly — headings stay white, body stays grey.
2. **Everything is a token.** Never hardcode `#111`, `#1A1A1A`, `#2A2A2A`. Use CSS vars so light mode + accent theming work for free.
3. **The card recipe is sacred.** Surface bg + 1px border + 3px accent left-border + accent glow on hover. Don't invent new card styles.
4. **Syne for anything bold** (headings, buttons, numbers), DM Sans for body, JetBrains Mono for anything technical (filenames, sizes, page counts, status, %).
5. **Motion is subtle and consistent.** Fade-up on entrance (`y:20→0`, 0.5s), `scale:1.03` + glow on hover. Nothing bounces except pills.

---

## 1. Color Tokens

Drop this into your global CSS (e.g. `src/index.css`). Same token system as the portfolio so the two apps feel related; **crimson is the default accent.**

```css
:root {
  /* Accent — crimson default (theme-switchable) */
  --accent:      #F43F5E;
  --accent-dark: #E11D48;
  --accent-05:   rgba(244,63,94,0.05);
  --accent-10:   rgba(244,63,94,0.10);
  --accent-20:   rgba(244,63,94,0.20);
  --accent-25:   rgba(244,63,94,0.25);
  --accent-30:   rgba(244,63,94,0.30);
  --accent-40:   rgba(244,63,94,0.40);
  --accent-70:   rgba(244,63,94,0.70);

  /* Mode (dark default) */
  --bg:       #111111;  /* page background */
  --bg-deep:  #0D0D0D;  /* footer / deepest layer */
  --bg-95:    rgba(17,17,17,0.95); /* frosted toolbar */
  --surface:  #1A1A1A;  /* cards, panels, drop zone */
  --border:   #2A2A2A;  /* all borders */
  --text-1:   #FFFFFF;  /* headings, active */
  --text-2:   #888888;  /* body, labels */
  --text-3:   #555555;  /* placeholder, quiet meta */
  --text-4:   #444444;  /* faintest — copyright, hints */
}

[data-mode="light"] {
  --bg: #F5F5F5; --bg-deep: #E8E8E8; --bg-95: rgba(245,245,245,0.95);
  --surface: #FFFFFF; --border: #D8D8D8;
  --text-1: #111111; --text-2: #555555; --text-3: #888888; --text-4: #AAAAAA;
}

/* Optional accent themes — swap [data-theme="..."] on <html> */
[data-theme="gold"] {
  --accent:#E8B84B; --accent-dark:#D4A83E;
  --accent-05:rgba(232,184,75,0.05); --accent-10:rgba(232,184,75,0.10);
  --accent-20:rgba(232,184,75,0.20); --accent-25:rgba(232,184,75,0.25);
  --accent-30:rgba(232,184,75,0.30); --accent-40:rgba(232,184,75,0.40);
  --accent-70:rgba(232,184,75,0.70);
}
[data-theme="blue"]   { --accent:#60A5FA; --accent-dark:#3B82F6; /* + 05..70 at rgba(96,165,250,x) */ }
[data-theme="purple"] { --accent:#A78BFA; --accent-dark:#7C3AED; /* rgba(167,139,250,x) */ }
[data-theme="green"]  { --accent:#4ADE80; --accent-dark:#22C55E; /* rgba(74,222,128,x) */ }
[data-theme="orange"] { --accent:#FB923C; --accent-dark:#F97316; /* rgba(251,146,60,x) */ }

::selection { background-color: var(--accent); color: #fff; }
html, body { background: var(--bg); color: var(--text-1); font-family: 'DM Sans', sans-serif; }
```

### Semantic / status colours (hardcoded — not theme-dependent)

| Hex | Use in PDF King |
|---|---|
| `#22C55E` | Success — "Converted", "Done", upload-complete pulse dot |
| `#EF4444` | Error — failed file, validation, delete-destructive |
| `#F59E0B` | Warning — large file, "processing may be slow" |
| `#111111` | Button text on accent (`text-[#111111]`) — stays dark in both modes |

### Mode switching

Set `data-mode="dark"` (default) or `data-mode="light"` on `<html>`, and `data-theme="..."` for the accent. Persist both to `localStorage`. The `[data-mode="light"]` selector overrides all mode vars; `[data-theme]` overrides all accent vars.

---

## 2. Typography

Load (Google Fonts):

```
Syne: 400,600,700,800 · DM Sans: 400,500 (+italic) · JetBrains Mono: 400,500
```

```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');
```

| Role | Family | Tailwind |
|---|---|---|
| Display / headings / buttons / big numbers | Syne | `font-syne` |
| Body / UI text | DM Sans | `font-sans` (default) |
| Filenames, sizes, page counts, status, code | JetBrains Mono | `font-mono` |

Scale:

| Usage | Classes |
|---|---|
| Hero / landing h1 | `font-syne font-bold text-5xl lg:text-7xl leading-tight` |
| Page / section heading | `font-syne font-bold text-4xl lg:text-5xl` |
| Tool card title | `font-syne font-bold text-xl` |
| Panel sub-heading | `font-syne font-bold text-3xl` |
| Body | `text-sm leading-relaxed` (default) / `text-lg leading-relaxed` (intro) |
| Muted label | `text-xs uppercase tracking-widest text-[var(--text-3)]` |
| File meta (size · pages) | `font-mono text-[11px] text-[var(--text-3)]` |
| Button | `font-syne font-bold text-sm` |

Tailwind config (`tailwind.config.js`):

```js
theme: { extend: { fontFamily: {
  syne: ['"Syne"','sans-serif'],
  sans: ['"DM Sans"','sans-serif'],
  mono: ['"JetBrains Mono"','monospace'],
}}}
```

### Numbered-heading pattern

The portfolio numbers sections `01 — About`. PDF King can do the same for a tool catalogue or onboarding flow:

```
01 — Upload    02 — Choose Tool    03 — Download
```

Number in `text-[var(--accent)]`, em-dash, label in `text-[var(--text-1)]`, all `font-syne font-bold`.

---

## 3. Spacing & Layout

- Max content width: `max-w-7xl` (1280px), centered
- Horizontal padding: `px-6 lg:px-12`
- Section vertical padding: `py-24` (never below `py-16`)
- Heading bottom margin: `mb-16`
- Tool grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
- File list / two-col: `grid grid-cols-1 md:grid-cols-2 gap-6`

Radius:

| Element | Radius |
|---|---|
| Cards, panels, drop zone | `rounded-xl` |
| Primary button | `rounded-lg` |
| Pills, tags, inputs, icon containers | `rounded-md` |
| Status badge / avatar | `rounded-full` |

---

## 4. Component Patterns

### 4.1 The Card (universal recipe)

Use for tool cards, file rows, result cards — everything.

```jsx
<motion.div
  className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6"
  style={{ borderLeft: "3px solid var(--accent)" }}
  initial={{ boxShadow: `0 0 0px ${theme.r0}` }}
  whileHover={{ scale: 1.03, boxShadow: `0 0 28px ${theme.r45}`, zIndex: 10 }}
  transition={{ duration: 0.2 }}
>
```

- Title: `font-syne font-bold text-[var(--text-1)] text-xl`
- Body: `text-[var(--text-2)] text-sm leading-relaxed`
- Inner divider: `border-t border-[var(--border)] pt-4` (never `<hr>`)

> `theme.r0`/`r45` are accent-glow rgba strings from your theme context (see §8). If you skip theming, hardcode `0 0 28px rgba(244,63,94,0.45)`.

### 4.2 Tool Card (PDF King's signature element)

A grid card for each operation (Merge, Split, Compress, Convert, Sign, etc.). Card recipe + icon container + title + one-line description.

```jsx
<motion.div className="group bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6
                       flex flex-col gap-4 cursor-pointer"
  style={{ borderLeft: "3px solid var(--accent)" }}
  whileHover={{ scale: 1.03, boxShadow: `0 0 28px ${theme.r45}` }}>
  <div className="bg-[var(--bg)] border border-[var(--border)] p-3 rounded-lg w-fit">
    <Merge className="w-6 h-6 text-[var(--accent)]" aria-hidden />
  </div>
  <h3 className="font-syne font-bold text-xl text-[var(--text-1)]
                 group-hover:text-[var(--accent)] transition-colors">Merge PDFs</h3>
  <p className="text-sm text-[var(--text-2)] leading-relaxed">
    Combine multiple PDFs into one file, in any order.
  </p>
</motion.div>
```

### 4.3 Upload / Drop Zone (hero interaction)

The most important screen. A large dashed surface that lights up on drag-over.

```jsx
<div className={cn(
  "rounded-xl border-2 border-dashed bg-[var(--surface)]",
  "flex flex-col items-center justify-center text-center gap-4 py-20 px-6",
  "transition-colors duration-200",
  isDragging
    ? "border-[var(--accent)] bg-[var(--accent-05)]"
    : "border-[var(--border)] hover:border-[var(--accent-40)]"
)}>
  <div className="bg-[var(--bg)] border border-[var(--border)] p-4 rounded-lg">
    <UploadCloud className="w-8 h-8 text-[var(--accent)]" aria-hidden />
  </div>
  <p className="font-syne font-bold text-xl text-[var(--text-1)]">
    Drop your PDF here
  </p>
  <p className="text-sm text-[var(--text-2)]">
    or <span className="text-[var(--accent)] underline-offset-2 hover:underline cursor-pointer">browse files</span>
  </p>
  <p className="font-mono text-[11px] text-[var(--text-4)]">PDF · up to 100 MB</p>
</div>
```

### 4.4 File Card / Row (a queued or uploaded file)

Card recipe, horizontal. Filename in Syne, size/pages in mono, a remove button.

```jsx
<div className="flex items-center gap-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4"
     style={{ borderLeft: "3px solid var(--accent)" }}>
  <div className="bg-[var(--bg)] border border-[var(--border)] p-3 rounded-lg">
    <FileText className="w-5 h-5 text-[var(--accent)]" aria-hidden />
  </div>
  <div className="flex-1 min-w-0">
    <p className="font-syne font-bold text-[var(--text-1)] truncate">report-final.pdf</p>
    <p className="font-mono text-[11px] text-[var(--text-3)]">2.4 MB · 18 pages</p>
  </div>
  <button className="text-[var(--text-3)] hover:text-[#EF4444] transition-colors">
    <X className="w-4 h-4" />
  </button>
</div>
```

### 4.5 Primary Button (CTA — "Merge", "Download", "Convert")

```
font-syne font-bold bg-[var(--accent)] text-[#111111] px-6 py-3 rounded-lg
hover:bg-[var(--accent-dark)] transition-colors
disabled:opacity-60 disabled:cursor-not-allowed
```

Button text is **always** `text-[#111111]` (dark in both modes). Compact toolbar variant: `px-4 py-2 rounded-md text-sm`.

### 4.6 Secondary / Ghost Button

```
border border-[var(--border)] text-[var(--text-2)] px-6 py-3 rounded-lg
hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors
```

### 4.7 Tag / Pill (file type, "PDF", "DOCX", filters)

```
inline-flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--border)]
text-[var(--text-2)] rounded-md px-3 py-1.5 text-sm
```

Interactive pill hover (spring):
```js
whileHover={{ scale: 1.1, boxShadow: `0 0 14px ${theme.r45}`, borderColor: theme.r50 }}
transition={{ type: "spring", stiffness: 400, damping: 25 }}
```

### 4.8 Form Input (filename, page range, password)

```
w-full bg-[var(--bg)] border rounded-lg px-4 py-3
text-[var(--text-1)] placeholder-[var(--text-3)]
focus:outline-none transition-colors
default: border-[var(--border)] focus:border-[var(--accent)]
error:   border-red-500 focus:border-red-400
```

Error text: `text-red-400 text-xs mt-1`. Success: `text-green-400 text-sm`.

### 4.9 Progress / Processing State

```jsx
{/* Determinate bar */}
<div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
  <motion.div className="h-full bg-[var(--accent)] rounded-full"
    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
    transition={{ ease: "easeOut" }} />
</div>
<p className="font-mono text-[11px] text-[var(--text-3)] mt-2">Compressing… {pct}%</p>
```

Indeterminate spinner: `border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full w-5 h-5 animate-spin`.

### 4.10 Status Badge

```
inline-flex items-center gap-2 px-3 py-1 rounded-full
bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-2)]
```

Dot inside reflects state: `bg-[#22C55E] animate-pulse` (done) / `bg-[#F59E0B]` (working) / `bg-[#EF4444]` (failed).

### 4.11 Top Toolbar / Header

```
fixed top-0 left-0 w-full z-50 transition-all duration-300
scrolled:    bg-[var(--bg-95)] backdrop-blur-sm border-b border-[var(--border)]
transparent: bg-transparent
```

Logo: `font-syne font-bold text-[var(--text-1)] text-lg hover:text-[var(--accent)]` → render "PDF **King**" with "King" (or a crown glyph) in `text-[var(--accent)]`. Theme/mode toggles live in the **footer**, not the header (keeps the toolbar focused on tools).

Optional upload/scroll progress bar inside header: `absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)] origin-left` driven by motion `scaleX`.

### 4.12 Footer

```
bg-[var(--bg-deep)] border-t border-[var(--border)]
```

Accent gradient on the top edge:
```jsx
<div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-40)] to-transparent" />
```

Bottom row holds **ThemeSwitcher** (accent dots) + **ModeToggle** (sun/moon). Copyright in `font-mono text-[11px] text-[var(--text-4)]`.

### 4.13 Empty State (no files yet / no results)

```
flex flex-col items-center justify-center py-24 text-center
```

- Icon: 40×40, `text-[var(--border)]`, `mb-5`
- Headline: `font-syne font-bold text-lg text-[var(--text-1)] mb-2`
- Message: `font-sans text-sm text-[var(--text-3)] max-w-xs mb-6`
- Action: ghost button (§4.6)

---

## 5. Motion

Declare all variants at **module scope** in `SCREAMING_SNAKE_CASE`. Reuse these everywhere:

```js
export const HEADER_ANIM = {
  initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 },
  viewport: { once: true }, transition: { duration: 0.5 },
};
export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } }),
};
```

| Element | whileHover |
|---|---|
| Tool / file card | `{ scale: 1.03, boxShadow: \`0 0 28px ${theme.r45}\` }` |
| Content card | `{ scale: 1.03, boxShadow: \`0 0 24px ${theme.r35}\` }` |
| Pill | `{ scale: 1.1, boxShadow: \`0 0 14px ${theme.r45}\`, borderColor: theme.r50 }` (spring) |

Defaults: entrance `duration: 0.5`, hover `duration: 0.2–0.3`, stagger `0.1s` per card. Keep it restrained — this is a productivity tool, not a showcase.

---

## 6. Iconography

`lucide-react` for everything: `UploadCloud, FileText, Merge, Scissors (split), Minimize2 (compress), RefreshCw (convert), Lock, Unlock, PenTool (sign), Download, Trash2, X, Check`. Sizes: `w-6 h-6` (tool card header), `w-5 h-5` (file rows), `w-4 h-4` (buttons/pills). Icon colour in cards: `text-[var(--accent)]`. Always `aria-hidden` on decorative icons.

---

## 7. Accessibility

- Sections: `<section aria-labelledby="…">` + matching `<h2 id>`
- Drop zone: keyboard-focusable, `role="button"`, `aria-label="Upload PDF"`, Enter/Space triggers file picker
- Every input has `aria-label`; progress bars use `role="progressbar"` + `aria-valuenow`
- Live region (`aria-live="polite"`) announces "File converted", "Upload failed"
- Visible focus ring: `focus-visible:ring-2 focus-visible:ring-[var(--accent)]`

---

## 8. Theming Context (optional but recommended)

Mirror the portfolio's `ThemeContext`: store `mode` (`dark`/`light`) on `<html data-mode>` and `theme` (accent) on `<html data-theme>`, persist to `localStorage`. Expose glow helpers so hover shadows track the accent:

```js
// derived from current accent (crimson default)
r0:  "rgba(244,63,94,0)"
r35: "rgba(244,63,94,0.35)"
r45: "rgba(244,63,94,0.45)"
r50: "rgba(244,63,94,0.50)"
```

If you don't need multi-accent theming on day one, hardcode the crimson rgba values and skip the context — the rest of the system works unchanged.

---

## 9. Rules for New Screens

1. Use CSS vars for **all** bg/text/border — never raw dark hex (except `text-[#111111]` button text).
2. Cards use the recipe: surface + border + 3px accent left-border + glow on hover. Don't invent new card styles.
3. Headings & buttons: `font-syne font-bold`. Body: DM Sans. Anything technical (filename, size, %, status): `font-mono`.
4. Crimson is the only saturated colour besides status green/red/amber. Don't add a second brand hue.
5. Section padding `py-24`; dividers are `border-t border-[var(--border)]`, never `<hr>`.
6. All motion variants at module scope; entrance fade-up, hover scale+glow.
7. Muted labels: `text-xs uppercase tracking-widest text-[var(--text-3)]`.

---

## 10. Suggested PDF King screens (apply the kit)

| Screen | Built from |
|---|---|
| Landing | Hero (h1 + tagline + CTA) → numbered `01 Upload / 02 Tool / 03 Download` → Tool grid (§4.2) |
| Tool workspace | Drop zone (§4.3) → file list (§4.4) → options form (§4.8) → Primary CTA (§4.5) |
| Processing | Progress bar (§4.9) + status badge (§4.10) |
| Result | Result card with preview thumb + Download button + "do another" ghost button |
| All tools | Tool grid (§4.2), `grid-cols-1 sm:2 lg:3` |

---

*Derived from the "Dark Refined" design system used in Ankit Bhardwaj's portfolio. Default accent set to crimson (`#F43F5E`).*
