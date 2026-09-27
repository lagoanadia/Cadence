"use client";

import { ChevronRight, Clock, Plus } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import type { AreaSummary, RecurringTaskSummary, RoutineSummary } from "@/features/agenda/queries";
import type { DayKey } from "@/lib/dates";
import { AreaTag } from "./area-tag";
import { RecurringTaskForm } from "./recurring-task-form";
import { RoutineForm } from "./routine-form";

type Props = {
  areas: AreaSummary[];
  today: DayKey;
  recurringTasks: RecurringTaskSummary[];
  routines: RoutineSummary[];
};

// Which sheet is open. Using a union type makes impossible states impossible:
// we can't be editing a routine AND a recurring task at the same time.
type Editing =
  | { type: "routine"; routine?: RoutineSummary }
  | { type: "recurring"; recurring?: RecurringTaskSummary }
  | null;

export function PlansManager({ areas, today, recurringTasks, routines }: Props) {
  const [editing, setEditing] = useState<Editing>(null);
  const close = () => setEditing(null);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <SectionHeader
          title="Routines"
          description="Checklists you go through, like a morning routine."
          onAdd={() => setEditing({ type: "routine" })}
        />
        {routines.length === 0 ? (
          <Empty text="No routines yet." />
        ) : (
          <ul className="flex flex-col gap-2">
            {routines.map((routine) => (
              <li key={routine.id}>
                <button
                  type="button"
                  onClick={() => setEditing({ type: "routine", routine })}
                  className="flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{routine.name}</span>
                    <span className="flex flex-wrap gap-x-3 text-xs text-muted">
                      <span>{routine.ruleLabel}</span>
                      <span>{routine.steps.length} steps</span>
                      {routine.area && <AreaTag area={routine.area} />}
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader
          title="Recurring tasks"
          description="Single tasks that come back: daily, some weekdays or monthly."
          onAdd={() => setEditing({ type: "recurring" })}
        />
        {recurringTasks.length === 0 ? (
          <Empty text="No recurring tasks yet." />
        ) : (
          <ul className="flex flex-col gap-2">
            {recurringTasks.map((recurring) => (
              <li key={recurring.id}>
                <button
                  type="button"
                  onClick={() => setEditing({ type: "recurring", recurring })}
                  className="flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{recurring.title}</span>
                    <span className="flex flex-wrap gap-x-3 text-xs text-muted">
                      <span>{recurring.ruleLabel}</span>
                      {recurring.time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {recurring.time}
                        </span>
                      )}
                      {recurring.area && <AreaTag area={recurring.area} />}
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet
        open={editing?.type === "routine"}
        onClose={close}
        title={editing?.type === "routine" && editing.routine ? "Edit routine" : "New routine"}
      >
        {editing?.type === "routine" && <RoutineForm areas={areas} routine={editing.routine} onDone={close} />}
      </Sheet>

      <Sheet
        open={editing?.type === "recurring"}
        onClose={close}
        title={editing?.type === "recurring" && editing.recurring ? "Edit recurring task" : "New recurring task"}
      >
        {editing?.type === "recurring" && (
          <RecurringTaskForm areas={areas} today={today} recurring={editing.recurring} onDone={close} />
        )}
      </Sheet>
    </div>
  );
}

type SectionHeaderProps = {
  title: string;
  description: string;
  onAdd: () => void;
};

function SectionHeader({ title, description, onAdd }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="flex shrink-0 items-center gap-1 rounded-xl bg-accent-soft px-3 py-2 text-sm font-medium text-accent"
      >
        <Plus className="size-4" />
        Add
      </button>
    </div>
  );
}

type EmptyProps = {
  text: string;
};

function Empty({ text }: EmptyProps) {
  return (
    <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">{text}</p>
  );
}
