import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "plain" | "danger";

// iOS buttons: filled for the main action, tinted for secondary, text-only for "plain"
const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-text active:opacity-80",
  secondary: "bg-accent-soft text-accent active:opacity-70",
  plain: "text-accent active:opacity-60",
  danger: "bg-danger/10 text-danger active:opacity-70",
};

type Props = ComponentProps<"button"> & {
  variant?: Variant;
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  return (
    <button
      className={`inline-flex h-[50px] items-center justify-center gap-2 rounded-xl px-5 text-[17px] font-semibold transition disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
