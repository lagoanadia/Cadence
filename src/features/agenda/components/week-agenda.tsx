import Link from "next/link";
import type { AgendaDay, AreaSummary } from "@/features/agenda/queries";
import { type DayKey, formatDay } from "@/lib/dates";
import { AgendaItemRow } from "./agenda-item-row";

type Props = {
  days: AgendaDay[];
  areas: AreaSummary[];
  today: DayKey;
};

export function WeekAgenda({ days, areas, today }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {days.map((day) => {
        const isToday = day.date === today;
        return (
          <section key={day.date} className="flex flex-col gap-2">
            <Link href={`/agenda/day/${day.date}`} className="flex items-baseline gap-2 px-4">
              <span className={`text-[20px] font-bold tracking-tight ${isToday ? "text-accent" : ""}`}>
                {formatDay(day.date, { weekday: "long" })}
              </span>
              <span className="text-[15px] text-muted">{formatDay(day.date, { day: "numeric", month: "short" })}</span>
            </Link>

            {day.routines.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4">
                {day.routines.map((routine) => {
                  const done = routine.steps.filter((step) => step.done).length;
                  return (
                    <Link
                      key={routine.id}
                      href={`/agenda/day/${day.date}`}
                      className="rounded-full bg-surface px-3 py-1 text-[13px] text-muted"
                    >
                      {routine.name} · <span className="tabular">{done}/{routine.steps.length}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {day.items.length === 0 ? (
              <p className="px-4 text-[15px] text-muted/70">Free day</p>
            ) : (
              <ul className="ios-list ios-rows [--row-inset:52px]">
                {day.items.map((item) => (
                  <AgendaItemRow key={`${item.kind}-${item.id}`} item={item} areas={areas} today={today} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
