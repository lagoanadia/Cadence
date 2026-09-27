"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteTaskAction, saveTaskAction } from "@/features/agenda/actions";
import type { AgendaTask, AreaSummary } from "@/features/agenda/queries";
import type { DayKey } from "@/lib/dates";
import { useActionForm } from "@/lib/use-action-form";
import { AreaSelect } from "./area-select";

type Props = {
  areas: AreaSummary[];
  defaultDate: DayKey;
  task?: AgendaTask; // present when editing
  /** Pre-selects an area for new tasks (e.g. from the areas dashboard) */
  defaultAreaId?: string;
  onDone: () => void;
};

export function TaskForm({ areas, defaultDate, task, defaultAreaId, onDone }: Props) {
  const { state, pending, onSubmit, errors } = useActionForm(saveTaskAction, onDone);
  const [deleting, startDelete] = useTransition();

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {task && <input type="hidden" name="id" value={task.id} />}

      <Field label="What do you want to do?" htmlFor="title" errors={errors.title}>
        <Input id="title" name="title" defaultValue={task?.title} placeholder="Read chapter 3" required />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor="date" errors={errors.date}>
          <Input id="date" name="date" type="date" defaultValue={task?.date ?? defaultDate} required />
        </Field>
        <Field label="Time (optional)" htmlFor="time" errors={errors.time}>
          <Input id="time" name="time" type="time" defaultValue={task?.time ?? ""} />
        </Field>
      </div>

      <AreaSelect areas={areas} defaultValue={task ? task.area?.id : defaultAreaId} errors={errors.areaId} />

      <Field label="Notes (optional)" htmlFor="notes" errors={errors.notes}>
        <Textarea id="notes" name="notes" defaultValue={task?.notes ?? ""} rows={2} />
      </Field>

      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />

      <div className="flex gap-3">
        {task && (
          <Button
            type="button"
            variant="danger"
            disabled={deleting}
            aria-label="Delete task"
            onClick={() =>
              startDelete(async () => {
                await deleteTaskAction(task.id);
                onDone();
              })
            }
          >
            <Trash2 className="size-4" />
          </Button>
        )}
        <SubmitButton pending={pending} className="flex-1">
          {task ? "Save changes" : "Add task"}
        </SubmitButton>
      </div>
    </form>
  );
}
