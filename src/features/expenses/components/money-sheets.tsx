"use client";

import { Tags } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import type { Category } from "@/features/expenses/queries";
import { BudgetForm } from "./budget-form";
import { CategoryManager } from "./category-manager";

type BudgetProps = {
  budgetCents: number | null;
};

export function BudgetButton({ budgetCents }: BudgetProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-[15px] text-accent active:opacity-60">
        {budgetCents === null ? "Set budget" : "Edit budget"}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Monthly budget">
        <BudgetForm budgetCents={budgetCents} onDone={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

type CategoriesProps = {
  categories: Category[];
};

export function CategoriesButton({ categories }: CategoriesProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Categories"
        className="p-1.5 text-accent active:opacity-60"
      >
        <Tags className="size-[22px]" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Categories">
        <CategoryManager categories={categories} />
      </Sheet>
    </>
  );
}
