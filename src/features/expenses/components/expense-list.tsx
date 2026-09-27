"use client";

import { Camera } from "lucide-react";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Private } from "@/components/ui/private";
import { Sheet } from "@/components/ui/sheet";
import type { Category, ExpenseRow } from "@/features/expenses/queries";
import type { DayKey } from "@/lib/dates";
import { formatEuros } from "@/lib/money";
import { cssColor } from "@/lib/palette";
import { ExpenseForm } from "./expense-form";

export type ExpenseDayGroup = {
  date: DayKey;
  /** Formatted on the server, to avoid hydration differences */
  label: string;
  totalCents: number;
  expenses: ExpenseRow[];
};

type Props = {
  groups: ExpenseDayGroup[];
  categories: Category[];
  today: DayKey;
  receiptsEnabled: boolean;
  hidden: boolean;
};

export function ExpenseList({ groups, categories, today, receiptsEnabled, hidden }: Props) {
  const [editing, setEditing] = useState<ExpenseRow | null>(null);

  if (groups.length === 0) {
    return (
      <p className="ios-list px-4 py-6 text-center text-[15px] text-muted">
        No expenses this month. Tap + to log one in seconds.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.date} className="flex flex-col gap-2">
          <h2 className="section-title flex justify-between">
            <span>{group.label}</span>
            <span className="normal-case tabular">
              <Private hidden={hidden}>{formatEuros(group.totalCents)}</Private>
            </span>
          </h2>
          <ul className="ios-list ios-rows [--row-inset:58px]">
            {group.expenses.map((expense) => (
              <li key={expense.id}>
                <button
                  type="button"
                  onClick={() => setEditing(expense)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-surface-2"
                >
                  <span
                    className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] text-white"
                    style={{ backgroundColor: expense.category ? cssColor(expense.category.color) : "var(--muted)" }}
                  >
                    <Icon name={expense.category?.icon ?? "receipt"} className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] first-letter:uppercase">
                      {expense.note ?? expense.category?.name ?? "Expense"}
                    </span>
                    {expense.note && expense.category && (
                      <span className="block text-[13px] text-muted">{expense.category.name}</span>
                    )}
                  </span>
                  {expense.hasReceipt && <Camera className="size-4 text-muted" aria-label="Has photo" />}
                  <span className="text-[17px] tabular">
                    <Private hidden={hidden}>{formatEuros(expense.amountCents)}</Private>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title="Edit expense">
        {editing && (
          <ExpenseForm
            key={editing.id}
            categories={categories}
            today={today}
            receiptsEnabled={receiptsEnabled}
            expense={editing}
            onDone={() => setEditing(null)}
          />
        )}
      </Sheet>
    </div>
  );
}
