"use client";

import { Field, FormMessage, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveBudgetAction } from "@/features/expenses/actions";
import { centsToInput } from "@/lib/money";
import { useActionForm } from "@/lib/use-action-form";

type Props = {
  budgetCents: number | null;
  onDone: () => void;
};

export function BudgetForm({ budgetCents, onDone }: Props) {
  const { state, pending, onSubmit, errors } = useActionForm(saveBudgetAction, onDone);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field
        label="Monthly budget (€)"
        htmlFor="budget"
        errors={errors.budgetCents}
        hint="Leave it empty if you don't want a budget."
      >
        <Input
          id="budget"
          name="budget"
          inputMode="decimal"
          placeholder="600"
          defaultValue={budgetCents ? centsToInput(budgetCents) : ""}
        />
      </Field>
      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />
      <SubmitButton pending={pending}>Save budget</SubmitButton>
    </form>
  );
}
