# Cadence — learning guide

This guide explains **how Cadence works and why it's built this way**, phase by phase.
Read it with the code open next to it. Every section ends with "Try it" — small exercises
that make you touch the code, which is the fastest way to really understand it.

---

## 0. The big picture

```
Browser                         Server (Next.js)                       PostgreSQL
───────                         ────────────────                       ──────────
page request ─────────────────▶ Server Component (page.tsx)
                                  └─ queries.ts ── Prisma ───────────▶  SELECT …
                ◀──── HTML ──────┘
tap a checkbox ──────────────▶ Server Action (actions.ts)
  (Client Component)              ├─ requireUserId()   ← who are you?
                                  ├─ Zod               ← is the input valid?
                                  ├─ Prisma ─────────────────────────▶  UPDATE … WHERE userId = …
                                  └─ revalidatePath()  ← refresh the pages
                ◀── new HTML ────┘
```

Three ideas repeat in every module:

1. **Reads** live in `features/<module>/queries.ts` and are called from pages (Server Components).
2. **Writes** live in `features/<module>/actions.ts` as Server Actions (`"use server"`).
3. **Every query filters by `userId`**, and the `userId` always comes from the session cookie —
   never from the browser. That single rule is what keeps everyone's data private.

---

## Phase 1 — Auth + Agenda

**Files to read first:** `src/lib/auth.ts`, `src/lib/session.ts`, `src/features/agenda/recurrence.ts`, `src/lib/dates.ts`.

### Auth
- **Auth.js** handles login. We have 3 providers: email/password (`Credentials`), Google and GitHub.
- Passwords are hashed with **bcrypt** (`registerAction`). A hash is one-way: even we can't read the password.
- Sessions are **JWT**: an encrypted cookie that contains your user id. `requireUserId()` reads it.
- Google/GitHub users are saved by the **Prisma adapter**; the `events.createUser` hook gives them default areas, categories and chores.

### Dates without bugs
- We store days as `@db.Date` and handle them in code as strings like `"2026-09-27"` (`DayKey`).
- A `Date` is a *moment*; converted between timezones, "Tuesday" can become "Monday 22:00". A string can't move.
- "Today" is calculated in the **user's** timezone (`todayKey(timezone)`), not the server's.
- ⚠️ Hydration lesson: Node and Chrome format dates slightly differently ("Wed 23 Sept" vs "Wed, 23 Sept"),
  so labels are formatted **on the server** and passed down as text.

### Recurring tasks are rules, not copies
`occursOn(rule, day)` is a **pure function**: no database, no clock. The agenda asks it "does this happen
on day X?" for every day on screen. Only *completions* are stored. See the tests in `recurrence.test.ts`.

### Try it
1. Add a "every 2 weeks" option: add an `interval` field to the rule and handle it in `occursOn`. Write the test first.
2. Change `compareItems` in `agenda/queries.ts` so timed tasks come before untimed ones even when done.

---

## Phase 2 — Money (Expenses)

**Files:** `src/lib/money.ts`, `src/features/expenses/actions.ts`, `src/lib/storage.ts`, `src/app/api/receipts/[id]/route.ts`.

### Money is integers
`12,50 €` is stored as `1250` (cents). Floats can't represent most decimals exactly (`0.1 + 0.2 !== 0.3`).
`parseEuroInput` accepts `12,5`, `12.50`, `1.234,56`… and `formatEuros` formats by hand (again: hydration).

### Designed for 5 seconds
The amount field has `autoFocus` + `inputMode="decimal"` (numeric keyboard opens immediately), categories are
one tap, the date defaults to today. If you type a word instead, the server checks whether it's a category
name ("transport" → Transport); otherwise it becomes the note.

### Private receipt photos
1. The browser **compresses** the photo first (`compress-image.ts`: canvas → JPEG, max 1600px). A 5 MB photo becomes ~300 KB.
2. The Server Action uploads it to **Vercel Blob with `access: "private"`**.
3. The page shows it via `/api/receipts/<expenseId>`, a **Route Handler** that looks up the expense by
   `id AND userId`. Another user gets 404; a logged-out visitor gets 401.
4. `storage.ts` uses the **strategy pattern**: the same interface backed by Vercel Blob or a local folder (dev only).

### A hand-edited migration
Renaming `receiptUrl → receiptPath`, Prisma generated `DROP COLUMN + ADD COLUMN` (data loss!).
We edited the SQL to `RENAME COLUMN`. Always read generated migrations before applying them.

### Try it
1. Add a "repeat last expense" button to the quick-add sheet.
2. Add a test to `money.test.ts` for `"1 234,56"` (space as thousands separator) and make it pass.

---

## Phase 3 — Home (Chores)

**Files:** `src/features/chores/status.ts`, `queries.ts`, `components/chore-list.tsx`.

- `choreStatus(lastDone, frequencyDays, today)` is pure → easy to test (`chore-status.test.ts`).
- Its return type is a **discriminated union** (`kind: "never" | "done-today" | "ok" | "overdue"`).
  In a `switch (status.kind)` TypeScript knows exactly which fields exist in each branch.
- Only the latest 5 logs per chore are loaded (`take: 5`): never load more than the screen needs.
- The "Did it" button uses **`useOptimistic`**: it flips instantly, the server confirms afterwards.
- Copy matters: overdue says "could use some love", not "OVERDUE".

### Try it
1. Show a small history ("done on 21 Sept, 14 Sept…") in the edit sheet using `chore.recent`.
2. Add "snooze 1 day" for overdue chores. (Hint: you'll need a new field or a log with a flag — think about which is cleaner.)

---

## Phase 4 — Growth areas dashboard + private mode

**Files:** `src/features/areas/queries.ts`, `activity.ts`, `src/app/(app)/areas/page.tsx`.

- `getAreaActivity` runs **7 small queries in parallel** (`Promise.all`), one per source (tasks, recurring,
  routines, chores, reading, workouts, metrics), each selecting only 2–3 columns.
- `summarizeActivity` (pure) turns them into "moments" per area. All the steps of one routine on one day
  count as **one** moment — that's what the `key` field is for.
- The page never shows scores or red: areas without activity are "Resting — no pressure", with a "Plan" button.
- **Private mode** (`components/ui/private.tsx`) replaces names and numbers on the **server**. The real values
  never reach the browser, so even "View source" can't reveal them. (CSS blur would be fake privacy.)

### Try it
1. Count expenses linked to an area as moments too (the schema already has `Expense.areaId`).
2. Add a "last 4 weeks" mini chart per area. Read `docs` of the dataviz rules in this guide's last section first.

---

## Phase 5 — Reading

**Files:** `src/features/reading/actions.ts` (`logPagesAction`), `streak.ts`.

- Logging pages writes **two rows that must stay consistent** (the log + the book's `currentPage`),
  so they're wrapped in `db.$transaction([...])`: both happen, or neither.
- Reaching the last page automatically marks the book as finished.
- `readingStreak` (pure) keeps yesterday's streak alive if you haven't read *yet* today — a small kindness.
- Zod `.refine()` checks rules that involve two fields ("current page ≤ total pages").

### Ratings and reviews
A **purely additive migration** (`ADD COLUMN rating INTEGER, review TEXT`, both optional) — safe for
existing data, so it ran automatically on the next Vercel deploy. `StarPicker` keeps its value in a
hidden `<input>`, so it works with a normal form submission.

### Try it
1. Add a yearly goal ("12 books in 2026") with a progress bar.
2. Show pages per day for the last 7 days as a small bar chart.

---

## Phase 6 — Health & Movement

**Files:** `src/features/health/actions.ts`, `stats.ts`, `components/metric-chart.tsx`.

- Metrics are **user-defined** (name + unit). One value per metric per day, enforced by
  `@@unique([metricId, date])` and written with **`upsert`** (insert or update).
- The chart is hand-made SVG — no chart library:
  - the line is SVG with `vectorEffect="non-scaling-stroke"` (stays 2px when stretched),
  - labels, marker and tooltip are HTML on top (text never gets distorted),
  - pointer events find the nearest point for the tooltip (works with mouse and touch),
  - a `<details>` table shows the same data for screen readers.
- Language is neutral on purpose: no weight/diet defaults anywhere.

### Try it
1. Add a 7-day moving average line to the chart (a second path, thinner, and a legend — two series now!).
2. Let workouts have an optional "intensity" (1–3) and show it as dots in the list.

---

## The iOS look

- **Design tokens** in `globals.css`: colors are named by role (`--surface`, `--muted`…). Dark mode swaps values only.
- Custom Tailwind utilities (`@utility`): `ios-list` (white rounded group), `ios-rows` (hairline separators
  inset like iOS), `section-title`, `large-title`.
- Components copy iOS patterns: large titles, inset grouped lists, segmented controls, the switch, bottom
  sheets with a grabber, a translucent tab bar with `backdrop-blur`.
- The area/category palette is **monochrome amber** — all 8 swatches are shades of yellow, by product
  choice, not a rainbow of hues. That means color alone can't tell two areas apart, so colors never carry
  meaning alone: there's always a name or icon next to them.
- Color overall is kept scarce on purpose: backgrounds are near-neutral (near-white in light mode,
  near-black in dark) with only a faint yellow glow, not a colored gradient — so the single yellow accent
  stands out instead of competing with everything else.

## Testing

- `npm test` runs unit tests for all the pure logic (dates, recurrence, money, chores, reading, stats, areas).
- Notice the pattern: **the logic worth testing was pulled out into pure files** (`status.ts`, `streak.ts`,
  `stats.ts`, `activity.ts`). Pure functions need no database and no mocks.

## Where to go next

1. Write a Playwright end-to-end test for your favorite flow and add it to the repo.
2. Deploy to Vercel (see README) and install it on your phone.
3. Add push notifications for routines (the Next.js PWA guide in `node_modules/next/dist/docs` explains how).

---

## Phase 7 — Liquid glass, contextual "+" and the AI assistant

### Liquid glass (`globals.css`)
Glass needs **something behind it**: the page has a fixed gradient background (`--bg-image`,
`background-attachment: fixed`), and surfaces are *translucent* (`rgba(255,255,255,0.08)`).
The `glass` / `ios-list` utilities add `backdrop-filter: blur() saturate()` (blurs what's behind),
a light border and an inner top highlight (`inset 0 1px 0`) that makes the edge look curved.

Yellow has two tokens: `accent-fill` (the yellow for buttons and selections, with dark text on top)
and `accent` (the color for text and icons: yellow in dark mode, deep amber in light mode, because yellow
text on a light background is unreadable). Separating "fill" from "ink" is a common design-system pattern.

### Contextual "+" (`quick-add.tsx`)
`modeForPath(pathname)` maps the current URL to the form that makes sense there (Money → expense,
Home → chore…). The full menu is still one tap away ("Something else…"). Small pure function = easy to change.

### The assistant (`src/features/assistant/`)
1. **Voice** uses the browser's own speech recognition (`webkitSpeechRecognition`): free, no audio
   leaves the device through our server. It only fills the text box.
2. `planAssistantAction` sends the text + your lists (areas, categories, chores, books) and today's date to
   Claude with a **structured output**: the answer must match the Zod `planSchema` (a list of typed
   actions). No free text to parse with regexes.
3. **Nothing is saved yet.** You see the proposed actions, untick what you don't want, then
   `applyAssistantAction` runs. It **re-validates** everything (the browser could send anything) and
   `executeAction` matches names only against *your* rows, rejecting impossible values.
4. Design choices: low effort (it's an extraction job, so it's faster), a cached system prompt
   (cheaper), typed SDK errors handled from most specific to least, and server-side refusal fallbacks
   (`fallbacks: "default"`).

### Try it
1. Add a new action kind, e.g. `create_book` ("quiero leer Dune"): schema → description → executor → test.
2. Show the assistant's last plan again after a reload (hint: keep it in `localStorage`).
