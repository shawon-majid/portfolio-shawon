import OpenAI from "openai";
import { PROFILE, SYSTEM_PROMPT } from "./profile";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export function buildSystemContent(kbText: string): string {
  const kbBlock = kbText.trim()
    ? `\n\n--- UPLOADED KNOWLEDGE ---\n${kbText.trim()}\n--- END UPLOADED KNOWLEDGE ---`
    : "";
  return `${SYSTEM_PROMPT}\n\nPROFILE:\n${PROFILE}${kbBlock}`;
}

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (client) return client;
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  client = new OpenAI({ apiKey: key });
  return client;
}

export async function* streamAsk(opts: {
  question: string;
  history: ChatTurn[];
  kbText: string;
  model: string;
}): AsyncGenerator<string, void, unknown> {
  const messages = [
    { role: "system" as const, content: buildSystemContent(opts.kbText) },
    ...opts.history.slice(-6).map((t) => ({ role: t.role, content: t.content })),
    { role: "user" as const, content: opts.question },
  ];
  const completion = await getClient().chat.completions.create({
    model: opts.model,
    messages,
    stream: true,
    temperature: 0.5,
    max_tokens: 500,
  });
  for await (const chunk of completion) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) yield delta;
  }
}
