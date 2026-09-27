import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgendaHeader } from "@/features/agenda/components/agenda-header";
import { DayAgenda } from "@/features/agenda/components/day-agenda";
import { getAgendaContext } from "@/features/agenda/context";
import { getAgenda } from "@/features/agenda/queries";
import { addDays, formatDay, isDayKey, monthOf, relativeDayLabel } from "@/lib/dates";

export const metadata: Metadata = { title: "Day" };

export default async function DayPage({ params }: PageProps<"/agenda/day/[date]">) {
  const { date } = await params;
  // The URL is user input too: /agenda/day/banana must not crash the page
  if (!isDayKey(date)) notFound();

  const { userId, areas, today } = await getAgendaContext();
  const [day] = await getAgenda(userId, date, date);

  return (
    <div className="flex flex-col gap-6">
      <AgendaHeader
        view="day"
        title={relativeDayLabel(date, today)}
        subtitle={formatDay(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        prevHref={`/agenda/day/${addDays(date, -1)}`}
        nextHref={`/agenda/day/${addDays(date, 1)}`}
        todayHref={`/agenda/day/${today}`}
        isCurrent={date === today}
        viewHrefs={{ day: `/agenda/day/${date}`, week: `/agenda/week/${date}`, month: `/agenda/month/${monthOf(date)}` }}
      />
      <DayAgenda day={day} areas={areas} today={today} />
    </div>
  );
}
