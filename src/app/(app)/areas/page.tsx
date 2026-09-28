import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Private } from "@/components/ui/private";
import { WeekDots } from "@/components/ui/week-dots";
import { getAgendaContext } from "@/features/agenda/context";
import { ManageAreasButton, PlanForAreaButton, PrivateModeRow } from "@/features/areas/components/area-controls";
import { getAreaActivity } from "@/features/areas/queries";
import { addDays, eachDay, formatDay, isDayKey, startOfWeek } from "@/lib/dates";
import { cssColor } from "@/lib/palette";

export const metadata: Metadata = { title: "Areas" };

/** Kind words, never scores: the point is to feel less overwhelmed, not more. */
function encouragement(attended: number, total: number): string {
  if (total === 0) return "Create an area to start.";
  if (attended === 0) return "A fresh week. Pick one small thing — that's enough.";
  if (attended === total) return "Every area got some love this week. Beautiful balance.";
  if (attended / total >= 0.6) return "A well-rounded week. The rest can wait.";
  return "Some areas are resting. That's okay — focus is a good thing.";
}

export default async function AreasPage({ searchParams }: PageProps<"/areas">) {
  const { userId, settings, areas, today } = await getAgendaContext();
  const { week } = await searchParams;
  const anchor = typeof week === "string" && isDayKey(week) ? week : today;
  const start = startOfWeek(anchor, settings.weekStartsOn);
  const end = addDays(start, 6);
  const isCurrentWeek = today >= start && today <= end;

  const activity = await getAreaActivity(userId, start, end);
  const days = eachDay(start, end);
  const hidden = settings.privateMode;

  const withActivity = areas
    .map((area) => ({ area, activity: activity.get(area.id) }))
    .sort((a, b) => (b.activity?.moments ?? 0) - (a.activity?.moments ?? 0));
  const attended = withActivity.filter((item) => item.activity);
  const resting = withActivity.filter((item) => !item.activity);

  const title = isCurrentWeek
    ? "This week"
    : `${formatDay(start, { day: "numeric", month: "short" })} – ${formatDay(end, { day: "numeric", month: "short" })}`;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Areas"
        actions={
          <>
            <Link href={`/areas?week=${addDays(start, -7)}`} aria-label="Previous week" className="p-1.5 text-accent">
              <ChevronLeft className="size-6" />
            </Link>
            <Link href={`/areas?week=${addDays(start, 7)}`} aria-label="Next week" className="p-1.5 text-accent">
              <ChevronRight className="size-6" />
            </Link>
            <ManageAreasButton areas={areas} />
          </>
        }
      />

      <section className="ios-list flex flex-col gap-1 p-4">
        <p className="text-[13px] font-medium tracking-wide text-muted uppercase">{title}</p>
        <p className="text-[28px] leading-tight font-bold tracking-tight">
          <Private hidden={hidden}>{`${attended.length} of ${areas.length}`}</Private> areas got your time
        </p>
        <p className="text-[15px] text-muted">{encouragement(attended.length, areas.length)}</p>
        {/* One segment per area, colored if it got attention: the week at a glance */}
        <div className="mt-2 flex gap-1" aria-hidden>
          {withActivity.map(({ area, activity: areaActivity }) => (
            <span
              key={area.id}
              className="h-2 flex-1 rounded-full"
              style={{ backgroundColor: areaActivity ? cssColor(area.color) : "var(--surface-2)" }}
            />
          ))}
        </div>
      </section>

      {attended.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="section-title">Got attention</h2>
          <ul className="ios-list ios-rows [--row-inset:58px]">
            {attended.map(({ area, activity: areaActivity }) => (
              <li key={area.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] text-white"
                  style={{ backgroundColor: cssColor(area.color) }}
                >
                  {hidden ? null : <Icon name={area.icon} className="size-[18px]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px]">
                    <Private hidden={hidden}>{area.name}</Private>
                  </span>
                  <span className="block text-[13px] text-muted">
                    <Private hidden={hidden}>
                      {`${areaActivity?.moments} ${areaActivity?.moments === 1 ? "moment" : "moments"}`}
                    </Private>
                  </span>
                </span>
                <WeekDots
                  label={hidden ? "Activity" : `${area.name} activity`}
                  color={cssColor(area.color)}
                  days={days.map((day) => ({
                    key: day,
                    label: formatDay(day, { weekday: "narrow" }),
                    active: areaActivity?.days.has(day) ?? false,
                  }))}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {resting.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="section-title">Resting</h2>
          <ul className="ios-list ios-rows [--row-inset:58px]">
            {resting.map(({ area }) => (
              <li key={area.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-surface-2 text-muted">
                  {hidden ? null : <Icon name={area.icon} className="size-[18px]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px]">
                    <Private hidden={hidden}>{area.name}</Private>
                  </span>
                  <span className="block text-[13px] text-muted">No pressure — it’ll be here when you’re ready</span>
                </span>
                {isCurrentWeek && !hidden && <PlanForAreaButton area={area} areas={areas} today={today} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      <PrivateModeRow privateMode={settings.privateMode} />
    </div>
  );
}
