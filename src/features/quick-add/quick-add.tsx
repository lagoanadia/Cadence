"use client";

import { BookOpen, CircleCheck, Dumbbell, House, type LucideIcon, Plus, Receipt } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import type { AreaSummary } from "@/features/agenda/queries";
import { TaskForm } from "@/features/agenda/components/task-form";
import { type DayKey, isDayKey } from "@/lib/dates";

type Props = {
  areas: AreaSummary[];
  today: DayKey;
};

type Mode = "menu" | "task";

type Option = {
  label: string;
  icon: LucideIcon;
  mode: Mode | null; // null = coming in a later phase
};

const OPTIONS: Option[] = [
  { label: "Task", icon: CircleCheck, mode: "task" },
  { label: "Expense", icon: Receipt, mode: null },
  { label: "Chore done", icon: House, mode: null },
  { label: "Workout", icon: Dumbbell, mode: null },
  { label: "Pages read", icon: BookOpen, mode: null },
];

/** When you're looking at a specific day, new tasks default to that day. */
function dateFromPath(pathname: string, fallback: DayKey): DayKey {
  const match = pathname.match(/^\/agenda\/(?:day|week)\/(\d{4}-\d{2}-\d{2})/);
  const date = match?.[1];
  return date && isDayKey(date) && date >= fallback ? date : fallback;
}

export function QuickAdd({ areas, today }: Props) {
  const [mode, setMode] = useState<Mode | null>(null);
  const pathname = usePathname();
  const close = () => setMode(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setMode("menu")}
        aria-label="Quick add"
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-text shadow-lg shadow-accent/30 transition active:scale-95 sm:right-[max(1rem,calc(50%-20rem))]"
      >
        <Plus className="size-7" />
      </button>

      <Sheet open={mode === "menu"} onClose={close} title="Quick add">
        <ul className="grid grid-cols-3 gap-3">
          {OPTIONS.map((option) => (
            <li key={option.label}>
              <button
                type="button"
                disabled={option.mode === null}
                onClick={() => option.mode && setMode(option.mode)}
                className="flex w-full flex-col items-center gap-2 rounded-2xl bg-surface-2 px-2 py-4 text-sm font-medium disabled:opacity-40"
              >
                <option.icon className="size-6" />
                {option.label}
                {option.mode === null && <span className="-mt-1.5 text-[10px] text-muted">Soon</span>}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={mode === "task"} onClose={close} title="New task">
        <TaskForm areas={areas} defaultDate={dateFromPath(pathname, today)} onDone={close} />
      </Sheet>
    </>
  );
}
