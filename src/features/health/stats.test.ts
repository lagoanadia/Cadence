import { describe, expect, it } from "vitest";
import { weekStats } from "./stats";

const workout = (date: string, durationMin: number) => ({ id: date + durationMin, type: "walk", durationMin, notes: null, date });

describe("weekStats", () => {
  it("only counts the last 7 days, today included", () => {
    const stats = weekStats(
      [workout("2026-09-27", 30), workout("2026-09-27", 15), workout("2026-09-21", 40), workout("2026-09-20", 60)],
      "2026-09-27",
    );
    expect(stats.minutes).toBe(85);
    expect(stats.sessions).toBe(3);
    expect(stats.days.filter((day) => day.active).map((day) => day.date)).toEqual(["2026-09-21", "2026-09-27"]);
    expect(stats.days).toHaveLength(7);
  });
});
