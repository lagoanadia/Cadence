import { BottomNav } from "@/components/layout/bottom-nav";
import { getAgendaContext } from "@/features/agenda/context";
import { QuickAdd } from "@/features/quick-add/quick-add";

// Every page inside (app) is private: getAgendaContext() calls requireUserId(),
// which sends visitors to /login. Each page ALSO checks the session itself,
// because a layout must never be the only security check.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { areas, today } = await getAgendaContext();

  return (
    <>
      <main className="mx-auto w-full max-w-2xl px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-40">{children}</main>
      <QuickAdd areas={areas} today={today} />
      <BottomNav />
    </>
  );
}
