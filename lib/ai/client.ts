/* ==========================================================================
   The seam between Zafe and Claude.

   - If ANTHROPIC_API_KEY is set, we call Claude for real.
   - If it isn't, callers fall back to the offline heuristic in mock.ts, so the
     demo still works on stage with no key and no network.

   Everything goes through one helper, `runStructured`, which asks Claude to
   return JSON that matches a schema (structured outputs) and hands back the
   parsed object. Keeping the model call in one place means the three AI
   features stay small and testable.
   ========================================================================== */

import Anthropic from "@anthropic-ai/sdk";

/** Default to the most capable model; override per-deploy without a code change. */
export const AI_MODEL = process.env.TRUSTFLOW_AI_MODEL || "claude-opus-5";

/** True when a real Claude call is possible. */
export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  // The SDK reads ANTHROPIC_API_KEY from the environment on its own.
  if (!client) client = new Anthropic();
  return client;
}

export interface RunStructuredOptions {
  system: string;
  user: string;
  /** JSON Schema the reply must match. Objects need additionalProperties:false. */
  schema: Record<string, unknown>;
  /** Reasoning depth. "low" keeps the scoring endpoints fast; "high" for disputes. */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  /** Headroom for thinking + JSON. Thinking is on by default on Opus 5. */
  maxTokens?: number;
}

/**
 * Ask Claude for a JSON object matching `schema` and return it parsed.
 * Throws on network / API / parse errors so callers can fall back to mock.
 */
export async function runStructured<T>(opts: RunStructuredOptions): Promise<T> {
  const response = await getClient().messages.create({
    model: AI_MODEL,
    max_tokens: opts.maxTokens ?? 8000,
    system: opts.system,
    output_config: {
      format: { type: "json_schema", schema: opts.schema },
      effort: opts.effort ?? "low",
    },
    messages: [{ role: "user", content: opts.user }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined the request (safety refusal)");
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  if (!text) throw new Error("Claude returned no text to parse");
  return JSON.parse(text) as T;
}

/** One turn in a conversation with an agent. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Cap how much conversation we ever send to the model. Bounds cost and blast
    radius from a client that keeps appending. */
const MAX_TURNS = 24;
const MAX_TURN_CHARS = 6000;

function trimTurns(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: String(m.content ?? "").slice(0, MAX_TURN_CHARS) }));
}

/**
 * A plain-text conversational turn: send the history, get the assistant's reply.
 * Used by the support agent. Throws on API/parse errors so callers fall back.
 */
export async function runChat(opts: { system: string; messages: ChatMessage[]; maxTokens?: number }): Promise<string> {
  const response = await getClient().messages.create({
    model: AI_MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: trimTurns(opts.messages),
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined the request (safety refusal)");
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!text) throw new Error("Claude returned no text");
  return text;
}

/**
 * A structured conversational turn: same as runStructured, but over a message
 * history instead of a single prompt. Used by the dispute agent, which asks
 * follow-up questions before it decides.
 */
export async function runStructuredChat<T>(opts: {
  system: string;
  messages: ChatMessage[];
  schema: Record<string, unknown>;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens?: number;
}): Promise<T> {
  const response = await getClient().messages.create({
    model: AI_MODEL,
    max_tokens: opts.maxTokens ?? 8000,
    system: opts.system,
    output_config: { format: { type: "json_schema", schema: opts.schema }, effort: opts.effort ?? "medium" },
    messages: trimTurns(opts.messages),
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined the request (safety refusal)");
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!text) throw new Error("Claude returned no text to parse");
  return JSON.parse(text) as T;
}

/** Clamp any model- or heuristic-produced number into an integer 0–100. */
export function clampScore(value: unknown, fallback = 50): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}
