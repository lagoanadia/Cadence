"use client";

import { Clock, Repeat } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle, useOptimisticDone } from "@/components/ui/check-toggle";
import { Sheet } from "@/components/ui/sheet";
import { moveTaskToDayAction, toggleOccurrenceAction, toggleTaskAction } from "@/features/agenda/actions";
import type { AgendaItem, AreaSummary } from "@/features/agenda/queries";
import type { DayKey } from "@/lib/dates";
import { cssColor } from "@/lib/palette";
import { AreaTag } from "./area-tag";
import { TaskForm } from "./task-form";

type Props = {
  item: AgendaItem;
  areas: AreaSummary[];
  today: DayKey;
  /**
   * Overdue rows show their date and a "Move to today" button.
   * The label is formatted on the SERVER: Node and the browser can format
   * dates slightly differently ("Wed 23 Sept" vs "Wed, 23 Sept"), and that
   * difference would make React's hydration fail.
   */
  overdueLabel?: string;
};

export function AgendaItemRow({ item, areas, today, overdueLabel }: Props) {
  const overdue = overdueLabel !== undefined;
  const [editing, setEditing] = useState(false);
  const [moving, startMove] = useTransition();

  // Narrowing: inside each branch TypeScript knows exactly which kind `item` is
  const [done, toggle] = useOptimisticDone(item.done, (next) =>
    item.kind === "task" ? toggleTaskAction(item.id, next) : toggleOccurrenceAction(item.id, item.date, next),
  );

  const meta = (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-muted">
      {overdue && <span className="text-warning">{overdueLabel}</span>}
      {item.time && (
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" />
          {item.time}
        </span>
      )}
      {item.kind === "recurring" && (
        <span className="inline-flex items-center gap-1">
          <Repeat className="size-3.5" />
          {item.ruleLabel}
        </span>
      )}
      {item.area && <AreaTag area={item.area} />}
    </span>
  );

  const body = (
    <>
      <span className={`block text-[17px] leading-snug ${done ? "text-muted" : ""}`}>{item.title}</span>
      {meta}
    </>
  );

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <div className="pt-0.5">
        <CheckCircle
          done={done}
          onToggle={toggle}
          label={`Mark "${item.title}" as done`}
          color={item.area ? cssColor(item.area.color) : undefined}
        />
      </div>

      {item.kind === "task" ? (
        <button type="button" onClick={() => setEditing(true)} className="flex min-w-0 flex-1 flex-col gap-1 text-left">
          {body}
        </button>
      ) : (
        <Link href="/agenda/plans" className="flex min-w-0 flex-1 flex-col gap-1">
          {body}
        </Link>
      )}

      {overdue && item.kind === "task" && (
        <button
          type="button"
          disabled={moving}
          onClick={() => startMove(() => moveTaskToDayAction(item.id, today))}
          className="shrink-0 self-center rounded-full bg-accent-soft px-3 py-1 text-[13px] font-semibold text-accent"
        >
          Move to today
        </button>
      )}

      {item.kind === "task" && (
        <Sheet open={editing} onClose={() => setEditing(false)} title="Edit task">
          <TaskForm areas={areas} defaultDate={item.date} task={item} onDone={() => setEditing(false)} />
        </Sheet>
      )}
    </li>
  );
}
