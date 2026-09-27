"use client";

import Link from "next/link";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { loginAction, registerAction } from "@/features/auth/actions";
import { useActionForm } from "@/lib/use-action-form";

type Props = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: Props) {
  // On success the action redirects to /today, so there's nothing to do here
  const { state, pending, onSubmit, errors } = useActionForm(
    mode === "login" ? loginAction : registerAction,
    () => {},
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {mode === "register" && (
        <Field label="Name" htmlFor="name" errors={errors.name}>
          <Input id="name" name="name" autoComplete="name" required />
        </Field>
      )}
      <Field label="Email" htmlFor="email" errors={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        errors={errors.password}
        hint={mode === "register" ? "At least 8 characters." : undefined}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
      </Field>

      <FormMessage status={state.status} message={state.message} />

      <SubmitButton pending={pending} className="mt-1 w-full">{mode === "login" ? "Log in" : "Create account"}</SubmitButton>

      <p className="text-center text-[15px] text-muted">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/register" className="font-medium text-accent">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
