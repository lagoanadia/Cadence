import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PlansManager } from "@/features/agenda/components/plans-manager";
import { getAgendaContext } from "@/features/agenda/context";
import { listRecurringTasks, listRoutines } from "@/features/agenda/queries";

export const metadata: Metadata = { title: "Repeating" };

export default async function PlansPage() {
  const { userId, areas, today } = await getAgendaContext();
  const [recurringTasks, routines] = await Promise.all([listRecurringTasks(userId), listRoutines(userId)]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/agenda" className="-ml-1 inline-flex items-center gap-1 text-sm text-muted">
          <ChevronLeft className="size-4" />
          Agenda
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Repeating</h1>
      </header>
      <PlansManager areas={areas} today={today} recurringTasks={recurringTasks} routines={routines} />
    </div>
  );
}
