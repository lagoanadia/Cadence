"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { CheckCircle, useOptimisticDone } from "@/components/ui/check-toggle";
import { toggleRoutineStepAction } from "@/features/agenda/actions";
import type { RoutineOccurrence } from "@/features/agenda/queries";

type Props = {
  routine: RoutineOccurrence;
};

export function RoutineCard({ routine }: Props) {
  const doneCount = routine.steps.filter((step) => step.done).length;
  const total = routine.steps.length;
  const complete = total > 0 && doneCount === total;
  // Finished routines start collapsed so they don't take space
  const [open, setOpen] = useState(!complete);
  const color = routine.area?.color ?? "var(--accent)";

  return (
    <section className="rounded-2xl bg-surface">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
        >
          <Icon name={routine.icon ?? routine.area?.icon ?? "sunrise"} className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{routine.name}</span>
          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-2">
            <span
              className="block h-full rounded-full transition-all"
              style={{ width: `${total ? (doneCount / total) * 100 : 0}%`, backgroundColor: color }}
            />
          </span>
        </span>
        <span className="text-sm text-muted tabular-nums">
          {complete ? "Done ✨" : `${doneCount}/${total}`}
        </span>
        <ChevronDown className={`size-4 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul className="flex flex-col gap-3 px-4 pb-4 pl-16">
          {routine.steps.map((step) => (
            <RoutineStepRow key={step.id} step={step} date={routine.date} color={color} />
          ))}
        </ul>
      )}
    </section>
  );
}

type StepProps = {
  step: RoutineOccurrence["steps"][number];
  date: string;
  color: string;
};

function RoutineStepRow({ step, date, color }: StepProps) {
  const [done, toggle] = useOptimisticDone(step.done, (next) => toggleRoutineStepAction(step.id, date, next));
  return (
    <li className="flex items-center gap-3">
      <CheckCircle done={done} onToggle={toggle} label={`Mark "${step.title}" as done`} color={color} size="sm" />
      <span className={`text-sm ${done ? "text-muted line-through" : ""}`}>{step.title}</span>
    </li>
  );
}
