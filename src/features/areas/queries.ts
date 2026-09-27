import "server-only";
import { db } from "@/lib/db";
import { type DayKey, dateToDayKey, dayKeyToDate } from "@/lib/dates";
import { type ActivityEvent, type AreaActivity, summarizeActivity } from "./activity";

export type { AreaActivity };

/**
 * Collects every logged thing linked to an area between two days.
 * Seven small queries run in parallel; each selects only the two or three
 * columns we need. Then a pure function does the counting.
 */
export async function getAreaActivity(userId: string, from: DayKey, to: DayKey): Promise<Map<string, AreaActivity>> {
  const date = { gte: dayKeyToDate(from), lte: dayKeyToDate(to) };

  const [tasks, recurring, routineChecks, chores, reading, workouts, metrics] = await Promise.all([
    db.task.findMany({
      where: { userId, date, completedAt: { not: null }, areaId: { not: null } },
      select: { areaId: true, date: true },
    }),
    db.recurringTaskCompletion.findMany({
      where: { userId, date, recurringTask: { areaId: { not: null } } },
      select: { date: true, recurringTask: { select: { areaId: true } } },
    }),
    db.routineStepCheck.findMany({
      where: { userId, date, step: { routine: { areaId: { not: null } } } },
      select: { date: true, step: { select: { routine: { select: { id: true, areaId: true } } } } },
    }),
    db.choreLog.findMany({
      where: { userId, date, chore: { areaId: { not: null } } },
      select: { date: true, chore: { select: { areaId: true } } },
    }),
    db.readingLog.findMany({
      where: { userId, date, book: { areaId: { not: null } } },
      select: { date: true, book: { select: { areaId: true } } },
    }),
    db.workout.findMany({ where: { userId, date, areaId: { not: null } }, select: { areaId: true, date: true } }),
    db.metricEntry.findMany({
      where: { userId, date, metric: { areaId: { not: null } } },
      select: { date: true, metric: { select: { areaId: true } } },
    }),
  ]);

  const events: ActivityEvent[] = [];
  const push = (areaId: string | null, day: Date, key?: string) => {
    if (areaId) events.push({ areaId, date: dateToDayKey(day), key });
  };

  for (const row of tasks) push(row.areaId, row.date);
  for (const row of recurring) push(row.recurringTask.areaId, row.date);
  for (const row of routineChecks) {
    const routine = row.step.routine;
    // All the steps of one routine on one day count as ONE moment
    push(routine.areaId, row.date, `routine-${routine.id}-${dateToDayKey(row.date)}`);
  }
  for (const row of chores) push(row.chore.areaId, row.date);
  for (const row of reading) push(row.book.areaId, row.date);
  for (const row of workouts) push(row.areaId, row.date);
  for (const row of metrics) push(row.metric.areaId, row.date);

  return summarizeActivity(events);
}
