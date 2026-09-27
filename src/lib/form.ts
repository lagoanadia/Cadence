import type { z } from "zod";

// Every form action returns this shape, so all forms handle results the same way.
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Changes on every success, so the client can react even to two identical results. */
  submittedAt?: number;
};

export const initialFormState: FormState = { status: "idle" };

export function errorState(message: string): FormState {
  return { status: "error", message };
}

export function validationError(error: z.ZodError): FormState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
}

export function successState(message?: string): FormState {
  return { status: "success", message, submittedAt: Date.now() };
}

/** Empty inputs arrive as "" — turn them into undefined so optional fields stay optional. */
export function formValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}
