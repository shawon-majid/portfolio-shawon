"use server";

import { headers } from "next/headers";
import { createStreamableValue, type StreamableValue } from "ai/rsc";
import { streamAsk, type ChatTurn } from "@/lib/llm";
import { loadKnowledgeText } from "@/lib/kb";
import { takeRateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";

export type AskResult =
  | { type: "ok"; value: StreamableValue<string> }
  | { type: "disabled"; message: string }
  | { type: "rate-limited"; retryAfterSeconds: number; limit: number }
  | { type: "error"; message: string };

const ASK_WINDOW_MS = 60 * 60 * 1000; // 1 hour, fixed

async function getClientKey(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();
  return ip || "anonymous";
}

export async function ask(input: { question: string; history?: ChatTurn[] }): Promise<AskResult> {
  const question = (input.question || "").trim();
  if (!question) return { type: "error", message: "missing question" };

  const settings = await getSettings();
  if (!settings.askEnabled) {
    return {
      type: "disabled",
      message: "ai is offline right now — try a chip below or email shawon.majid@gmail.com.",
    };
  }
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("[ask] OPENROUTER_API_KEY missing in environment");
    return {
      type: "error",
      message: "ai provider not configured — try /help or email shawon.majid@gmail.com.",
    };
  }

  const maxPerHour = settings.rateLimit.maxPerHour;
  if (maxPerHour !== null) {
    const key = await getClientKey();
    const rl = await takeRateLimit(key, { limit: maxPerHour, windowMs: ASK_WINDOW_MS });
    if (!rl.allowed) {
      return {
        type: "rate-limited",
        retryAfterSeconds: rl.retryAfterSeconds,
        limit: rl.limit,
      };
    }
  }

  let kbText = "";
  try {
    ({ text: kbText } = await loadKnowledgeText());
  } catch {
    kbText = "";
  }

  const history = Array.isArray(input.history) ? input.history : [];
  const stream = createStreamableValue<string>("");

  (async () => {
    let acc = "";
    try {
      for await (const delta of streamAsk({ question, history, kbText, model: settings.model })) {
        acc += delta;
        stream.update(acc);
      }
      stream.done(acc);
    } catch (err) {
      console.error("[ask] streamAsk failed", err);
      const raw = err instanceof Error ? err.message : "model error";
      // In production, Next masks server-action error payloads. Send the
      // message as a final stream update so the user sees a real reason
      // instead of the generic "Server Components render" mask.
      const friendly = `[error: ${raw}]`;
      stream.update(acc ? `${acc}\n${friendly}` : friendly);
      stream.done();
    }
  })();

  return { type: "ok", value: stream.value };
}
