import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * The ONLY way the app finds out who the current user is.
 * The id comes from the encrypted session cookie, never from the browser's
 * form data, so nobody can pretend to be another user.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  return userId;
}

export type UserSettingsData = {
  timezone: string;
  weekStartsOn: number;
  privateMode: boolean;
  monthlyBudgetCents: number | null;
};

export async function getUserSettings(userId: string): Promise<UserSettingsData> {
  const settings = await db.userSettings.findUnique({ where: { userId } });
  return {
    timezone: settings?.timezone ?? "Europe/Madrid",
    weekStartsOn: settings?.weekStartsOn ?? 1,
    privateMode: settings?.privateMode ?? false,
    monthlyBudgetCents: settings?.monthlyBudgetCents ?? null,
  };
}
