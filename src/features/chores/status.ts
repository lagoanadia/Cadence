import { type DayKey, diffInDays } from "@/lib/dates";

export type ChoreStatus =
  | { kind: "never" } // never done yet
  | { kind: "done-today" }
  | { kind: "ok"; daysSince: number; dueIn: number | null } // dueIn null = no ideal frequency
  | { kind: "overdue"; daysSince: number; daysLate: number };

/** Pure function (easy to test): works out a chore's status from its last date. */
export function choreStatus(lastDone: DayKey | null, frequencyDays: number | null, today: DayKey): ChoreStatus {
  if (lastDone === null) return { kind: "never" };
  const daysSince = diffInDays(lastDone, today);
  if (daysSince <= 0) return { kind: "done-today" };
  if (frequencyDays === null) return { kind: "ok", daysSince, dueIn: null };
  const dueIn = frequencyDays - daysSince;
  if (dueIn < 0) return { kind: "overdue", daysSince, daysLate: -dueIn };
  return { kind: "ok", daysSince, dueIn };
}
