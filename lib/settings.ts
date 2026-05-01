import { put, del, list } from "@vercel/blob";

export type StatusMode = "open-to-work" | "busy" | "offline" | "custom";

export type Settings = {
  askEnabled: boolean;
  model: string;
  rateLimit: { maxPerHour: number | null };
  headlines: string[];
  status: { mode: StatusMode; label: string };
  updatedAt: string;
};

const MANIFEST_PREFIX = "settings/manifest-";
const MANIFEST_SUFFIX = ".json";
const CACHE_TTL_MS = 60 * 1000;

const DEFAULT_HEADLINES = [
  "I build AI-augmented backends.",
  "Currently shipping at Vyg.ai — remote, from Sylhet.",
  "Agentic workflows. LangGraph. Serverless on AWS + GCP.",
  "Cut AI inference cost 50% with batch pipelines.",
  "Champion — Code Samurai 2024.",
  "Open to work on hard AI-systems problems.",
];

export const MAX_HEADLINES = 12;
export const MAX_HEADLINE_CHARS = 140;
export const MAX_STATUS_LABEL_CHARS = 40;
export const MAX_MODEL_CHARS = 80;
export const MAX_RATE_LIMIT = 1_000_000;

export function defaultSettings(): Settings {
  return {
    askEnabled: true,
    model: process.env.OPENROUTER_MODEL || "openrouter/free",
    rateLimit: {
      maxPerHour: Number(process.env.ASK_RATE_LIMIT_MAX) || 10,
    },
    headlines: DEFAULT_HEADLINES.slice(),
    status: { mode: "open-to-work", label: "open to work" },
    updatedAt: new Date(0).toISOString(),
  };
}

type Cache = { value: Settings; at: number } | null;
let cache: Cache = null;

export function blobsEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function findManifestBlobs() {
  const { blobs } = await list({ prefix: MANIFEST_PREFIX, limit: 200 });
  return blobs
    .filter((b) => b.pathname.startsWith(MANIFEST_PREFIX) && b.pathname.endsWith(MANIFEST_SUFFIX))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

async function readManifest(): Promise<Settings | null> {
  if (!blobsEnabled()) return null;
  try {
    const blobs = await findManifestBlobs();
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return null;
    const raw = (await res.json()) as Partial<Settings>;
    return mergeWithDefaults(raw);
  } catch {
    return null;
  }
}

async function writeManifest(value: Settings): Promise<void> {
  const name = `${MANIFEST_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}${MANIFEST_SUFFIX}`;
  await put(name, JSON.stringify(value, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  try {
    const blobs = await findManifestBlobs();
    const old = blobs.slice(1).map((b) => b.url);
    if (old.length) await del(old);
  } catch {
    /* cleanup is best-effort */
  }
}

function mergeWithDefaults(raw: Partial<Settings>): Settings {
  const d = defaultSettings();
  const headlines = Array.isArray(raw.headlines)
    ? raw.headlines.filter((h): h is string => typeof h === "string" && h.trim().length > 0)
    : null;
  const mode = raw.status?.mode;
  return {
    askEnabled: typeof raw.askEnabled === "boolean" ? raw.askEnabled : d.askEnabled,
    model: typeof raw.model === "string" && raw.model.trim() ? raw.model.trim() : d.model,
    rateLimit: {
      maxPerHour:
        raw.rateLimit && (raw.rateLimit.maxPerHour === null || typeof raw.rateLimit.maxPerHour === "number")
          ? raw.rateLimit.maxPerHour
          : d.rateLimit.maxPerHour,
    },
    headlines: headlines && headlines.length > 0 ? headlines.slice(0, MAX_HEADLINES) : d.headlines,
    status: {
      mode:
        mode === "open-to-work" || mode === "busy" || mode === "offline" || mode === "custom"
          ? mode
          : d.status.mode,
      label:
        typeof raw.status?.label === "string" && raw.status.label.trim()
          ? raw.status.label.trim().slice(0, MAX_STATUS_LABEL_CHARS)
          : d.status.label,
    },
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : d.updatedAt,
  };
}

export async function getSettings(): Promise<Settings> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.value;
  const stored = await readManifest();
  const value = stored || defaultSettings();
  cache = { value, at: now };
  return value;
}

export class SettingsValidationError extends Error {}

export function validatePartial(input: unknown): Partial<Settings> {
  if (!input || typeof input !== "object") {
    throw new SettingsValidationError("body must be an object");
  }
  const raw = input as Record<string, unknown>;
  const out: Partial<Settings> = {};

  if ("askEnabled" in raw) {
    if (typeof raw.askEnabled !== "boolean") throw new SettingsValidationError("askEnabled must be boolean");
    out.askEnabled = raw.askEnabled;
  }
  if ("model" in raw) {
    if (typeof raw.model !== "string" || !raw.model.trim()) {
      throw new SettingsValidationError("model must be a non-empty string");
    }
    if (raw.model.length > MAX_MODEL_CHARS) {
      throw new SettingsValidationError(`model too long (max ${MAX_MODEL_CHARS} chars)`);
    }
    out.model = raw.model.trim();
  }
  if ("rateLimit" in raw) {
    const rl = raw.rateLimit as { maxPerHour?: unknown } | null;
    if (!rl || typeof rl !== "object") throw new SettingsValidationError("rateLimit must be object");
    const m = rl.maxPerHour;
    if (m === null) {
      out.rateLimit = { maxPerHour: null };
    } else if (typeof m === "number" && Number.isFinite(m) && m >= 1 && m <= MAX_RATE_LIMIT) {
      out.rateLimit = { maxPerHour: Math.floor(m) };
    } else {
      throw new SettingsValidationError(
        `rateLimit.maxPerHour must be null or an integer between 1 and ${MAX_RATE_LIMIT}`,
      );
    }
  }
  if ("headlines" in raw) {
    if (!Array.isArray(raw.headlines)) throw new SettingsValidationError("headlines must be array");
    const cleaned = raw.headlines
      .filter((h): h is string => typeof h === "string")
      .map((h) => h.trim())
      .filter((h) => h.length > 0)
      .slice(0, MAX_HEADLINES);
    if (cleaned.length === 0) throw new SettingsValidationError("headlines must have at least one entry");
    if (cleaned.some((h) => h.length > MAX_HEADLINE_CHARS)) {
      throw new SettingsValidationError(`each headline must be ≤ ${MAX_HEADLINE_CHARS} chars`);
    }
    out.headlines = cleaned;
  }
  if ("status" in raw) {
    const s = raw.status as { mode?: unknown; label?: unknown } | null;
    if (!s || typeof s !== "object") throw new SettingsValidationError("status must be object");
    const mode = s.mode;
    if (mode !== "open-to-work" && mode !== "busy" && mode !== "offline" && mode !== "custom") {
      throw new SettingsValidationError("status.mode must be open-to-work | busy | offline | custom");
    }
    if (typeof s.label !== "string" || !s.label.trim()) {
      throw new SettingsValidationError("status.label must be a non-empty string");
    }
    if (s.label.length > MAX_STATUS_LABEL_CHARS) {
      throw new SettingsValidationError(`status.label too long (max ${MAX_STATUS_LABEL_CHARS} chars)`);
    }
    out.status = { mode, label: s.label.trim() };
  }
  return out;
}

export async function saveSettings(partial: Partial<Settings>): Promise<Settings> {
  if (!blobsEnabled()) {
    throw new Error("Blob storage not configured. Set BLOB_READ_WRITE_TOKEN.");
  }
  const current = (await readManifest()) || defaultSettings();
  const next: Settings = {
    askEnabled: partial.askEnabled ?? current.askEnabled,
    model: partial.model ?? current.model,
    rateLimit: { maxPerHour: partial.rateLimit?.maxPerHour ?? current.rateLimit.maxPerHour },
    headlines: partial.headlines ?? current.headlines,
    status: partial.status ?? current.status,
    updatedAt: new Date().toISOString(),
  };
  await writeManifest(next);
  cache = { value: next, at: Date.now() };
  return next;
}

export function invalidateSettingsCache(): void {
  cache = null;
}
