"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ICON_NAMES } from "@/components/icons";
import { db } from "@/lib/db";
import { errorState, type FormState, formValue, successState, validationError } from "@/lib/form";
import { PALETTE_HEXES } from "@/lib/palette";
import { requireUserId } from "@/lib/session";

function refreshApp(): void {
  revalidatePath("/", "layout");
}

const areaSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1, "Give it a name").max(40),
  icon: z.enum(ICON_NAMES, { error: "Pick an icon" }),
  color: z.string().refine((color) => PALETTE_HEXES.includes(color), "Pick a color"),
});

export async function saveAreaAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = areaSchema.safeParse({
    id: formValue(formData, "id"),
    name: formValue(formData, "name"),
    icon: formValue(formData, "icon"),
    color: formValue(formData, "color"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { id, ...data } = parsed.data;
  const duplicate = await db.area.findFirst({
    where: { userId, name: { equals: data.name, mode: "insensitive" }, NOT: id ? { id } : undefined },
  });
  if (duplicate) return errorState("You already have an area with that name.");

  if (id) {
    const { count } = await db.area.updateMany({ where: { id, userId }, data });
    if (count === 0) return errorState("Area not found.");
  } else {
    const position = await db.area.count({ where: { userId } });
    await db.area.create({ data: { ...data, position, userId } });
  }
  refreshApp();
  return successState(id ? "Area updated" : "Area added");
}

/** Archived areas disappear from pickers and the dashboard; linked items keep their history. */
export async function archiveAreaAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.area.updateMany({ where: { id, userId }, data: { archivedAt: new Date() } });
  refreshApp();
}

export async function setPrivateModeAction(privateMode: boolean): Promise<void> {
  const userId = await requireUserId();
  await db.userSettings.upsert({ where: { userId }, create: { userId, privateMode }, update: { privateMode } });
  refreshApp();
}
