import type { ComponentProps } from "react";

// Glass fields: translucent, blurred, with a light border; yellow ring on focus
export const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-surface px-4 text-[17px] text-text backdrop-blur-xl placeholder:text-muted/70 outline-none focus:border-accent-fill/60 focus:ring-2 focus:ring-accent-fill/35";

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
      <label htmlFor={htmlFor} className="px-1 text-[13px] font-medium text-muted uppercase tracking-wide">
        {label}
      </label>
      {children}
      {hint && !errors?.length && <p className="px-1 text-[13px] text-muted">{hint}</p>}
      {errors?.map((error) => (
        <p key={error} className="px-1 text-[13px] text-danger">
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
  return <select className={`${inputClass} appearance-none ${className}`} {...props} />;
}

type TextareaProps = ComponentProps<"textarea">;

export function Textarea({ className = "", ...props }: TextareaProps) {
  return <textarea className={`${inputClass} h-auto min-h-20 py-2.5 ${className}`} {...props} />;
}

type FormMessageProps = {
  status: "idle" | "success" | "error";
  message?: string;
};

export function FormMessage({ status, message }: FormMessageProps) {
  if (!message || status === "idle") return null;
  const color = status === "error" ? "bg-danger/10 text-danger" : "bg-success/10 text-success";
  return (
    <p role="status" className={`rounded-2xl px-4 py-2.5 text-[15px] ${color}`}>
      {message}
    </p>
  );
}
