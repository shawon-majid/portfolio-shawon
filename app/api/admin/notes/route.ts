import { NextRequest, NextResponse } from "next/server";
import { addKbNote, getKbNoteBody, listKb, updateKbNote } from "@/lib/kb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NOTE_CHARS = 60_000;
const MAX_TITLE_CHARS = 120;
const MAX_DOCS = 20;

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    const entries = await listKb();
    return NextResponse.json({ entries: entries.filter((e) => e.editable) });
  }
  const body = await getKbNoteBody(id);
  if (body === null) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ body });
}

function readBody(json: unknown): { title: string; body: string; error?: string } {
  if (!json || typeof json !== "object") return { title: "", body: "", error: "invalid body" };
  const raw = json as Record<string, unknown>;
  const title = typeof raw.title === "string" ? raw.title.trim().slice(0, MAX_TITLE_CHARS) : "";
  const body = typeof raw.body === "string" ? raw.body : "";
  if (!title) return { title: "", body, error: "title required" };
  if (!body.trim()) return { title, body: "", error: "body required" };
  if (body.length > MAX_NOTE_CHARS)
    return { title, body, error: `body too long (max ${MAX_NOTE_CHARS} chars)` };
  return { title, body };
}

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Blob storage not configured. Set BLOB_READ_WRITE_TOKEN." },
      { status: 503 },
    );
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = readBody(json);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const existing = await listKb();
  if (existing.length >= MAX_DOCS) {
    return NextResponse.json(
      { error: `max ${MAX_DOCS} docs reached — delete one first` },
      { status: 409 },
    );
  }

  try {
    const entry = await addKbNote({ title: parsed.title, body: parsed.body });
    return NextResponse.json({ entry });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "create failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Blob storage not configured. Set BLOB_READ_WRITE_TOKEN." },
      { status: 503 },
    );
  }
  let json: { id?: string; title?: string; body?: string };
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const id = (json.id || "").trim();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const parsed = readBody({ title: json.title, body: json.body });
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const updated = await updateKbNote(id, { title: parsed.title, body: parsed.body });
    if (!updated) return NextResponse.json({ error: "not found or not editable" }, { status: 404 });
    return NextResponse.json({ entry: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
