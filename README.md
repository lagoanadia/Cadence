# Cadence

A calm, mobile-first personal growth app for people with many interests: agenda, routines,
habits, home chores, reading, movement and quick expenses — in one place.

**Stack:** Next.js 16 (App Router) · TypeScript · Prisma 7 + PostgreSQL · Auth.js v5 · Tailwind CSS 4 · PWA

## Status

| Phase | Module                         | Status  |
| ----- | ------------------------------ | ------- |
| 1     | Auth + Agenda                  | ✅ Done |
| 2     | Expenses                       | ⏳      |
| 3     | Chores                         | ⏳      |
| 4     | Growth areas dashboard         | ⏳      |
| 5     | Reading                        | ⏳      |
| 6     | Health & Movement              | ⏳      |

## Getting started

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Start PostgreSQL (or use your own and edit DATABASE_URL)
docker compose up -d

# 3. Environment variables
cp .env.example .env
npx auth secret          # writes AUTH_SECRET into .env.local — or paste any random 32+ char string

# 4. Create the tables and the demo account
npm run db:migrate
npm run db:seed

# 5. Run it
npm run dev              # http://localhost:3000
```

Demo account: **demo@cadence.app / demo1234**

## Scripts

| Script              | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Development server                             |
| `npm run build`     | Production build                               |
| `npm test`          | Unit tests (Vitest) for dates and recurrence   |
| `npm run typecheck` | TypeScript check                               |
| `npm run lint`      | ESLint                                         |
| `npm run db:migrate`| Apply schema changes to the database           |
| `npm run db:seed`   | (Re)create the demo account                    |
| `npm run db:studio` | Browse the database in the browser             |

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

## Project structure

```
prisma/            schema, migrations, demo seed
src/app/           routes only: (auth) = login/register, (app) = private pages
src/features/      one folder per module: queries (read), actions (write), schemas (validation), components
src/components/    shared UI (buttons, sheet, fields, icons, layout)
src/lib/           db client, auth, sessions, dates, form helpers
public/sw.js       service worker (installable PWA + offline page)
```
