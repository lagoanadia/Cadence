"use client";

import { BookOpen, CalendarDays, Dumbbell, House, LayoutDashboard, type LucideIcon, Sun, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: LucideIcon; also?: string[] };

// Every module has its own tab. Seven is more than iOS usually shows, so the
// labels are short and the icons a bit smaller to fit a phone screen.
const ITEMS: NavItem[] = [
  { href: "/today", label: "Today", icon: Sun, also: ["/settings"] },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/expenses", label: "Money", icon: Wallet },
  { href: "/home", label: "Home", icon: House },
  { href: "/areas", label: "Areas", icon: LayoutDashboard },
  { href: "/reading", label: "Books", icon: BookOpen },
  { href: "/health", label: "Move", icon: Dumbbell },
];

/**
 * A floating "liquid glass" tab bar: a capsule that hovers above the content,
 * so the page scrolls (blurred) underneath it. The active tab gets a yellow
 * icon on a small glass pill.
 */
export function BottomNav() {
  // usePathname only works in Client Components: it reads the browser's URL
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 mx-auto max-w-xl"
    >
      <ul className="glass flex rounded-[30px] p-1.5">
        {ITEMS.map(({ href, label, icon: IconComponent, also = [] }) => {
          const active = isActive(href) || also.some(isActive);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-[24px] py-1.5 text-[10px] font-medium transition ${
                  active ? "bg-surface-2 text-accent shadow-[inset_0_1px_0_var(--highlight)]" : "text-muted"
                }`}
              >
                <IconComponent className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
