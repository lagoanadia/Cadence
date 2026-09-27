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
    <div className="flex flex-col gap-7">
      {day.routines.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="section-title">Routines</h2>
          {day.routines.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="section-title flex justify-between">
          <span>Tasks</span>
          {day.items.length > 0 && <span className="normal-case">{pending === 0 ? "All done 🎉" : `${pending} to go`}</span>}
        </h2>
        {day.items.length === 0 ? (
          <p className="ios-list px-4 py-6 text-center text-[15px] text-muted">
            Nothing planned. Enjoy the space — or tap + to add something.
          </p>
        ) : (
          <ul className="ios-list ios-rows [--row-inset:52px]">
            {day.items.map((item) => (
              <AgendaItemRow key={`${item.kind}-${item.id}`} item={item} areas={areas} today={today} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
