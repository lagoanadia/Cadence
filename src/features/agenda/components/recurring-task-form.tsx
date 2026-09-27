"use client";

import { Archive } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { archiveRecurringTaskAction, saveRecurringTaskAction } from "@/features/agenda/actions";
import type { AreaSummary, RecurringTaskSummary } from "@/features/agenda/queries";
import type { DayKey } from "@/lib/dates";
import { useActionForm } from "@/lib/use-action-form";
import { AreaSelect } from "./area-select";
import { RuleFields } from "./rule-fields";

type Props = {
  areas: AreaSummary[];
  today: DayKey;
  recurring?: RecurringTaskSummary;
  onDone: () => void;
};

export function RecurringTaskForm({ areas, today, recurring, onDone }: Props) {
  const { state, pending, onSubmit, errors } = useActionForm(saveRecurringTaskAction, onDone);
  const [archiving, startArchive] = useTransition();

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {recurring && <input type="hidden" name="id" value={recurring.id} />}

      <Field label="Task" htmlFor="title" errors={errors.title}>
        <Input id="title" name="title" defaultValue={recurring?.title} placeholder="Water the plants" required />
      </Field>

      <RuleFields
        frequency={recurring?.frequency}
        daysOfWeek={recurring?.daysOfWeek}
        dayOfMonth={recurring?.dayOfMonth}
        errors={errors}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts on" htmlFor="startDate" errors={errors.startDate}>
          <Input id="startDate" name="startDate" type="date" defaultValue={recurring?.startDate ?? today} required />
        </Field>
        <Field label="Time (optional)" htmlFor="time" errors={errors.time}>
          <Input id="time" name="time" type="time" defaultValue={recurring?.time ?? ""} />
        </Field>
      </div>

      <AreaSelect areas={areas} defaultValue={recurring?.area?.id} errors={errors.areaId} />

      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />

      <div className="flex gap-3">
        {recurring && (
          <Button
            type="button"
            variant="danger"
            disabled={archiving}
            aria-label="Stop repeating"
            onClick={() =>
              startArchive(async () => {
                await archiveRecurringTaskAction(recurring.id);
                onDone();
              })
            }
          >
            <Archive className="size-4" />
          </Button>
        )}
        <SubmitButton pending={pending} className="flex-1">
          {recurring ? "Save changes" : "Add recurring task"}
        </SubmitButton>
      </div>
    </form>
  );
}
