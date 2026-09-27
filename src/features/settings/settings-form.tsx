"use client";

import { Field, FormMessage, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionForm } from "@/lib/use-action-form";
import { saveSettingsAction } from "./actions";

type Props = {
  timezone: string;
  weekStartsOn: number;
  timezones: string[];
};

export function SettingsForm({ timezone, weekStartsOn, timezones }: Props) {
  const { state, pending, onSubmit, errors } = useActionForm(saveSettingsAction, () => {});

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
      <Field label="Timezone" htmlFor="timezone" errors={errors.timezone} hint="Decides when your day starts.">
        <Select id="timezone" name="timezone" defaultValue={timezone}>
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Week starts on" htmlFor="weekStartsOn" errors={errors.weekStartsOn}>
        <Select id="weekStartsOn" name="weekStartsOn" defaultValue={String(weekStartsOn)}>
          <option value="1">Monday</option>
          <option value="0">Sunday</option>
        </Select>
      </Field>
      <FormMessage status={state.status} message={state.message} />
      <SubmitButton pending={pending}>Save</SubmitButton>
    </form>
  );
}
