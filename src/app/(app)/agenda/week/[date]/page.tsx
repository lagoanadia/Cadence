import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgendaHeader } from "@/features/agenda/components/agenda-header";
import { WeekAgenda } from "@/features/agenda/components/week-agenda";
import { getAgendaContext } from "@/features/agenda/context";
import { getAgenda } from "@/features/agenda/queries";
import { addDays, formatDay, isDayKey, monthOf, startOfWeek } from "@/lib/dates";

export const metadata: Metadata = { title: "Week" };

export default async function WeekPage({ params }: PageProps<"/agenda/week/[date]">) {
  const { date } = await params;
  if (!isDayKey(date)) notFound();

  const { userId, settings, areas, today } = await getAgendaContext();
  const start = startOfWeek(date, settings.weekStartsOn);
  const end = addDays(start, 6);
  const days = await getAgenda(userId, start, end);

  const title = `${formatDay(start, { day: "numeric", month: "short" })} – ${formatDay(end, { day: "numeric", month: "short" })}`;
  const total = days.reduce((sum, day) => sum + day.items.length, 0);
  const done = days.reduce((sum, day) => sum + day.items.filter((item) => item.done).length, 0);

  return (
    <div className="flex flex-col gap-6">
      <AgendaHeader
        view="week"
        title={title}
        subtitle={total > 0 ? `${done} of ${total} tasks done` : "A quiet week so far"}
        prevHref={`/agenda/week/${addDays(start, -7)}`}
        nextHref={`/agenda/week/${addDays(start, 7)}`}
        todayHref={`/agenda/week/${today}`}
        isCurrent={today >= start && today <= end}
        viewHrefs={{ day: `/agenda/day/${date}`, week: `/agenda/week/${date}`, month: `/agenda/month/${monthOf(date)}` }}
      />
      <WeekAgenda days={days} areas={areas} today={today} />
    </div>
  );
}
