// Date helpers built around "day keys": plain strings like "2026-09-27".
//
// Why strings instead of Date objects? A JS Date is an exact *moment* in time,
// so "Tuesday" can turn into "Monday 22:00" when it's converted between
// timezones. A day key has no time and no timezone, so it can't shift.
//
// All the arithmetic below is done in UTC on purpose: UTC has no daylight
// saving time, so adding 1 day always adds exactly 24h.

export type DayKey = string; // "YYYY-MM-DD"
export type MonthKey = string; // "YYYY-MM"

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_RE = /^\d{4}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isDayKey(value: string): value is DayKey {
  if (!DAY_KEY_RE.test(value)) return false;
  // "2026-02-31" matches the regex but isn't a real day
  return dateToDayKey(new Date(`${value}T00:00:00Z`)) === value;
}

export function isMonthKey(value: string): value is MonthKey {
  if (!MONTH_KEY_RE.test(value)) return false;
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}

/** Today's date as seen by a user living in `timeZone`. */
export function todayKey(timeZone: string, now: Date = new Date()): DayKey {
  // The "en-CA" locale formats dates as YYYY-MM-DD, which is exactly a day key.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Day key → Date at UTC midnight. This is what Prisma expects for @db.Date columns. */
export function dayKeyToDate(key: DayKey): Date {
  return new Date(`${key}T00:00:00Z`);
}

/** Date coming from a @db.Date column → day key. */
export function dateToDayKey(date: Date): DayKey {
  return date.toISOString().slice(0, 10);
}

export function addDays(key: DayKey, amount: number): DayKey {
  return dateToDayKey(new Date(dayKeyToDate(key).getTime() + amount * MS_PER_DAY));
}

/** Number of days from `from` to `to` (positive if `to` is later). */
export function diffInDays(from: DayKey, to: DayKey): number {
  return Math.round((dayKeyToDate(to).getTime() - dayKeyToDate(from).getTime()) / MS_PER_DAY);
}

/** 0 = Sunday … 6 = Saturday (same convention as Date.getDay). */
export function weekdayOf(key: DayKey): number {
  return dayKeyToDate(key).getUTCDay();
}

export function startOfWeek(key: DayKey, weekStartsOn: number): DayKey {
  const offset = (weekdayOf(key) - weekStartsOn + 7) % 7;
  return addDays(key, -offset);
}

/** Every day from `from` to `to`, both included. */
export function eachDay(from: DayKey, to: DayKey): DayKey[] {
  const days: DayKey[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}

export function monthOf(key: DayKey): MonthKey {
  return key.slice(0, 7);
}

export function daysInMonth(month: MonthKey): number {
  const [year, m] = month.split("-").map(Number);
  // Day 0 of the next month is the last day of this month
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

export function firstDayOfMonth(month: MonthKey): DayKey {
  return `${month}-01`;
}

export function lastDayOfMonth(month: MonthKey): DayKey {
  return `${month}-${String(daysInMonth(month)).padStart(2, "0")}`;
}

export function addMonths(month: MonthKey, amount: number): MonthKey {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}

// ── Formatting ──
// We always pass timeZone: "UTC" because our Dates live at UTC midnight.
// Without it, a browser in America would show the previous day.

const LOCALE = "en-GB";

export function formatDay(key: DayKey, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: "UTC" }).format(dayKeyToDate(key));
}

export function formatMonth(month: MonthKey): string {
  return formatDay(firstDayOfMonth(month), { month: "long", year: "numeric" });
}

/** Short weekday names ordered starting at `weekStartsOn`. */
export function weekdayLabels(weekStartsOn: number): string[] {
  // 2023-01-01 was a Sunday, so 2023-01-01 + i is weekday i
  return Array.from({ length: 7 }, (_, i) =>
    formatDay(addDays("2023-01-01", (weekStartsOn + i) % 7), { weekday: "short" }),
  );
}

/** "Today", "Tomorrow", "Yesterday" or a short date. */
export function relativeDayLabel(key: DayKey, today: DayKey): string {
  const diff = diffInDays(today, key);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatDay(key, { weekday: "short", day: "numeric", month: "short" });
}
