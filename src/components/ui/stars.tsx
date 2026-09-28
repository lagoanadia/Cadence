"use client";

import { Star } from "lucide-react";
import { useState } from "react";

type PickerProps = {
  name: string;
  defaultValue: number | null;
};

/**
 * 1–5 star picker. The value travels with the form through a hidden input.
 * Tapping the star that's already selected clears the rating.
 */
export function StarPicker({ name, defaultValue }: PickerProps) {
  const [value, setValue] = useState<number | null>(defaultValue);

  return (
    <div role="radiogroup" aria-label="Rating" className="flex gap-1">
      <input type="hidden" name={name} value={value ?? ""} />
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
          onClick={() => setValue(value === star ? null : star)}
          className="p-1 transition active:scale-90"
        >
          <Star
            className={`size-8 ${value !== null && star <= value ? "fill-[var(--c-yellow)] text-[var(--c-yellow)]" : "text-muted/50"}`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

type DisplayProps = {
  rating: number;
};

/** Read-only stars, e.g. in a list. */
export function Stars({ rating }: DisplayProps) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden
          className={`size-3.5 ${star <= rating ? "fill-[var(--c-yellow)] text-[var(--c-yellow)]" : "text-muted/40"}`}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}
