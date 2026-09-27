"use client";

import { useEffect, useRef } from "react";
import type { FormState } from "@/lib/form";

/** Runs `onSuccess` once every time a form action returns a new success. */
export function useFormSuccess(state: FormState, onSuccess: () => void): void {
  // A ref keeps the latest callback without making the effect re-run when it changes
  const callback = useRef(onSuccess);
  useEffect(() => {
    callback.current = onSuccess;
  });

  useEffect(() => {
    if (state.status === "success" && state.submittedAt) callback.current();
  }, [state.status, state.submittedAt]);
}
