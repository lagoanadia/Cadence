"use client";

import { useState } from "react";

export type ChartPoint = {
  /** Position on the time axis from 0 (first day of the window) to 1 (today) */
  x: number;
  value: number;
  /** Formatted on the server, e.g. "Tue 22 Sept" */
  dateLabel: string;
};

type Props = {
  name: string;
  unit: string | null;
  points: ChartPoint[];
  startLabel: string;
  endLabel: string;
};

const HEIGHT = 120;

function formatValue(value: number, unit: string | null): string {
  // Up to 1 decimal, no trailing ".0"
  const text = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return unit ? `${text} ${unit}` : text;
}

/**
 * A single-series line chart for a user metric over the last 30 days.
 * The line is SVG; labels, the marker and the tooltip are HTML on top of it,
 * so text never gets stretched when the SVG scales to the card's width.
 */
export function MetricChart({ name, unit, points, startLabel, endLabel }: Props) {
  const [active, setActive] = useState<number | null>(null);

  if (points.length === 0) {
    return <p className="py-6 text-center text-[15px] text-muted">No values yet. Log the first one!</p>;
  }

  const values = points.map((point) => point.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  // 10% breathing room above and below the line
  const padding = (max - min) * 0.1;
  min -= padding;
  max += padding;

  const y = (value: number) => (1 - (value - min) / (max - min)) * HEIGHT;
  const path = points.map((point, i) => `${i === 0 ? "M" : "L"}${point.x * 100},${y(point.value)}`).join(" ");

  const shown = active ?? points.length - 1; // with no hover, highlight the latest value
  const current = points[shown];

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientX - rect.left) / rect.width;
    // Nearest point to the finger/cursor
    let nearest = 0;
    points.forEach((point, i) => {
      if (Math.abs(point.x - fraction) < Math.abs(points[nearest].x - fraction)) nearest = i;
    });
    setActive(nearest);
  }

  return (
    <figure className="flex flex-col gap-2">
      {/* The tooltip gets its own row, so it never covers the header or the line */}
      <div className="relative h-7">
        <div
          className="pointer-events-none absolute top-0 rounded-lg bg-text px-2 py-1 text-[12px] whitespace-nowrap text-bg"
          style={{
            left: `${current.x * 100}%`,
            transform: `translateX(${current.x > 0.8 ? "-100%" : current.x < 0.2 ? "0" : "-50%"})`,
          }}
        >
          <span className="font-semibold tabular">{formatValue(current.value, unit)}</span> · {current.dateLabel}
        </div>
      </div>

      <div
        className="relative touch-pan-y"
        style={{ height: HEIGHT }}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerMove}
        onPointerLeave={() => setActive(null)}
        role="img"
        aria-label={`${name}: ${points.length} values in the last 30 days, latest ${formatValue(points.at(-1)?.value ?? 0, unit)}`}
      >
        {/* Recessive baseline */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-border" />

        <svg
          viewBox={`0 0 100 ${HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
          aria-hidden
        >
          <path
            d={path}
            fill="none"
            stroke="var(--c-blue)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            // Keeps the line 2px thick even though the SVG is stretched
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Crosshair + marker for the highlighted point */}
        {active !== null && (
          <div className="absolute inset-y-0 w-px bg-muted/40" style={{ left: `${current.x * 100}%` }} />
        )}
        <div
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--c-blue)] ring-2 ring-surface"
          style={{ left: `${current.x * 100}%`, top: y(current.value) }}
        />
      </div>

      <div className="flex justify-between text-[11px] text-muted tabular">
        <span>{startLabel}</span>
        <span>
          Range {formatValue(min + padding, null)}–{formatValue(max - padding, unit)}
        </span>
        <span>{endLabel}</span>
      </div>

      {/* The same data as a table, for screen readers and anyone who prefers numbers */}
      <details className="text-[13px] text-muted">
        <summary className="cursor-pointer text-accent">Show values</summary>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left">
              <th className="font-medium">Day</th>
              <th className="text-right font-medium">{name}</th>
            </tr>
          </thead>
          <tbody className="text-text">
            {[...points].reverse().map((point) => (
              <tr key={point.dateLabel}>
                <td>{point.dateLabel}</td>
                <td className="text-right tabular">{formatValue(point.value, unit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
