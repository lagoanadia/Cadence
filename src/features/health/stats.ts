import { addDays, type DayKey } from "@/lib/dates";

export type Workout = {
  id: string;
  type: string;
  durationMin: number;
  notes: string | null;
  date: DayKey;
};

export type WeekStats = {
  minutes: number;
  sessions: number;
  /** One entry per day of the last 7 days (oldest first): did you move that day? */
  days: { date: DayKey; active: boolean }[];
};

/** Pure: summarises the last 7 days from a list of workouts. */
export function weekStats(workouts: Workout[], today: DayKey): WeekStats {
  const start = addDays(today, -6);
  const inWeek = workouts.filter((workout) => workout.date >= start && workout.date <= today);
  const activeDays = new Set(inWeek.map((workout) => workout.date));
  return {
    minutes: inWeek.reduce((sum, workout) => sum + workout.durationMin, 0),
    sessions: inWeek.length,
    days: Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      return { date, active: activeDays.has(date) };
    }),
  };
}
