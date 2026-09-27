import "server-only";
import { db } from "@/lib/db";
import { addDays, type DayKey, dateToDayKey, dayKeyToDate } from "@/lib/dates";
import type { Workout } from "./stats";

export type { Workout, WeekStats } from "./stats";

export type MetricPoint = { date: DayKey; value: number };

export type Metric = {
  id: string;
  name: string;
  unit: string | null;
  points: MetricPoint[]; // oldest first
};

export const CHART_DAYS = 30;

export async function listRecentWorkouts(userId: string, today: DayKey): Promise<Workout[]> {
  const rows = await db.workout.findMany({
    where: { userId, date: { gte: dayKeyToDate(addDays(today, -30)) } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    durationMin: row.durationMin,
    notes: row.notes,
    date: dateToDayKey(row.date),
  }));
}

export async function listMetrics(userId: string, today: DayKey): Promise<Metric[]> {
  const metrics = await db.metric.findMany({
    where: { userId },
    orderBy: { position: "asc" },
    include: {
      entries: {
        where: { date: { gte: dayKeyToDate(addDays(today, -(CHART_DAYS - 1))) } },
        orderBy: { date: "asc" },
        select: { date: true, value: true },
      },
    },
  });
  return metrics.map((metric) => ({
    id: metric.id,
    name: metric.name,
    unit: metric.unit,
    points: metric.entries.map((entry) => ({ date: dateToDayKey(entry.date), value: entry.value })),
  }));
}
