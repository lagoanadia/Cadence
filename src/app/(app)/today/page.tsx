import type { Metadata } from "next";
import { AgendaItemRow } from "@/features/agenda/components/agenda-item-row";
import { DayAgenda } from "@/features/agenda/components/day-agenda";
import { getAgendaContext } from "@/features/agenda/context";
import { getAgenda, getOverdueTasks } from "@/features/agenda/queries";
import { ChevronRight, Settings } from "lucide-react";
import Link from "next/link";
import { getAreaActivity } from "@/features/areas/queries";
import { AssistantCard } from "@/features/assistant/assistant-card";
import { assistantEnabled } from "@/features/assistant/planner";
import { addDays, formatDay, relativeDayLabel, startOfWeek } from "@/lib/dates";
import { cssColor } from "@/lib/palette";

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
  const weekStart = startOfWeek(today, settings.weekStartsOn);
  const [[day], overdue, activity] = await Promise.all([
    getAgenda(userId, today, today),
    getOverdueTasks(userId, today),
    getAreaActivity(userId, weekStart, addDays(weekStart, 6)),
  ]);
  const attended = areas.filter((area) => activity.has(area.id)).length;

  return (
    <div className="flex flex-col gap-7">
      <header>
        <div className="flex min-h-9 justify-end">
          <Link href="/settings" aria-label="Settings" className="p-1.5 text-accent active:opacity-60">
            <Settings className="size-[22px]" />
          </Link>
        </div>
        <p className="text-[13px] font-semibold text-muted uppercase tracking-wide">
          {formatDay(today, { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="display-serif text-[44px] leading-[1.05]">{greeting(settings.timezone)}</h1>
      </header>

      <AssistantCard enabled={assistantEnabled} />

      <Link href="/areas" className="ios-list flex items-center gap-3 px-4 py-3 active:bg-surface-2">
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">This week</span>
          <span className="block text-[13px] text-muted">
            {settings.privateMode ? "Your areas at a glance" : `${attended} of ${areas.length} areas got your time`}
          </span>
          <span className="mt-2 flex gap-1" aria-hidden>
            {areas.map((area) => (
              <span
                key={area.id}
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: activity.has(area.id) ? cssColor(area.color) : "var(--surface-2)" }}
              />
            ))}
          </span>
        </span>
        <ChevronRight className="size-4 text-muted" />
      </Link>

      {overdue.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="section-title">Still open from before</h2>
          <ul className="ios-list ios-rows [--row-inset:52px]">
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
