import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "plain" | "danger";

// Pill buttons: yellow fill for the main action, glass for secondary, text-only for "plain"
const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent-fill text-accent-text shadow-[0_6px_20px_rgba(255,214,10,0.35)] active:opacity-85",
  secondary: "glass text-accent active:opacity-70",
  plain: "text-accent active:opacity-60",
  danger: "bg-danger/10 text-danger active:opacity-70",
};

type Props = ComponentProps<"button"> & {
  variant?: Variant;
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  return (
    <button
      className={`inline-flex h-[50px] items-center justify-center gap-2 rounded-full px-5 text-[17px] font-semibold transition disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
