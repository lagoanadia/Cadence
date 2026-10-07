"use client";

import { BookOpen, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Stars } from "@/components/ui/stars";
import type { Book } from "@/features/reading/queries";
import { BookForm, LogPagesForm } from "./reading-forms";

type Props = {
  books: Book[];
  /** "Finished 12 Sept" labels, formatted on the server */
  finishedLabels: Record<string, string>;
};

type Open = { kind: "book"; book?: Book } | { kind: "log"; book: Book } | null;

export function ReadingView({ books, finishedLabels }: Props) {
  const [open, setOpen] = useState<Open>(null);
  const close = () => setOpen(null);

  const reading = books.filter((book) => book.status === "READING");
  const wantToRead = books.filter((book) => book.status === "WANT_TO_READ");
  const finished = books.filter((book) => book.status === "FINISHED");

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-2">
        <h2 className="section-title">Reading now</h2>
        {reading.length === 0 ? (
          <p className="ios-list px-4 py-6 text-center text-[15px] text-muted">
            No book in progress. Pick one from your list, or add a new one.
          </p>
        ) : (
          reading.map((book) => {
            const percent = book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : null;
            return (
              <article key={book.id} className="ios-list flex flex-col gap-3 p-4">
                <button type="button" onClick={() => setOpen({ kind: "book", book })} className="flex gap-3 text-left">
                  <BookSpine title={book.title} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] leading-snug font-semibold">{book.title}</span>
                    {book.author && <span className="block text-[15px] text-muted">{book.author}</span>}
                    <span className="mt-1 block text-[13px] text-muted tabular">
                      {book.totalPages
                        ? `Page ${book.currentPage} of ${book.totalPages} · ${percent}%`
                        : `Page ${book.currentPage}`}
                    </span>
                    {book.rating !== null && (
                      <span className="mt-1 block">
                        <Stars rating={book.rating} />
                      </span>
                    )}
                    {book.review && (
                      <span className="mt-1 line-clamp-2 block text-[13px] text-text/80 italic">“{book.review}”</span>
                    )}
                  </span>
                </button>
                {percent !== null && (
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-surface-2"
                    role="progressbar"
                    aria-label={`${book.title} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                  >
                    <div className="h-full rounded-full bg-accent-fill" style={{ width: `${percent}%` }} />
                  </div>
                )}
                <Button type="button" variant="secondary" onClick={() => setOpen({ kind: "log", book })} className="h-10 text-[15px]">
                  Log pages
                </Button>
              </article>
            );
          })
        )}
      </section>

      <BookList title="Want to read" books={wantToRead} onOpen={(book) => setOpen({ kind: "book", book })} />
      <BookList
        title="Finished"
        books={finished}
        detail={(book) => finishedLabels[book.id]}
        onOpen={(book) => setOpen({ kind: "book", book })}
      />

      <Button type="button" variant="secondary" onClick={() => setOpen({ kind: "book" })}>
        <Plus className="size-5" />
        Add book
      </Button>

      <Sheet
        open={open?.kind === "book"}
        onClose={close}
        title={open?.kind === "book" && open.book ? "Edit book" : "New book"}
      >
        {open?.kind === "book" && <BookForm key={open.book?.id ?? "new"} book={open.book} onDone={close} />}
      </Sheet>
      <Sheet open={open?.kind === "log"} onClose={close} title="Pages read today">
        {open?.kind === "log" && <LogPagesForm books={[open.book]} onDone={close} />}
      </Sheet>
    </div>
  );
}

type BookListProps = {
  title: string;
  books: Book[];
  detail?: (book: Book) => string | undefined;
  onOpen: (book: Book) => void;
};

function BookList({ title, books, detail, onOpen }: BookListProps) {
  if (books.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="section-title">{title}</h2>
      <ul className="ios-list ios-rows [--row-inset:58px]">
        {books.map((book) => (
          <li key={book.id}>
            <button
              type="button"
              onClick={() => onOpen(book)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-surface-2"
            >
              <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-surface-2 text-muted">
                <BookOpen className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px]">{book.title}</span>
                <span className="block truncate text-[13px] text-muted">
                  {[book.author, detail?.(book)].filter(Boolean).join(" · ")}
                </span>
                {book.rating !== null && (
                  <span className="mt-0.5 block">
                    <Stars rating={book.rating} />
                  </span>
                )}
                {book.review && (
                  <span className="mt-0.5 line-clamp-2 block text-[13px] text-text/80 italic">“{book.review}”</span>
                )}
              </span>
              <ChevronRight className="size-4 text-muted" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

type SpineProps = {
  title: string;
};

/** A tiny "book cover" made from the title's first letter. */
function BookSpine({ title }: SpineProps) {
  return (
    <span className="flex h-16 w-12 shrink-0 items-center justify-center rounded-[6px] bg-gradient-to-br from-accent-fill to-accent text-[22px] font-bold text-white shadow-sm">
      {title.charAt(0).toUpperCase()}
    </span>
  );
}
