import type { ComponentProps } from "react";

export const inputClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-text placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

type FieldProps = {
  label: string;
  htmlFor: string;
  errors?: string[];
  hint?: string;
  children: React.ReactNode;
};

/** A label + input + error message block, used by every form. */
export function Field({ label, htmlFor, errors, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-text">
        {label}
      </label>
      {children}
      {hint && !errors?.length && <p className="text-xs text-muted">{hint}</p>}
      {errors?.map((error) => (
        <p key={error} className="text-xs text-danger">
          {error}
        </p>
      ))}
    </div>
  );
}

type InputProps = ComponentProps<"input">;

export function Input({ className = "", ...props }: InputProps) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

type SelectProps = ComponentProps<"select">;

export function Select({ className = "", ...props }: SelectProps) {
  return <select className={`${inputClass} ${className}`} {...props} />;
}

type TextareaProps = ComponentProps<"textarea">;

export function Textarea({ className = "", ...props }: TextareaProps) {
  return <textarea className={`${inputClass} h-auto min-h-20 py-2 ${className}`} {...props} />;
}

type FormMessageProps = {
  status: "idle" | "success" | "error";
  message?: string;
};

export function FormMessage({ status, message }: FormMessageProps) {
  if (!message || status === "idle") return null;
  const color = status === "error" ? "bg-danger/10 text-danger" : "bg-success/10 text-success";
  return (
    <p role="status" className={`rounded-xl px-3 py-2 text-sm ${color}`}>
      {message}
    </p>
  );
}
