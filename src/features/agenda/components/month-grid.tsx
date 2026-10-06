import Link from "next/link";
import type { AgendaDay } from "@/features/agenda/queries";
import { type DayKey, type MonthKey, monthOf, weekdayLabels } from "@/lib/dates";
import { cssColor } from "@/lib/palette";

type Props = {
  month: MonthKey;
  /** Full weeks: may include a few days from the previous and next month */
  days: AgendaDay[];
  today: DayKey;
  weekStartsOn: number;
};

const MAX_DOTS = 4;

export function MonthGrid({ month, days, today, weekStartsOn }: Props) {
  return (
    <div className="ios-list p-2">
      <div className="grid grid-cols-7 pb-1 text-center text-[11px] font-semibold text-muted uppercase">
        {weekdayLabels(weekStartsOn).map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = monthOf(day.date) === month;
          const isToday = day.date === today;
          // Skipped recurring tasks in the past are just gone, not "debt": no dots for them
          const pending = day.items.filter(
            (item) => !item.done && !(item.kind === "recurring" && day.date < today),
          );
          const allDone = day.items.length > 0 && day.items.every((item) => item.done);

          return (
            <Link
              key={day.date}
              href={`/agenda/day/${day.date}`}
              aria-label={`${day.date}: ${day.items.length} tasks`}
              className={`flex aspect-square flex-col items-center gap-1 rounded-[10px] pt-1.5 text-[17px] active:bg-surface-2 ${
                inMonth ? "" : "opacity-35"
              }`}
            >
              <span
                className={`flex size-8 items-center justify-center rounded-full tabular ${
                  isToday ? "bg-accent-fill font-semibold text-accent-text" : ""
                }`}
              >
                {Number(day.date.slice(8))}
              </span>
              {allDone ? (
                <span className="text-[11px] leading-none font-bold text-success">✓</span>
              ) : (
                <span className="flex flex-wrap justify-center gap-0.5 px-1">
                  {pending.slice(0, MAX_DOTS).map((item) => (
                    <span
                      key={`${item.kind}-${item.id}`}
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: item.area ? cssColor(item.area.color) : "var(--muted)" }}
                    />
                  ))}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
