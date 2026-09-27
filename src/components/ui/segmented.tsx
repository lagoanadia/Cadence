import Link from "next/link";

type Segment = { label: string; href: string; active: boolean };

type Props = {
  segments: Segment[];
  label: string;
};

/** iOS segmented control, where each segment is a link (it changes the URL). */
export function SegmentedLinks({ segments, label }: Props) {
  return (
    <nav aria-label={label} className="flex rounded-[9px] bg-surface-2 p-0.5">
      {segments.map((segment) => (
        <Link
          key={segment.href}
          href={segment.href}
          aria-current={segment.active ? "page" : undefined}
          className={`flex-1 rounded-[7px] py-1.5 text-center text-[13px] font-semibold transition ${
            segment.active ? "bg-surface text-text shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)]" : "text-text/80"
          }`}
        >
          {segment.label}
        </Link>
      ))}
    </nav>
  );
}
