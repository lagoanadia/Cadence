import "server-only";
import { db } from "@/lib/db";
import { type DayKey, dateToDayKey, dayKeyToDate, eachDay } from "@/lib/dates";
import { describeRule, occursOn, type RecurrenceRule } from "./recurrence";

// Every function here receives the userId from the caller (a page that got it
// from requireUserId()) and uses it in EVERY `where`. That's what keeps each
// user's data private.

export type AreaSummary = { id: string; name: string; icon: string; color: string };

const areaSelect = { select: { id: true, name: true, icon: true, color: true } } as const;

export type AgendaTask = {
  kind: "task";
  id: string;
  title: string;
  notes: string | null;
  time: string | null;
  date: DayKey;
  done: boolean;
  area: AreaSummary | null;
};

export type AgendaOccurrence = {
  kind: "recurring";
  id: string; // id of the RecurringTask
  title: string;
  time: string | null;
  date: DayKey;
  done: boolean;
  area: AreaSummary | null;
  ruleLabel: string;
};

// A "discriminated union": `kind` tells TypeScript which of the two shapes we have
export type AgendaItem = AgendaTask | AgendaOccurrence;

export type RoutineOccurrence = {
  id: string;
  name: string;
  icon: string | null;
  date: DayKey;
  area: AreaSummary | null;
  steps: { id: string; title: string; done: boolean }[];
};

export type AgendaDay = {
  date: DayKey;
  items: AgendaItem[];
  routines: RoutineOccurrence[];
};

export async function listAreas(userId: string): Promise<AreaSummary[]> {
  return db.area.findMany({
    where: { userId, archivedAt: null },
    orderBy: { position: "asc" },
    ...areaSelect,
  });
}

function toAgendaTask(task: {
  id: string;
  title: string;
  notes: string | null;
  time: string | null;
  date: Date;
  completedAt: Date | null;
  area: AreaSummary | null;
}): AgendaTask {
  return {
    kind: "task",
    id: task.id,
    title: task.title,
    notes: task.notes,
    time: task.time,
    date: dateToDayKey(task.date),
    done: task.completedAt !== null,
    area: task.area,
  };
}

/** Pending items first, then by time (untimed last), then alphabetically. */
function compareItems(a: AgendaItem, b: AgendaItem): number {
  if (a.done !== b.done) return a.done ? 1 : -1;
  if (a.time !== b.time) {
    if (a.time === null) return 1;
    if (b.time === null) return -1;
    return a.time.localeCompare(b.time);
  }
  return a.title.localeCompare(b.title);
}

/**
 * Everything planned between `from` and `to`, grouped by day.
 * It runs 3 queries in parallel (Promise.all) and then combines the results
 * in memory, instead of doing one query per day.
 */
export async function getAgenda(userId: string, from: DayKey, to: DayKey): Promise<AgendaDay[]> {
  const range = { gte: dayKeyToDate(from), lte: dayKeyToDate(to) };

  const [tasks, recurringTasks, routines] = await Promise.all([
    db.task.findMany({
      where: { userId, date: range },
      include: { area: areaSelect },
    }),
    db.recurringTask.findMany({
      where: {
        userId,
        archivedAt: null,
        startDate: { lte: range.lte },
        OR: [{ endDate: null }, { endDate: { gte: range.gte } }],
      },
      include: {
        area: areaSelect,
        completions: { where: { date: range }, select: { date: true } },
      },
    }),
    db.routine.findMany({
      where: { userId, archivedAt: null },
      orderBy: { position: "asc" },
      include: {
        area: areaSelect,
        steps: {
          orderBy: { position: "asc" },
          include: { checks: { where: { date: range }, select: { date: true } } },
        },
      },
    }),
  ]);

  return eachDay(from, to).map((date) => {
    const items: AgendaItem[] = tasks.filter((task) => dateToDayKey(task.date) === date).map(toAgendaTask);

    for (const recurring of recurringTasks) {
      const rule: RecurrenceRule = {
        frequency: recurring.frequency,
        daysOfWeek: recurring.daysOfWeek,
        dayOfMonth: recurring.dayOfMonth,
        startDate: dateToDayKey(recurring.startDate),
        endDate: recurring.endDate ? dateToDayKey(recurring.endDate) : null,
      };
      if (!occursOn(rule, date)) continue;
      items.push({
        kind: "recurring",
        id: recurring.id,
        title: recurring.title,
        time: recurring.time,
        date,
        done: recurring.completions.some((c) => dateToDayKey(c.date) === date),
        area: recurring.area,
        ruleLabel: describeRule(rule),
      });
    }

    const dayRoutines: RoutineOccurrence[] = routines
      .filter((routine) =>
        occursOn(
          {
            frequency: routine.frequency,
            daysOfWeek: routine.daysOfWeek,
            dayOfMonth: routine.dayOfMonth,
            startDate: dateToDayKey(routine.createdAt),
            endDate: null,
          },
          date,
        ),
      )
      .map((routine) => ({
        id: routine.id,
        name: routine.name,
        icon: routine.icon,
        date,
        area: routine.area,
        steps: routine.steps.map((step) => ({
          id: step.id,
          title: step.title,
          done: step.checks.some((c) => dateToDayKey(c.date) === date),
        })),
      }));

    return { date, items: items.sort(compareItems), routines: dayRoutines };
  });
}

/** One-off tasks from past days that aren't done. Missed recurring tasks are never overdue. */
export async function getOverdueTasks(userId: string, today: DayKey): Promise<AgendaTask[]> {
  const tasks = await db.task.findMany({
    where: { userId, completedAt: null, date: { lt: dayKeyToDate(today) } },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    include: { area: areaSelect },
  });
  return tasks.map(toAgendaTask);
}

export type RecurringTaskSummary = {
  id: string;
  title: string;
  time: string | null;
  frequency: RecurrenceRule["frequency"];
  daysOfWeek: number[];
  dayOfMonth: number | null;
  startDate: DayKey;
  area: AreaSummary | null;
  ruleLabel: string;
};

export async function listRecurringTasks(userId: string): Promise<RecurringTaskSummary[]> {
  const rows = await db.recurringTask.findMany({
    where: { userId, archivedAt: null },
    orderBy: [{ time: "asc" }, { title: "asc" }],
    include: { area: areaSelect },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    time: row.time,
    frequency: row.frequency,
    daysOfWeek: row.daysOfWeek,
    dayOfMonth: row.dayOfMonth,
    startDate: dateToDayKey(row.startDate),
    area: row.area,
    ruleLabel: describeRule(row),
  }));
}

export type RoutineSummary = {
  id: string;
  name: string;
  frequency: RecurrenceRule["frequency"];
  daysOfWeek: number[];
  dayOfMonth: number | null;
  area: AreaSummary | null;
  steps: string[];
  ruleLabel: string;
};

export async function listRoutines(userId: string): Promise<RoutineSummary[]> {
  const rows = await db.routine.findMany({
    where: { userId, archivedAt: null },
    orderBy: { position: "asc" },
    include: { area: areaSelect, steps: { orderBy: { position: "asc" } } },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    frequency: row.frequency,
    daysOfWeek: row.daysOfWeek,
    dayOfMonth: row.dayOfMonth,
    area: row.area,
    steps: row.steps.map((step) => step.title),
    ruleLabel: describeRule(row),
  }));
}
