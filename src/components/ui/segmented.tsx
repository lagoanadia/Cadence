import Link from "next/link";

type Segment = { label: string; href: string; active: boolean };

type Props = {
  segments: Segment[];
  label: string;
};

/** iOS segmented control, where each segment is a link (it changes the URL). */
export function SegmentedLinks({ segments, label }: Props) {
  return (
    <nav aria-label={label} className="glass flex rounded-full p-1">
      {segments.map((segment) => (
        <Link
          key={segment.href}
          href={segment.href}
          aria-current={segment.active ? "page" : undefined}
          className={`flex-1 rounded-full py-1.5 text-center text-[13px] font-semibold transition ${
            segment.active ? "bg-accent-fill text-accent-text shadow-[0_4px_14px_rgba(255,214,10,0.35)]" : "text-text/75"
          }`}
        >
          {segment.label}
        </Link>
      ))}
    </nav>
  );
}
