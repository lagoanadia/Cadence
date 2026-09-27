"use client";

import { type FormEvent, useActionState, useTransition } from "react";
import { type FormState, initialFormState } from "@/lib/form";
import { useFormSuccess } from "@/lib/use-form-success";

type FormAction = (prev: FormState, formData: FormData) => Promise<FormState>;

/**
 * Connects a Server Action to a form.
 *
 * Why not just <form action={formAction}>? In React 19, a form submitted that
 * way is reset after the action runs, so if validation fails the user loses
 * what they typed. Submitting through onSubmit + startTransition keeps the
 * inputs as they are.
 */
export function useActionForm(action: FormAction, onSuccess: () => void) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [, startTransition] = useTransition();
  useFormSuccess(state, onSuccess);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return { state, pending, onSubmit, errors: state.fieldErrors ?? {} };
}
