"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ICON_NAMES } from "@/components/icons";
import { db } from "@/lib/db";
import { dayKeyToDate } from "@/lib/dates";
import { errorState, type FormState, formValue, successState, validationError } from "@/lib/form";
import { ownedAreaId, userToday } from "@/lib/ownership";
import { requireUserId } from "@/lib/session";

function refreshApp(): void {
  revalidatePath("/", "layout");
}

/** One tap: saves today's date for this chore (once per day is enough). */
export async function markChoreDoneAction(choreId: string): Promise<void> {
  const userId = await requireUserId();
  const chore = await db.chore.findFirst({ where: { id: choreId, userId }, select: { id: true } });
  if (!chore) return;

  const date = dayKeyToDate(await userToday(userId));
  const already = await db.choreLog.findFirst({ where: { choreId, date } });
  if (!already) await db.choreLog.create({ data: { choreId, userId, date } });
  refreshApp();
}

/** Undo a tap made by mistake: removes today's log. */
export async function undoChoreTodayAction(choreId: string): Promise<void> {
  const userId = await requireUserId();
  const date = dayKeyToDate(await userToday(userId));
  await db.choreLog.deleteMany({ where: { choreId, userId, date } });
  refreshApp();
}

const choreSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1, "Give the chore a name").max(60),
  icon: z.enum(ICON_NAMES),
  // "every N days" is optional: some chores have no ideal rhythm
  frequencyDays: z.coerce.number().int().min(1, "At least 1 day").max(365).optional(),
  areaId: z.string().min(1).optional(),
});

export async function saveChoreAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = choreSchema.safeParse({
    id: formValue(formData, "id"),
    name: formValue(formData, "name"),
    icon: formValue(formData, "icon"),
    frequencyDays: formValue(formData, "frequencyDays"),
    areaId: formValue(formData, "areaId"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { id, areaId, ...rest } = parsed.data;
  const data = { ...rest, frequencyDays: rest.frequencyDays ?? null, areaId: await ownedAreaId(userId, areaId) };

  if (id) {
    const { count } = await db.chore.updateMany({ where: { id, userId }, data });
    if (count === 0) return errorState("Chore not found.");
  } else {
    const position = await db.chore.count({ where: { userId } });
    await db.chore.create({ data: { ...data, position, userId } });
  }
  refreshApp();
  return successState(id ? "Chore updated" : "Chore added");
}

/** Hidden from the list, but its history still counts on the areas dashboard. */
export async function archiveChoreAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.chore.updateMany({ where: { id, userId }, data: { archivedAt: new Date() } });
  refreshApp();
}
