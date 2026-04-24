import { NextRequest, NextResponse } from "next/server";
import { deleteKb } from "@/lib/kb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const id = body.id?.trim();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  try {
    const ok = await deleteKb(id);
    if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
