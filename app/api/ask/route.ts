import { NextRequest } from "next/server";
import { streamAsk, type ChatTurn } from "@/lib/openai";
import { loadKnowledgeText } from "@/lib/kb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { question?: string; history?: ChatTurn[] };

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }
  const question = (body.question || "").trim();
  if (!question) return new Response("missing question", { status: 400 });
  const history = Array.isArray(body.history) ? body.history : [];

  let kbText = "";
  try {
    ({ text: kbText } = await loadKnowledgeText());
  } catch {
    kbText = "";
  }

  try {
    const stream = await streamAsk({ question, history, kbText });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "model error";
    return new Response(`[error: ${msg}]`, { status: 500 });
  }
}
