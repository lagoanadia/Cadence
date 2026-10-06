"use client";

import { Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  deleteMetricAction,
  deleteWorkoutAction,
  logMetricAction,
  saveMetricAction,
  saveWorkoutAction,
} from "@/features/health/actions";
import type { Metric, Workout } from "@/features/health/queries";
import type { DayKey } from "@/lib/dates";
import { useActionForm } from "@/lib/use-action-form";

export const WORKOUT_TYPES = ["walk", "run", "gym", "yoga", "cycling", "swim", "hike", "dance"];

const DURATIONS = [15, 30, 45, 60];

type WorkoutFormProps = {
  today: DayKey;
  workout?: Workout;
  onDone: () => void;
};

export function WorkoutForm({ today, workout, onDone }: WorkoutFormProps) {
  const { state, pending, onSubmit, errors } = useActionForm(saveWorkoutAction, onDone);
  const [deleting, startDelete] = useTransition();
  const isCustom = workout !== undefined && !WORKOUT_TYPES.includes(workout.type);
  const [custom, setCustom] = useState(isCustom);
  const duration = useRef<HTMLInputElement>(null);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {workout && <input type="hidden" name="id" value={workout.id} />}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 px-1 text-[13px] font-medium tracking-wide text-muted uppercase">What did you do?</legend>
        <div className="flex flex-wrap gap-2">
          {[...WORKOUT_TYPES, "other"].map((type) => (
            <label key={type} className="cursor-pointer">
              <input
                type="radio"
                name="type"
                value={type}
                defaultChecked={isCustom ? type === "other" : (workout?.type ?? "walk") === type}
                onChange={() => setCustom(type === "other")}
                className="peer sr-only"
              />
              <span className="flex h-9 items-center rounded-full bg-surface px-4 text-[15px] capitalize peer-checked:bg-accent-fill peer-checked:text-accent-text peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                {type}
              </span>
            </label>
          ))}
        </div>
        {custom && (
          <Input
            name="customType"
            placeholder="Climbing, pilates, football…"
            defaultValue={isCustom ? workout?.type : ""}
            aria-label="Activity name"
            required
          />
        )}
        {errors.type?.map((error) => (
          <p key={error} className="px-1 text-[13px] text-danger">
            {error}
          </p>
        ))}
      </fieldset>

      <Field label="Minutes" htmlFor="durationMin" errors={errors.durationMin}>
        <div className="flex gap-2">
          <Input
            ref={duration}
            id="durationMin"
            name="durationMin"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="30"
            defaultValue={workout?.durationMin}
            className="w-24"
            required
          />
          {DURATIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => {
                if (duration.current) duration.current.value = String(minutes);
              }}
              className="h-11 flex-1 rounded-[10px] bg-surface text-[15px] text-accent"
            >
              {minutes}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field label="Notes (optional)" htmlFor="workout-notes" errors={errors.notes}>
          <Input id="workout-notes" name="notes" defaultValue={workout?.notes ?? ""} placeholder="How did it feel?" />
        </Field>
        <Field label="Date" htmlFor="workout-date" errors={errors.date}>
          <Input id="workout-date" name="date" type="date" defaultValue={workout?.date ?? today} className="w-auto" />
        </Field>
      </div>

      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />
      <div className="flex gap-3">
        {workout && (
          <Button
            type="button"
            variant="danger"
            disabled={deleting}
            aria-label="Delete workout"
            onClick={() =>
              startDelete(async () => {
                await deleteWorkoutAction(workout.id);
                onDone();
              })
            }
          >
            <Trash2 className="size-5" />
          </Button>
        )}
        <SubmitButton pending={pending} className="flex-1">
          {workout ? "Save" : "Log workout"}
        </SubmitButton>
      </div>
    </form>
  );
}

// Neutral, general-purpose suggestions (nothing about weight or dieting)
const METRIC_SUGGESTIONS = [
  { name: "Steps", unit: "steps" },
  { name: "Sleep", unit: "h" },
  { name: "Water", unit: "glasses" },
  { name: "Energy", unit: "/5" },
  { name: "Meditation", unit: "min" },
];

type MetricFormProps = {
  metric?: Metric;
  onDone: () => void;
};

export function MetricForm({ metric, onDone }: MetricFormProps) {
  const { state, pending, onSubmit, errors } = useActionForm(saveMetricAction, onDone);
  const [deleting, startDelete] = useTransition();
  const nameInput = useRef<HTMLInputElement>(null);
  const unitInput = useRef<HTMLInputElement>(null);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {metric && <input type="hidden" name="id" value={metric.id} />}
      {!metric && (
        <div className="flex flex-wrap gap-2">
          {METRIC_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.name}
              type="button"
              onClick={() => {
                if (nameInput.current) nameInput.current.value = suggestion.name;
                if (unitInput.current) unitInput.current.value = suggestion.unit;
              }}
              className="h-9 rounded-full bg-surface px-4 text-[15px] text-accent"
            >
              {suggestion.name}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <Field label="What to track" htmlFor="metric-name" errors={errors.name}>
          <Input ref={nameInput} id="metric-name" name="name" defaultValue={metric?.name} placeholder="Steps" required />
        </Field>
        <Field label="Unit" htmlFor="metric-unit" errors={errors.unit}>
          <Input ref={unitInput} id="metric-unit" name="unit" defaultValue={metric?.unit ?? ""} placeholder="steps" />
        </Field>
      </div>
      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />
      <div className="flex gap-3">
        {metric && (
          <Button
            type="button"
            variant="danger"
            disabled={deleting}
            aria-label="Stop tracking"
            onClick={() =>
              startDelete(async () => {
                await deleteMetricAction(metric.id);
                onDone();
              })
            }
          >
            <Trash2 className="size-5" />
          </Button>
        )}
        <SubmitButton pending={pending} className="flex-1">
          {metric ? "Save" : "Start tracking"}
        </SubmitButton>
      </div>
    </form>
  );
}

type LogMetricProps = {
  metric: Metric;
  today: DayKey;
  onDone: () => void;
};

export function LogMetricForm({ metric, today, onDone }: LogMetricProps) {
  const { state, pending, onSubmit, errors } = useActionForm(logMetricAction, onDone);
  const todayValue = metric.points.find((point) => point.date === today)?.value;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="metricId" value={metric.id} />
      <label className="flex flex-col items-center gap-1">
        <span className="sr-only">{metric.name}</span>
        <input
          name="value"
          inputMode="decimal"
          placeholder="0"
          defaultValue={todayValue}
          autoFocus
          required
          className="w-44 bg-transparent text-center text-[44px] font-bold tracking-tight tabular outline-none placeholder:text-muted/40"
        />
        <span className="text-[15px] text-muted">{metric.unit ?? metric.name}</span>
        {errors.value?.map((error) => (
          <span key={error} className="text-[13px] text-danger">
            {error}
          </span>
        ))}
      </label>
      <Field label="Date" htmlFor="metric-date" errors={errors.date} hint="Logging the same day again replaces the value.">
        <Input id="metric-date" name="date" type="date" defaultValue={today} />
      </Field>
      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />
      <SubmitButton pending={pending}>Save</SubmitButton>
    </form>
  );
}
