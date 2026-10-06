import { describe, expect, it } from "vitest";
import { describeAction, findByName, normalize, planSchema } from "./plan";

describe("normalize / findByName", () => {
  it("ignores case and accents", () => {
    expect(normalize("  Café ")).toBe("cafe");
    const items = [{ name: "Comida" }, { name: "Transporte" }];
    expect(findByName(items, "comida")?.name).toBe("Comida");
  });

  it("accepts partial matches in both directions", () => {
    const chores = [{ name: "Poner lavadora" }, { name: "Baño" }];
    expect(findByName(chores, "lavadora")?.name).toBe("Poner lavadora");
    expect(findByName(chores, "limpiar el baño")?.name).toBe("Baño");
    expect(findByName(chores, "aspirar")).toBeNull();
    expect(findByName(chores, null)).toBeNull();
  });
});

describe("planSchema", () => {
  it("accepts the kind of plan the model returns", () => {
    const plan = planSchema.parse({
      reply: "¡Hecho! Te he preparado 3 cosas.",
      actions: [
        { kind: "create_recurring_task", title: "Poner lavadora", frequency: "WEEKLY", daysOfWeek: [6], dayOfMonth: null, time: null, area: "Home" },
        { kind: "set_budget", amountEuros: 240 },
        { kind: "add_expense", amountEuros: 40, category: "Groceries", note: "supermercado", date: "2026-10-06" },
      ],
    });
    expect(plan.actions).toHaveLength(3);
    expect(describeAction(plan.actions[0])).toBe("Repeating: Poner lavadora · every Sat");
    expect(describeAction(plan.actions[2])).toBe("Expense: 40,00 € · supermercado (Groceries)");
  });

  it("rejects unknown action kinds", () => {
    expect(() => planSchema.parse({ reply: "", actions: [{ kind: "delete_everything" }] })).toThrow();
  });
});
