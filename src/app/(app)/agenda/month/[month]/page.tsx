import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgendaHeader } from "@/features/agenda/components/agenda-header";
import { MonthGrid } from "@/features/agenda/components/month-grid";
import { getAgendaContext } from "@/features/agenda/context";
import { getAgenda } from "@/features/agenda/queries";
import {
  addDays,
  addMonths,
  firstDayOfMonth,
  formatMonth,
  isMonthKey,
  lastDayOfMonth,
  monthOf,
  startOfWeek,
} from "@/lib/dates";

export const metadata: Metadata = { title: "Month" };

export default async function MonthPage({ params }: PageProps<"/agenda/month/[month]">) {
  const { month } = await params;
  if (!isMonthKey(month)) notFound();

  const { userId, settings, today } = await getAgendaContext();
  // Show complete weeks, so the grid always starts on the first column
  const gridStart = startOfWeek(firstDayOfMonth(month), settings.weekStartsOn);
  const gridEnd = addDays(startOfWeek(lastDayOfMonth(month), settings.weekStartsOn), 6);
  const days = await getAgenda(userId, gridStart, gridEnd);

  // When switching to Day/Week, open today if it's in this month, else the 1st
  const focus = monthOf(today) === month ? today : firstDayOfMonth(month);

  return (
    <div className="flex flex-col gap-6">
      <AgendaHeader
        view="month"
        title={formatMonth(month)}
        prevHref={`/agenda/month/${addMonths(month, -1)}`}
        nextHref={`/agenda/month/${addMonths(month, 1)}`}
        todayHref={`/agenda/month/${monthOf(today)}`}
        isCurrent={monthOf(today) === month}
        viewHrefs={{ day: `/agenda/day/${focus}`, week: `/agenda/week/${focus}`, month: `/agenda/month/${month}` }}
      />
      <MonthGrid month={month} days={days} today={today} weekStartsOn={settings.weekStartsOn} />
      <p className="px-1 text-xs text-muted">Dots are pending tasks, colored by area. Tap a day to open it.</p>
    </div>
  );
}
