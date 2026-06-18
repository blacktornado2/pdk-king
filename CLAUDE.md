# PDF King — Claude Reference

## Project

A web app for PDF management (merge, split, reorder, unlock, compress, etc.), built incrementally feature by feature.

## Monorepo Structure

npm **workspaces** monorepo. The root `package.json` ties `client` and `server`
together — run `npm install` **once at the root** (dependencies hoist to a single
root `node_modules`), and `npm run dev` boots both apps together via `concurrently`.

```
pdf-king/
├── package.json  # Root — workspaces, runs both apps via concurrently
├── client/       # React 19 + Vite + TypeScript + TailwindCSS + React Router v7
├── server/       # NestJS + TypeScript + Prisma + BullMQ
└── plan.md       # Full project plan with decisions and roadmap
```

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | React 19 + Vite | NOT Next.js — SPA is sufficient, NestJS handles API |
| Icons | lucide-react | Navbar + UI icons — tree-shaken |
| Styling | TailwindCSS v4 + framer-motion | Dark-first "Dark Refined" theme, runtime light/dark + 6-accent switching |
| Routing | React Router v7 | |
| State | Zustand | Lightweight, no Redux overhead |
| HTTP client | Axios | |
| Backend | NestJS + TypeScript | |
| ORM | Prisma | |
| Primary DB | PostgreSQL | Jobs, metadata, history |
| Queue/Cache | Redis + BullMQ | Async PDF processing jobs |
| File storage | Local disk (dev) | Abstracted via StorageService — swap to S3/R2 for prod |

## PDF Libraries

| Library | Operations |
|---------|-----------|
| `pdf-lib` | Merge, split, reorder, rotate, watermark, page numbers, extract — pure JS |
| `qpdf` (CLI) | Unlock / decrypt password-protected PDFs |
| `ghostscript` (CLI) | Compress PDFs |
| `pdfjs-dist` | Page thumbnail previews in the browser |

Install CLI tools locally: `brew install qpdf ghostscript`

## Architecture Pattern

Every PDF operation follows the same flow:

```
Upload files → Multer saves to /uploads/temp/
→ NestJS creates Job record in PostgreSQL (status: PENDING)
→ Job pushed to BullMQ (Redis)
→ BullMQ Worker runs processor (pdf-lib / qpdf / ghostscript)
→ Output saved to /uploads/output/
→ Job updated to DONE with outputFile path
→ Client polls GET /jobs/:id → triggers download
```

Small/fast ops can be processed synchronously (skip the queue). Use queue for large files and slow ops (compress, unlock).

## API Base URL

`/api/v1/`

Key endpoints:
- `POST /pdf/merge` — upload files, queue merge
- `POST /pdf/split` — upload + page range options
- `POST /pdf/reorder` — upload + page order array
- `POST /pdf/compress` — upload + quality option
- `POST /pdf/unlock` — upload + password
- `GET /jobs/:id` — poll job status
- `GET /jobs/:id/download` — download output
- `DELETE /jobs/:id` — cancel/cleanup

## Database Schema (key model)

```prisma
model Job {
  id         String    @id @default(cuid())
  type       JobType   // MERGE | SPLIT | REORDER | COMPRESS | UNLOCK | ...
  status     JobStatus // PENDING | PROCESSING | DONE | FAILED
  inputFiles String[]
  outputFile String?
  options    Json?     // page ranges, password, quality, etc.
  errorMsg   String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  expiresAt  DateTime  // auto-delete output after 1 hour
}
```

## Design System

The single source of truth is [`pdf-king-design-system.md`](pdf-king-design-system.md)
("Dark Refined"): dark-first canvas, single switchable accent (crimson default),
Syne / DM Sans / JetBrains Mono, the card recipe (surface + 3px accent left-border +
hover glow), framer-motion. Tokens are runtime CSS vars in `client/src/index.css`,
switched via `data-mode` / `data-theme` on `<html>` by `client/src/theme/ThemeContext`.

## Feature Build Order

1. Merge PDFs
2. Split PDF
3. Reorder Pages
4. Compress PDF
5. Unlock PDF
6. Protect PDF
7. Rotate Pages
8. Extract Pages
9. PDF to Images
10. Add Watermark
11. Add Page Numbers
12. PDF Metadata Editor
13. Edit Text (`EDIT` job type)

## Dev Commands

```bash
# Install everything (from root — installs both workspaces)
npm install

# Run BOTH apps together (from root) — preferred
npm run dev          # client (vite) + server (nest --watch), labeled logs

# Run individually if needed
npm run dev:client   # or: cd client && npm run dev
npm run dev:server   # or: cd server && npm run start:dev

# DB migrations
cd server && npx prisma migrate dev

# Prisma Studio
cd server && npx prisma studio
```

> The server still needs **Postgres + Redis** running, or it errors on connect.

## Key Conventions

- StorageService is always the abstraction layer for file I/O — never call `fs` directly in processors
- Each PDF operation lives in its own processor file under `server/src/modules/pdf/processors/`
- Frontend pages live in `client/src/pages/`, one file per tool
- Job polling interval: 1500ms, stop on DONE or FAILED
- Temp files expire after 1 hour — a cleanup cron job handles deletion
- `react` and `react-dom` are **pinned to the exact same version** (no caret) in
  `client/package.json` — workspace hoisting can otherwise split them and crash
  the app with an "Incompatible React versions" error. Bump both together.
- After adding a Prisma schema change, run `npx prisma generate` (stale client →
  `Property 'X' does not exist on type` TS errors).
- After installing a new client dependency, restart Vite (or `vite --force`) to
  rebuild its optimize-deps cache — otherwise: `504 Outdated Optimize Dep`.
