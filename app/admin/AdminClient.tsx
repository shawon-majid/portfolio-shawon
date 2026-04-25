"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SettingsPanel from "./SettingsPanel";

type Entry = {
  id: string;
  name: string;
  kind: "pdf" | "text" | "markdown";
  size: number;
  chars: number;
  uploadedAt: string;
  rawUrl: string;
  textUrl: string;
};

type Status = { tone: "" | "ok" | "err"; msg: string };

function fmtSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [status, setStatus] = useState<Status>({ tone: "", msg: "" });
  const fileRef = useRef<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/list", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as { entries: Entry[] };
        setEntries(json.entries || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upload = useCallback(
    async (file: File) => {
      setBusy(true);
      setStatus({ tone: "", msg: `uploading ${file.name}…` });
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: form });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatus({ tone: "err", msg: json.error || `upload failed (${res.status})` });
        } else {
          setStatus({ tone: "ok", msg: `added ${json.entry?.name || file.name} · ${json.entry?.chars ?? 0} chars` });
          refresh();
        }
      } catch (err) {
        setStatus({ tone: "err", msg: err instanceof Error ? err.message : "upload failed" });
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Remove "${name}" from the knowledge base?`)) return;
      setBusy(true);
      try {
        const res = await fetch("/api/admin/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (res.ok) {
          setStatus({ tone: "ok", msg: `removed ${name}` });
          refresh();
        } else {
          const json = await res.json().catch(() => ({}));
          setStatus({ tone: "err", msg: json.error || "delete failed" });
        }
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  };

  return (
    <div className="admin">
      <h1>admin</h1>
      <div className="sub">knowledge base for ask-shawon · basic-auth gated</div>

      <SettingsPanel />

      <section>
        <h2>upload</h2>
        <label
          className={`drop ${over ? "over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              if (fileRef.current) fileRef.current.value = "";
            }}
            disabled={busy}
          />
          <div>
            {busy ? "working…" : "drop a pdf / txt / md file here, or click to choose"}
            <br />
            <span style={{ fontSize: 11 }}>max 10 MB · parsed to text, stored as blob, fed to the AI</span>
          </div>
        </label>
        <div className={`status ${status.tone}`}>{status.msg || " "}</div>
      </section>

      <section>
        <h2>knowledge base ({entries.length})</h2>
        {loading ? (
          <div className="empty">loading…</div>
        ) : entries.length === 0 ? (
          <div className="empty">no docs yet — upload a resume, case study, or notes.</div>
        ) : (
          entries.map((e) => (
            <div className="row" key={e.id}>
              <div>
                <div className="name">
                  <a href={e.rawUrl} target="_blank" rel="noreferrer">
                    {e.name}
                  </a>
                </div>
                <div className="meta">
                  {e.kind} · {fmtSize(e.size)} · {e.chars.toLocaleString()} chars · {fmtDate(e.uploadedAt)}
                </div>
              </div>
              <a className="back" href={e.textUrl} target="_blank" rel="noreferrer">
                parsed
              </a>
              <a className="back" href={e.rawUrl} target="_blank" rel="noreferrer">
                raw
              </a>
              <button className="rm" disabled={busy} onClick={() => remove(e.id, e.name)}>
                remove
              </button>
            </div>
          ))
        )}
      </section>

      <a className="back" href="/">
        ← back to terminal
      </a>
    </div>
  );
}
