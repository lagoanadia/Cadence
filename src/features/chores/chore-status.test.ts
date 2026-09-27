import { describe, expect, it } from "vitest";
import { choreStatus } from "./status";

describe("choreStatus", () => {
  it("knows when a chore was never done or done today", () => {
    expect(choreStatus(null, 7, "2026-09-27")).toEqual({ kind: "never" });
    expect(choreStatus("2026-09-27", 7, "2026-09-27")).toEqual({ kind: "done-today" });
  });

  it("counts days until it's due", () => {
    expect(choreStatus("2026-09-24", 7, "2026-09-27")).toEqual({ kind: "ok", daysSince: 3, dueIn: 4 });
    expect(choreStatus("2026-09-20", 7, "2026-09-27")).toEqual({ kind: "ok", daysSince: 7, dueIn: 0 });
  });

  it("marks it overdue after its ideal frequency", () => {
    expect(choreStatus("2026-09-17", 7, "2026-09-27")).toEqual({ kind: "overdue", daysSince: 10, daysLate: 3 });
  });

  it("is never overdue without an ideal frequency", () => {
    expect(choreStatus("2026-01-01", null, "2026-09-27")).toMatchObject({ kind: "ok", dueIn: null });
  });
});
