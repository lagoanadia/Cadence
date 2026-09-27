"use client";

import { Activity, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { Metric, Workout } from "@/features/health/queries";
import type { DayKey } from "@/lib/dates";
import { LogMetricForm, MetricForm, WorkoutForm } from "./health-forms";
import { type ChartPoint, MetricChart } from "./metric-chart";

export type MetricWithChart = Metric & { chartPoints: ChartPoint[]; latestLabel: string | null };

type Props = {
  today: DayKey;
  workouts: (Workout & { dateLabel: string })[];
  metrics: MetricWithChart[];
  chartStartLabel: string;
};

type Open =
  | { kind: "workout"; workout?: Workout }
  | { kind: "metric"; metric?: Metric }
  | { kind: "log"; metric: Metric }
  | null;

export function HealthView({ today, workouts, metrics, chartStartLabel }: Props) {
  const [open, setOpen] = useState<Open>(null);
  const close = () => setOpen(null);

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between px-4">
          <h2 className="text-[20px] font-bold tracking-tight">Recent activity</h2>
          <button type="button" onClick={() => setOpen({ kind: "workout" })} className="text-[17px] text-accent">
            Log
          </button>
        </div>
        {workouts.length === 0 ? (
          <p className="ios-list px-4 py-6 text-center text-[15px] text-muted">
            Nothing logged in the last month. A short walk counts too!
          </p>
        ) : (
          <ul className="ios-list ios-rows [--row-inset:58px]">
            {workouts.slice(0, 10).map((workout) => (
              <li key={workout.id}>
                <button
                  type="button"
                  onClick={() => setOpen({ kind: "workout", workout })}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-surface-2"
                >
                  <span className="flex size-[30px] items-center justify-center rounded-[8px] bg-[var(--c-aqua)] text-white">
                    <Activity className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] capitalize">{workout.type}</span>
                    <span className="block truncate text-[13px] text-muted">
                      {[workout.dateLabel, workout.notes].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="text-[17px] text-muted tabular">{workout.durationMin} min</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between px-4">
          <h2 className="text-[20px] font-bold tracking-tight">Your metrics</h2>
          <button type="button" onClick={() => setOpen({ kind: "metric" })} className="flex items-center gap-1 text-[17px] text-accent">
            <Plus className="size-5" />
            Add
          </button>
        </div>
        {metrics.length === 0 && (
          <p className="ios-list px-4 py-6 text-center text-[15px] text-muted">
            Track anything that matters to you: steps, sleep, water, energy…
          </p>
        )}
        {metrics.map((metric) => (
          <article key={metric.id} className="ios-list flex flex-col gap-4 p-4">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[17px] font-semibold">{metric.name}</h3>
                <p className="text-[13px] text-muted">{metric.latestLabel ?? "Last 30 days"}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Edit ${metric.name}`}
                  onClick={() => setOpen({ kind: "metric", metric })}
                  className="p-2 text-muted"
                >
                  <Pencil className="size-4" />
                </button>
                <Button type="button" variant="secondary" onClick={() => setOpen({ kind: "log", metric })} className="h-8 px-3.5 text-[15px]">
                  Log
                </Button>
              </div>
            </header>
            <MetricChart
              name={metric.name}
              unit={metric.unit}
              points={metric.chartPoints}
              startLabel={chartStartLabel}
              endLabel="Today"
            />
          </article>
        ))}
      </section>

      <Sheet open={open?.kind === "workout"} onClose={close} title={open?.kind === "workout" && open.workout ? "Edit workout" : "Log workout"}>
        {open?.kind === "workout" && <WorkoutForm key={open.workout?.id ?? "new"} today={today} workout={open.workout} onDone={close} />}
      </Sheet>
      <Sheet open={open?.kind === "metric"} onClose={close} title={open?.kind === "metric" && open.metric ? "Edit metric" : "New metric"}>
        {open?.kind === "metric" && <MetricForm key={open.metric?.id ?? "new"} metric={open.metric} onDone={close} />}
      </Sheet>
      <Sheet open={open?.kind === "log"} onClose={close} title={open?.kind === "log" ? open.metric.name : ""}>
        {open?.kind === "log" && <LogMetricForm metric={open.metric} today={today} onDone={close} />}
      </Sheet>
    </div>
  );
}
