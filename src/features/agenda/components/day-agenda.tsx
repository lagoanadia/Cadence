import type { AgendaDay, AreaSummary } from "@/features/agenda/queries";
import type { DayKey } from "@/lib/dates";
import { AgendaItemRow } from "./agenda-item-row";
import { RoutineCard } from "./routine-card";

type Props = {
  day: AgendaDay;
  areas: AreaSummary[];
  today: DayKey;
};

/** A Server Component that arranges client components (the rows and cards). */
export function DayAgenda({ day, areas, today }: Props) {
  const pending = day.items.filter((item) => !item.done).length;

  return (
    <div className="flex flex-col gap-6">
      {day.routines.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-medium text-muted">Routines</h2>
          {day.routines.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="flex justify-between px-1 text-sm font-medium text-muted">
          <span>Tasks</span>
          {day.items.length > 0 && <span>{pending === 0 ? "All done 🎉" : `${pending} to go`}</span>}
        </h2>
        {day.items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            Nothing planned. Enjoy the space — or tap + to add something.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {day.items.map((item) => (
              <AgendaItemRow key={`${item.kind}-${item.id}`} item={item} areas={areas} today={today} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
