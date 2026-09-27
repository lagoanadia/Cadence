import { addDays, type DayKey } from "@/lib/dates";

/** Pure: counts consecutive reading days. A streak survives if you haven't read YET today. */
export function readingStreak(daysWithReading: Set<DayKey>, today: DayKey): number {
  let day = daysWithReading.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (daysWithReading.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}
