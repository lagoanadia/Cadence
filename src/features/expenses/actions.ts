"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { dayKeyToDate, todayKey } from "@/lib/dates";
import { errorState, type FormState, formValue, successState, validationError } from "@/lib/form";
import { getUserSettings, requireUserId } from "@/lib/session";
import { deleteReceipt, MAX_RECEIPT_BYTES, receiptsEnabled, saveReceipt } from "@/lib/storage";
import { budgetSchema, parseCategoryForm, parseExpenseForm } from "./schemas";

function refreshApp(): void {
  revalidatePath("/", "layout");
}

/** Returns the uploaded photo, null if there's none, or an error message. */
function readReceiptFile(formData: FormData): File | null | string {
  const file = formData.get("receipt");
  // An empty file input still sends a File with size 0
  if (!(file instanceof File) || file.size === 0) return null;
  if (!receiptsEnabled) return "Photo storage isn't set up.";
  if (!file.type.startsWith("image/")) return "The photo must be an image.";
  if (file.size > MAX_RECEIPT_BYTES) return "The photo is too big (max 3 MB).";
  return file;
}

/**
 * Creates or updates an expense. Built to be fast to use: only the amount is
 * required. The date defaults to today, and a single typed word is matched
 * against category names ("coffee" → no match → it becomes the note).
 */
export async function saveExpenseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = parseExpenseForm(formData);
  if (!parsed.success) return validationError(parsed.error);

  const receipt = readReceiptFile(formData);
  if (typeof receipt === "string") return errorState(receipt);

  const input = parsed.data;
  const categories = await db.expenseCategory.findMany({ where: { userId }, select: { id: true, name: true } });

  // Only accept a category that belongs to this user
  let categoryId = categories.find((category) => category.id === input.categoryId)?.id ?? null;
  let note = input.word ?? null;
  if (!categoryId && note) {
    const match = categories.find((category) => category.name.toLowerCase() === note?.toLowerCase());
    if (match) {
      categoryId = match.id;
      note = null; // the word WAS the category, no need to repeat it
    }
  }
  categoryId ??= categories.find((category) => category.name === "Other")?.id ?? null;

  const { timezone } = await getUserSettings(userId);
  const data = {
    amountCents: input.amountCents,
    categoryId,
    note,
    date: dayKeyToDate(input.date ?? todayKey(timezone)),
  };

  if (input.id) {
    const existing = await db.expense.findFirst({ where: { id: input.id, userId } });
    if (!existing) return errorState("Expense not found.");

    let receiptPath = existing.receiptPath;
    if (receipt || input.removeReceipt) {
      if (existing.receiptPath) await deleteReceipt(existing.receiptPath);
      receiptPath = receipt ? await saveReceipt(userId, receipt) : null;
    }
    await db.expense.update({ where: { id: existing.id }, data: { ...data, receiptPath } });
  } else {
    const receiptPath = receipt ? await saveReceipt(userId, receipt) : null;
    await db.expense.create({ data: { ...data, receiptPath, userId } });
  }

  refreshApp();
  return successState(input.id ? "Expense updated" : "Expense added");
}

export async function deleteExpenseAction(id: string): Promise<void> {
  const userId = await requireUserId();
  const expense = await db.expense.findFirst({ where: { id, userId } });
  if (!expense) return;
  await db.expense.delete({ where: { id: expense.id } });
  if (expense.receiptPath) await deleteReceipt(expense.receiptPath);
  refreshApp();
}

export async function saveBudgetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = budgetSchema.safeParse({ budgetCents: formValue(formData, "budget") });
  if (!parsed.success) return validationError(parsed.error);

  const monthlyBudgetCents = parsed.data.budgetCents ?? null;
  await db.userSettings.upsert({
    where: { userId },
    create: { userId, monthlyBudgetCents },
    update: { monthlyBudgetCents },
  });
  refreshApp();
  return successState(monthlyBudgetCents ? "Budget saved" : "Budget removed");
}

export async function saveCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = parseCategoryForm(formData);
  if (!parsed.success) return validationError(parsed.error);

  const { id, ...data } = parsed.data;
  const duplicate = await db.expenseCategory.findFirst({
    where: { userId, name: { equals: data.name, mode: "insensitive" }, NOT: id ? { id } : undefined },
  });
  if (duplicate) return errorState("You already have a category with that name.");

  if (id) {
    const { count } = await db.expenseCategory.updateMany({ where: { id, userId }, data });
    if (count === 0) return errorState("Category not found.");
  } else {
    const position = await db.expenseCategory.count({ where: { userId } });
    await db.expenseCategory.create({ data: { ...data, position, userId } });
  }
  refreshApp();
  return successState(id ? "Category updated" : "Category added");
}

/** Its expenses are kept; they just become "uncategorised" (onDelete: SetNull). */
export async function deleteCategoryAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.expenseCategory.deleteMany({ where: { id, userId } });
  refreshApp();
}
