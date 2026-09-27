import "server-only";
import { db } from "@/lib/db";
import { type DayKey, type MonthKey, dateToDayKey, dayKeyToDate, firstDayOfMonth, lastDayOfMonth } from "@/lib/dates";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/lib/new-user";

export type Category = { id: string; name: string; icon: string; color: string };

export type ExpenseRow = {
  id: string;
  amountCents: number;
  note: string | null;
  date: DayKey;
  hasReceipt: boolean;
  category: Category | null;
};

export type CategoryTotal = { category: Category | null; totalCents: number; count: number };

export type MonthSummary = {
  month: MonthKey;
  totalCents: number;
  expenses: ExpenseRow[];
  byCategory: CategoryTotal[];
};

const categorySelect = { select: { id: true, name: true, icon: true, color: true } } as const;

/**
 * The user's categories. Accounts created before the Expenses module existed
 * have none, so we create the defaults the first time they're needed.
 */
export async function listCategories(userId: string): Promise<Category[]> {
  const categories = await db.expenseCategory.findMany({
    where: { userId },
    orderBy: { position: "asc" },
    ...categorySelect,
  });
  if (categories.length > 0) return categories;

  await db.expenseCategory.createMany({
    data: DEFAULT_EXPENSE_CATEGORIES.map((category, position) => ({ ...category, position, userId })),
    skipDuplicates: true,
  });
  return db.expenseCategory.findMany({ where: { userId }, orderBy: { position: "asc" }, ...categorySelect });
}

export async function getMonthSummary(userId: string, month: MonthKey): Promise<MonthSummary> {
  const rows = await db.expense.findMany({
    where: {
      userId,
      date: { gte: dayKeyToDate(firstDayOfMonth(month)), lte: dayKeyToDate(lastDayOfMonth(month)) },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { category: categorySelect },
  });

  const expenses: ExpenseRow[] = rows.map((row) => ({
    id: row.id,
    amountCents: row.amountCents,
    note: row.note,
    date: dateToDayKey(row.date),
    hasReceipt: row.receiptPath !== null,
    category: row.category,
  }));

  // Group by category in memory: we already have every row of the month,
  // so a second query (groupBy) would only cost another round trip.
  const totals = new Map<string, CategoryTotal>();
  for (const expense of expenses) {
    const key = expense.category?.id ?? "none";
    const entry = totals.get(key) ?? { category: expense.category, totalCents: 0, count: 0 };
    entry.totalCents += expense.amountCents;
    entry.count += 1;
    totals.set(key, entry);
  }

  return {
    month,
    totalCents: expenses.reduce((sum, expense) => sum + expense.amountCents, 0),
    expenses,
    byCategory: [...totals.values()].sort((a, b) => b.totalCents - a.totalCents),
  };
}
