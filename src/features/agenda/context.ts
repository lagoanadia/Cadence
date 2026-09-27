import "server-only";
import { cache } from "react";
import { todayKey } from "@/lib/dates";
import { getUserSettings, requireUserId } from "@/lib/session";
import { listAreas } from "./queries";

/**
 * What every agenda page needs: who you are, your settings, "today" in your
 * timezone and your areas. React's cache() remembers the result during one
 * request, so if the layout and the page both call it, the DB is hit once.
 */
export const getAgendaContext = cache(async () => {
  const userId = await requireUserId();
  const [settings, areas] = await Promise.all([getUserSettings(userId), listAreas(userId)]);
  return { userId, settings, areas, today: todayKey(settings.timezone) };
});
