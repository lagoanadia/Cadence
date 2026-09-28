"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { dayKeyToDate } from "@/lib/dates";
import { errorState, type FormState, formValue, successState, validationError } from "@/lib/form";
import { userToday } from "@/lib/ownership";
import { requireUserId } from "@/lib/session";

function refreshApp(): void {
  revalidatePath("/", "layout");
}

const bookSchema = z
  .object({
    id: z.string().min(1).optional(),
    title: z.string().min(1, "What's the title?").max(200),
    author: z.string().max(120).optional(),
    status: z.enum(["WANT_TO_READ", "READING", "FINISHED"]),
    totalPages: z.coerce.number().int().min(1).max(20_000).optional(),
    currentPage: z.coerce.number().int().min(0).max(20_000).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    review: z.string().max(2000, "Keep it under 2000 characters").optional(),
  })
  .refine((book) => !book.totalPages || !book.currentPage || book.currentPage <= book.totalPages, {
    path: ["currentPage"],
    message: "Can't be more than the total pages",
  });

export async function saveBookAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = bookSchema.safeParse({
    id: formValue(formData, "id"),
    title: formValue(formData, "title"),
    author: formValue(formData, "author"),
    status: formValue(formData, "status") ?? "WANT_TO_READ",
    totalPages: formValue(formData, "totalPages"),
    currentPage: formValue(formData, "currentPage"),
    rating: formValue(formData, "rating"),
    review: formValue(formData, "review"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { id, ...input } = parsed.data;
  const existing = id ? await db.book.findFirst({ where: { id, userId } }) : null;
  if (id && !existing) return errorState("Book not found.");

  const now = new Date();
  const totalPages = input.totalPages ?? null;
  // Finishing a book moves the bookmark to the last page
  const currentPage = input.status === "FINISHED" && totalPages ? totalPages : (input.currentPage ?? 0);
  const readingArea = await db.area.findFirst({ where: { userId, name: "Reading" }, select: { id: true } });

  const data = {
    title: input.title,
    author: input.author ?? null,
    status: input.status,
    totalPages,
    currentPage,
    rating: input.rating ?? null,
    review: input.review ?? null,
    // Keep the original dates if they exist; set them the first time a status is reached
    startedAt: input.status === "WANT_TO_READ" ? null : (existing?.startedAt ?? now),
    finishedAt: input.status === "FINISHED" ? (existing?.finishedAt ?? now) : null,
  };

  if (existing) {
    await db.book.update({ where: { id: existing.id }, data });
  } else {
    await db.book.create({ data: { ...data, userId, areaId: readingArea?.id ?? null } });
  }
  refreshApp();
  return successState(existing ? "Book updated" : "Book added");
}

const logSchema = z.object({
  bookId: z.string().min(1),
  pages: z.coerce.number({ error: "How many pages?" }).int().min(1, "At least 1 page").max(2000),
});

/**
 * Logs pages read today. Two writes that must happen together (the log and the
 * new bookmark), so they run in a TRANSACTION: if one fails, neither is saved.
 */
export async function logPagesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = logSchema.safeParse({ bookId: formValue(formData, "bookId"), pages: formValue(formData, "pages") });
  if (!parsed.success) return validationError(parsed.error);

  const { bookId, pages } = parsed.data;
  const book = await db.book.findFirst({ where: { id: bookId, userId } });
  if (!book) return errorState("Book not found.");

  const date = dayKeyToDate(await userToday(userId));
  const newPage = book.totalPages ? Math.min(book.currentPage + pages, book.totalPages) : book.currentPage + pages;
  const finished = book.totalPages !== null && newPage >= book.totalPages;
  const now = new Date();

  await db.$transaction([
    db.readingLog.create({ data: { userId, bookId, date, pages } }),
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

  refreshApp();
  return successState(finished ? `You finished “${book.title}”! 🎉` : `${pages} pages logged`);
}

export async function deleteBookAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.book.deleteMany({ where: { id, userId } });
  refreshApp();
}
