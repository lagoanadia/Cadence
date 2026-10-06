"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/field";
import type { Frequency } from "@/generated/prisma/enums";

type Props = {
  frequency?: Frequency;
  daysOfWeek?: number[];
  dayOfMonth?: number | null;
  errors: Record<string, string[] | undefined>;
};

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "DAILY", label: "Every day" },
  { value: "WEEKLY", label: "Some weekdays" },
  { value: "MONTHLY", label: "Monthly" },
];

// Shown Monday first, but stored with JS numbering (0 = Sunday)
const WEEKDAYS = [
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
  { value: 0, label: "S" },
];

/**
 * The "how often?" part of the recurring task and routine forms.
 * The inputs are plain HTML checkboxes/radios styled with Tailwind's `peer`
 * trick: `peer-checked:` styles an element when the input before it is checked.
 */
export function RuleFields({ frequency = "DAILY", daysOfWeek = [], dayOfMonth, errors }: Props) {
  const [selected, setSelected] = useState<Frequency>(frequency);

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 px-1 text-[13px] font-medium text-muted uppercase tracking-wide">How often?</legend>
        <div className="glass grid grid-cols-3 rounded-full p-1">
          {FREQUENCIES.map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value={option.value}
                checked={selected === option.value}
                onChange={() => setSelected(option.value)}
                className="peer sr-only"
              />
              <span className="flex h-8 items-center justify-center rounded-full text-[13px] font-semibold text-text/75 peer-checked:bg-accent-fill peer-checked:text-accent-text peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {selected === "WEEKLY" && (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 px-1 text-[13px] font-medium text-muted uppercase tracking-wide">On which days?</legend>
          <div className="flex justify-between gap-1">
            {WEEKDAYS.map((day) => (
              <label key={day.value} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="daysOfWeek"
                  value={day.value}
                  defaultChecked={daysOfWeek.includes(day.value)}
                  className="peer sr-only"
                />
                <span className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-[15px] font-semibold text-muted backdrop-blur-xl peer-checked:border-transparent peer-checked:bg-accent-fill peer-checked:text-accent-text peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                  {day.label}
                </span>
              </label>
            ))}
          </div>
          {errors.daysOfWeek?.map((error) => (
            <p key={error} className="px-1 text-[13px] text-danger">
              {error}
            </p>
          ))}
        </fieldset>
      )}

      {selected === "MONTHLY" && (
        <Field
          label="Day of the month"
          htmlFor="dayOfMonth"
          errors={errors.dayOfMonth}
          hint="If a month is shorter, it happens on its last day."
        >
          <Input id="dayOfMonth" name="dayOfMonth" type="number" min={1} max={31} defaultValue={dayOfMonth ?? 1} />
        </Field>
      )}
    </div>
  );
}
