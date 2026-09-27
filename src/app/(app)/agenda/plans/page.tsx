import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { PlansManager } from "@/features/agenda/components/plans-manager";
import { getAgendaContext } from "@/features/agenda/context";
import { listRecurringTasks, listRoutines } from "@/features/agenda/queries";

export const metadata: Metadata = { title: "Repeating" };

export default async function PlansPage() {
  const { userId, areas, today } = await getAgendaContext();
  const [recurringTasks, routines] = await Promise.all([listRecurringTasks(userId), listRoutines(userId)]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Repeating" back={{ href: "/agenda", label: "Agenda" }} />
      <PlansManager areas={areas} today={today} recurringTasks={recurringTasks} routines={routines} />
    </div>
  );
}
