import { OpenRouter } from "@openrouter/sdk";
import { PROFILE, SYSTEM_PROMPT } from "./profile";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export function buildSystemContent(kbText: string, systemPrompt?: string): string {
  const sp = systemPrompt && systemPrompt.trim() ? systemPrompt.trim() : SYSTEM_PROMPT;
  const kbBlock = kbText.trim()
    ? `\n\n--- UPLOADED KNOWLEDGE ---\n${kbText.trim()}\n--- END UPLOADED KNOWLEDGE ---`
    : "";
  return `${sp}\n\nPROFILE:\n${PROFILE}${kbBlock}`;
}

let client: OpenRouter | null = null;
function getClient(): OpenRouter {
  if (client) return client;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
  client = new OpenRouter({
    apiKey,
    httpReferer: process.env.OPENROUTER_REFERER || "https://shawonmajid.com",
    appTitle: process.env.OPENROUTER_APP_TITLE || "ask-shawon",
  });
  return client;
}

export async function* streamAsk(opts: {
  question: string;
  history: ChatTurn[];
  kbText: string;
  model: string;
  systemPrompt?: string;
}): AsyncGenerator<string, void, unknown> {
  const messages = [
    { role: "system" as const, content: buildSystemContent(opts.kbText, opts.systemPrompt) },
    ...opts.history.slice(-6).map((t) => ({ role: t.role, content: t.content })),
    { role: "user" as const, content: opts.question },
  ];
  const stream = await getClient().chat.send({
    chatRequest: {
      model: opts.model,
      messages,
      stream: true,
      temperature: 0.5,
      maxTokens: 500,
    },
  });
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (typeof delta === "string" && delta) yield delta;
  }
}
