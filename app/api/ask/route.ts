import { NextRequest } from "next/server";
import { streamAsk, type ChatTurn } from "@/lib/openai";
import { loadKnowledgeText } from "@/lib/kb";
import { takeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { question?: string; history?: ChatTurn[] };

const ASK_LIMIT = Number(process.env.ASK_RATE_LIMIT_MAX || 10);
const ASK_WINDOW_MS = Number(process.env.ASK_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000);

function getClientKey(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();
  return ip || "anonymous";
}

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

  const rateLimit = await takeRateLimit(getClientKey(req), {
    limit: ASK_LIMIT,
    windowMs: ASK_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return new Response("rate limit exceeded", {
      status: 429,
      headers: {
        "Retry-After": String(rateLimit.retryAfterSeconds),
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(rateLimit.resetAt),
      },
    });
  }

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
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(rateLimit.resetAt),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "model error";
    return new Response(`[error: ${msg}]`, { status: 500 });
  }
}
