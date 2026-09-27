import type { IconName } from "@/components/icons";
import { db } from "@/lib/db";

type DefaultArea = { name: string; icon: IconName; color: string };

export const DEFAULT_AREAS: DefaultArea[] = [
  { name: "Reading", icon: "book-open", color: "#6366f1" },
  { name: "Coding", icon: "code", color: "#0ea5e9" },
  { name: "Studies", icon: "graduation-cap", color: "#8b5cf6" },
  { name: "Health & Movement", icon: "activity", color: "#10b981" },
  { name: "Personal Life", icon: "sparkles", color: "#f59e0b" },
  { name: "Home", icon: "house", color: "#f97316" },
  { name: "Finances", icon: "wallet", color: "#14b8a6" },
];

/**
 * Gives a brand-new user their settings and default areas.
 * Called after email sign-up and when Auth.js creates a user from Google/GitHub.
 * `skipDuplicates` makes it safe to run twice.
 */
export async function setupNewUser(userId: string): Promise<void> {
  await db.$transaction([
    db.userSettings.upsert({ where: { userId }, create: { userId }, update: {} }),
    db.area.createMany({
      data: DEFAULT_AREAS.map((area, position) => ({ ...area, position, userId })),
      skipDuplicates: true,
    }),
  ]);
}
