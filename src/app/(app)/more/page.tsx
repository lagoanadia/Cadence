import { BookOpen, ChevronRight, Dumbbell, House, LayoutDashboard, type LucideIcon, Receipt, Repeat, Settings } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "More" };

type Entry = { href: string | null; label: string; description: string; icon: LucideIcon };

// href: null = module arriving in a later phase
const ENTRIES: Entry[] = [
  { href: "/agenda/plans", label: "Routines & repeating", description: "Checklists and recurring tasks", icon: Repeat },
  { href: null, label: "Expenses", description: "Quick spending log and budget", icon: Receipt },
  { href: null, label: "Home", description: "Chores and when you last did them", icon: House },
  { href: null, label: "Growth areas", description: "Where your attention went this week", icon: LayoutDashboard },
  { href: null, label: "Reading", description: "Books and pages read", icon: BookOpen },
  { href: null, label: "Health & Movement", description: "Workouts and your own metrics", icon: Dumbbell },
  { href: "/settings", label: "Settings", description: "Timezone, week start, account", icon: Settings },
];

export default async function MorePage() {
  await requireUserId();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">More</h1>
      <ul className="flex flex-col gap-2">
        {ENTRIES.map((entry) => {
          const content = (
            <>
              <span className="flex size-10 items-center justify-center rounded-xl bg-surface-2">
                <entry.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{entry.label}</span>
                <span className="block text-sm text-muted">{entry.description}</span>
              </span>
              {entry.href ? (
                <ChevronRight className="size-4 text-muted" />
              ) : (
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">Soon</span>
              )}
            </>
          );
          const className = "flex items-center gap-3 rounded-2xl bg-surface px-4 py-3";
          return (
            <li key={entry.label}>
              {entry.href ? (
                <Link href={entry.href} className={className}>
                  {content}
                </Link>
              ) : (
                <div className={`${className} opacity-60`}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
