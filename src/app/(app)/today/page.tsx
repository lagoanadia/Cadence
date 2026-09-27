import type { Metadata } from "next";
import { AgendaItemRow } from "@/features/agenda/components/agenda-item-row";
import { DayAgenda } from "@/features/agenda/components/day-agenda";
import { getAgendaContext } from "@/features/agenda/context";
import { getAgenda, getOverdueTasks } from "@/features/agenda/queries";
import { formatDay, relativeDayLabel } from "@/lib/dates";

export const metadata: Metadata = { title: "Today" };

function greeting(timeZone: string): string {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", hourCycle: "h23" }).format(new Date()));
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 20) return "Good afternoon";
  return "Good evening";
}

export default async function TodayPage() {
  const { userId, settings, areas, today } = await getAgendaContext();
  const [[day], overdue] = await Promise.all([getAgenda(userId, today, today), getOverdueTasks(userId, today)]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-muted">{formatDay(today, { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{greeting(settings.timezone)}</h1>
      </header>

      {overdue.length > 0 && (
        <section className="flex flex-col gap-2 rounded-3xl bg-warning-soft p-3">
          <h2 className="px-1 text-sm font-medium text-warning">
            Still open from before · pick them up or move them to today
          </h2>
          <ul className="flex flex-col gap-2">
            {overdue.map((task) => (
              <AgendaItemRow
                key={task.id}
                item={task}
                areas={areas}
                today={today}
                overdueLabel={relativeDayLabel(task.date, today)}
              />
            ))}
          </ul>
        </section>
      )}

      <DayAgenda day={day} areas={areas} today={today} />
    </div>
  );
}
