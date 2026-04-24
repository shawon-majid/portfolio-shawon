import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { addKb, listKb, type KbEntry } from "@/lib/kb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_DOCS = 20;

function kindFor(file: File): KbEntry["kind"] | null {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".md") || name.endsWith(".markdown") || type === "text/markdown") return "markdown";
  if (type.startsWith("text/") || name.endsWith(".txt")) return "text";
  return null;
}

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Blob storage not configured. Set BLOB_READ_WRITE_TOKEN." },
      { status: 503 },
    );
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid form data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file too large (max 10 MB)" }, { status: 413 });
  }
  const kind = kindFor(file);
  if (!kind) {
    return NextResponse.json({ error: "unsupported file type (pdf, txt, md only)" }, { status: 415 });
  }
  const existing = await listKb();
  if (existing.length >= MAX_DOCS) {
    return NextResponse.json({ error: `max ${MAX_DOCS} docs reached — delete one first` }, { status: 409 });
  }

  let parsedText = "";
  try {
    if (kind === "pdf") {
      const buf = new Uint8Array(await file.arrayBuffer());
      const pdf = await getDocumentProxy(buf);
      const { text } = await extractText(pdf, { mergePages: true });
      parsedText = Array.isArray(text) ? text.join("\n") : text;
    } else {
      parsedText = await file.text();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "parse failed";
    return NextResponse.json({ error: `failed to parse file: ${msg}` }, { status: 422 });
  }
  parsedText = parsedText.trim();
  if (!parsedText) {
    return NextResponse.json({ error: "no text extracted from file" }, { status: 422 });
  }

  try {
    const entry = await addKb({ file, parsedText, kind });
    return NextResponse.json({ entry });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
