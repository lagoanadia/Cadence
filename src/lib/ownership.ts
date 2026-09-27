import "server-only";
import { db } from "@/lib/db";
import { type DayKey, todayKey } from "@/lib/dates";
import { getUserSettings } from "@/lib/session";

/**
 * The browser could send ANY areaId, even one from another user.
 * We only accept it if that area belongs to the current user.
 */
export async function ownedAreaId(userId: string, areaId: string | undefined): Promise<string | null> {
  if (!areaId) return null;
  const area = await db.area.findFirst({ where: { id: areaId, userId }, select: { id: true } });
  return area?.id ?? null;
}

/** "Today" for this user, in their own timezone. */
export async function userToday(userId: string): Promise<DayKey> {
  const { timezone } = await getUserSettings(userId);
  return todayKey(timezone);
}
