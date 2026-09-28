// Demo account with fake data, for portfolio screenshots.
// Run with: npx prisma db seed
// It is safe to run many times: the demo user is deleted and created again.
// Dates are relative to "today", so the demo always looks alive.

import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { addDays, type DayKey, dayKeyToDate, startOfWeek, todayKey } from "../src/lib/dates";
import { setupNewUser } from "../src/lib/new-user";

const DEMO_ID = "demo-user"; // fixed id, so an open demo session survives a re-seed
const DEMO_EMAIL = "demo@cadence.app";
const DEMO_PASSWORD = "demo1234";

// A tiny seeded random generator ("mulberry32"): same numbers on every run,
// so the demo screenshots always look the same.
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = seededRandom(42);
const between = (min: number, max: number) => Math.round(min + random() * (max - min));

async function main() {
  const today = todayKey("Europe/Madrid");
  const monday = startOfWeek(today, 1);
  const day = (offset: number): Date => dayKeyToDate(addDays(today, offset));

  // Cascade deletes remove all the demo user's data too
  await db.user.deleteMany({ where: { id: DEMO_ID } });
  await db.user.create({
    data: {
      id: DEMO_ID,
      name: "Alex Demo",
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12),
    },
  });
  await setupNewUser(DEMO_ID);

  const areas = await db.area.findMany({ where: { userId: DEMO_ID } });
  const area = (name: string): string => {
    const found = areas.find((a) => a.name === name);
    if (!found) throw new Error(`Missing area ${name}`);
    return found.id;
  };

  // ── One-off tasks ──
  await db.task.createMany({
    data: [
      { title: "Finish database practice exercises", date: day(-2), areaId: area("Studies") },
      { title: "Book dentist appointment", date: day(-1), areaId: area("Personal Life") },
      { title: "Read 20 pages of Atomic Habits", date: day(0), time: "21:30", areaId: area("Reading") },
      { title: "Push portfolio project to GitHub", date: day(0), time: "18:00", areaId: area("Coding") },
      { title: "Call grandma", date: day(0), areaId: area("Personal Life"), completedAt: new Date() },
      { title: "Buy groceries", date: day(0), time: "12:00", areaId: area("Home"), completedAt: new Date() },
      { title: "Kotlin exam", date: day(2), time: "09:00", areaId: area("Studies"), notes: "Unit 4 to 6" },
      { title: "Yoga class", date: day(1), time: "19:00", areaId: area("Health & Movement") },
      { title: "Review monthly budget", date: day(3), areaId: area("Finances") },
      { title: "Refactor Android app navigation", date: day(4), areaId: area("Coding") },
      { title: "Library: return books", date: day(6), areaId: area("Reading") },
      { title: "Dinner with friends", date: day(9), time: "21:00", areaId: area("Personal Life") },
      { title: "Submit FP project proposal", date: day(12), areaId: area("Studies") },
      { title: "Clean up old notes", date: day(-5), areaId: area("Studies"), completedAt: new Date() },
      { title: "Update CV", date: day(-4), areaId: area("Coding"), completedAt: new Date() },
    ].map((task) => ({ ...task, userId: DEMO_ID })),
  });

  // ── Recurring tasks ──
  const recurring = await db.recurringTask.createManyAndReturn({
    data: [
      { title: "Duolingo lesson", frequency: "DAILY" as const, areaId: area("Studies") },
      {
        title: "30 min coding practice",
        frequency: "WEEKLY" as const,
        daysOfWeek: [1, 3, 5],
        time: "17:00",
        areaId: area("Coding"),
      },
      { title: "Water the plants", frequency: "WEEKLY" as const, daysOfWeek: [0], areaId: area("Home") },
      { title: "Pay rent", frequency: "MONTHLY" as const, dayOfMonth: 1, areaId: area("Finances") },
    ].map((task) => ({ ...task, userId: DEMO_ID, startDate: day(-60) })),
  });

  // Completed occurrences on the last few days (some missed on purpose — that's life)
  const duolingo = recurring[0];
  const completions: { recurringTaskId: string; userId: string; date: Date }[] = [];
  for (const offset of [-6, -5, -3, -2, -1]) {
    completions.push({ recurringTaskId: duolingo.id, userId: DEMO_ID, date: day(offset) });
  }
  await db.recurringTaskCompletion.createMany({ data: completions });

  // ── Routines ──
  const morning = await db.routine.create({
    data: {
      userId: DEMO_ID,
      name: "Morning routine",
      icon: "sunrise",
      areaId: area("Personal Life"),
      position: 0,
      createdAt: day(-30),
      steps: {
        create: ["Make the bed", "Glass of water", "Stretch 5 minutes", "Breakfast"].map((title, position) => ({
          title,
          position,
        })),
      },
    },
    include: { steps: true },
  });
  await db.routine.create({
    data: {
      userId: DEMO_ID,
      name: "Evening wind-down",
      icon: "sparkles",
      areaId: area("Health & Movement"),
      position: 1,
      frequency: "WEEKLY",
      daysOfWeek: [0, 1, 2, 3, 4],
      createdAt: day(-30),
      steps: {
        create: ["Plan tomorrow", "Phone away", "Read 10 minutes"].map((title, position) => ({ title, position })),
      },
    },
  });

  // Morning routine: fully done on past days of this week, half done today
  const checks: { stepId: string; userId: string; date: Date }[] = [];
  for (let d: DayKey = monday; d < today; d = addDays(d, 1)) {
    for (const step of morning.steps) checks.push({ stepId: step.id, userId: DEMO_ID, date: dayKeyToDate(d) });
  }
  for (const step of morning.steps.slice(0, 2)) {
    checks.push({ stepId: step.id, userId: DEMO_ID, date: dayKeyToDate(today) });
  }
  await db.routineStepCheck.createMany({ data: checks });

  await seedExpenses(today, day);
  await seedChores(today);
  await seedReading(day, area("Reading"));
  await seedHealth(day, area("Health & Movement"));
  await db.userSettings.update({ where: { userId: DEMO_ID }, data: { monthlyBudgetCents: 90000 } });

  console.log(`Demo account ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

async function seedExpenses(today: DayKey, day: (offset: number) => Date) {
  const categories = await db.expenseCategory.findMany({ where: { userId: DEMO_ID } });
  const category = (name: string) => categories.find((c) => c.name === name)?.id ?? null;

  // [days ago, euros, category, note]
  const rows: [number, number, string, string | null][] = [
    [0, 3.2, "Food", "coffee"],
    [0, 24.85, "Groceries", null],
    [1, 12.5, "Leisure", "cinema"],
    [1, 1.5, "Transport", "bus"],
    [2, 8.9, "Food", "lunch"],
    [3, 45.0, "Health", "gym membership"],
    [3, 1.5, "Transport", "bus"],
    [4, 31.4, "Groceries", null],
    [5, 19.99, "Shopping", "t-shirt"],
    [6, 2.8, "Food", "coffee"],
    [7, 60.0, "Home", "electricity"],
    [8, 14.3, "Food", "pizza night"],
    [9, 27.6, "Groceries", null],
    [10, 9.99, "Leisure", "music subscription"],
    [12, 1.5, "Transport", "bus"],
    [13, 38.2, "Groceries", null],
    [15, 22.0, "Leisure", "concert"],
    [18, 350.0, "Home", "rent"],
    [20, 16.45, "Food", "sushi"],
    [24, 29.9, "Groceries", null],
    [30, 12.0, "Transport", "train"],
    [33, 41.3, "Groceries", null],
  ];
  const monthStart = `${today.slice(0, 7)}-01`;
  await db.expense.createMany({
    data: rows
      // Only this month and last month, so "This month" never shows future-looking data
      .filter(([daysAgo]) => addDays(today, -daysAgo) >= addDays(monthStart, -31))
      .map(([daysAgo, euros, name, note]) => ({
        userId: DEMO_ID,
        amountCents: Math.round(euros * 100),
        categoryId: category(name),
        note,
        date: day(-daysAgo),
      })),
  });
}

async function seedChores(today: DayKey) {
  const chores = await db.chore.findMany({ where: { userId: DEMO_ID } });
  await db.chore.create({
    data: { userId: DEMO_ID, name: "Water the plants", icon: "flower", frequencyDays: 3, position: chores.length },
  });
  // Days ago each chore was last done: some fresh, one overdue, one due soon
  const lastDone: Record<string, number[]> = {
    Laundry: [2, 6, 10],
    Vacuuming: [9, 16],
    Bathroom: [5, 12],
    "Change bed sheets": [3],
    "Take out recycling": [0, 5, 9],
  };
  const logs = chores.flatMap((chore) =>
    (lastDone[chore.name] ?? []).map((daysAgo) => ({
      choreId: chore.id,
      userId: DEMO_ID,
      date: dayKeyToDate(addDays(today, -daysAgo)),
    })),
  );
  await db.choreLog.createMany({ data: logs });
}

async function seedReading(day: (offset: number) => Date, areaId: string) {
  const reading = await db.book.create({
    data: {
      userId: DEMO_ID,
      areaId,
      title: "Atomic Habits",
      author: "James Clear",
      status: "READING",
      currentPage: 142,
      totalPages: 320,
      startedAt: day(-12),
    },
  });
  const second = await db.book.create({
    data: {
      userId: DEMO_ID,
      areaId,
      title: "Clean Code",
      author: "Robert C. Martin",
      status: "READING",
      currentPage: 58,
      totalPages: 464,
      startedAt: day(-5),
    },
  });
  await db.book.createMany({
    data: [
      { title: "The Pragmatic Programmer", author: "Hunt & Thomas", status: "WANT_TO_READ" as const },
      { title: "Project Hail Mary", author: "Andy Weir", status: "WANT_TO_READ" as const },
      {
        title: "Klara and the Sun",
        author: "Kazuo Ishiguro",
        status: "FINISHED" as const,
        currentPage: 303,
        totalPages: 303,
        finishedAt: day(-20),
        rating: 5,
        review: "Quiet and heartbreaking. Klara's hope stayed with me for days.",
      },
    ].map((book) => ({ ...book, userId: DEMO_ID, areaId })),
  });
  // A 5-day streak, with a gap before it
  await db.readingLog.createMany({
    data: [
      ...[-4, -3, -2, -1, 0].map((offset) => ({ bookId: reading.id, date: day(offset), pages: between(8, 30) })),
      { bookId: second.id, date: day(-2), pages: 15 },
      { bookId: reading.id, date: day(-7), pages: 22 },
    ].map((log) => ({ ...log, userId: DEMO_ID })),
  });
}

async function seedHealth(day: (offset: number) => Date, areaId: string) {
  await db.workout.createMany({
    data: [
      { daysAgo: 0, type: "walk", durationMin: 35, notes: "Around the park" },
      { daysAgo: 1, type: "yoga", durationMin: 25, notes: null },
      { daysAgo: 3, type: "gym", durationMin: 50, notes: "Upper body" },
      { daysAgo: 5, type: "cycling", durationMin: 40, notes: null },
      { daysAgo: 8, type: "walk", durationMin: 30, notes: null },
      { daysAgo: 10, type: "gym", durationMin: 45, notes: null },
      { daysAgo: 14, type: "swim", durationMin: 30, notes: "First time in months!" },
    ].map(({ daysAgo, ...workout }) => ({ ...workout, userId: DEMO_ID, areaId, date: day(-daysAgo) })),
  });

  const steps = await db.metric.create({ data: { userId: DEMO_ID, areaId, name: "Steps", unit: "steps", position: 0 } });
  const sleep = await db.metric.create({ data: { userId: DEMO_ID, areaId, name: "Sleep", unit: "h", position: 1 } });
  const entries = [];
  for (let offset = -29; offset <= 0; offset++) {
    // Skip a few days: real logs have gaps
    if (random() < 0.15) continue;
    entries.push({ metricId: steps.id, userId: DEMO_ID, date: day(offset), value: between(4000, 11000) });
    entries.push({ metricId: sleep.id, userId: DEMO_ID, date: day(offset), value: between(60, 85) / 10 });
  }
  await db.metricEntry.createMany({ data: entries });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
