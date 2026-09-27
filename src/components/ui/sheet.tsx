"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

/**
 * A bottom sheet built on the native <dialog> element. The browser gives us
 * for free: closing with Esc, trapping keyboard focus inside, and the backdrop.
 * On bigger screens it becomes a centered modal.
 */
export function Sheet({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  // Latest value of `open`, readable from event handlers
  const openRef = useRef(open);

  // React controls `open`; this effect keeps the real <dialog> in sync with it
  useEffect(() => {
    openRef.current = open;
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      // The "close" event also fires when WE close the dialog from the effect.
      // Only report it when the user closed it (Esc key) while it should be open.
      onClose={() => {
        if (openRef.current) onClose();
      }}
      // Clicking the backdrop: the click target is the <dialog> itself
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-0 mt-auto w-full max-w-none rounded-t-3xl bg-surface p-0 text-text backdrop:bg-black/40 sm:m-auto sm:max-w-md sm:rounded-3xl"
    >
      <div className="max-h-[85dvh] overflow-y-auto px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-muted hover:bg-surface-2"
          >
            <X className="size-5" />
          </button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
}
