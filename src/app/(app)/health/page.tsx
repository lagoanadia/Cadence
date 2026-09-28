import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatTiles } from "@/components/ui/stat-tiles";
import { WeekDots } from "@/components/ui/week-dots";
import { getAgendaContext } from "@/features/agenda/context";
import { HealthView, type MetricWithChart } from "@/features/health/components/health-view";
import { CHART_DAYS, listMetrics, listRecentWorkouts } from "@/features/health/queries";
import { weekStats } from "@/features/health/stats";
import { addDays, diffInDays, formatDay, relativeDayLabel } from "@/lib/dates";

export const metadata: Metadata = { title: "Health & Movement" };

export default async function HealthPage() {
  const { userId, today } = await getAgendaContext();
  const [workouts, metrics] = await Promise.all([listRecentWorkouts(userId, today), listMetrics(userId, today)]);
  const stats = weekStats(workouts, today);
  const chartStart = addDays(today, -(CHART_DAYS - 1));

  // Everything with a date label is prepared here, on the server (no hydration surprises)
  const metricsWithCharts: MetricWithChart[] = metrics.map((metric) => {
    const latest = metric.points.at(-1);
    return {
      ...metric,
      chartPoints: metric.points.map((point) => ({
        x: diffInDays(chartStart, point.date) / (CHART_DAYS - 1),
        value: point.value,
        dateLabel: formatDay(point.date, { weekday: "short", day: "numeric", month: "short" }),
      })),
      latestLabel: latest ? `Latest: ${relativeDayLabel(latest.date, today).toLowerCase()}` : null,
    };
  });

  return (
    <div className="flex flex-col gap-7">
      <PageHeader title="Movement" />

      <section className="flex flex-col gap-3">
        <StatTiles
          tiles={[
            { label: "Last 7 days", value: String(stats.minutes), unit: "min" },
            { label: "Sessions", value: String(stats.sessions) },
          ]}
        />
        <div className="ios-list flex items-center justify-between px-4 py-3">
          <span className="text-[15px] text-muted">Days you moved</span>
          <WeekDots
            label="Active days"
            color="var(--c-aqua)"
            days={stats.days.map((day) => ({
              key: day.date,
              label: formatDay(day.date, { weekday: "narrow" }),
              active: day.active,
            }))}
          />
        </div>
      </section>

      <HealthView
        today={today}
        workouts={workouts.map((workout) => ({ ...workout, dateLabel: relativeDayLabel(workout.date, today) }))}
        metrics={metricsWithCharts}
        chartStartLabel={formatDay(chartStart, { day: "numeric", month: "short" })}
      />
    </div>
  );
}
