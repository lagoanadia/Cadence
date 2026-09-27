import { describe, expect, it } from "vitest";
import { describeRule, getOccurrences, occursOn, type RecurrenceRule } from "./recurrence";

const base: RecurrenceRule = {
  frequency: "DAILY",
  daysOfWeek: [],
  dayOfMonth: null,
  startDate: "2026-01-01",
  endDate: null,
};

describe("occursOn", () => {
  it("never happens before the start date or after the end date", () => {
    const rule = { ...base, startDate: "2026-03-10", endDate: "2026-03-12" };
    expect(occursOn(rule, "2026-03-09")).toBe(false);
    expect(occursOn(rule, "2026-03-10")).toBe(true);
    expect(occursOn(rule, "2026-03-12")).toBe(true);
    expect(occursOn(rule, "2026-03-13")).toBe(false);
  });

  it("WEEKLY happens only on the chosen weekdays", () => {
    const rule: RecurrenceRule = { ...base, frequency: "WEEKLY", daysOfWeek: [1, 3, 5] };
    // 2026-09-28 is a Monday
    expect(occursOn(rule, "2026-09-28")).toBe(true); // Mon
    expect(occursOn(rule, "2026-09-29")).toBe(false); // Tue
    expect(occursOn(rule, "2026-09-30")).toBe(true); // Wed
    expect(occursOn(rule, "2026-10-04")).toBe(false); // Sun
  });

  it("MONTHLY on the 31st falls back to the last day of short months", () => {
    const rule: RecurrenceRule = { ...base, frequency: "MONTHLY", dayOfMonth: 31 };
    expect(occursOn(rule, "2026-01-31")).toBe(true);
    expect(occursOn(rule, "2026-02-28")).toBe(true);
    expect(occursOn(rule, "2026-04-30")).toBe(true);
    expect(occursOn(rule, "2026-04-29")).toBe(false);
  });

  it("MONTHLY handles leap years", () => {
    const rule: RecurrenceRule = { ...base, frequency: "MONTHLY", dayOfMonth: 30 };
    expect(occursOn(rule, "2028-02-29")).toBe(true);
    expect(occursOn(rule, "2028-02-28")).toBe(false);
  });
});

describe("getOccurrences", () => {
  it("lists every matching day in the range", () => {
    const rule: RecurrenceRule = { ...base, frequency: "WEEKLY", daysOfWeek: [0] };
    expect(getOccurrences(rule, "2026-09-01", "2026-09-30")).toEqual([
      "2026-09-06",
      "2026-09-13",
      "2026-09-20",
      "2026-09-27",
    ]);
  });
});

describe("describeRule", () => {
  it("summarises weekly rules starting on Monday", () => {
    expect(describeRule({ frequency: "WEEKLY", daysOfWeek: [0, 1, 3], dayOfMonth: null })).toBe(
      "Every Mon, Wed, Sun",
    );
    expect(describeRule({ frequency: "WEEKLY", daysOfWeek: [1, 2, 3, 4, 5], dayOfMonth: null })).toBe(
      "Weekdays",
    );
  });
});
