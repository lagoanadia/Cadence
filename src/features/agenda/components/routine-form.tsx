"use client";

import { Archive } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { archiveRoutineAction, saveRoutineAction } from "@/features/agenda/actions";
import type { AreaSummary, RoutineSummary } from "@/features/agenda/queries";
import { useActionForm } from "@/lib/use-action-form";
import { AreaSelect } from "./area-select";
import { RuleFields } from "./rule-fields";

type Props = {
  areas: AreaSummary[];
  routine?: RoutineSummary;
  onDone: () => void;
};

export function RoutineForm({ areas, routine, onDone }: Props) {
  const { state, pending, onSubmit, errors } = useActionForm(saveRoutineAction, onDone);
  const [archiving, startArchive] = useTransition();

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {routine && <input type="hidden" name="id" value={routine.id} />}

      <Field label="Name" htmlFor="name" errors={errors.name}>
        <Input id="name" name="name" defaultValue={routine?.name} placeholder="Morning routine" required />
      </Field>

      <Field label="Steps" htmlFor="steps" errors={errors.steps} hint="One step per line.">
        <Textarea
          id="steps"
          name="steps"
          rows={5}
          defaultValue={routine?.steps.join("\n")}
          placeholder={"Make the bed\nStretch for 5 minutes\nBreakfast"}
          required
        />
      </Field>

      <RuleFields
        frequency={routine?.frequency}
        daysOfWeek={routine?.daysOfWeek}
        dayOfMonth={routine?.dayOfMonth}
        errors={errors}
      />

      <AreaSelect areas={areas} defaultValue={routine?.area?.id} errors={errors.areaId} />

      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />

      <div className="flex gap-3">
        {routine && (
          <Button
            type="button"
            variant="danger"
            disabled={archiving}
            aria-label="Archive routine"
            onClick={() =>
              startArchive(async () => {
                await archiveRoutineAction(routine.id);
                onDone();
              })
            }
          >
            <Archive className="size-4" />
          </Button>
        )}
        <SubmitButton pending={pending} className="flex-1">
          {routine ? "Save changes" : "Add routine"}
        </SubmitButton>
      </div>
    </form>
  );
}
