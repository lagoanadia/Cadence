import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getAgendaContext } from "@/features/agenda/context";
import { ChoreList } from "@/features/chores/components/chore-list";
import { listChores } from "@/features/chores/queries";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const { userId, areas, today } = await getAgendaContext();
  const chores = await listChores(userId, today);
  const waiting = chores.filter((chore) => chore.status.kind === "overdue").length;
  const doneToday = chores.filter((chore) => chore.status.kind === "done-today").length;

  let subtitle = "Everything's looking fresh ✨";
  if (waiting > 0) subtitle = `${waiting} ${waiting === 1 ? "chore could" : "chores could"} use some love`;
  else if (doneToday > 0) subtitle = `${doneToday} done today — nice`;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader title="Home" subtitle={subtitle} />
      <ChoreList chores={chores} areas={areas} />
    </div>
  );
}
