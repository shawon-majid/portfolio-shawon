import { NextRequest, NextResponse } from "next/server";
import {
  blobsEnabled,
  getSettings,
  saveSettings,
  SettingsValidationError,
  validatePartial,
} from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings, blobsEnabled: blobsEnabled() });
}

export async function POST(req: NextRequest) {
  if (!blobsEnabled()) {
    return NextResponse.json(
      { error: "Blob storage not configured. Set BLOB_READ_WRITE_TOKEN." },
      { status: 503 },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  let partial;
  try {
    partial = validatePartial(body);
  } catch (err) {
    if (err instanceof SettingsValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  try {
    const settings = await saveSettings(partial);
    return NextResponse.json({ settings });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "save failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
