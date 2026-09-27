"use client";

import { ChevronRight, EyeOff, Plus, SlidersHorizontal, Archive } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { IconColorPicker } from "@/components/ui/icon-color-picker";
import { Sheet } from "@/components/ui/sheet";
import { SubmitButton } from "@/components/ui/submit-button";
import { Switch } from "@/components/ui/switch";
import { TaskForm } from "@/features/agenda/components/task-form";
import type { AreaSummary } from "@/features/agenda/queries";
import { archiveAreaAction, saveAreaAction, setPrivateModeAction } from "@/features/areas/actions";
import type { DayKey } from "@/lib/dates";
import { cssColor } from "@/lib/palette";
import { useActionForm } from "@/lib/use-action-form";

type PrivateProps = {
  privateMode: boolean;
};

/** The private-mode switch, as a grouped-list row. */
export function PrivateModeRow({ privateMode }: PrivateProps) {
  const [value, setValue] = useOptimistic(privateMode);
  const [pending, startTransition] = useTransition();

  return (
    <div className="ios-list flex items-center gap-3 px-4 py-2.5">
      <span className="flex size-[30px] items-center justify-center rounded-[8px] bg-[var(--c-violet)] text-white">
        <EyeOff className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px]">Private mode</span>
        <span className="block text-[13px] text-muted">Hides names and numbers, for screen sharing</span>
      </span>
      <Switch
        checked={value}
        disabled={pending}
        label="Private mode"
        onChange={(next) =>
          startTransition(async () => {
            setValue(next);
            await setPrivateModeAction(next);
          })
        }
      />
    </div>
  );
}

type PlanProps = {
  area: AreaSummary;
  areas: AreaSummary[];
  today: DayKey;
};

/** "Plan something small" for a resting area: a task sheet with the area pre-selected. */
export function PlanForAreaButton({ area, areas, today }: PlanProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-[13px] font-semibold text-accent"
      >
        Plan
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={`Something small for ${area.name}`}>
        <TaskForm areas={areas} defaultDate={today} defaultAreaId={area.id} onDone={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

const AREA_ICONS: IconName[] = [
  "book-open",
  "code",
  "graduation-cap",
  "activity",
  "sparkles",
  "house",
  "wallet",
  "languages",
  "music",
  "palette",
  "camera",
  "pen",
  "brain",
  "briefcase",
  "heart",
  "users",
  "leaf",
  "sprout",
  "plane",
  "gamepad",
  "utensils",
  "dumbbell",
  "sun",
  "target",
];

type ManagerProps = {
  areas: AreaSummary[];
};

export function ManageAreasButton({ areas }: ManagerProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AreaSummary | "new" | null>(null);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Edit areas" className="p-1.5 text-accent">
        <SlidersHorizontal className="size-[22px]" />
      </button>
      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title="Your areas"
      >
        {editing ? (
          <AreaForm
            key={editing === "new" ? "new" : editing.id}
            area={editing === "new" ? undefined : editing}
            onDone={() => setEditing(null)}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <ul className="ios-list ios-rows [--row-inset:58px]">
              {areas.map((area) => (
                <li key={area.id}>
                  <button
                    type="button"
                    onClick={() => setEditing(area)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-surface-2"
                  >
                    <span
                      className="flex size-[30px] items-center justify-center rounded-[8px] text-white"
                      style={{ backgroundColor: cssColor(area.color) }}
                    >
                      <Icon name={area.icon} className="size-[18px]" />
                    </span>
                    <span className="flex-1 text-[17px]">{area.name}</span>
                    <ChevronRight className="size-4 text-muted" />
                  </button>
                </li>
              ))}
            </ul>
            <Button type="button" variant="secondary" onClick={() => setEditing("new")}>
              <Plus className="size-5" />
              New area
            </Button>
          </div>
        )}
      </Sheet>
    </>
  );
}

type AreaFormProps = {
  area?: AreaSummary;
  onDone: () => void;
};

function AreaForm({ area, onDone }: AreaFormProps) {
  const { state, pending, onSubmit, errors } = useActionForm(saveAreaAction, onDone);
  const [archiving, startArchive] = useTransition();

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {area && <input type="hidden" name="id" value={area.id} />}
      <Field label="Name" htmlFor="area-name" errors={errors.name}>
        <Input id="area-name" name="name" defaultValue={area?.name} placeholder="Music" required />
      </Field>
      <IconColorPicker icons={AREA_ICONS} defaultIcon={area?.icon} defaultColor={area?.color} errors={errors} />
      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />
      <div className="flex gap-3">
        <Button type="button" variant="plain" onClick={onDone}>
          Back
        </Button>
        {area && (
          <Button
            type="button"
            variant="danger"
            disabled={archiving}
            aria-label="Archive area"
            onClick={() =>
              startArchive(async () => {
                await archiveAreaAction(area.id);
                onDone();
              })
            }
          >
            <Archive className="size-5" />
          </Button>
        )}
        <SubmitButton pending={pending} className="flex-1">
          {area ? "Save" : "Add area"}
        </SubmitButton>
      </div>
    </form>
  );
}
