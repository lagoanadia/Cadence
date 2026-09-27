"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { dayKeyToDate, isDayKey } from "@/lib/dates";
import { errorState, type FormState, formValue, successState, validationError } from "@/lib/form";
import { userToday } from "@/lib/ownership";
import { requireUserId } from "@/lib/session";

function refreshApp(): void {
  revalidatePath("/", "layout");
}

const dayKey = z.string().refine(isDayKey, "Pick a valid date");

const workoutSchema = z.object({
  id: z.string().min(1).optional(),
  type: z.string().min(1, "What did you do?").max(40),
  durationMin: z.coerce.number({ error: "How long?" }).int().min(1, "At least 1 minute").max(1440),
  notes: z.string().max(300).optional(),
  date: dayKey.optional(),
});

export async function saveWorkoutAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = workoutSchema.safeParse({
    id: formValue(formData, "id"),
    // The chips send "type"; the "Other" text box sends "customType"
    type: formValue(formData, "customType") ?? formValue(formData, "type"),
    durationMin: formValue(formData, "durationMin"),
    notes: formValue(formData, "notes"),
    date: formValue(formData, "date"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { id, date, ...input } = parsed.data;
  const healthArea = await db.area.findFirst({ where: { userId, name: "Health & Movement" }, select: { id: true } });
  const data = {
    ...input,
    type: input.type.toLowerCase(),
    notes: input.notes ?? null,
    date: dayKeyToDate(date ?? (await userToday(userId))),
  };

  if (id) {
    const { count } = await db.workout.updateMany({ where: { id, userId }, data });
    if (count === 0) return errorState("Workout not found.");
  } else {
    await db.workout.create({ data: { ...data, userId, areaId: healthArea?.id ?? null } });
  }
  refreshApp();
  return successState(id ? "Workout updated" : "Nice! Workout logged 💪");
}

export async function deleteWorkoutAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.workout.deleteMany({ where: { id, userId } });
  refreshApp();
}

const metricSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1, "Name it, e.g. Steps").max(40),
  unit: z.string().max(15).optional(),
});

export async function saveMetricAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = metricSchema.safeParse({
    id: formValue(formData, "id"),
    name: formValue(formData, "name"),
    unit: formValue(formData, "unit"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { id, name, unit } = parsed.data;
  const duplicate = await db.metric.findFirst({
    where: { userId, name: { equals: name, mode: "insensitive" }, NOT: id ? { id } : undefined },
  });
  if (duplicate) return errorState("You already track something with that name.");

  if (id) {
    const { count } = await db.metric.updateMany({ where: { id, userId }, data: { name, unit: unit ?? null } });
    if (count === 0) return errorState("Metric not found.");
  } else {
    const [position, healthArea] = await Promise.all([
      db.metric.count({ where: { userId } }),
      db.area.findFirst({ where: { userId, name: "Health & Movement" }, select: { id: true } }),
    ]);
    await db.metric.create({ data: { name, unit: unit ?? null, position, userId, areaId: healthArea?.id ?? null } });
  }
  refreshApp();
  return successState(id ? "Saved" : "Now tracking it");
}

export async function deleteMetricAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.metric.deleteMany({ where: { id, userId } });
  refreshApp();
}

const entrySchema = z.object({
  metricId: z.string().min(1),
  value: z.coerce.number({ error: "Enter a number" }).finite().min(-1_000_000).max(1_000_000),
  date: dayKey.optional(),
});

/** One value per metric per day: logging again the same day replaces it (upsert). */
export async function logMetricAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = entrySchema.safeParse({
    metricId: formValue(formData, "metricId"),
    // Accept "7,5" as well as "7.5"
    value: formValue(formData, "value")?.replace(",", "."),
    date: formValue(formData, "date"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { metricId, value } = parsed.data;
  const metric = await db.metric.findFirst({ where: { id: metricId, userId }, select: { id: true } });
  if (!metric) return errorState("Metric not found.");

  const date = dayKeyToDate(parsed.data.date ?? (await userToday(userId)));
  await db.metricEntry.upsert({
    where: { metricId_date: { metricId, date } },
    create: { metricId, userId, date, value },
    update: { value },
  });
  refreshApp();
  return successState("Logged");
}
