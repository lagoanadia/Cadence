// Recurring tasks and routines are NOT stored once per day in the database.
// We store the *rule* and calculate the days it happens on when we need them.
// These are pure functions (same input → same output, no database, no clock),
// which makes them easy to test: see recurrence.test.ts.

import type { Frequency } from "@/generated/prisma/enums";
import { type DayKey, daysInMonth, eachDay, monthOf, weekdayOf } from "@/lib/dates";

export type RecurrenceRule = {
  frequency: Frequency;
  daysOfWeek: number[]; // used by WEEKLY: 0 = Sunday … 6 = Saturday
  dayOfMonth: number | null; // used by MONTHLY: 1–31
  startDate: DayKey;
  endDate: DayKey | null;
};

export function occursOn(rule: RecurrenceRule, day: DayKey): boolean {
  if (day < rule.startDate) return false;
  if (rule.endDate !== null && day > rule.endDate) return false;

  switch (rule.frequency) {
    case "DAILY":
      return true;
    case "WEEKLY":
      return rule.daysOfWeek.includes(weekdayOf(day));
    case "MONTHLY": {
      if (rule.dayOfMonth === null) return false;
      // "Every 31st" happens on the 30th in April and the 28th/29th in February
      const lastDay = daysInMonth(monthOf(day));
      const target = Math.min(rule.dayOfMonth, lastDay);
      return Number(day.slice(8, 10)) === target;
    }
  }
}

/** All the days between `from` and `to` (both included) on which the rule happens. */
export function getOccurrences(rule: RecurrenceRule, from: DayKey, to: DayKey): DayKey[] {
  return eachDay(from, to).filter((day) => occursOn(rule, day));
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Human-readable summary, e.g. "Every Mon, Wed, Fri". */
export function describeRule(rule: Pick<RecurrenceRule, "frequency" | "daysOfWeek" | "dayOfMonth">): string {
  switch (rule.frequency) {
    case "DAILY":
      return "Every day";
    case "WEEKLY": {
      const days = [...rule.daysOfWeek].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
      if (days.length === 7) return "Every day";
      if (days.length === 5 && !days.includes(0) && !days.includes(6)) return "Weekdays";
      return `Every ${days.map((d) => WEEKDAY_NAMES[d]).join(", ")}`;
    }
    case "MONTHLY":
      return `Monthly on day ${rule.dayOfMonth ?? "?"}`;
  }
}
