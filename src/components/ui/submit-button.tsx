"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Pass it when the form is submitted with onSubmit instead of action={…} */
  pending?: boolean;
};

/**
 * useFormStatus() reads the state of the <form action={…}> this button lives in,
 * so it knows when the Server Action is still running.
 */
export function SubmitButton({ children, className = "", pending }: Props) {
  const status = useFormStatus();
  const isPending = pending ?? status.pending;
  return (
    <Button type="submit" disabled={isPending} className={className}>
      {isPending ? "Saving…" : children}
    </Button>
  );
}
