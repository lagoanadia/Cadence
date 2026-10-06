import "server-only";
import Groq from "groq-sdk";
import { z } from "zod";
import { type AssistantContext, type AssistantPlan, planSchema } from "./plan";

/** True when the server has an API key, so the UI can hide the assistant otherwise. */
export const assistantEnabled = Boolean(process.env.GROQ_API_KEY);

// Created once and reused (it keeps HTTP connections open between requests)
const client = assistantEnabled ? new Groq() : null;

// Large, strong model: extraction quality matters more than raw speed here,
// and it's one of the few Groq models that support `strict: true` JSON schema
// output (constrained decoding — the response is guaranteed to match the
// schema, no parsing fallback needed).
const MODEL = "openai/gpt-oss-120b";

// Groq's strict JSON schema mode expects the OpenAI JSON Schema dialect:
// every field listed in "required" (optional fields become nullable instead
// of absent) and "additionalProperties: false" on every object. Zod 4 can
// produce exactly that shape, so the schema below is the single source of
// truth — nothing is hand-duplicated as a separate JSON schema.
const RESPONSE_SCHEMA = z.toJSONSchema(planSchema, { target: "openai" });

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
- The reply is one or two short, warm sentences in the user's language, summarizing what you prepared. No markdown.
- Reply with JSON only, matching the given schema exactly.`;

export class AssistantUnavailableError extends Error {}

export async function planFromText(text: string, context: AssistantContext): Promise<AssistantPlan> {
  if (!client) throw new AssistantUnavailableError("GROQ_API_KEY is not set");

  const response = await client.chat.completions.create({
    model: MODEL,
    max_completion_tokens: 2000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
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
    response_format: {
      type: "json_schema",
      json_schema: { name: "assistant_plan", strict: true, schema: RESPONSE_SCHEMA },
    },
  });

  const choice = response.choices[0];
  if (!choice?.message.content || choice.finish_reason !== "stop") {
    throw new Error(`Assistant returned no plan (finish_reason: ${choice?.finish_reason})`);
  }

  // Strict mode guarantees schema-shaped JSON, but the model is still
  // untrusted input (CLAUDE.md security rules apply to it too) — re-validate
  // with the same Zod schema rather than trusting JSON.parse() blindly.
  return planSchema.parse(JSON.parse(choice.message.content));
}
