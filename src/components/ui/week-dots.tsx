type Day = { key: string; label: string; active: boolean };

type Props = {
  days: Day[];
  /** CSS color of the filled dots */
  color?: string;
  label: string;
};

/**
 * Seven dots, one per day. Filled = something happened that day.
 * Empty days are just grey: they're rest, not failure.
 */
export function WeekDots({ days, color = "var(--accent)", label }: Props) {
  const activeCount = days.filter((day) => day.active).length;
  return (
    <ol className="flex gap-1.5" aria-label={`${label}: ${activeCount} of ${days.length} days`}>
      {days.map((day) => (
        <li key={day.key} className="flex flex-col items-center gap-1">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: day.active ? color : "var(--surface-2)" }}
          />
          <span className="text-[10px] leading-none text-muted" aria-hidden>
            {day.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
