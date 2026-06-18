# PDF King

A web app for PDF management — merge, split, reorder, compress, unlock, protect,
rotate, extract, convert to images, watermark, page numbers, metadata editing, and
text editing. Built incrementally, one tool at a time.

![PDF King home page](docs/screenshots/home.png)

<p>
  <img src="docs/screenshots/merge.png" width="32%" alt="Merge PDFs" />
  <img src="docs/screenshots/split.png" width="32%" alt="Split PDF" />
  <img src="docs/screenshots/compress.png" width="32%" alt="Compress PDF" />
</p>
<p>
  <img src="docs/screenshots/reorder.png" width="32%" alt="Reorder pages" />
  <img src="docs/screenshots/watermark.png" width="32%" alt="Add watermark" />
</p>

## Architecture

An npm **workspaces monorepo** with two apps:

```
pdf-king/
├── client/   # React 19 + Vite + TypeScript + TailwindCSS v4 + React Router v7
├── server/   # NestJS + Prisma + BullMQ
└── plan.md   # Full project plan and roadmap
```

| Layer        | Tech                                                        |
|--------------|--------------------------------------------------------------|
| Frontend     | React 19, Vite, TypeScript, TailwindCSS v4, framer-motion, Zustand |
| Icons        | lucide-react                                                |
| Backend      | NestJS, TypeScript                                          |
| ORM / DB     | Prisma + PostgreSQL                                         |
| Queue        | BullMQ + Redis                                              |
| PDF engines  | pdf-lib, qpdf (CLI), ghostscript (CLI), pdfjs-dist           |

Each PDF operation is queued as a `Job` (Postgres), processed by a BullMQ worker,
and the output is served back for download. See [CLAUDE.md](CLAUDE.md) for the full
architecture and conventions. The UI follows the "Dark Refined" design system in
[pdf-king-design-system.md](pdf-king-design-system.md) — dark-first canvas, a
switchable accent (6 options), and light/dark mode, both togglable from the footer.

## Prerequisites

- **Node.js** 20+ (developed on v24)
- **PostgreSQL** 15+ installed and running locally
- **Redis** installed and running locally
- CLI tools: `qpdf`, `ghostscript`

On macOS (Homebrew) you can install everything with:

```bash
brew install postgresql@15 redis qpdf ghostscript
```

## Setup

```bash
# 1. Start the data services (they don't auto-start after install)
brew services start postgresql@15
brew services start redis

# 2. Create the application database
createdb pdfking

# 3. Install all dependencies (root install covers both workspaces)
npm install

# 4. Configure the server env, then run DB migrations
cd server
cp .env.example .env   # then edit DATABASE_URL to match your Postgres (see note below)
npx prisma migrate dev
npx prisma generate
cd ..
```

> **Heads-up on `DATABASE_URL`.** `.env.example` ships with
> `postgresql://postgres:postgres@localhost:5432/pdfking`, but a stock Homebrew
> Postgres has **no `postgres` role and no password** — it authenticates as your
> macOS username. On such a setup use:
>
> ```
> DATABASE_URL="postgresql://$(whoami)@localhost:5432/pdfking?schema=public"
> ```
>
> (substitute your actual username, e.g. `postgresql://ankit@localhost:5432/pdfking?schema=public`).

## Running

From the **repo root**, start both apps together:

```bash
npm run dev
```

| App     | URL                                   |
|---------|---------------------------------------|
| Client  | http://localhost:5173                 |
| Server  | http://localhost:3001/api/v1          |
| API docs (Swagger) | http://localhost:3001/api/docs |

Run them individually if needed:

```bash
npm run dev:client   # Vite dev server
npm run dev:server   # NestJS in watch mode
```

> The server needs Postgres **and** Redis up, or it errors on connect.

In **development** the client needs no env config — Vite proxies `/api` to the
server. For **production** builds (no proxy), set `VITE_API_URL` to the deployed
API base; see [client/.env.example](client/.env.example).

## Common Commands

```bash
npm run build                      # build both apps
cd server && npx prisma studio     # browse the database
cd server && npx prisma migrate dev # create/apply a migration
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Module '@prisma/client' has no exported member 'PrismaClient'` on first `npm run dev` | The Prisma client wasn't generated yet. Run `cd server && npx prisma generate`, then restart `npm run dev` |
| `Property 'X' does not exist on type` after a schema change | `cd server && npx prisma generate` |
| Server exits with a connection error on boot | Postgres/Redis aren't running — `brew services start postgresql@15 && brew services start redis` |
| `504 Outdated Optimize Dep` after adding a client dependency | restart Vite (or `npm run dev:client -- --force`) |
| `Incompatible React versions` | `react` and `react-dom` must be the exact same version in `client/package.json` |

## Project Status

Built feature by feature — see [plan.md](plan.md) for the roadmap and the feature
build order in [CLAUDE.md](CLAUDE.md).
