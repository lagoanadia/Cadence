import { z } from "zod";
import { ICON_NAMES } from "@/components/icons";
import { isDayKey } from "@/lib/dates";
import { formValue } from "@/lib/form";
import { parseEuroInput } from "@/lib/money";
import { PALETTE_HEXES } from "@/lib/palette";

// z.string().transform(...) lets Zod turn "12,50" into 1250 while validating
const amount = z
  .string({ error: "Enter an amount" })
  .transform((text, ctx) => {
    const cents = parseEuroInput(text);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "Enter an amount like 12,50" });
      return z.NEVER;
    }
    return cents;
  })
  .pipe(z.number().max(10_000_000, "That's a lot! Max 100.000 €"));

export const expenseSchema = z.object({
  id: z.string().min(1).optional(),
  amountCents: amount,
  categoryId: z.string().min(1).optional(),
  word: z.string().max(80).optional(),
  date: z.string().refine(isDayKey, "Pick a valid date").optional(),
  removeReceipt: z.boolean(),
});

export function parseExpenseForm(formData: FormData) {
  return expenseSchema.safeParse({
    id: formValue(formData, "id"),
    amountCents: formValue(formData, "amount"),
    categoryId: formValue(formData, "categoryId"),
    word: formValue(formData, "word"),
    date: formValue(formData, "date"),
    removeReceipt: formData.get("removeReceipt") === "on",
  });
}

export const budgetSchema = z.object({
  // Empty = remove the budget
  budgetCents: amount.optional(),
});

export const categorySchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1, "Give it a name").max(30),
  icon: z.enum(ICON_NAMES, { error: "Pick an icon" }),
  color: z.string().refine((color) => PALETTE_HEXES.includes(color), "Pick a color"),
});

export function parseCategoryForm(formData: FormData) {
  return categorySchema.safeParse({
    id: formValue(formData, "id"),
    name: formValue(formData, "name"),
    icon: formValue(formData, "icon"),
    color: formValue(formData, "color"),
  });
}
