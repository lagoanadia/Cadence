import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getAgendaContext } from "@/features/agenda/context";
import { type ExpenseDayGroup, ExpenseList } from "@/features/expenses/components/expense-list";
import { BudgetButton, CategoriesButton } from "@/features/expenses/components/money-sheets";
import { MonthOverview } from "@/features/expenses/components/month-overview";
import { getMonthSummary, listCategories } from "@/features/expenses/queries";
import { addMonths, diffInDays, formatMonth, isMonthKey, lastDayOfMonth, monthOf, relativeDayLabel } from "@/lib/dates";
import { receiptsEnabled } from "@/lib/storage";

export const metadata: Metadata = { title: "Money" };

export default async function ExpensesPage({ searchParams }: PageProps<"/expenses">) {
  const { userId, settings, today } = await getAgendaContext();
  const { month: monthParam } = await searchParams;
  const month = typeof monthParam === "string" && isMonthKey(monthParam) ? monthParam : monthOf(today);

  const [summary, categories] = await Promise.all([getMonthSummary(userId, month), listCategories(userId)]);
  const isCurrentMonth = month === monthOf(today);
  const daysLeft = isCurrentMonth ? diffInDays(today, lastDayOfMonth(month)) + 1 : null;
  const hidden = settings.privateMode;

  // Group the month's expenses by day (they're already sorted newest first)
  const groups: ExpenseDayGroup[] = [];
  for (const expense of summary.expenses) {
    let group = groups.at(-1);
    if (group?.date !== expense.date) {
      group = { date: expense.date, label: relativeDayLabel(expense.date, today), totalCents: 0, expenses: [] };
      groups.push(group);
    }
    group.totalCents += expense.amountCents;
    group.expenses.push(expense);
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Money"
        actions={
          <>
            <Link href={`/expenses?month=${addMonths(month, -1)}`} aria-label="Previous month" className="p-1.5 text-accent">
              <ChevronLeft className="size-6" />
            </Link>
            <Link href={`/expenses?month=${addMonths(month, 1)}`} aria-label="Next month" className="p-1.5 text-accent">
              <ChevronRight className="size-6" />
            </Link>
            <CategoriesButton categories={categories} />
          </>
        }
        subtitle={isCurrentMonth ? `This month · ${formatMonth(month)}` : formatMonth(month)}
      />

      <MonthOverview
        summary={summary}
        budgetCents={settings.monthlyBudgetCents}
        daysLeft={daysLeft}
        hidden={hidden}
        budgetButton={<BudgetButton budgetCents={settings.monthlyBudgetCents} />}
      />

      <ExpenseList
        groups={groups}
        categories={categories}
        today={today}
        receiptsEnabled={receiptsEnabled}
        hidden={hidden}
      />
    </div>
  );
}
