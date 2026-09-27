"use client";

import { Check } from "lucide-react";
import { useOptimistic, useTransition } from "react";

/**
 * "Optimistic UI": when you tap, we show the new state IMMEDIATELY and send
 * the request in the background. When the server answers, the page is
 * refreshed with the real data. If the request fails, React throws the
 * optimistic value away and the old state comes back on its own.
 */
export function useOptimisticDone(
  done: boolean,
  save: (next: boolean) => Promise<void>,
): [boolean, () => void] {
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !optimisticDone;
    startTransition(async () => {
      setOptimisticDone(next);
      await save(next);
    });
  }

  return [optimisticDone, toggle];
}

type Props = {
  done: boolean;
  label: string;
  onToggle: () => void;
  /** CSS color (e.g. from cssColor()) for the ring and the filled state */
  color?: string;
  size?: "md" | "sm";
};

/** A round checkbox like the one in Apple's Reminders app. */
export function CheckCircle({ done, label, onToggle, color = "var(--accent)", size = "md" }: Props) {
  const box = size === "md" ? "size-[22px]" : "size-5";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onToggle}
      // The padding makes the tap target bigger than the circle (good for thumbs)
      className="-m-2.5 shrink-0 p-2.5"
    >
      <span
        className={`flex ${box} items-center justify-center rounded-full border-[1.5px] transition active:scale-90`}
        style={{
          borderColor: done ? color : "color-mix(in srgb, var(--muted) 60%, transparent)",
          backgroundColor: done ? color : "transparent",
        }}
      >
        {done && <Check className="size-3.5 text-white" strokeWidth={3.5} />}
      </span>
    </button>
  );
}
