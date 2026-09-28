"use client";

import { Trash2 } from "lucide-react";
import { useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { StarPicker } from "@/components/ui/stars";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteBookAction, logPagesAction, saveBookAction } from "@/features/reading/actions";
import type { Book } from "@/features/reading/queries";
import { useActionForm } from "@/lib/use-action-form";

type BookFormProps = {
  book?: Book;
  onDone: () => void;
};

export function BookForm({ book, onDone }: BookFormProps) {
  const { state, pending, onSubmit, errors } = useActionForm(saveBookAction, onDone);
  const [deleting, startDelete] = useTransition();

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {book && <input type="hidden" name="id" value={book.id} />}
      <Field label="Title" htmlFor="book-title" errors={errors.title}>
        <Input id="book-title" name="title" defaultValue={book?.title} placeholder="Atomic Habits" required />
      </Field>
      <Field label="Author (optional)" htmlFor="author" errors={errors.author}>
        <Input id="author" name="author" defaultValue={book?.author ?? ""} placeholder="James Clear" />
      </Field>
      <Field label="Status" htmlFor="status" errors={errors.status}>
        <Select id="status" name="status" defaultValue={book?.status ?? "READING"}>
          <option value="WANT_TO_READ">Want to read</option>
          <option value="READING">Reading</option>
          <option value="FINISHED">Finished</option>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Current page" htmlFor="currentPage" errors={errors.currentPage}>
          <Input
            id="currentPage"
            name="currentPage"
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={book?.currentPage ?? 0}
          />
        </Field>
        <Field label="Total pages" htmlFor="totalPages" errors={errors.totalPages}>
          <Input
            id="totalPages"
            name="totalPages"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="320"
            defaultValue={book?.totalPages ?? ""}
          />
        </Field>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 px-1 text-[13px] font-medium tracking-wide text-muted uppercase">
          Your rating & review (optional)
        </legend>
        <StarPicker name="rating" defaultValue={book?.rating ?? null} />
        <Textarea
          name="review"
          aria-label="Review"
          rows={4}
          defaultValue={book?.review ?? ""}
          placeholder="What did you think? What will you remember?"
        />
        {[...(errors.rating ?? []), ...(errors.review ?? [])].map((error) => (
          <p key={error} className="px-1 text-[13px] text-danger">
            {error}
          </p>
        ))}
      </fieldset>
      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />
      <div className="flex gap-3">
        {book && (
          <Button
            type="button"
            variant="danger"
            disabled={deleting}
            aria-label="Delete book"
            onClick={() =>
              startDelete(async () => {
                await deleteBookAction(book.id);
                onDone();
              })
            }
          >
            <Trash2 className="size-5" />
          </Button>
        )}
        <SubmitButton pending={pending} className="flex-1">
          {book ? "Save" : "Add book"}
        </SubmitButton>
      </div>
    </form>
  );
}

type LogPagesProps = {
  /** Books the user can pick from. With one book, there's no picker. */
  books: Book[];
  onDone: () => void;
};

const QUICK_PAGES = [5, 10, 20, 30];

export function LogPagesForm({ books, onDone }: LogPagesProps) {
  const { state, pending, onSubmit, errors } = useActionForm(logPagesAction, onDone);
  const pagesInput = useRef<HTMLInputElement>(null);

  if (books.length === 0) {
    return <p className="text-center text-[15px] text-muted">Mark a book as “Reading” first, then log pages here.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {books.length === 1 ? (
        <>
          <input type="hidden" name="bookId" value={books[0].id} />
          <p className="text-center text-[15px] text-muted">{books[0].title}</p>
        </>
      ) : (
        <Field label="Book" htmlFor="bookId" errors={errors.bookId}>
          <Select id="bookId" name="bookId" defaultValue={books[0].id}>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <label className="flex flex-col items-center gap-1">
        <span className="sr-only">Pages read today</span>
        <input
          ref={pagesInput}
          name="pages"
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="0"
          // The only thing to type here, so open the keyboard straight away
          autoFocus
          required
          className="w-32 bg-transparent text-center text-[44px] font-bold tracking-tight tabular outline-none placeholder:text-muted/40"
        />
        <span className="text-[15px] text-muted">pages today</span>
        {errors.pages?.map((error) => (
          <span key={error} className="text-[13px] text-danger">
            {error}
          </span>
        ))}
      </label>

      <div className="flex justify-center gap-2">
        {QUICK_PAGES.map((pages) => (
          <button
            key={pages}
            type="button"
            onClick={() => {
              if (pagesInput.current) pagesInput.current.value = String(pages);
            }}
            className="h-9 rounded-full bg-surface px-4 text-[15px] font-medium text-accent"
          >
            {pages}
          </button>
        ))}
      </div>

      <FormMessage status={state.status} message={state.status === "error" ? state.message : undefined} />
      <SubmitButton pending={pending}>Log pages</SubmitButton>
    </form>
  );
}
