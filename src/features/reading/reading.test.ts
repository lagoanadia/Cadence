import { describe, expect, it } from "vitest";
import { readingStreak } from "./streak";

describe("readingStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(readingStreak(new Set(["2026-09-25", "2026-09-26", "2026-09-27"]), "2026-09-27")).toBe(3);
  });

  it("keeps yesterday's streak alive if you haven't read yet today", () => {
    expect(readingStreak(new Set(["2026-09-25", "2026-09-26"]), "2026-09-27")).toBe(2);
  });

  it("resets after a missed day", () => {
    expect(readingStreak(new Set(["2026-09-20", "2026-09-27"]), "2026-09-27")).toBe(1);
    expect(readingStreak(new Set(["2026-09-24"]), "2026-09-27")).toBe(0);
  });
});
