"use client";

import { CalendarDays, LayoutGrid, type LucideIcon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: LucideIcon };

// New modules will add their tab here in later phases
const ITEMS: NavItem[] = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/more", label: "More", icon: LayoutGrid },
];

export function BottomNav() {
  // usePathname only works in Client Components: it reads the browser's URL
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-2xl">
        {ITEMS.map(({ href, label, icon: IconComponent }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <IconComponent className="size-6" strokeWidth={active ? 2.25 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
