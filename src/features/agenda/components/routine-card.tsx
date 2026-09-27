"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { CheckCircle, useOptimisticDone } from "@/components/ui/check-toggle";
import { toggleRoutineStepAction } from "@/features/agenda/actions";
import type { RoutineOccurrence } from "@/features/agenda/queries";
import { cssColor } from "@/lib/palette";

type Props = {
  routine: RoutineOccurrence;
};

export function RoutineCard({ routine }: Props) {
  const doneCount = routine.steps.filter((step) => step.done).length;
  const total = routine.steps.length;
  const complete = total > 0 && doneCount === total;
  // Finished routines start collapsed so they don't take space
  const [open, setOpen] = useState(!complete);
  const color = routine.area ? cssColor(routine.area.color) : "var(--accent)";

  return (
    <section className="ios-list">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-surface-2"
      >
        <span
          className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] text-white"
          style={{ backgroundColor: color }}
        >
          <Icon name={routine.icon ?? routine.area?.icon ?? "sunrise"} className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-semibold">{routine.name}</span>
          <span
            className="mt-1.5 block h-1 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={doneCount}
            aria-label={`${routine.name} progress`}
          >
            <span
              className="block h-full rounded-full transition-all duration-500"
              style={{ width: `${total ? (doneCount / total) * 100 : 0}%`, backgroundColor: color }}
            />
          </span>
        </span>
        <span className="text-[15px] text-muted tabular">{complete ? "Done ✨" : `${doneCount}/${total}`}</span>
        <ChevronDown className={`size-4 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul className="ios-rows border-t-[0.5px] border-border [--row-inset:58px]">
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
    <li className="flex items-center gap-3 py-2.5 pr-4 pl-[21px]">
      <CheckCircle done={done} onToggle={toggle} label={`Mark "${step.title}" as done`} color={color} size="sm" />
      <span className={`pl-2 text-[15px] ${done ? "text-muted" : ""}`}>{step.title}</span>
    </li>
  );
}
