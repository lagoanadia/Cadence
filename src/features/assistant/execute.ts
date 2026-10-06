import "server-only";
import { db } from "@/lib/db";
import { dayKeyToDate, isDayKey } from "@/lib/dates";
import { listCategories } from "@/features/expenses/queries";
import { type AssistantAction, describeAction, findByName } from "./plan";

export type ActionResult = { label: string; ok: boolean; error?: string };

/**
 * Saves ONE confirmed action for this user. Everything coming from the model is
 * treated as untrusted input: dates and numbers are re-checked here, and names
 * are only matched against rows that belong to this user.
 */
export async function executeAction(userId: string, action: AssistantAction, today: string): Promise<ActionResult> {
  const label = describeAction(action);
  const fail = (error: string): ActionResult => ({ label, ok: false, error });
  const validDay = (day: string) => (isDayKey(day) ? day : today);

  const areas = await db.area.findMany({ where: { userId, archivedAt: null }, select: { id: true, name: true } });
  const areaId = (name: string | null) => findByName(areas, name)?.id ?? null;

  switch (action.kind) {
    case "create_task": {
      if (!action.title.trim()) return fail("Empty title");
      await db.task.create({
        data: {
          userId,
          title: action.title.trim().slice(0, 120),
          date: dayKeyToDate(validDay(action.date)),
          time: action.time && /^([01]\d|2[0-3]):[0-5]\d$/.test(action.time) ? action.time : null,
          areaId: areaId(action.area),
        },
      });
      break;
    }
    case "create_recurring_task": {
      const days = [...new Set(action.daysOfWeek.filter((d) => d >= 0 && d <= 6))].sort((a, b) => a - b);
      if (action.frequency === "WEEKLY" && days.length === 0) return fail("No weekday given");
      const dayOfMonth = action.dayOfMonth && action.dayOfMonth >= 1 && action.dayOfMonth <= 31 ? action.dayOfMonth : null;
      if (action.frequency === "MONTHLY" && !dayOfMonth) return fail("No day of the month given");
      await db.recurringTask.create({
        data: {
          userId,
          title: action.title.trim().slice(0, 120),
          frequency: action.frequency,
          daysOfWeek: action.frequency === "WEEKLY" ? days : [],
          dayOfMonth: action.frequency === "MONTHLY" ? dayOfMonth : null,
          time: action.time && /^([01]\d|2[0-3]):[0-5]\d$/.test(action.time) ? action.time : null,
          startDate: dayKeyToDate(today),
          areaId: areaId(action.area),
        },
      });
      break;
    }
    case "add_expense": {
      const amountCents = Math.round(action.amountEuros * 100);
      if (!(amountCents > 0 && amountCents <= 10_000_000)) return fail("Invalid amount");
      const categories = await listCategories(userId);
      const category = findByName(categories, action.category) ?? findByName(categories, "Other");
      await db.expense.create({
        data: {
          userId,
          amountCents,
          categoryId: category?.id ?? null,
          note: action.note?.trim().slice(0, 80) || null,
          date: dayKeyToDate(validDay(action.date)),
        },
      });
      break;
    }
    case "set_budget": {
      const monthlyBudgetCents = Math.round(action.amountEuros * 100);
      if (!(monthlyBudgetCents > 0)) return fail("Invalid amount");
      await db.userSettings.upsert({
        where: { userId },
        create: { userId, monthlyBudgetCents },
        update: { monthlyBudgetCents },
      });
      break;
    }
    case "chore_done": {
      const chores = await db.chore.findMany({ where: { userId, archivedAt: null }, select: { id: true, name: true } });
      const chore = findByName(chores, action.chore);
      if (!chore) return fail(`No chore called "${action.chore}"`);
      const date = dayKeyToDate(today);
      const already = await db.choreLog.findFirst({ where: { choreId: chore.id, date } });
      if (!already) await db.choreLog.create({ data: { choreId: chore.id, userId, date } });
      break;
    }
    case "create_chore": {
      const position = await db.chore.count({ where: { userId } });
      const frequencyDays = action.frequencyDays && action.frequencyDays > 0 ? action.frequencyDays : null;
      await db.chore.create({
        data: { userId, name: action.name.trim().slice(0, 60), icon: "house", frequencyDays, position, areaId: areaId("Home") },
      });
      break;
    }
    case "log_workout": {
      if (!(action.minutes > 0 && action.minutes <= 1440)) return fail("Invalid duration");
      await db.workout.create({
        data: {
          userId,
          type: action.type.trim().toLowerCase().slice(0, 40) || "workout",
          durationMin: action.minutes,
          date: dayKeyToDate(validDay(action.date)),
          areaId: areaId("Health & Movement"),
        },
      });
      break;
    }
    case "log_pages": {
      const books = await db.book.findMany({ where: { userId }, select: { id: true, title: true, currentPage: true, totalPages: true, startedAt: true, finishedAt: true } });
      const book = findByName(books.map((b) => ({ ...b, name: b.title })), action.book);
      if (!book) return fail(`No book called "${action.book}"`);
      if (!(action.pages > 0 && action.pages <= 2000)) return fail("Invalid number of pages");
      const newPage = book.totalPages ? Math.min(book.currentPage + action.pages, book.totalPages) : book.currentPage + action.pages;
      const finished = book.totalPages !== null && newPage >= book.totalPages;
      const now = new Date();
      await db.$transaction([
        db.readingLog.create({ data: { userId, bookId: book.id, date: dayKeyToDate(today), pages: action.pages } }),
        db.book.update({
          where: { id: book.id },
          data: {
            currentPage: newPage,
            status: finished ? "FINISHED" : "READING",
            startedAt: book.startedAt ?? now,
            finishedAt: finished ? (book.finishedAt ?? now) : null,
          },
        }),
      ]);
      break;
    }
  }
  return { label, ok: true };
}
