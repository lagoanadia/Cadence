import {
  BookOpen,
  ChevronRight,
  Dumbbell,
  LayoutDashboard,
  type LucideIcon,
  Repeat,
  Settings,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "More" };

type Entry = { href: string; label: string; icon: LucideIcon; color: string };

// Grouped like the iOS Settings app: colored icon tiles, one list per group
const GROUPS: Entry[][] = [
  [
    { href: "/areas", label: "Growth areas", icon: LayoutDashboard, color: "var(--c-magenta)" },
    { href: "/reading", label: "Reading", icon: BookOpen, color: "var(--c-violet)" },
    { href: "/health", label: "Health & Movement", icon: Dumbbell, color: "var(--c-aqua)" },
  ],
  [{ href: "/agenda/plans", label: "Routines & repeating", icon: Repeat, color: "var(--c-blue)" }],
  [{ href: "/settings", label: "Settings", icon: Settings, color: "#8e8e93" }],
];

export default async function MorePage() {
  await requireUserId();

  return (
    <div className="flex flex-col gap-7">
      <PageHeader title="More" />
      {GROUPS.map((group) => (
        <ul key={group[0].href} className="ios-list ios-rows [--row-inset:58px]">
          {group.map((entry) => (
            <li key={entry.href}>
              <Link href={entry.href} className="flex items-center gap-3 px-4 py-2.5 active:bg-surface-2">
                <span
                  className="flex size-[30px] items-center justify-center rounded-[8px] text-white"
                  style={{ backgroundColor: entry.color }}
                >
                  <entry.icon className="size-[18px]" />
                </span>
                <span className="flex-1 text-[17px]">{entry.label}</span>
                <ChevronRight className="size-4 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
