"use client";

import { Check, Plus } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { AreaSummary } from "@/features/agenda/queries";
import { markChoreDoneAction, undoChoreTodayAction } from "@/features/chores/actions";
import type { ChoreItem, ChoreStatus } from "@/features/chores/queries";
import { ChoreForm } from "./chore-form";

type Props = {
  chores: ChoreItem[];
  areas: AreaSummary[];
};

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** Friendly text for each status. Numbers only, so server and browser agree. */
export function statusText(status: ChoreStatus): string {
  switch (status.kind) {
    case "never":
      return "Not done yet";
    case "done-today":
      return "Done today";
    case "ok": {
      const ago = status.daysSince === 1 ? "Yesterday" : `${status.daysSince} days ago`;
      if (status.dueIn === null) return ago;
      if (status.dueIn === 0) return `${ago} · due today`;
      return `${ago} · due in ${plural(status.dueIn, "day")}`;
    }
    case "overdue":
      return `${status.daysSince} days ago · could use some love`;
  }
}

export function ChoreList({ chores, areas }: Props) {
  const [editing, setEditing] = useState<ChoreItem | "new" | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {chores.length === 0 ? (
        <p className="ios-list px-4 py-6 text-center text-[15px] text-muted">No chores yet. Add the first one below.</p>
      ) : (
        <ul className="ios-list ios-rows [--row-inset:58px]">
          {chores.map((chore) => (
            <ChoreRow key={chore.id} chore={chore} onEdit={() => setEditing(chore)} />
          ))}
        </ul>
      )}

      <Button type="button" variant="secondary" onClick={() => setEditing("new")}>
        <Plus className="size-5" />
        New chore
      </Button>

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" || editing === null ? "New chore" : "Edit chore"}
      >
        {editing !== null && (
          <ChoreForm
            key={editing === "new" ? "new" : editing.id}
            areas={areas}
            chore={editing === "new" ? undefined : editing}
            onDone={() => setEditing(null)}
          />
        )}
      </Sheet>
    </div>
  );
}

type RowProps = {
  chore: ChoreItem;
  onEdit: () => void;
};

function ChoreRow({ chore, onEdit }: RowProps) {
  // Optimistic: the button flips to "Done" instantly while the server saves
  const [doneToday, setDoneToday] = useOptimistic(chore.status.kind === "done-today");
  const [, startTransition] = useTransition();
  const overdue = chore.status.kind === "overdue";

  function toggle() {
    startTransition(async () => {
      setDoneToday(!doneToday);
      await (doneToday ? undoChoreTodayAction(chore.id) : markChoreDoneAction(chore.id));
    });
  }

  const status: ChoreStatus = doneToday ? { kind: "done-today" } : chore.status;

  return (
    <li className="flex items-center gap-3 py-2.5 pr-3 pl-4">
      <button type="button" onClick={onEdit} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span
          className={`flex size-[30px] shrink-0 items-center justify-center rounded-[8px] ${
            overdue && !doneToday ? "bg-warning-soft text-warning" : "bg-surface-2 text-muted"
          }`}
        >
          <Icon name={chore.icon ?? "house"} className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px]">{chore.name}</span>
          <span className={`block text-[13px] ${overdue && !doneToday ? "text-warning" : "text-muted"}`}>
            {statusText(status)}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={doneToday}
        aria-label={doneToday ? `Undo ${chore.name}` : `Mark ${chore.name} as done today`}
        className={`flex h-8 shrink-0 items-center gap-1 rounded-full px-3.5 text-[15px] font-semibold transition active:scale-95 ${
          doneToday ? "bg-success/15 text-success" : "bg-accent-soft text-accent"
        }`}
      >
        {doneToday && <Check className="size-4" strokeWidth={3} />}
        {doneToday ? "Done" : "Did it"}
      </button>
    </li>
  );
}
