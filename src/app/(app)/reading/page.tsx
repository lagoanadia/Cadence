import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { StatTiles } from "@/components/ui/stat-tiles";
import { getAgendaContext } from "@/features/agenda/context";
import { ReadingView } from "@/features/reading/components/reading-view";
import { getReadingStats, listBooks } from "@/features/reading/queries";
import { formatDay } from "@/lib/dates";

export const metadata: Metadata = { title: "Reading" };

export default async function ReadingPage() {
  const { userId, today } = await getAgendaContext();
  const [books, stats] = await Promise.all([listBooks(userId), getReadingStats(userId, today)]);

  const finishedLabels: Record<string, string> = {};
  for (const book of books) {
    if (book.finishedAt) finishedLabels[book.id] = `Finished ${formatDay(book.finishedAt, { day: "numeric", month: "short" })}`;
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader title="Reading" back={{ href: "/more", label: "More" }} />
      <StatTiles
        tiles={[
          { label: "Today", value: String(stats.pagesToday), unit: "pages" },
          { label: "Last 7 days", value: String(stats.pagesThisWeek), unit: "pages" },
          { label: "Streak", value: String(stats.streak), unit: stats.streak === 1 ? "day" : "days" },
        ]}
      />
      <ReadingView books={books} finishedLabels={finishedLabels} />
    </div>
  );
}
