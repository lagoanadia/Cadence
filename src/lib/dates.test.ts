import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  diffInDays,
  isDayKey,
  lastDayOfMonth,
  startOfWeek,
  todayKey,
  weekdayLabels,
} from "./dates";

describe("todayKey", () => {
  it("uses the user's timezone, not the server's", () => {
    // 23:30 UTC on the 27th is already the 28th in Madrid (UTC+2 in summer)
    const now = new Date("2026-09-27T23:30:00Z");
    expect(todayKey("Europe/Madrid", now)).toBe("2026-09-28");
    expect(todayKey("America/New_York", now)).toBe("2026-09-27");
  });
});

describe("day arithmetic", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("is not affected by daylight saving time changes", () => {
    // Clocks change in Spain on 2026-10-25
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
    expect(diffInDays("2026-10-24", "2026-10-26")).toBe(2);
  });

  it("finds the start of the week", () => {
    // 2026-09-27 is a Sunday
    expect(startOfWeek("2026-09-27", 1)).toBe("2026-09-21");
    expect(startOfWeek("2026-09-27", 0)).toBe("2026-09-27");
  });

  it("handles months", () => {
    expect(lastDayOfMonth("2028-02")).toBe("2028-02-29");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
});

describe("validation and labels", () => {
  it("rejects impossible dates", () => {
    expect(isDayKey("2026-02-30")).toBe(false);
    expect(isDayKey("2026-2-3")).toBe(false);
    expect(isDayKey("2026-02-28")).toBe(true);
  });

  it("orders weekday labels by weekStartsOn", () => {
    expect(weekdayLabels(1)[0]).toBe("Mon");
    expect(weekdayLabels(0)[0]).toBe("Sun");
  });
});
