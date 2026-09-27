import { z } from "zod";
import { formValue } from "@/lib/form";
import { isDayKey } from "@/lib/dates";

// Zod schemas describe what valid form data looks like. The server checks
// every submission against them, because anything coming from the browser
// can be tampered with (even if the HTML input has `required`).

const dayKey = z.string().refine(isDayKey, "Pick a valid date");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");
const optionalId = z.string().min(1).optional();

export const taskSchema = z.object({
  id: optionalId,
  title: z.string().min(1, "Give the task a name").max(120),
  date: dayKey,
  time: time.optional(),
  areaId: optionalId,
  notes: z.string().max(500).optional(),
});
export type TaskInput = z.infer<typeof taskSchema>;

export function parseTaskForm(formData: FormData) {
  return taskSchema.safeParse({
    id: formValue(formData, "id"),
    title: formValue(formData, "title"),
    date: formValue(formData, "date"),
    time: formValue(formData, "time"),
    areaId: formValue(formData, "areaId"),
    notes: formValue(formData, "notes"),
  });
}

// ── Recurrence rules (shared by recurring tasks and routines) ──

const ruleSchema = z
  .object({
    frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
    daysOfWeek: z.array(z.coerce.number().int().min(0).max(6)),
    dayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
  })
  // superRefine = validation that depends on several fields at once
  .superRefine((rule, ctx) => {
    if (rule.frequency === "WEEKLY" && rule.daysOfWeek.length === 0) {
      ctx.addIssue({ code: "custom", path: ["daysOfWeek"], message: "Pick at least one day" });
    }
    if (rule.frequency === "MONTHLY" && rule.dayOfMonth === undefined) {
      ctx.addIssue({ code: "custom", path: ["dayOfMonth"], message: "Pick a day of the month" });
    }
  });

function readRule(formData: FormData) {
  return {
    frequency: formValue(formData, "frequency"),
    daysOfWeek: formData.getAll("daysOfWeek"),
    dayOfMonth: formValue(formData, "dayOfMonth"),
  };
}

export const recurringTaskSchema = z
  .object({
    id: optionalId,
    title: z.string().min(1, "Give the task a name").max(120),
    time: time.optional(),
    areaId: optionalId,
    startDate: dayKey,
  })
  .and(ruleSchema);
export type RecurringTaskInput = z.infer<typeof recurringTaskSchema>;

export function parseRecurringTaskForm(formData: FormData) {
  return recurringTaskSchema.safeParse({
    id: formValue(formData, "id"),
    title: formValue(formData, "title"),
    time: formValue(formData, "time"),
    areaId: formValue(formData, "areaId"),
    startDate: formValue(formData, "startDate"),
    ...readRule(formData),
  });
}

export const routineSchema = z
  .object({
    id: optionalId,
    name: z.string().min(1, "Give the routine a name").max(80),
    areaId: optionalId,
    // One step per line in a textarea → array of trimmed, non-empty lines
    steps: z
      .string()
      .transform((text) =>
        text
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.string().max(120)).min(1, "Add at least one step").max(20, "20 steps max")),
  })
  .and(ruleSchema);
export type RoutineInput = z.infer<typeof routineSchema>;

export function parseRoutineForm(formData: FormData) {
  return routineSchema.safeParse({
    id: formValue(formData, "id"),
    name: formValue(formData, "name"),
    areaId: formValue(formData, "areaId"),
    steps: formValue(formData, "steps") ?? "",
    ...readRule(formData),
  });
}
