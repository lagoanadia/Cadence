"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { listChores } from "@/features/chores/queries";
import { listCategories } from "@/features/expenses/queries";
import { listBooks } from "@/features/reading/queries";
import { db } from "@/lib/db";
import { formatDay } from "@/lib/dates";
import { userToday } from "@/lib/ownership";
import { requireUserId } from "@/lib/session";
import { type ActionResult, executeAction } from "./execute";
import { actionSchema, type AssistantAction, describeAction } from "./plan";
import { AssistantUnavailableError, planFromText } from "./planner";

export type ProposedAction = { action: AssistantAction; label: string };

export type PlanResult =
  | { status: "ok"; reply: string; proposals: ProposedAction[] }
  | { status: "error"; message: string };

const MAX_INPUT = 2000;

/** Step 1: understand the text and PROPOSE actions. Nothing is saved here. */
export async function planAssistantAction(text: string): Promise<PlanResult> {
  const userId = await requireUserId();
  const input = text.trim().slice(0, MAX_INPUT);
  if (!input) return { status: "error", message: "Tell me what you need first 🙂" };

  const today = await userToday(userId);
  const [areas, categories, chores, books] = await Promise.all([
    db.area.findMany({ where: { userId, archivedAt: null }, select: { name: true } }),
    listCategories(userId),
    listChores(userId, today),
    listBooks(userId),
  ]);

  try {
    const plan = await planFromText(input, {
      today,
      weekday: formatDay(today, { weekday: "long" }),
      areas: areas.map((a) => a.name),
      categories: categories.map((c) => c.name),
      chores: chores.map((c) => c.name),
      books: books.filter((b) => b.status === "READING").map((b) => b.title),
    });
    return {
      status: "ok",
      reply: plan.reply,
      proposals: plan.actions.map((action) => ({ action, label: describeAction(action) })),
    };
  } catch (error) {
    // Typed SDK errors, most specific first — never string-match messages
    if (error instanceof AssistantUnavailableError) {
      return { status: "error", message: "The assistant isn't set up yet (missing API key)." };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { status: "error", message: "Too many requests right now. Try again in a minute." };
    }
    if (error instanceof Anthropic.APIError) {
      return { status: "error", message: "The assistant is having trouble. Please try again." };
    }
    throw error;
  }
}

/** Step 2: save only the actions the user confirmed. Re-validated: never trust the browser. */
export async function applyAssistantAction(actions: unknown): Promise<ActionResult[]> {
  const userId = await requireUserId();
  const parsed = z.array(actionSchema).max(20).safeParse(actions);
  if (!parsed.success) return [{ label: "Plan", ok: false, error: "Invalid plan" }];

  const today = await userToday(userId);
  const results: ActionResult[] = [];
  // One by one, so one failing action (e.g. unknown chore) doesn't block the rest
  for (const action of parsed.data) {
    results.push(await executeAction(userId, action, today));
  }
  revalidatePath("/", "layout");
  return results;
}
