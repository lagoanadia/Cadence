import "server-only";
import type { BookStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { addDays, type DayKey, dateToDayKey, dayKeyToDate } from "@/lib/dates";
import { readingStreak } from "./streak";

export type Book = {
  id: string;
  title: string;
  author: string | null;
  status: BookStatus;
  currentPage: number;
  totalPages: number | null;
  finishedAt: DayKey | null;
  rating: number | null;
  review: string | null;
  areaId: string | null;
};

export type ReadingStats = {
  pagesToday: number;
  pagesThisWeek: number; // last 7 days, today included
  streak: number; // days in a row with some reading, ending today or yesterday
};

export async function listBooks(userId: string): Promise<Book[]> {
  const rows = await db.book.findMany({
    where: { userId },
    orderBy: [{ finishedAt: "desc" }, { createdAt: "desc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    status: row.status,
    currentPage: row.currentPage,
    totalPages: row.totalPages,
    finishedAt: row.finishedAt ? dateToDayKey(row.finishedAt) : null,
    rating: row.rating,
    review: row.review,
    areaId: row.areaId,
  }));
}

export async function getReadingStats(userId: string, today: DayKey): Promise<ReadingStats> {
  // 60 days is plenty for a streak; a longer one just shows as "60+" worth of days
  const logs = await db.readingLog.findMany({
    where: { userId, date: { gte: dayKeyToDate(addDays(today, -60)) } },
    select: { date: true, pages: true },
  });

  const weekStart = addDays(today, -6);
  let pagesToday = 0;
  let pagesThisWeek = 0;
  const days = new Set<DayKey>();
  for (const log of logs) {
    const day = dateToDayKey(log.date);
    days.add(day);
    if (day === today) pagesToday += log.pages;
    if (day >= weekStart && day <= today) pagesThisWeek += log.pages;
  }
  return { pagesToday, pagesThisWeek, streak: readingStreak(days, today) };
}
