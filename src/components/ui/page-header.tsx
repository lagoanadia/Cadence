import { ChevronLeft } from "lucide-react";
import Link from "next/link";

type Props = {
  title: string;
  subtitle?: string;
  back?: { href: string; label: string };
  /** Buttons shown on the right of the top bar */
  actions?: React.ReactNode;
};

/** The iOS "large title" header: small navigation row, then a big bold title. */
export function PageHeader({ title, subtitle, back, actions }: Props) {
  return (
    <header className="flex flex-col gap-1">
      <div className="flex min-h-9 items-center justify-between">
        {back ? (
          <Link href={back.href} className="-ml-2 flex items-center text-[17px] text-accent active:opacity-60">
            <ChevronLeft className="size-7" strokeWidth={2.25} />
            {back.label}
          </Link>
        ) : (
          <span />
        )}
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <h1 className="large-title">{title}</h1>
      {subtitle && <p className="text-[15px] text-muted">{subtitle}</p>}
    </header>
  );
}
