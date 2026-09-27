import { redirect } from "next/navigation";
import { getAgendaContext } from "@/features/agenda/context";

export default async function AgendaPage() {
  const { today } = await getAgendaContext();
  redirect(`/agenda/week/${today}`);
}
