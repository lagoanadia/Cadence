import { z } from "zod";

// The assistant turns free text ("tengo que poner la lavadora cada semana y hoy
// gasté 40 € en el súper") into a PLAN: a list of small, typed actions.
// Nothing is saved until the user reviews the plan and confirms it.
//
// This schema is sent to Claude as a "structured output": the API guarantees
// the answer is JSON matching it. Every field is required; "no value" is null
// (structured outputs work best without optional fields).

const dayKey = z.string().describe("Date as YYYY-MM-DD");
const time = z.string().nullable().describe("24h time HH:mm, or null if no time was mentioned");
const areaName = z.string().nullable().describe("One of the user's area names, exactly as listed, or null");

export const actionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("create_task"),
    title: z.string(),
    date: dayKey,
    time,
    area: areaName,
  }),
  z.object({
    kind: z.literal("create_recurring_task"),
    title: z.string(),
    frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
    daysOfWeek: z.array(z.number().int()).describe("For WEEKLY: 0=Sunday … 6=Saturday. Empty otherwise."),
    dayOfMonth: z.number().int().nullable().describe("For MONTHLY: 1-31. Null otherwise."),
    time,
    area: areaName,
  }),
  z.object({
    kind: z.literal("add_expense"),
    amountEuros: z.number(),
    category: z.string().nullable().describe("One of the user's expense category names, or null"),
    note: z.string().nullable().describe("A short description, e.g. 'supermercado'"),
    date: dayKey,
  }),
  z.object({
    kind: z.literal("set_budget"),
    amountEuros: z.number().describe("Monthly budget in euros"),
  }),
  z.object({
    kind: z.literal("chore_done"),
    chore: z.string().describe("One of the user's chore names"),
  }),
  z.object({
    kind: z.literal("create_chore"),
    name: z.string(),
    frequencyDays: z.number().int().nullable().describe("Ideal frequency in days (weekly = 7), or null"),
  }),
  z.object({
    kind: z.literal("log_workout"),
    type: z.string().describe("e.g. walk, run, gym, yoga"),
    minutes: z.number().int(),
    date: dayKey,
  }),
  z.object({
    kind: z.literal("log_pages"),
    book: z.string().describe("Title of one of the user's books being read"),
    pages: z.number().int(),
  }),
]);

export type AssistantAction = z.infer<typeof actionSchema>;

export const planSchema = z.object({
  reply: z.string().describe("One or two short, warm sentences to the user, in the user's language"),
  actions: z.array(actionSchema),
});

export type AssistantPlan = z.infer<typeof planSchema>;

/** What the model needs to know about this user to map words to real things. */
export type AssistantContext = {
  today: string; // YYYY-MM-DD
  weekday: string; // e.g. "Tuesday"
  areas: string[];
  categories: string[];
  chores: string[];
  books: string[]; // books being read
};

/** Case- and accent-insensitive comparison: "Lavadora" matches "lavadora". */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

/** Finds the item whose name matches; also accepts partial matches ("lavadora" → "Poner lavadora"). */
export function findByName<T extends { name: string }>(items: T[], name: string | null): T | null {
  if (!name) return null;
  const wanted = normalize(name);
  return (
    items.find((item) => normalize(item.name) === wanted) ??
    items.find((item) => normalize(item.name).includes(wanted) || wanted.includes(normalize(item.name))) ??
    null
  );
}

/** Short human description of an action, shown in the review list. */
export function describeAction(action: AssistantAction): string {
  switch (action.kind) {
    case "create_task":
      return `Task: ${action.title} · ${action.date}${action.time ? ` ${action.time}` : ""}`;
    case "create_recurring_task": {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const when =
        action.frequency === "DAILY"
          ? "every day"
          : action.frequency === "WEEKLY"
            ? `every ${action.daysOfWeek.map((d) => days[d] ?? "?").join(", ")}`
            : `monthly on day ${action.dayOfMonth ?? "?"}`;
      return `Repeating: ${action.title} · ${when}`;
    }
    case "add_expense":
      return `Expense: ${action.amountEuros.toFixed(2).replace(".", ",")} €${action.note ? ` · ${action.note}` : ""}${action.category ? ` (${action.category})` : ""}`;
    case "set_budget":
      return `Monthly budget: ${action.amountEuros} €`;
    case "chore_done":
      return `Chore done: ${action.chore}`;
    case "create_chore":
      return `New chore: ${action.name}${action.frequencyDays ? ` · every ${action.frequencyDays} days` : ""}`;
    case "log_workout":
      return `Workout: ${action.type} · ${action.minutes} min`;
    case "log_pages":
      return `Reading: ${action.pages} pages of ${action.book}`;
  }
}
