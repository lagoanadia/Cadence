"use client";

import { CalendarDays, Ellipsis, House, type LucideIcon, Sun, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: LucideIcon; also?: string[] };

const ITEMS: NavItem[] = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/expenses", label: "Money", icon: Wallet },
  { href: "/home", label: "Home", icon: House },
  // "More" stays highlighted on the pages it links to
  { href: "/more", label: "More", icon: Ellipsis, also: ["/areas", "/reading", "/health", "/settings"] },
];

/** iOS tab bar: translucent, blurred, hairline on top. */
export function BottomNav() {
  // usePathname only works in Client Components: it reads the browser's URL
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t-[0.5px] border-border bg-surface/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150"
    >
      <ul className="mx-auto flex max-w-2xl">
        {ITEMS.map(({ href, label, icon: IconComponent, also = [] }) => {
          const active = isActive(href) || also.some(isActive);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[10px] font-medium ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <IconComponent className="size-[26px]" strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
