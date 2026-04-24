import { NextResponse } from "next/server";
import { listKb } from "@/lib/kb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entries = await listKb();
    return NextResponse.json({ entries });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "list error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
