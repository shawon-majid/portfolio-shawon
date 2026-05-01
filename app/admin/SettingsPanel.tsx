"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type StatusMode = "open-to-work" | "busy" | "offline" | "custom";

type Settings = {
  askEnabled: boolean;
  model: string;
  rateLimit: { maxPerHour: number | null };
  headlines: string[];
  status: { mode: StatusMode; label: string };
  systemPrompt: string;
  updatedAt: string;
};

const MAX_SYSTEM_PROMPT_CHARS = 8_000;

type Status = { tone: "" | "ok" | "err"; msg: string };

const MODEL_SUGGESTIONS = [
  "openrouter/free",
  "openrouter/auto",
  "anthropic/claude-3.5-haiku",
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-chat:free",
];

const RATE_PRESETS = [
  { label: "10 / hour", value: 10 },
  { label: "20 / hour", value: 20 },
  { label: "50 / hour", value: 50 },
  { label: "100 / hour", value: 100 },
  { label: "Unlimited (no cap)", value: null as number | null },
  { label: "Custom…", value: "custom" as const },
];

const STATUS_PRESETS: { mode: StatusMode; label: string }[] = [
  { mode: "open-to-work", label: "open to work" },
  { mode: "busy", label: "heads down — shipping" },
  { mode: "offline", label: "offline" },
  { mode: "custom", label: "" },
];

function modeFromValue(v: string): StatusMode {
  if (v === "open-to-work" || v === "busy" || v === "offline" || v === "custom") return v;
  return "open-to-work";
}

export default function SettingsPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [draft, setDraft] = useState<Settings | null>(null);
  const [headlinesText, setHeadlinesText] = useState("");
  const [rateMode, setRateMode] = useState<"preset" | "custom" | "unlimited">("preset");
  const [customRate, setCustomRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>({ tone: "", msg: "" });
  const [blobsEnabledFlag, setBlobsEnabledFlag] = useState(true);
  const [defaultSystemPrompt, setDefaultSystemPrompt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const json = (await res.json()) as {
        settings: Settings;
        blobsEnabled: boolean;
        defaults?: { systemPrompt?: string };
      };
      setSettings(json.settings);
      setDraft(json.settings);
      setHeadlinesText(json.settings.headlines.join("\n"));
      setBlobsEnabledFlag(json.blobsEnabled);
      if (json.defaults?.systemPrompt) setDefaultSystemPrompt(json.defaults.systemPrompt);

      const m = json.settings.rateLimit.maxPerHour;
      if (m === null) {
        setRateMode("unlimited");
      } else if ([10, 20, 50, 100].includes(m)) {
        setRateMode("preset");
      } else {
        setRateMode("custom");
        setCustomRate(String(m));
      }
    } catch (err) {
      setStatus({ tone: "err", msg: err instanceof Error ? err.message : "load failed" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => {
    if (!settings || !draft) return false;
    if (settings.askEnabled !== draft.askEnabled) return true;
    if (settings.model !== draft.model) return true;
    if (settings.rateLimit.maxPerHour !== draft.rateLimit.maxPerHour) return true;
    if (settings.status.mode !== draft.status.mode) return true;
    if (settings.status.label !== draft.status.label) return true;
    if (settings.headlines.join("\n") !== headlinesText) return true;
    if (settings.systemPrompt !== draft.systemPrompt) return true;
    return false;
  }, [settings, draft, headlinesText]);

  const onSave = useCallback(async () => {
    if (!draft) return;
    const headlines = headlinesText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (headlines.length === 0) {
      setStatus({ tone: "err", msg: "at least one headline required" });
      return;
    }
    setSaving(true);
    setStatus({ tone: "", msg: "saving…" });
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          askEnabled: draft.askEnabled,
          model: draft.model,
          rateLimit: { maxPerHour: draft.rateLimit.maxPerHour },
          headlines,
          status: { mode: draft.status.mode, label: draft.status.label },
          systemPrompt: draft.systemPrompt,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ tone: "err", msg: json.error || `save failed (${res.status})` });
      } else {
        setSettings(json.settings);
        setDraft(json.settings);
        setHeadlinesText(json.settings.headlines.join("\n"));
        setStatus({ tone: "ok", msg: "saved · reload terminal page to see changes" });
      }
    } catch (err) {
      setStatus({ tone: "err", msg: err instanceof Error ? err.message : "save failed" });
    } finally {
      setSaving(false);
    }
  }, [draft, headlinesText]);

  if (loading || !draft) {
    return (
      <section>
        <h2>runtime settings</h2>
        <div className="empty">loading…</div>
      </section>
    );
  }

  const onRateChange = (raw: string) => {
    if (raw === "unlimited") {
      setRateMode("unlimited");
      setDraft({ ...draft, rateLimit: { maxPerHour: null } });
    } else if (raw === "custom") {
      setRateMode("custom");
      const seed = draft.rateLimit.maxPerHour ?? 30;
      setCustomRate(String(seed));
      setDraft({ ...draft, rateLimit: { maxPerHour: seed } });
    } else {
      const n = Number(raw);
      setRateMode("preset");
      setDraft({ ...draft, rateLimit: { maxPerHour: n } });
    }
  };

  const onCustomRateChange = (raw: string) => {
    setCustomRate(raw);
    const n = Math.floor(Number(raw));
    if (Number.isFinite(n) && n >= 1) {
      setDraft({ ...draft, rateLimit: { maxPerHour: n } });
    }
  };

  const presetSelectValue =
    rateMode === "unlimited"
      ? "unlimited"
      : rateMode === "custom"
        ? "custom"
        : String(draft.rateLimit.maxPerHour ?? 10);

  return (
    <section>
      <h2>runtime settings</h2>
      <div className="settings-grid">
        <label className="field">
          <span className="field-label">ai ask</span>
          <div className="field-row">
            <input
              type="checkbox"
              checked={draft.askEnabled}
              onChange={(e) => setDraft({ ...draft, askEnabled: e.target.checked })}
            />
            <span className="hint">{draft.askEnabled ? "enabled" : "disabled (kill switch on)"}</span>
          </div>
        </label>

        <label className="field">
          <span className="field-label">openrouter model</span>
          <input
            list="model-suggestions"
            value={draft.model}
            onChange={(e) => setDraft({ ...draft, model: e.target.value })}
            placeholder="openrouter/free"
          />
          <datalist id="model-suggestions">
            {MODEL_SUGGESTIONS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <span className="hint">openrouter model id · `openrouter/free` routes to free models; suffix `:free` picks free providers</span>
        </label>

        <label className="field">
          <span className="field-label">rate limit (per ip · per hour)</span>
          <select value={presetSelectValue} onChange={(e) => onRateChange(e.target.value)}>
            {RATE_PRESETS.map((p) => {
              const v = p.value === null ? "unlimited" : p.value === "custom" ? "custom" : String(p.value);
              return (
                <option key={v} value={v}>
                  {p.label}
                </option>
              );
            })}
          </select>
          {rateMode === "custom" && (
            <input
              type="number"
              min={1}
              step={1}
              value={customRate}
              onChange={(e) => onCustomRateChange(e.target.value)}
              placeholder="e.g. 30"
            />
          )}
          {rateMode === "unlimited" && (
            <span className="hint warn">no cap — anyone can burn openrouter credits. consider a real limit.</span>
          )}
        </label>

        <label className="field">
          <span className="field-label">status badge</span>
          <select
            value={draft.status.mode}
            onChange={(e) => {
              const mode = modeFromValue(e.target.value);
              const preset = STATUS_PRESETS.find((p) => p.mode === mode);
              setDraft({
                ...draft,
                status: {
                  mode,
                  label: mode === "custom" ? draft.status.label : preset?.label || draft.status.label,
                },
              });
            }}
          >
            <option value="open-to-work">open to work</option>
            <option value="busy">busy / heads down</option>
            <option value="offline">offline</option>
            <option value="custom">custom…</option>
          </select>
          <input
            value={draft.status.label}
            onChange={(e) =>
              setDraft({ ...draft, status: { ...draft.status, label: e.target.value } })
            }
            placeholder="display label"
          />
        </label>

        <label className="field field-wide">
          <span className="field-label">typing headlines (one per line · max 12)</span>
          <textarea
            value={headlinesText}
            onChange={(e) => setHeadlinesText(e.target.value)}
            rows={8}
            spellCheck={false}
          />
          <span className="hint">
            {headlinesText.split("\n").filter((s) => s.trim()).length} / 12 lines
          </span>
        </label>

        <label className="field field-wide">
          <span className="field-label">
            system prompt — sent to the model before profile + uploaded knowledge
          </span>
          <textarea
            value={draft.systemPrompt}
            onChange={(e) =>
              setDraft({ ...draft, systemPrompt: e.target.value.slice(0, MAX_SYSTEM_PROMPT_CHARS) })
            }
            rows={12}
            spellCheck={false}
            style={{ fontFamily: "var(--mono)", fontSize: 12.5 }}
          />
          <div className="field-row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span className="hint">
              {draft.systemPrompt.length.toLocaleString()} / {MAX_SYSTEM_PROMPT_CHARS.toLocaleString()} chars
            </span>
            {defaultSystemPrompt && draft.systemPrompt !== defaultSystemPrompt && (
              <button
                type="button"
                className="back"
                onClick={() => setDraft({ ...draft, systemPrompt: defaultSystemPrompt })}
                style={{ padding: "4px 10px", fontSize: 11.5 }}
              >
                reset to default
              </button>
            )}
          </div>
        </label>
      </div>

      <div className="settings-actions">
        <button className="save" disabled={!dirty || saving || !blobsEnabledFlag} onClick={onSave}>
          {saving ? "saving…" : "save settings"}
        </button>
        <button
          className="back"
          disabled={!dirty || saving}
          onClick={() => {
            if (!settings) return;
            setDraft(settings);
            setHeadlinesText(settings.headlines.join("\n"));
            setStatus({ tone: "", msg: "" });
          }}
        >
          revert
        </button>
        <span className="hint">
          last saved {new Date(settings?.updatedAt || 0).getTime() === 0 ? "—" : new Date(settings!.updatedAt).toLocaleString()}
        </span>
      </div>
      {!blobsEnabledFlag && (
        <div className="status err">
          BLOB_READ_WRITE_TOKEN is not set — settings are read-only here. Add it in Vercel or .env.local.
        </div>
      )}
      <div className={`status ${status.tone}`}>{status.msg || " "}</div>
    </section>
  );
}
