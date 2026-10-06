import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { type AssistantContext, type AssistantPlan, planSchema } from "./plan";

/** True when the server has an API key, so the UI can hide the assistant otherwise. */
export const assistantEnabled = Boolean(process.env.ANTHROPIC_API_KEY);

// Created once and reused (it keeps HTTP connections open between requests)
const client = assistantEnabled ? new Anthropic() : null;

// The system prompt never changes, so it's cached by the API (cheaper and faster).
// Anything that changes per request (today's date, the user's lists) goes in the
// user message instead — otherwise the cache would never be reused.
const SYSTEM_PROMPT = `You are the planning assistant inside Cadence, a personal planner app.
The user tells you, in any language, what they need to do, what they spent, or what they did.
Turn it into a list of actions using ONLY the action kinds in the schema.

Rules:
- Resolve relative dates ("mañana", "el jueves", "hoy") using the date given in the context. Dates are YYYY-MM-DD.
- Use names exactly as they appear in the user's lists when something matches (areas, categories, chores, books). If nothing matches, use null (or the closest sensible new name for create actions).
- "Weekly" with no day mentioned: use today's weekday. Weekdays: 0=Sunday … 6=Saturday.
- "Monthly budget of X" → set_budget. A purchase → add_expense with today's date unless another day is said.
- Something they finished doing at home → chore_done if it matches a chore; a new recurring home task → create_recurring_task (or create_chore if it has no fixed weekday).
- Never invent actions the user did not ask for. If the message has nothing actionable, return an empty list.
- The reply is one or two short, warm sentences in the user's language, summarizing what you prepared. No markdown.`;

export class AssistantUnavailableError extends Error {}

export async function planFromText(text: string, context: AssistantContext): Promise<AssistantPlan> {
  if (!client) throw new AssistantUnavailableError("ANTHROPIC_API_KEY is not set");

  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    // Extraction is a simple job: low effort keeps it fast while you wait
    output_config: { effort: "low", format: betaZodOutputFormat(planSchema) },
    // If a safety classifier declines, the API retries on a suitable model by itself
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `Context:
- Today: ${context.today} (${context.weekday})
- Areas: ${context.areas.join(", ") || "none"}
- Expense categories: ${context.categories.join(", ") || "none"}
- Chores: ${context.chores.join(", ") || "none"}
- Books being read: ${context.books.join(", ") || "none"}

User message:
${text}`,
      },
    ],
  });

  // Always check why the model stopped before trusting the output
  if (response.stop_reason === "refusal") {
    return { reply: "I can't help with that one — try describing your tasks or expenses.", actions: [] };
  }
  if (!response.parsed_output) throw new Error(`Assistant returned no plan (stop_reason: ${response.stop_reason})`);
  return response.parsed_output;
}
