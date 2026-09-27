"use client";

import { Camera, CalendarDays, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { FormMessage, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteExpenseAction, saveExpenseAction } from "@/features/expenses/actions";
import type { Category, ExpenseRow } from "@/features/expenses/queries";
import { compressImage } from "@/lib/compress-image";
import type { DayKey } from "@/lib/dates";
import { centsToInput } from "@/lib/money";
import { cssColor } from "@/lib/palette";
import { useActionForm } from "@/lib/use-action-form";

type Props = {
  categories: Category[];
  today: DayKey;
  receiptsEnabled: boolean;
  expense?: ExpenseRow; // present when editing
  onDone: () => void;
};

/**
 * Built for speed (the goal is < 5 seconds): the amount field is focused
 * straight away and opens the numeric keyboard, one tap picks a category,
 * and the date is today unless you change it.
 */
export function ExpenseForm({ categories, today, receiptsEnabled, expense, onDone }: Props) {
  // The compressed photo plus a temporary URL to preview it
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [showDate, setShowDate] = useState(expense !== undefined && expense.date !== today);
  const [deleting, startDelete] = useTransition();

  const { state, pending, onSubmit, errors } = useActionForm(saveExpenseAction, onDone, (formData) => {
    // Send the compressed photo instead of whatever the file input holds
    formData.delete("receipt");
    if (photo) formData.set("receipt", photo.file);
  });

  // A preview URL keeps the file in memory until it's revoked, so we revoke
  // the old one whenever the photo changes and when the form closes
  const photoUrl = useRef<string | null>(null);
  function replacePhoto(next: File | null) {
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    photoUrl.current = next ? URL.createObjectURL(next) : null;
    setPhoto(next && photoUrl.current ? { file: next, url: photoUrl.current } : null);
  }
  useEffect(
    () => () => {
      if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    },
    [],
  );

  async function onPhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) replacePhoto(await compressImage(file));
  }

  const preview = photo?.url ?? null;
  const existingReceipt = expense?.hasReceipt && !removeExisting && !photo;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {expense && <input type="hidden" name="id" value={expense.id} />}
      {removeExisting && <input type="hidden" name="removeReceipt" value="on" />}

      <label className="flex flex-col items-center gap-1">
        <span className="sr-only">Amount in euros</span>
        <span className="flex items-baseline justify-center gap-1 pr-6">
          <input
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            defaultValue={expense ? centsToInput(expense.amountCents) : undefined}
            // The whole point of this sheet is typing the amount fast
            autoFocus
            required
            className="w-40 bg-transparent text-right text-[44px] font-bold tracking-tight tabular outline-none placeholder:text-muted/40"
          />
          <span className="text-[28px] font-semibold text-muted">€</span>
        </span>
        {errors.amountCents?.map((error) => (
          <span key={error} className="text-[13px] text-danger">
            {error}
          </span>
        ))}
      </label>

      <fieldset>
        <legend className="sr-only">Category</legend>
        <div className="grid grid-cols-4 gap-y-3">
          {categories.map((category) => (
            <label key={category.id} className="flex cursor-pointer flex-col items-center gap-1">
              <input
                type="radio"
                name="categoryId"
                value={category.id}
                defaultChecked={expense?.category?.id === category.id}
                className="peer sr-only"
              />
              <span
                className="flex size-12 items-center justify-center rounded-full bg-surface ring-accent transition peer-checked:scale-105 peer-checked:ring-[2.5px] peer-focus-visible:ring-2"
                style={{ color: cssColor(category.color) }}
              >
                <Icon name={category.icon} className="size-[22px]" />
              </span>
              <span className="max-w-full truncate text-[12px] text-muted peer-checked:font-semibold peer-checked:text-text">
                {category.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Input
        name="word"
        placeholder="…or type a word: coffee, bus, cinema"
        defaultValue={expense?.note ?? ""}
        autoComplete="off"
        aria-label="Note"
      />

      <div className="flex flex-wrap items-center gap-2">
        {showDate ? (
          <Input
            name="date"
            type="date"
            defaultValue={expense?.date ?? today}
            aria-label="Date"
            className="w-auto flex-1"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowDate(true)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-surface px-3.5 text-[15px] text-accent"
          >
            <CalendarDays className="size-4" />
            Today
          </button>
        )}

        {receiptsEnabled && !preview && !existingReceipt && (
          <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-surface px-3.5 text-[15px] text-accent">
            <Camera className="size-4" />
            Add photo
            <input type="file" accept="image/*" capture="environment" onChange={onPhotoChange} className="sr-only" />
          </label>
        )}
      </div>

      {(preview || existingReceipt) && (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview / private authenticated image */}
          <img
            src={preview ?? `/api/receipts/${expense?.id}`}
            alt="Receipt"
            className="h-28 rounded-xl object-cover"
          />
          <button
            type="button"
            aria-label="Remove photo"
            onClick={() => {
              replacePhoto(null);
              if (expense?.hasReceipt) setRemoveExisting(true);
            }}
            className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-text text-bg"
          >
            <X className="size-4" strokeWidth={3} />
          </button>
        </div>
      )}

      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />

      <div className="flex gap-3">
        {expense && (
          <Button
            type="button"
            variant="danger"
            disabled={deleting}
            aria-label="Delete expense"
            onClick={() =>
              startDelete(async () => {
                await deleteExpenseAction(expense.id);
                onDone();
              })
            }
          >
            <Trash2 className="size-5" />
          </Button>
        )}
        <SubmitButton pending={pending} className="flex-1">
          {expense ? "Save" : "Add expense"}
        </SubmitButton>
      </div>
    </form>
  );
}
