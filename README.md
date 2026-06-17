# PDF King

A web app for PDF management — merge, split, reorder, compress, unlock, protect,
rotate, extract, convert to images, watermark, page numbers, metadata editing, and
text editing. Built incrementally, one tool at a time.

## Architecture

An npm **workspaces monorepo** with two apps:

```
pdf-king/
├── client/   # React 19 + Vite + TypeScript + TailwindCSS + React Router v7
├── server/   # NestJS + Prisma + BullMQ
└── plan.md   # Full project plan and roadmap
```

| Layer        | Tech                                              |
|--------------|---------------------------------------------------|
| Frontend     | React 19, Vite, TypeScript, TailwindCSS, Zustand  |
| Icons        | lucide-react                                      |
| Backend      | NestJS, TypeScript                                |
| ORM / DB     | Prisma + PostgreSQL                               |
| Queue        | BullMQ + Redis                                    |
| PDF engines  | pdf-lib, qpdf (CLI), ghostscript (CLI), pdfjs-dist |

Each PDF operation is queued as a `Job` (Postgres), processed by a BullMQ worker,
and the output is served back for download. See [CLAUDE.md](CLAUDE.md) for the full
architecture, conventions, and design system.

## Prerequisites

- **Node.js** 20+ (developed on v24)
- **PostgreSQL** running locally
- **Redis** running locally
- CLI tools: `brew install qpdf ghostscript`

## Setup

```bash
# 1. Install all dependencies (root install covers both workspaces)
npm install

# 2. Configure the server env, then run DB migrations
cd server
cp .env.example .env   # then edit DATABASE_URL, REDIS_HOST/PORT, etc.
npx prisma migrate dev
npx prisma generate
cd ..
```

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
| `Property 'X' does not exist on type` after a schema change | `cd server && npx prisma generate` |
| `504 Outdated Optimize Dep` after adding a client dependency | restart Vite (or `npm run dev:client -- --force`) |
| `Incompatible React versions` | `react` and `react-dom` must be the exact same version in `client/package.json` |

## Project Status

Built feature by feature — see [plan.md](plan.md) for the roadmap and the feature
build order in [CLAUDE.md](CLAUDE.md).
