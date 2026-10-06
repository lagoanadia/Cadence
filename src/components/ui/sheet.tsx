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
 * An iOS-style bottom sheet built on the native <dialog> element. The browser
 * gives us for free: closing with Esc, trapping keyboard focus inside, and the
 * backdrop. On bigger screens it becomes a centered modal.
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
      // The sheet is heavy glass: you still glimpse the screen behind it
      className="m-0 mt-auto w-full max-w-none rounded-t-[32px] border border-b-0 border-border bg-[var(--sheet)] p-0 text-text shadow-[inset_0_1px_0_var(--highlight)] backdrop-blur-[40px] backdrop-saturate-150 backdrop:bg-black/25 backdrop:backdrop-blur-[2px] open:animate-[sheet-in_0.32s_cubic-bezier(0.32,0.72,0,1)] sm:m-auto sm:max-w-md sm:rounded-[32px] sm:border-b"
    >
      <div className="max-h-[88dvh] overflow-y-auto px-5 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-2 h-[5px] w-9 rounded-full bg-muted/40 sm:hidden" />
        <div className="relative mb-5 flex items-center justify-center">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-0 flex size-[32px] items-center justify-center rounded-full border border-border bg-surface-2 text-muted"
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
}
