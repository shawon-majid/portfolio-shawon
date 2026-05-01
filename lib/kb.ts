import { put, del, list } from "@vercel/blob";

export type KbEntry = {
  id: string;
  name: string;
  kind: "pdf" | "text" | "markdown";
  size: number;
  chars: number;
  uploadedAt: string;
  rawUrl: string;
  textUrl: string;
  editable?: boolean;
};

const MANIFEST_PREFIX = "kb/manifest-";
const MANIFEST_SUFFIX = ".json";
const MAX_KB_CHARS = 60_000;
const CACHE_TTL_MS = 60 * 1000;

type Cache = { text: string; entries: KbEntry[]; at: number } | null;
let cache: Cache = null;

function blobsEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function findManifestBlobs() {
  const { blobs } = await list({ prefix: MANIFEST_PREFIX, limit: 200 });
  return blobs
    .filter((b) => b.pathname.startsWith(MANIFEST_PREFIX) && b.pathname.endsWith(MANIFEST_SUFFIX))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

async function readManifest(): Promise<KbEntry[]> {
  if (!blobsEnabled()) return [];
  try {
    const blobs = await findManifestBlobs();
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as KbEntry[];
  } catch {
    return [];
  }
}

async function writeManifest(entries: KbEntry[]): Promise<void> {
  const name = `${MANIFEST_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}${MANIFEST_SUFFIX}`;
  await put(name, JSON.stringify(entries, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  // Best-effort cleanup of older manifest blobs (keep newest only)
  try {
    const blobs = await findManifestBlobs();
    const old = blobs.slice(1).map((b) => b.url);
    if (old.length) await del(old);
  } catch {
    /* cleanup is best-effort */
  }
}

export async function listKb(): Promise<KbEntry[]> {
  return readManifest();
}

export async function addKb(input: {
  file: File;
  parsedText: string;
  kind: KbEntry["kind"];
}): Promise<KbEntry> {
  const id = crypto.randomUUID();
  const ext = input.kind === "pdf" ? "pdf" : input.kind === "markdown" ? "md" : "txt";
  const rawPath = `kb/raw/${id}.${ext}`;
  const textPath = `kb/text/${id}.txt`;

  const rawBlob = await put(rawPath, input.file, {
    access: "public",
    contentType: input.file.type || "application/octet-stream",
    addRandomSuffix: false,
  });
  const textBlob = await put(textPath, input.parsedText, {
    access: "public",
    contentType: "text/plain; charset=utf-8",
    addRandomSuffix: false,
  });

  const entry: KbEntry = {
    id,
    name: input.file.name,
    kind: input.kind,
    size: input.file.size,
    chars: input.parsedText.length,
    uploadedAt: new Date().toISOString(),
    rawUrl: rawBlob.url,
    textUrl: textBlob.url,
  };

  const manifest = await readManifest();
  manifest.unshift(entry);
  await writeManifest(manifest);
  cache = null;
  return entry;
}

export async function addKbNote(input: {
  title: string;
  body: string;
}): Promise<KbEntry> {
  const id = crypto.randomUUID();
  const rawPath = `kb/raw/${id}.md`;
  const textPath = `kb/text/${id}.txt`;

  const rawBlob = await put(rawPath, input.body, {
    access: "public",
    contentType: "text/markdown; charset=utf-8",
    addRandomSuffix: false,
  });
  const textBlob = await put(textPath, input.body, {
    access: "public",
    contentType: "text/plain; charset=utf-8",
    addRandomSuffix: false,
  });

  const entry: KbEntry = {
    id,
    name: input.title.trim() || "untitled note",
    kind: "markdown",
    size: new TextEncoder().encode(input.body).byteLength,
    chars: input.body.length,
    uploadedAt: new Date().toISOString(),
    rawUrl: rawBlob.url,
    textUrl: textBlob.url,
    editable: true,
  };

  const manifest = await readManifest();
  manifest.unshift(entry);
  await writeManifest(manifest);
  cache = null;
  return entry;
}

export async function updateKbNote(
  id: string,
  input: { title: string; body: string },
): Promise<KbEntry | null> {
  const manifest = await readManifest();
  const idx = manifest.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const existing = manifest[idx];
  if (!existing.editable) return null;

  // Best-effort delete the old blobs first; Vercel Blob `put` does not
  // overwrite by default and would otherwise leak the previous content.
  await Promise.allSettled([del(existing.rawUrl), del(existing.textUrl)]);

  const rawPath = `kb/raw/${id}.md`;
  const textPath = `kb/text/${id}.txt`;
  const rawBlob = await put(rawPath, input.body, {
    access: "public",
    contentType: "text/markdown; charset=utf-8",
    addRandomSuffix: false,
  });
  const textBlob = await put(textPath, input.body, {
    access: "public",
    contentType: "text/plain; charset=utf-8",
    addRandomSuffix: false,
  });

  const updated: KbEntry = {
    ...existing,
    name: input.title.trim() || "untitled note",
    size: new TextEncoder().encode(input.body).byteLength,
    chars: input.body.length,
    uploadedAt: new Date().toISOString(),
    rawUrl: rawBlob.url,
    textUrl: textBlob.url,
  };
  manifest[idx] = updated;
  await writeManifest(manifest);
  cache = null;
  return updated;
}

export async function getKbNoteBody(id: string): Promise<string | null> {
  const manifest = await readManifest();
  const entry = manifest.find((e) => e.id === id);
  if (!entry || !entry.editable) return null;
  try {
    const res = await fetch(entry.textUrl, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function deleteKb(id: string): Promise<boolean> {
  const manifest = await readManifest();
  const idx = manifest.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  const entry = manifest[idx];
  await Promise.allSettled([del(entry.rawUrl), del(entry.textUrl)]);
  manifest.splice(idx, 1);
  await writeManifest(manifest);
  cache = null;
  return true;
}

export async function loadKnowledgeText(): Promise<{ text: string; entries: KbEntry[] }> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) {
    return { text: cache.text, entries: cache.entries };
  }
  const entries = await readManifest();
  if (entries.length === 0) {
    cache = { text: "", entries, at: now };
    return { text: "", entries };
  }
  const texts = await Promise.all(
    entries.map(async (e) => {
      try {
        const res = await fetch(e.textUrl, { cache: "no-store" });
        if (!res.ok) return "";
        const body = await res.text();
        return `=== ${e.name} (${e.kind}) ===\n${body}`;
      } catch {
        return "";
      }
    }),
  );
  let joined = texts.filter(Boolean).join("\n\n");
  if (joined.length > MAX_KB_CHARS) joined = joined.slice(0, MAX_KB_CHARS) + "\n…[truncated]";
  cache = { text: joined, entries, at: now };
  return { text: joined, entries };
}
