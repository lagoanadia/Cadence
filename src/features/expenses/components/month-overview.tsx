import { TriangleAlert } from "lucide-react";
import { Icon } from "@/components/icons";
import { Private } from "@/components/ui/private";
import type { MonthSummary } from "@/features/expenses/queries";
import { formatEuros } from "@/lib/money";
import { cssColor } from "@/lib/palette";

type Props = {
  summary: MonthSummary;
  budgetCents: number | null;
  /** null when looking at a past or future month */
  daysLeft: number | null;
  hidden: boolean;
  budgetButton: React.ReactNode;
};

/** Server Component: the big total, the budget bar and the per-category breakdown. */
export function MonthOverview({ summary, budgetCents, daysLeft, hidden, budgetButton }: Props) {
  const { totalCents, byCategory } = summary;

  return (
    <div className="flex flex-col gap-7">
      <section className="ios-list flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-medium tracking-wide text-muted uppercase">Spent</p>
            <p className="text-[40px] leading-tight font-bold tracking-tight tabular">
              <Private hidden={hidden}>{formatEuros(totalCents)}</Private>
            </p>
          </div>
          {budgetButton}
        </div>
        {budgetCents !== null && (
          <BudgetBar totalCents={totalCents} budgetCents={budgetCents} daysLeft={daysLeft} hidden={hidden} />
        )}
      </section>

      {byCategory.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="section-title">By category</h2>
          <ul className="ios-list ios-rows [--row-inset:58px]">
            {byCategory.map(({ category, totalCents: categoryTotal, count }) => {
              const share = totalCents > 0 ? categoryTotal / totalCents : 0;
              const color = category ? cssColor(category.color) : "var(--muted)";
              return (
                <li key={category?.id ?? "none"} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] text-white"
                    style={{ backgroundColor: color }}
                  >
                    <Icon name={category?.icon ?? "receipt"} className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[17px]">{category?.name ?? "Uncategorised"}</span>
                      <span className="text-[17px] tabular">
                        <Private hidden={hidden}>{formatEuros(categoryTotal)}</Private>
                      </span>
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      {/* A thin bar: its length is this category's share of the month */}
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${Math.max(share * 100, 2)}%`, backgroundColor: color }}
                        />
                      </span>
                      <span className="w-20 text-right text-[13px] text-muted tabular">
                        {hidden ? `${count}×` : `${Math.round(share * 100)}% · ${count}×`}
                      </span>
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

type BudgetProps = {
  totalCents: number;
  budgetCents: number;
  daysLeft: number | null;
  hidden: boolean;
};

function BudgetBar({ totalCents, budgetCents, daysLeft, hidden }: BudgetProps) {
  const ratio = budgetCents > 0 ? totalCents / budgetCents : 0;
  const over = totalCents > budgetCents;
  const left = budgetCents - totalCents;

  // Encouraging copy: going over is information, not a failure
  let message: string;
  if (over) message = `${formatEuros(-left)} over — that's okay, a fresh month is coming.`;
  else if (daysLeft !== null) message = `${formatEuros(left)} left · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} to go`;
  else message = `${formatEuros(left)} under budget 🎉`;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-label="Budget used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(ratio, 1) * 100)}
      >
        <div
          className={`h-full rounded-full ${over ? "bg-warning" : "bg-accent-fill"}`}
          style={{ width: `${Math.min(ratio, 1) * 100}%` }}
        />
      </div>
      <p className={`flex items-center gap-1.5 text-[15px] ${over ? "text-warning" : "text-muted"}`}>
        {over && <TriangleAlert className="size-4 shrink-0" />}
        {hidden ? (over ? "Over budget" : `${Math.round(ratio * 100)}% of budget used`) : message}
      </p>
      <p className="text-[13px] text-muted">
        Budget: <Private hidden={hidden}>{formatEuros(budgetCents, { decimals: false })}</Private> / month
      </p>
    </div>
  );
}
