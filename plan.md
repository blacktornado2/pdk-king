# PDF King — Project Plan

## Overview

A modern, minimalistic web application for managing PDF operations: merge, split, reorder pages, unlock, compress, and more. Light-only UI for now, dark mode to be added later.

---

## Tech Stack Decision

### Frontend: React + Vite (not Next.js)

**Recommendation: React with Vite.**

Reasons:
- You already have a NestJS backend, so Next.js API routes add no value.
- PDF King is a tool app — SEO matters only for the landing page, not the tool pages. A single-page app is perfectly fine.
- Vite-based React is fast to develop, simple to deploy (just a static build served by Nginx or a CDN).
- Next.js has improved significantly since 2 years ago (App Router is now stable), but for your use case, the added complexity (SSR, server components, hydration) is unnecessary overhead.
- **If you ever want SEO on the landing page**, you can use React with React Helmet, or add a simple SSR layer later — without switching frameworks.

Stack: `React 19` + `Vite` + `TypeScript` + `TailwindCSS` + `React Router v7`

### Backend: NestJS

Good choice. NestJS provides:
- Module-based architecture (clean separation of concerns per feature)
- Built-in support for file uploads via Multer
- Excellent TypeScript support
- Easy integration with BullMQ for job queues

Stack: `NestJS` + `TypeScript` + `Multer` + `BullMQ` + `Prisma`

### Database: PostgreSQL + Redis

**PostgreSQL** — primary database
- Stores user accounts, file metadata, operation history, job status
- Reliable, battle-tested, great with Prisma ORM
- Handles JSON well (for storing page-order configs, settings, etc.)

**Redis** — job queue + caching
- BullMQ (built on Redis) for async PDF processing jobs
- PDF operations can be slow — you don't want the HTTP request to hang
- Also useful for rate limiting and session caching

**No object storage needed at first** — store processed files on local disk during development. Abstract behind a `StorageService` so you can swap to AWS S3 / Cloudflare R2 in production without changing business logic.

### PDF Processing Libraries (Node.js)

| Library | Use Case |
|---------|----------|
| `pdf-lib` | Merge, split, reorder pages, rotate, add watermark — pure JS, no binaries |
| `pdfjs-dist` | Render page thumbnails/previews in the browser |
| `sharp` | Convert PDF pages to images (via intermediate step) |
| `qpdf` (CLI via child_process) | Unlock/decrypt password-protected PDFs |
| `ghostscript` (CLI) | Compress PDFs — best compression ratios |

`pdf-lib` will handle ~80% of operations. `qpdf` and `ghostscript` are CLI tools you install on the server, called via Node's `child_process.exec`.

---

## Architecture

```
pdf-king/
├── client/          # React + Vite frontend
├── server/          # NestJS backend
└── plan.md
```

### Request Flow (for a PDF job)

```
User uploads PDF(s)
      ↓
NestJS receives file(s) via Multer → saves to /uploads/temp/
      ↓
NestJS creates a Job record in PostgreSQL (status: PENDING)
      ↓
Job pushed to BullMQ queue (Redis)
      ↓
BullMQ Worker processes the job (calls pdf-lib / qpdf / ghostscript)
      ↓
Output file saved to /uploads/output/
      ↓
Job record updated in PostgreSQL (status: DONE, outputPath: ...)
      ↓
Client polls job status (or WebSocket push) → triggers download
```

For small files (< 5MB, simple operations), you can process synchronously and skip the queue. Use the queue for large files and slow operations like compression.

---

## Feature Roadmap

### Phase 1 — Core (Build First)
1. **Merge PDFs** — combine multiple PDFs into one, with drag-to-reorder before merging
2. **Split PDF** — split by page range, every N pages, or extract specific pages
3. **Reorder Pages** — visual drag-and-drop page thumbnails, then export
4. **Compress PDF** — reduce file size (lossy/lossless options)

### Phase 2 — Common Utilities
5. **Unlock PDF** — remove password protection (user must supply the password)
6. **Protect PDF** — add password to a PDF
7. **Rotate Pages** — rotate individual or all pages
8. **Extract Pages** — pull specific pages out as a new PDF

### Phase 3 — Advanced
9. **PDF to Images** — export each page as PNG/JPG
10. **Add Watermark** — text or image watermark on all/selected pages
11. **Add Page Numbers** — stamp page numbers in chosen position/style
12. **PDF Metadata Editor** — edit title, author, subject, keywords

### Phase 4 — Stretch Goals
13. **Convert to PDF** — images → PDF, Word → PDF (Word needs LibreOffice CLI)
14. **OCR PDF** — make scanned PDFs searchable (needs Tesseract)
15. **User Accounts** — save history, re-download outputs

---

## Design System

### Philosophy
- Minimalistic, clean, tool-first — the PDF operation is the hero, not the branding
- Whitespace-heavy layout
- No gradients, no shadows that feel heavy — subtle depth only
- Every tool page has a single, obvious call to action: the upload zone

### Color Palette (Light Mode)

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#FAFAFA` | Page background |
| `surface` | `#FFFFFF` | Cards, panels |
| `border` | `#E5E7EB` | Dividers, card outlines |
| `text-primary` | `#111827` | Headings, body |
| `text-secondary` | `#6B7280` | Captions, hints |
| `accent` | `#4F46E5` | Indigo — buttons, highlights, active states |
| `accent-hover` | `#4338CA` | Button hover |
| `success` | `#10B981` | Done / success states |
| `error` | `#EF4444` | Error states |
| `warning` | `#F59E0B` | Warnings |

### Typography
- Font: `Inter` (Google Fonts) — clean, highly legible
- Headings: `font-semibold`, tight tracking
- Body: `font-normal`, 1.5 line-height

### Component Patterns
- **Upload Zone**: large dashed-border drop area, prominent on every tool page
- **Page Thumbnail Grid**: for reorder/split — shows mini previews of PDF pages
- **Progress Bar**: for long-running jobs
- **Tool Cards**: on the home page, icon + name + one-line description, hover lifts card slightly
- **Sidebar Nav** (desktop) / **Bottom Nav** (mobile): for navigating between tools

---

## Folder Structure

### Frontend (`client/`)
```
src/
├── assets/
├── components/
│   ├── ui/              # Button, Input, Badge, Spinner, etc.
│   ├── layout/          # Navbar, Sidebar, PageWrapper
│   └── pdf/             # UploadZone, PageThumbnail, PageGrid, ProgressBar
├── pages/
│   ├── Home.tsx
│   ├── Merge.tsx
│   ├── Split.tsx
│   ├── Reorder.tsx
│   ├── Compress.tsx
│   ├── Unlock.tsx
│   └── ...
├── hooks/               # useJobStatus, useFileUpload, etc.
├── services/            # API calls (axios)
├── store/               # Zustand (lightweight state)
└── types/
```

### Backend (`server/`)
```
src/
├── modules/
│   ├── pdf/
│   │   ├── pdf.module.ts
│   │   ├── pdf.controller.ts
│   │   ├── pdf.service.ts
│   │   └── processors/
│   │       ├── merge.processor.ts
│   │       ├── split.processor.ts
│   │       ├── reorder.processor.ts
│   │       ├── compress.processor.ts
│   │       └── unlock.processor.ts
│   ├── jobs/
│   │   ├── jobs.module.ts
│   │   ├── jobs.controller.ts
│   │   └── jobs.service.ts
│   └── storage/
│       ├── storage.module.ts
│       └── storage.service.ts    # abstracted: local disk today, S3 tomorrow
├── prisma/
│   └── schema.prisma
└── main.ts
```

---

## Database Schema (Prisma)

```prisma
model Job {
  id          String    @id @default(cuid())
  type        JobType   // MERGE | SPLIT | REORDER | COMPRESS | UNLOCK | ...
  status      JobStatus // PENDING | PROCESSING | DONE | FAILED
  inputFiles  String[]  // paths to uploaded input files
  outputFile  String?   // path to output file
  options     Json?     // operation-specific options (page ranges, password, etc.)
  errorMsg    String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  expiresAt   DateTime  // auto-delete output files after 1 hour
}

enum JobType {
  MERGE
  SPLIT
  REORDER
  COMPRESS
  UNLOCK
  PROTECT
  ROTATE
  EXTRACT
  PDF_TO_IMAGE
  WATERMARK
}

enum JobStatus {
  PENDING
  PROCESSING
  DONE
  FAILED
}
```

---

## API Design

All endpoints under `/api/v1/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/pdf/merge` | Upload files, queue merge job |
| `POST` | `/pdf/split` | Upload file + options, queue split job |
| `POST` | `/pdf/reorder` | Upload file + page order array, queue job |
| `POST` | `/pdf/compress` | Upload file + quality option, queue job |
| `POST` | `/pdf/unlock` | Upload file + password, queue job |
| `GET`  | `/jobs/:id` | Poll job status |
| `GET`  | `/jobs/:id/download` | Download output file |
| `DELETE` | `/jobs/:id` | Cancel / clean up job |

---

## Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- `qpdf` — `brew install qpdf`
- `ghostscript` — `brew install ghostscript`

### Commands
```bash
# Backend
cd server && npm install && npm run start:dev

# Frontend
cd client && npm install && npm run dev

# DB migrations
cd server && npx prisma migrate dev
```

---

## Deployment Plan (Future)

- Frontend: Vercel or Cloudflare Pages (static build)
- Backend: Railway, Render, or a VPS (DigitalOcean/Hetzner)
- Database: Supabase (managed Postgres) or Railway Postgres
- Redis: Upstash (serverless Redis) or Railway Redis
- File storage: Cloudflare R2 (cheap S3-compatible) — swap `StorageService` implementation

---

## What We Build First

1. Project scaffolding — Vite React app + NestJS app
2. File upload endpoint + Multer config
3. `pdf-lib` integration for Merge (simplest operation)
4. Job queue with BullMQ
5. Frontend: Home page + Merge page with upload zone + progress polling
6. Then iterate feature by feature
