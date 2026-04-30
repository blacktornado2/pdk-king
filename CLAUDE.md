# PDF King — Claude Reference

## Project

A web app for PDF management (merge, split, reorder, unlock, compress, etc.), built incrementally feature by feature.

## Monorepo Structure

```
pdf-king/
├── client/       # React 19 + Vite + TypeScript + TailwindCSS + React Router v7
├── server/       # NestJS + TypeScript + Prisma + BullMQ
└── plan.md       # Full project plan with decisions and roadmap
```

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | React 19 + Vite | NOT Next.js — SPA is sufficient, NestJS handles API |
| Styling | TailwindCSS | Minimalistic, light-only (dark mode later) |
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

- **Font**: Inter (Google Fonts)
- **Background**: `#FAFAFA`
- **Surface/Card**: `#FFFFFF`
- **Border**: `#E5E7EB`
- **Text primary**: `#111827`
- **Text secondary**: `#6B7280`
- **Accent**: `#4F46E5` (Indigo) — buttons, active states
- **Accent hover**: `#4338CA`
- **Success**: `#10B981` | **Error**: `#EF4444` | **Warning**: `#F59E0B`
- Style: minimalistic, whitespace-heavy, subtle borders — no heavy shadows or gradients

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

## Dev Commands

```bash
# Backend
cd server && npm run start:dev

# Frontend
cd client && npm run dev

# DB migrations
cd server && npx prisma migrate dev

# Prisma Studio
cd server && npx prisma studio
```

## Key Conventions

- StorageService is always the abstraction layer for file I/O — never call `fs` directly in processors
- Each PDF operation lives in its own processor file under `server/src/modules/pdf/processors/`
- Frontend pages live in `client/src/pages/`, one file per tool
- Job polling interval: 1500ms, stop on DONE or FAILED
- Temp files expire after 1 hour — a cleanup cron job handles deletion
