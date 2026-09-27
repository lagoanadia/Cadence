import "server-only";
import type { AreaSummary } from "@/features/agenda/queries";
import { db } from "@/lib/db";
import { type DayKey, dateToDayKey } from "@/lib/dates";
import { type ChoreStatus, choreStatus } from "./status";

export type { ChoreStatus };

export type ChoreItem = {
  id: string;
  name: string;
  icon: string | null;
  frequencyDays: number | null;
  area: AreaSummary | null;
  lastDone: DayKey | null;
  recent: DayKey[]; // last few times it was done, newest first
  status: ChoreStatus;
};

/** Sort key: overdue first (most late first), then "never", then due soonest; done today last. */
function urgency(chore: ChoreItem): number {
  const { status } = chore;
  switch (status.kind) {
    case "overdue":
      return -1000 - status.daysLate;
    case "never":
      return -500;
    case "ok":
      return status.dueIn ?? 500;
    case "done-today":
      return 1000;
  }
}

const RECENT = 5;

export async function listChores(userId: string, today: DayKey): Promise<ChoreItem[]> {
  const chores = await db.chore.findMany({
    where: { userId, archivedAt: null },
    orderBy: { position: "asc" },
    include: {
      area: { select: { id: true, name: true, icon: true, color: true } },
      // Only the latest few logs: we never need a chore's whole history here
      logs: { orderBy: { date: "desc" }, take: RECENT, select: { date: true } },
    },
  });

  return chores
    .map((chore) => {
      const recent = chore.logs.map((log) => dateToDayKey(log.date));
      const lastDone = recent[0] ?? null;
      return {
        id: chore.id,
        name: chore.name,
        icon: chore.icon,
        frequencyDays: chore.frequencyDays,
        area: chore.area,
        lastDone,
        recent,
        status: choreStatus(lastDone, chore.frequencyDays, today),
      };
    })
    .sort((a, b) => urgency(a) - urgency(b));
}
