import { ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import Link from "next/link";

export type AgendaView = "day" | "week" | "month";

type Props = {
  view: AgendaView;
  title: string;
  subtitle?: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  /** Where each tab points to, so switching views keeps the date you're looking at */
  viewHrefs: Record<AgendaView, string>;
  isCurrent: boolean;
};

const VIEWS: { value: AgendaView; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export function AgendaHeader({ view, title, subtitle, prevHref, nextHref, todayHref, viewHrefs, isCurrent }: Props) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <nav aria-label="Agenda view" className="flex rounded-xl bg-surface-2 p-1">
          {VIEWS.map((option) => (
            <Link
              key={option.value}
              href={viewHrefs[option.value]}
              aria-current={option.value === view ? "page" : undefined}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium ${
                option.value === view ? "bg-surface text-text shadow-sm" : "text-muted"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/agenda/plans"
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2"
        >
          <Repeat className="size-4" />
          Repeating
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {!isCurrent && (
          <Link href={todayHref} className="rounded-xl bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
            Today
          </Link>
        )}
        <Link href={prevHref} aria-label="Previous" className="rounded-xl p-2 text-muted hover:bg-surface-2">
          <ChevronLeft className="size-5" />
        </Link>
        <Link href={nextHref} aria-label="Next" className="rounded-xl p-2 text-muted hover:bg-surface-2">
          <ChevronRight className="size-5" />
        </Link>
      </div>
    </header>
  );
}
