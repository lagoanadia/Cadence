"use client";

import { Archive } from "lucide-react";
import { useTransition } from "react";
import type { IconName } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { IconColorPicker } from "@/components/ui/icon-color-picker";
import { SubmitButton } from "@/components/ui/submit-button";
import { AreaSelect } from "@/features/agenda/components/area-select";
import type { AreaSummary } from "@/features/agenda/queries";
import { archiveChoreAction, saveChoreAction } from "@/features/chores/actions";
import type { ChoreItem } from "@/features/chores/queries";
import { useActionForm } from "@/lib/use-action-form";

const CHORE_ICONS: IconName[] = [
  "washing-machine",
  "spray-can",
  "brush",
  "bath",
  "bed",
  "trash",
  "droplets",
  "cooking-pot",
  "utensils",
  "flower",
  "sprout",
  "shirt",
  "paw",
  "shopping-cart",
  "wrench",
  "scissors",
  "car",
  "house",
];

type Props = {
  areas: AreaSummary[];
  chore?: ChoreItem;
  onDone: () => void;
};

export function ChoreForm({ areas, chore, onDone }: Props) {
  const { state, pending, onSubmit, errors } = useActionForm(saveChoreAction, onDone);
  const [archiving, startArchive] = useTransition();
  const homeArea = areas.find((area) => area.name === "Home");

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {chore && <input type="hidden" name="id" value={chore.id} />}
      <Field label="Chore" htmlFor="chore-name" errors={errors.name}>
        <Input id="chore-name" name="name" defaultValue={chore?.name} placeholder="Water the plants" required />
      </Field>
      <Field
        label="Ideal frequency (days)"
        htmlFor="frequencyDays"
        errors={errors.frequencyDays}
        hint="Optional. After this many days it's gently highlighted."
      >
        <Input
          id="frequencyDays"
          name="frequencyDays"
          type="number"
          inputMode="numeric"
          min={1}
          max={365}
          placeholder="7"
          defaultValue={chore?.frequencyDays ?? ""}
        />
      </Field>
      <IconColorPicker icons={CHORE_ICONS} defaultIcon={chore?.icon ?? undefined} withColor={false} errors={errors} />
      <AreaSelect areas={areas} defaultValue={chore ? chore.area?.id : homeArea?.id} errors={errors.areaId} />
      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />
      <div className="flex gap-3">
        {chore && (
          <Button
            type="button"
            variant="danger"
            disabled={archiving}
            aria-label="Remove chore"
            onClick={() =>
              startArchive(async () => {
                await archiveChoreAction(chore.id);
                onDone();
              })
            }
          >
            <Archive className="size-5" />
          </Button>
        )}
        <SubmitButton pending={pending} className="flex-1">
          {chore ? "Save" : "Add chore"}
        </SubmitButton>
      </div>
    </form>
  );
}
