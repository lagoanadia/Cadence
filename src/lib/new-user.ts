import type { IconName } from "@/components/icons";
import { db } from "@/lib/db";
import { paletteHex } from "@/lib/palette";

type Defaults = { name: string; icon: IconName; color: string };

export const DEFAULT_AREAS: Defaults[] = [
  { name: "Reading", icon: "book-open", color: paletteHex("blue") },
  { name: "Coding", icon: "code", color: paletteHex("violet") },
  { name: "Studies", icon: "graduation-cap", color: paletteHex("orange") },
  { name: "Health & Movement", icon: "activity", color: paletteHex("aqua") },
  { name: "Personal Life", icon: "sparkles", color: paletteHex("magenta") },
  { name: "Home", icon: "house", color: paletteHex("yellow") },
  { name: "Finances", icon: "wallet", color: paletteHex("green") },
];

export const DEFAULT_EXPENSE_CATEGORIES: Defaults[] = [
  { name: "Food", icon: "utensils", color: paletteHex("orange") },
  { name: "Groceries", icon: "shopping-cart", color: paletteHex("aqua") },
  { name: "Transport", icon: "bus", color: paletteHex("blue") },
  { name: "Home", icon: "house", color: paletteHex("yellow") },
  { name: "Leisure", icon: "ticket", color: paletteHex("magenta") },
  { name: "Health", icon: "pill", color: paletteHex("green") },
  { name: "Shopping", icon: "shopping-bag", color: paletteHex("violet") },
  { name: "Other", icon: "receipt", color: paletteHex("red") },
];

type DefaultChore = { name: string; icon: IconName; frequencyDays: number };

export const DEFAULT_CHORES: DefaultChore[] = [
  { name: "Laundry", icon: "washing-machine", frequencyDays: 4 },
  { name: "Vacuuming", icon: "brush", frequencyDays: 7 },
  { name: "Bathroom", icon: "bath", frequencyDays: 7 },
  { name: "Change bed sheets", icon: "bed", frequencyDays: 14 },
  { name: "Take out recycling", icon: "trash", frequencyDays: 5 },
];

/**
 * Gives a brand-new user their settings, default areas, expense categories and
 * chores. Called after email sign-up and when Auth.js creates a user from
 * Google/GitHub. `skipDuplicates` + upsert make it safe to run more than once.
 */
export async function setupNewUser(userId: string): Promise<void> {
  const homeArea = { userId, ...DEFAULT_AREAS[5] };
  await db.$transaction(async (tx) => {
    await tx.userSettings.upsert({ where: { userId }, create: { userId }, update: {} });
    await tx.area.createMany({
      data: DEFAULT_AREAS.map((area, position) => ({ ...area, position, userId })),
      skipDuplicates: true,
    });
    await tx.expenseCategory.createMany({
      data: DEFAULT_EXPENSE_CATEGORIES.map((category, position) => ({ ...category, position, userId })),
      skipDuplicates: true,
    });
    if ((await tx.chore.count({ where: { userId } })) === 0) {
      const home = await tx.area.findUnique({ where: { userId_name: { userId, name: homeArea.name } } });
      await tx.chore.createMany({
        data: DEFAULT_CHORES.map((chore, position) => ({ ...chore, position, userId, areaId: home?.id })),
      });
    }
  });
}
