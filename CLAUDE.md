@AGENTS.md

# Cadence — guide for Claude

Read this whole file before doing anything. It is the hand-off from the previous Claude session that
built the project. `docs/GUIDE.md` is the learning guide written for the user; keep it updated too.

## 1. The user and how to work with them

- **Nadia**, 20, first year of a Spanish *FP Superior DAM* (multiplatform app development). Building
  Cadence as a personal app and portfolio piece.
- **Language: reply in the language she writes in** (usually Spanish; sometimes English). The app UI,
  code, comments and commits are in **English**.
- **She wants to understand, not copy-paste.** After each piece of work: say what you built, how to test
  it, and explain the concepts worth learning, step by step, at her level. Only give a plain
  copy-paste answer if she explicitly asks for one.
- Original working agreement: build in phases, stop after each and explain. Later she asked to finish
  things autonomously while she was away. Default: for big changes, do the work, then explain clearly.
  Ask only when a decision is genuinely hers.
- **Be honest about what you verified.** Say clearly what was tested in a browser, what was only
  type-checked, and what couldn't be tested (e.g. real Claude API calls, Google/GitHub OAuth). Correct
  yourself openly if you said something wrong earlier.
- She uses Windows (Git Bash / MINGW64), no Docker. She deploys on Vercel.

## 2. Code conventions (hers — follow them)

- TypeScript strict, **no `any`** (use `unknown` + narrowing, or proper types).
- Component props: **`type Props = { propName: type }`** (one `Props` type per component; for helper
  components in the same file use `XxxProps`).
- Clean, typed, commented for a student: comments explain *why*, in plain English. Match the existing
  comment density.
- Pure logic goes in its own file with a unit test and **no DB imports**
  (e.g. `chores/status.ts`, `reading/streak.ts`, `health/stats.ts`, `areas/activity.ts`, `agenda/recurrence.ts`,
  `assistant/plan.ts`, `lib/dates.ts`, `lib/money.ts`). Don't mock the DB to test logic: extract it.

## 3. Stack (newer than your training data — read the docs first)

| Tool | Version | Gotchas |
|---|---|---|
| Next.js | 16.3 (App Router, Turbopack) | **Read `node_modules/next/dist/docs/` before Next work** (see AGENTS.md). `params`/`searchParams` are Promises; use `PageProps<"/route">`, `LayoutProps`, `RouteContext` (run `npx next typegen` after adding routes). `middleware` is now `proxy` (we don't use one). `revalidateTag` needs 2 args; we use `revalidatePath("/", "layout")`. Server Action body limit raised to 4 MB in `next.config.ts`. |
| React | 19.2 | A `<form action={fn}>` **resets its inputs** after the action. We submit via `onSubmit` + `startTransition` instead: use `useActionForm` (`src/lib/use-action-form.ts`). |
| Prisma | **7.10** | Generator `prisma-client` → output `src/generated/prisma` (git-ignored; import from `@/generated/prisma/client` or `/enums`). Config in `prisma.config.ts`. **Driver adapter required** (`@prisma/adapter-pg`, see `src/lib/db.ts`). `migrate dev` does NOT run generate: run `npx prisma generate` after schema changes. **Always read generated migration SQL** (a rename was once generated as drop+add; it was hand-edited to `RENAME COLUMN`). |
| Auth.js | next-auth 5 beta | JWT sessions (required by Credentials). Providers: Credentials (bcrypt), Google and GitHub (enabled only if their env vars exist). `AUTH_TRUST_HOST=true` is needed outside Vercel. No automatic account linking by email, on purpose (security: emails aren't verified). |
| Tailwind | 4 | Tokens + custom `@utility` classes in `src/app/globals.css`. |
| Zod | 4 | `z.email()`, `{ error: "…" }`. |
| Groq SDK | `groq-sdk` | Used by the assistant (structured outputs via `response_format: json_schema`, `strict: true`). |
| Others | Vitest, lucide-react, @vercel/blob 2 (private blobs) | |

## 4. Commands

```bash
npm run dev | build | lint | typecheck | test
npm run db:migrate   # prisma migrate dev (then: npx prisma generate)
npm run db:seed      # recreates demo user (fixed id "demo-user") — demo@cadence.app / demo1234
npx next typegen     # after adding/renaming routes
```

Before every push run **lint + typecheck + test + build**, and drive the real UI in a browser for UI
changes (see §9).

## 5. Architecture

```
src/app/(auth)/…          login/register (no app shell)
src/app/(app)/…           private pages; layout fetches data for the "+" button and renders BottomNav
src/app/api/…             auth handlers, /api/receipts/[id] (private photo proxy)
src/features/<module>/    queries.ts (reads, "server-only") · actions.ts ("use server") · schemas.ts · components/
src/components/ui/        Sheet (native <dialog>), Field/Input, Button, Switch, SegmentedLinks, StatTiles, WeekDots, Private, Stars, IconColorPicker, PageHeader
src/lib/                  db, auth, session (requireUserId/getUserSettings), ownership (ownedAreaId/userToday), dates, money, palette, storage, form helpers
```

Modules: agenda (tasks, recurring tasks, routines; Today/day/week/month views), expenses ("Money"),
chores ("Home"), areas (weekly dashboard + private mode), reading ("Books", with ratings & reviews),
health ("Move": workouts + user-defined metrics with an SVG chart), quick-add (contextual "+"),
assistant (AI on Today), settings.

### Security rules (non-negotiable)
- The user id comes **only** from the session: `requireUserId()`. Never from form data.
- **Every** query/mutation filters by `userId` (`updateMany/deleteMany({ where: { id, userId } })`,
  `findFirst({ where: { id, userId } })`). Related ids from the browser (areaId, categoryId…) are checked
  for ownership (`ownedAreaId`).
- Validate all input with Zod on the server. Anything from the AI model is untrusted input too.
- Private mode (`settings.privateMode`) hides names/amounts **server-side** with `<Private>`.
- Receipts: Vercel Blob `access: "private"`, served only via `/api/receipts/[expenseId]` after an
  ownership check (401 logged out, 404 other users).

### Data model essentials (`prisma/schema.prisma`)
- **Money = integer cents** (`amountCents`). Parse with `parseEuroInput`, show with `formatEuros`.
- **Calendar days = `@db.Date`**, handled in code as `DayKey` strings `"YYYY-MM-DD"` (`lib/dates.ts`,
  UTC arithmetic). "Today" is computed in the user's timezone (`todayKey(settings.timezone)`).
- Recurring tasks/routines store a **rule** (`frequency`, `daysOfWeek` 0=Sun, `dayOfMonth`). Occurrences
  are computed by `occursOn()`; only completions are stored (`@@unique([…, date])`). Missed recurring
  items are never "overdue" (product decision: no guilt).
- Archive (`archivedAt`) instead of delete for areas, recurring tasks, routines and chores, so history
  still counts on the dashboard.
- New users get settings, 7 default areas, 8 expense categories and 5 chores (`lib/new-user.ts`).

### Hard-won pitfalls
- **Hydration:** Node and Chrome format dates/currency differently ("Wed 23 Sept" vs "Wed, 23 Sept").
  Format dates on the **server** and pass strings to Client Components; `formatEuros` is hand-written for
  the same reason.
- `Sheet`: the dialog `close` event fires when *we* close it too; `openRef` guards `onClose`.
- `useOptimistic` + `startTransition` for instant toggles (`useOptimisticDone`).
- React lint forbids `setState` inside effects; do it in event handlers.
- Tests that use relative dates can break as the calendar moves; prefer exact selectors.

## 6. Design system: "liquid glass" with a green accent, color kept scarce

- Fixed gradient background (`--bg-image`) + translucent surfaces with `backdrop-filter`. Utilities:
  `glass`, `ios-list` (glass card), `ios-rows` (hairline separators, `--row-inset`), `section-title`,
  `large-title`, `display-serif` (Instrument Serif, used sparingly: Today greeting, assistant), `tabular`.
- The background is deliberately near-neutral (near-white in light, near-black in dark) with just a faint
  green glow, not a colored gradient — color is scarce on purpose, so the one accent that exists reads.
  Green has two tokens: **`accent-fill`** (#34C759 fills; text on it = `accent-text`, dark — green is too
  bright for white text to sit on reliably) and **`accent`** (ink for text/icons, a darker green in light
  mode so it's readable). Light-mode surfaces are quite transparent (`--surface` at ~0.5 alpha) — she
  tried a more-transparent version (~0.26) and preferred the less-transparent one; don't lower it again
  without asking.
- Light (near-white, barely-green) and dark (near-black, barely-green) themes via `prefers-color-scheme`.
  Check both. **She has rejected two earlier directions for this screen** (a literal rainbow categorical
  palette, then a vivid/saturated multi-hue "atmospheric" background) before landing here — don't
  reintroduce either without being asked.
- Floating glass capsule tab bar with 7 tabs: Today, Agenda, Money, Home, Areas, Books, Move. Settings is
  a gear icon on Today; Routines & repeating is the 🔁 icon in the Agenda header.
- Area/category colors come from a **monochrome green palette** (`lib/palette.ts`, CSS vars
  `--c-blue`… — names are historical, values are all green shades now, by product choice). Store
  the light hex; render with `cssColor(hex)`. Because the swatches aren't hue-distinct, color never
  carries meaning alone (always with a name/icon) — that's load-bearing now, not just good practice. For
  charts, load the `dataviz` skill first.
- Tone: calm and encouraging, never guilt ("could use some love", "Resting — no pressure"). The Health
  module must never mention weight loss or dieting.

## 7. Features with non-obvious behavior

- **Contextual "+"** (`features/quick-add/quick-add.tsx`, `modeForPath`): Money → expense, Home → new
  chore, Books → new book, Move → workout, Today/Agenda/Areas → task (date from the URL on day/week
  views), otherwise the menu. "Something else…" opens the full menu.
- **Expense quick add:** amount first (autofocus, decimal keyboard), one-tap category, or one word that is
  matched to a category name ("transport") or becomes the note. Photos are compressed in the browser
  (`lib/compress-image.ts`) before upload. Without `BLOB_READ_WRITE_TOKEN`, dev saves to `./.uploads`
  (`LOCAL_UPLOADS=true` forces it in `next start`).
- **AI assistant** (`features/assistant/`): browser speech recognition fills a textarea →
  `planAssistantAction` calls Groq (`planner.ts`: `client.chat.completions.create` with
  `response_format: { type: "json_schema", json_schema: { strict: true, schema: z.toJSONSchema(planSchema,
  { target: "openai" }) } }`, model `openai/gpt-oss-120b` — one of the few Groq models that support
  `strict: true`) → the result is re-validated with `planSchema.parse` (the model is untrusted input too)
  → the user reviews and unticks proposals → `applyAssistantAction` re-validates again and `executeAction`
  writes, matching names only against the user's rows (`findByName`, accent/case-insensitive). To add an
  action kind: schema in `plan.ts` → `describeAction` → `executeAction` → test. Disabled (explanatory
  card) when `GROQ_API_KEY` is missing.
- Reading: logging pages runs a transaction (log + bookmark), auto-finishes at the last page. Books have
  an optional 1–5 `rating` and `review`.
- Demo seed (`prisma/seed.ts`): dates relative to today, seeded PRNG (deterministic screenshots), budget
  900 €.

## 8. Deployment and environment

- **Live:** https://cadence-organized-life.vercel.app — Vercel project `cadence`
  (`prj_Z0hDpALII2cTqYDTUQe6lcIBlCcC`, team scope `nadia-655a`, Hobby). The old
  `cadence-amber-iota.vercel.app` now 307-redirects here at the Vercel domain level (still verified on
  the project, just no longer primary) — no app code depends on the domain, Auth.js reads it from the
  request (`AUTH_TRUST_HOST=true`), so renaming it needed no code change, only new OAuth redirect URIs
  (see below). Linked to GitHub
  `lagoanadia/Cadence`; **every push to `claude/lucid-brahmagupta-cwb3ps` (the only and production branch)
  deploys to production.** Functions region `fra1` (same as the DB).
- Vercel runs `npm run vercel-build`: `prisma generate && prisma migrate deploy && (seed if SEED_DEMO=true)
  && next build`. So **migrations apply automatically on deploy**; keep them backward-compatible
  (additive) and review the SQL.
- Env vars on Vercel: `DATABASE_URL` (Prisma Postgres, Frankfurt), `AUTH_SECRET`, `AUTH_TRUST_HOST`,
  `SEED_DEMO=true` (demo account is reset on every deploy; real users untouched), `BLOB_READ_WRITE_TOKEN`
  (private store `cadence-receipts`), `AUTH_GOOGLE_ID/SECRET`, `AUTH_GITHUB_ID/SECRET` (production only),
  and `GROQ_API_KEY` (the AI assistant's key — set on Vercel directly, not something end users configure).
  Never print or commit secrets. The
  production DB was created with `npx create-db` and had to be *claimed* by the user. If the site loses
  its data, ask whether she claimed it.
- OAuth callback URLs must be registered in the Google Cloud Console and the GitHub OAuth App settings
  (not something Claude can do — no console access for either). After the domain rename, both need the
  new callback added: `https://cadence-organized-life.vercel.app/api/auth/callback/google` and
  `.../github`, plus `https://cadence-organized-life.vercel.app` as an authorized JavaScript origin for
  Google. Leaving the old `cadence-amber-iota.vercel.app` ones registered too is harmless. Google was
  verified to accept the client; GitHub could not be verified from the sandbox (github.com blocked).
- Vercel MCP works **without** `teamId` (passing the team id gives 403). Build logs and protected
  deployment URLs are not readable through it; check the public alias with curl instead.
- Local dev for her (Windows, no Docker): clone into a folder outside OneDrive, `npm install`,
  `npx create-db` for a separate dev database, fill `.env` from `.env.example`, `db:migrate`, `db:seed`, `dev`.

## 9. Verifying your work (how the previous session did it)

- In a Claude Code cloud sandbox: `service postgresql start` (local DB `cadence`/`cadence`, see `.env`),
  `npm run build`, then start `next start` with a pidfile (`kill $(cat pidfile)`; never `pkill -f next`,
  it kills your own shell). Use `LOCAL_UPLOADS=true` and a real `GROQ_API_KEY` to render and test the
  assistant (a real call is cheap and fast enough to actually run from the sandbox, unlike before).
- Playwright is not a project dependency: install it in a scratch directory and launch the preinstalled
  Chromium (`/opt/pw-browsers/chromium-*/chrome-linux/chrome`) at 390×844, in both color schemes. Previous
  e2e flows covered: login/wrong password, toggles persisting after reload, quick add, edit, move to today,
  views, recurring and routine forms (validation keeps input), 404 on invalid dates, settings, register,
  **no data leaks between users**, expense with photo (+ receipt 401/404 for others), budget, categories,
  chores done/undo, pages/finish book, workouts, metrics + chart hover, private mode, contextual "+".
  Reseed (`npm run db:seed`) before each run.
- The sandbox cannot reach Postgres on port 5432 outside, nor github.com login pages. It CAN reach the
  Groq API with a key. Its HTTPS proxy breaks Chromium against external sites, so verify production with
  curl.

## 10. Git

- Develop on **`claude/lucid-brahmagupta-cwb3ps`** and push there (`git push -u origin <branch>`). No PR
  unless she asks. Commit messages: imperative summary + bullet body, ending with the attribution lines
  the harness provides. Never put a model name in commits or code.

## 11. Ideas she may ask for next (not started)

Assistant memory of the last plan, push notifications for routines, yearly reading goal, a 7-day moving
average on metric charts, expenses counted on the areas dashboard (`Expense.areaId` exists, no UI yet),
offline support beyond the offline page, Spanish UI translation.
