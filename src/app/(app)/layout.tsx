import { BottomNav } from "@/components/layout/bottom-nav";
import { getAgendaContext } from "@/features/agenda/context";
import { listChores } from "@/features/chores/queries";
import { listCategories } from "@/features/expenses/queries";
import { QuickAdd } from "@/features/quick-add/quick-add";
import { listBooks } from "@/features/reading/queries";
import { receiptsEnabled } from "@/lib/storage";

// Every page inside (app) is private: getAgendaContext() calls requireUserId(),
// which sends visitors to /login. Each page ALSO checks the session itself,
// because a layout must never be the only security check.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { userId, areas, today } = await getAgendaContext();
  // Small queries the "+" button needs, run in parallel
  const [categories, chores, books] = await Promise.all([
    listCategories(userId),
    listChores(userId, today),
    listBooks(userId),
  ]);

  return (
    <>
      <main className="mx-auto w-full max-w-2xl px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-40">{children}</main>
      <QuickAdd
        areas={areas}
        today={today}
        categories={categories}
        receiptsEnabled={receiptsEnabled}
        chores={chores.map((chore) => ({
          id: chore.id,
          name: chore.name,
          icon: chore.icon,
          doneToday: chore.status.kind === "done-today",
        }))}
        readingBooks={books.filter((book) => book.status === "READING")}
      />
      <BottomNav />
    </>
  );
}
