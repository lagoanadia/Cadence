import { describe, expect, it } from "vitest";
import { summarizeActivity } from "./activity";

describe("summarizeActivity", () => {
  it("counts moments and active days per area", () => {
    const result = summarizeActivity([
      { areaId: "reading", date: "2026-09-21" },
      { areaId: "reading", date: "2026-09-21" },
      { areaId: "reading", date: "2026-09-23" },
      { areaId: "home", date: "2026-09-22" },
    ]);
    expect(result.get("reading")?.moments).toBe(3);
    expect([...(result.get("reading")?.days ?? [])]).toEqual(["2026-09-21", "2026-09-23"]);
    expect(result.get("home")?.moments).toBe(1);
    expect(result.has("coding")).toBe(false);
  });

  it("counts events with the same key only once", () => {
    // Three steps of the same routine on the same day = one moment
    const result = summarizeActivity([
      { areaId: "life", date: "2026-09-21", key: "routine-1-2026-09-21" },
      { areaId: "life", date: "2026-09-21", key: "routine-1-2026-09-21" },
      { areaId: "life", date: "2026-09-21", key: "routine-1-2026-09-21" },
      { areaId: "life", date: "2026-09-22", key: "routine-1-2026-09-22" },
    ]);
    expect(result.get("life")?.moments).toBe(2);
  });
});
