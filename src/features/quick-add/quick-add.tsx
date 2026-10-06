"use client";

import {
  BookOpen,
  BookPlus,
  Check,
  CircleCheck,
  Dumbbell,
  House,
  type LucideIcon,
  Plus,
  Receipt,
  Sparkles,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { Sheet } from "@/components/ui/sheet";
import { TaskForm } from "@/features/agenda/components/task-form";
import type { AreaSummary } from "@/features/agenda/queries";
import { markChoreDoneAction } from "@/features/chores/actions";
import { ChoreForm } from "@/features/chores/components/chore-form";
import { ExpenseForm } from "@/features/expenses/components/expense-form";
import type { Category } from "@/features/expenses/queries";
import { WorkoutForm } from "@/features/health/components/health-forms";
import { BookForm, LogPagesForm } from "@/features/reading/components/reading-forms";
import type { Book } from "@/features/reading/queries";
import { type DayKey, isDayKey } from "@/lib/dates";

export type QuickChore = { id: string; name: string; icon: string | null; doneToday: boolean };

type Props = {
  areas: AreaSummary[];
  today: DayKey;
  categories: Category[];
  receiptsEnabled: boolean;
  chores: QuickChore[];
  readingBooks: Book[];
};

type Mode = "task" | "expense" | "chore-done" | "new-chore" | "workout" | "pages" | "new-book";

const OPTIONS: { mode: Mode; label: string; icon: LucideIcon; color: string }[] = [
  { mode: "expense", label: "Expense", icon: Receipt, color: "var(--c-green)" },
  { mode: "task", label: "Task", icon: CircleCheck, color: "var(--c-blue)" },
  { mode: "chore-done", label: "Chore done", icon: House, color: "var(--c-yellow)" },
  { mode: "workout", label: "Workout", icon: Dumbbell, color: "var(--c-aqua)" },
  { mode: "pages", label: "Pages read", icon: BookOpen, color: "var(--c-violet)" },
  { mode: "new-book", label: "New book", icon: BookPlus, color: "var(--c-magenta)" },
];

const TITLES: Record<Mode, string> = {
  task: "New task",
  expense: "New expense",
  "chore-done": "Chore done",
  "new-chore": "New chore",
  workout: "Log workout",
  pages: "Pages read today",
  "new-book": "New book",
};

/**
 * The "+" adds whatever the current screen is about: on Money an expense, on
 * Home a chore, on Books a book… Screens without an obvious "thing" (Settings)
 * open the full menu instead.
 */
export function modeForPath(pathname: string): Mode | null {
  if (pathname.startsWith("/expenses")) return "expense";
  if (pathname.startsWith("/home")) return "new-chore";
  if (pathname.startsWith("/reading")) return "new-book";
  if (pathname.startsWith("/health")) return "workout";
  if (pathname.startsWith("/today") || pathname.startsWith("/agenda") || pathname.startsWith("/areas")) return "task";
  return null;
}

/** When you're looking at a specific day, new tasks default to that day. */
function dateFromPath(pathname: string, fallback: DayKey): DayKey {
  const match = pathname.match(/^\/agenda\/(?:day|week)\/(\d{4}-\d{2}-\d{2})/);
  const date = match?.[1];
  return date && isDayKey(date) && date >= fallback ? date : fallback;
}

/** The floating "+": opens the form that matches the screen, with the full menu one tap away. */
export function QuickAdd({ areas, today, categories, receiptsEnabled, chores, readingBooks }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const pathname = usePathname();
  const contextual = modeForPath(pathname);
  const close = () => setMode(null);

  function openPlus() {
    if (contextual) setMode(contextual);
    else setMenuOpen(true);
  }

  function showMenu() {
    setMode(null);
    setMenuOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openPlus}
        aria-label={contextual ? TITLES[contextual] : "Quick add"}
        className="fixed right-5 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full border border-white/40 bg-accent-fill text-accent-text shadow-[0_10px_30px_rgba(255,214,10,0.45),inset_0_1px_0_rgba(255,255,255,0.7)] transition active:scale-90 sm:right-[max(1.25rem,calc(50%-19rem))]"
      >
        <Plus className="size-7" strokeWidth={2.5} />
      </button>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Add something">
        <ul className="ios-list ios-rows [--row-inset:58px]">
          {OPTIONS.map((option) => (
            <li key={option.mode}>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setMode(option.mode);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[17px] active:bg-surface-2"
              >
                <span
                  className="flex size-[30px] items-center justify-center rounded-[9px] text-white"
                  style={{ backgroundColor: option.color }}
                >
                  <option.icon className="size-[18px]" />
                </span>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={mode !== null} onClose={close} title={mode ? TITLES[mode] : ""}>
        {mode === "task" && <TaskForm areas={areas} defaultDate={dateFromPath(pathname, today)} onDone={close} />}
        {mode === "expense" && (
          <ExpenseForm categories={categories} today={today} receiptsEnabled={receiptsEnabled} onDone={close} />
        )}
        {mode === "chore-done" && <ChorePicker chores={chores} onDone={close} />}
        {mode === "new-chore" && <ChoreForm areas={areas} onDone={close} />}
        {mode === "workout" && <WorkoutForm today={today} onDone={close} />}
        {mode === "pages" && <LogPagesForm books={readingBooks} onDone={close} />}
        {mode === "new-book" && <BookForm onDone={close} />}

        <button
          type="button"
          onClick={showMenu}
          className="mx-auto mt-5 flex items-center gap-1.5 text-[15px] text-accent active:opacity-60"
        >
          <Sparkles className="size-4" />
          Something else…
        </button>
      </Sheet>
    </>
  );
}

type ChorePickerProps = {
  chores: QuickChore[];
  onDone: () => void;
};

/** One tap on a chore = done today. */
function ChorePicker({ chores, onDone }: ChorePickerProps) {
  const [pending, startTransition] = useTransition();

  if (chores.length === 0) {
    return <p className="text-center text-[15px] text-muted">Add chores on the Home tab first.</p>;
  }

  return (
    <ul className="ios-list ios-rows [--row-inset:58px]">
      {chores.map((chore) => (
        <li key={chore.id}>
          <button
            type="button"
            disabled={pending || chore.doneToday}
            onClick={() =>
              startTransition(async () => {
                await markChoreDoneAction(chore.id);
                onDone();
              })
            }
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-[17px] active:bg-surface-2 disabled:opacity-60"
          >
            <span className="flex size-[30px] items-center justify-center rounded-[8px] bg-surface-2 text-muted">
              <Icon name={chore.icon ?? "house"} className="size-[18px]" />
            </span>
            <span className="flex-1">{chore.name}</span>
            {chore.doneToday && (
              <span className="flex items-center gap-1 text-[15px] text-success">
                <Check className="size-4" strokeWidth={3} />
                Today
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
