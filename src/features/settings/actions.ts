"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { type FormState, formValue, successState, validationError } from "@/lib/form";
import { requireUserId } from "@/lib/session";

const settingsSchema = z.object({
  // Intl.supportedValuesOf lists every timezone the runtime knows about
  timezone: z.string().refine((tz) => Intl.supportedValuesOf("timeZone").includes(tz), "Unknown timezone"),
  weekStartsOn: z.coerce.number().int().refine((day) => day === 0 || day === 1),
});

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = settingsSchema.safeParse({
    timezone: formValue(formData, "timezone"),
    weekStartsOn: formValue(formData, "weekStartsOn"),
  });
  if (!parsed.success) return validationError(parsed.error);

  await db.userSettings.upsert({
    where: { userId },
    create: { userId, ...parsed.data },
    update: parsed.data,
  });
  revalidatePath("/", "layout");
  return successState("Settings saved");
}
