# Cadence

A calm, mobile-first personal growth app for people with many interests: agenda, routines,
home chores, reading, movement and quick expenses — in one place, with a "liquid glass" design and yellow accents.

**Stack:** Next.js 16 (App Router) · TypeScript · Prisma 7 + PostgreSQL · Auth.js v5 · Tailwind CSS 4 · Vercel Blob · PWA

## Modules

| Module              | What it does                                                                  |
| ------------------- | ----------------------------------------------------------------------------- |
| Agenda              | Today view, day/week/month views, one-off & recurring tasks, routines         |
| Money               | 5-second expense logging, receipt photos, categories, monthly budget          |
| Home                | Chores with ideal frequency, one-tap "did it", gentle overdue highlight       |
| Growth areas        | Which areas got attention this week — encouraging, never guilt-inducing       |
| Reading             | Books by status, progress, "pages read today", streak, star ratings & reviews |
| Health & Movement   | Workouts and your own metrics (steps, sleep…) with a 30-day chart             |
| Assistant (Today)   | Speak or type what you need; Claude proposes tasks, expenses, budget… you confirm |
| Everywhere          | Contextual "+" (adds what the screen is about), private mode, installable PWA |

📘 **Want to understand the code?** Read [`docs/GUIDE.md`](docs/GUIDE.md) — a phase-by-phase walkthrough.

## Getting started

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Start PostgreSQL (or use your own and edit DATABASE_URL)
docker compose up -d

# 3. Environment variables
cp .env.example .env     # then put a long random string in AUTH_SECRET (openssl rand -base64 32)

# 4. Create the tables and the demo account
npm run db:migrate
npm run db:seed

# 5. Run it
npm run dev              # http://localhost:3000
```

Demo account: **demo@cadence.app / demo1234**

## Scripts

| Script               | What it does                                     |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Development server                               |
| `npm run build`      | Production build                                 |
| `npm test`           | Unit tests (Vitest)                              |
| `npm run typecheck`  | TypeScript check                                 |
| `npm run lint`       | ESLint                                           |
| `npm run db:migrate` | Create/apply migrations in development           |
| `npm run db:deploy`  | Apply existing migrations (production)           |
| `npm run db:seed`    | (Re)create the demo account                      |
| `npm run db:studio`  | Browse the database in the browser               |

## Receipt photos (Vercel Blob)

Photos are stored as **private** blobs and served through `/api/receipts/[id]`, which checks
that the expense belongs to the logged-in user.

- **On Vercel:** Project → Storage → Create → Blob, connect it to the project. Vercel adds
  `BLOB_READ_WRITE_TOKEN` for you.
- **Locally:** copy that token into `.env` to use the real store, or leave it empty: in
  development photos are then saved to `./.uploads` (git-ignored).

## Sign in with Google / GitHub (optional)

The buttons only appear when both keys of a provider are set in `.env`.

**GitHub** — <https://github.com/settings/developers> → *New OAuth App*
- Homepage URL: `http://localhost:3000`
- Callback URL: `http://localhost:3000/api/auth/callback/github`
- Copy the Client ID / Secret into `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`

**Google** — <https://console.cloud.google.com/apis/credentials> → *Create credentials → OAuth client ID → Web application*
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- Copy the values into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`

When you deploy, add the same callback URLs with your real domain.

## Deploying to Vercel

Vercel runs the `vercel-build` script, which **applies database migrations automatically**
(`prisma migrate deploy`) before building. Environment variables:

| Variable                | Value                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`          | Postgres connection string (e.g. Prisma Postgres or Neon)        |
| `AUTH_SECRET`           | Long random string                                               |
| `BLOB_READ_WRITE_TOKEN` | Added automatically when you connect a Blob store to the project |
| `SEED_DEMO`             | `true` to (re)create the demo account on every deploy            |
| `GROQ_API_KEY`          | Optional: enables the AI assistant on the Today screen           |
| `AUTH_GOOGLE_*` / `AUTH_GITHUB_*` | Optional OAuth keys                                    |

## Project structure

```
prisma/            schema, migrations, demo seed
src/app/           routes only: (auth) = login/register, (app) = private pages, api/ = route handlers
src/features/      one folder per module: queries (read), actions (write), schemas, components
src/components/    shared UI (iOS-style list, sheet, switch, segmented control, icons…)
src/lib/           db client, auth, sessions, dates, money, storage, palette
public/sw.js       service worker (installable PWA + offline page)
docs/GUIDE.md      learning guide
```
