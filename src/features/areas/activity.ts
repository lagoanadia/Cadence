import type { DayKey } from "@/lib/dates";

/**
 * One "moment" of attention to an area: a task done, a routine checked, a chore
 * done, pages read, a workout, a metric logged… `key` lets several events count
 * as one moment (e.g. all the steps of one routine on one day).
 */
export type ActivityEvent = { areaId: string; date: DayKey; key?: string };

export type AreaActivity = { moments: number; days: Set<DayKey> };

/** Pure: groups events by area, counting moments and the days they happened on. */
export function summarizeActivity(events: ActivityEvent[]): Map<string, AreaActivity> {
  const result = new Map<string, AreaActivity>();
  const seenKeys = new Set<string>();

  for (const event of events) {
    if (event.key) {
      if (seenKeys.has(event.key)) continue;
      seenKeys.add(event.key);
    }
    const entry = result.get(event.areaId) ?? { moments: 0, days: new Set<DayKey>() };
    entry.moments += 1;
    entry.days.add(event.date);
    result.set(event.areaId, entry);
  }
  return result;
}
