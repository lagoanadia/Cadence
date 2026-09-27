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

  console.log(`Demo account ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
