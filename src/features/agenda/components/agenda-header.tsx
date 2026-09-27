import { ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import Link from "next/link";
import { SegmentedLinks } from "@/components/ui/segmented";

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
    <header className="flex flex-col gap-3">
      <div className="flex min-h-9 items-center justify-between">
        {isCurrent ? (
          <span />
        ) : (
          <Link href={todayHref} className="text-[17px] text-accent active:opacity-60">
            Today
          </Link>
        )}
        <div className="flex items-center">
          <Link href={prevHref} aria-label="Previous" className="p-1.5 text-accent active:opacity-60">
            <ChevronLeft className="size-6" />
          </Link>
          <Link href={nextHref} aria-label="Next" className="p-1.5 text-accent active:opacity-60">
            <ChevronRight className="size-6" />
          </Link>
          <Link href="/agenda/plans" aria-label="Routines and repeating tasks" className="p-1.5 text-accent active:opacity-60">
            <Repeat className="size-[22px]" />
          </Link>
        </div>
      </div>

      <div>
        <h1 className="large-title truncate">{title}</h1>
        {subtitle && <p className="text-[15px] text-muted">{subtitle}</p>}
      </div>

      <SegmentedLinks
        label="Agenda view"
        segments={VIEWS.map((option) => ({
          label: option.label,
          href: viewHrefs[option.value],
          active: option.value === view,
        }))}
      />
    </header>
  );
}
