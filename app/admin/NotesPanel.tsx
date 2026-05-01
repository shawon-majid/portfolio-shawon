"use client";

import { useCallback, useEffect, useState } from "react";

type Entry = {
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

type Status = { tone: "" | "ok" | "err"; msg: string };

type Draft = {
  // server id once persisted; null while a new note hasn't been saved yet
  id: string | null;
  title: string;
  body: string;
  loaded: boolean;
  saving: boolean;
  dirty: boolean;
  status: Status;
};

function makeDraft(entry: Entry | null): Draft {
  return {
    id: entry?.id ?? null,
    title: entry?.name ?? "",
    body: "",
    loaded: false,
    saving: false,
    dirty: false,
    status: { tone: "", msg: "" },
  };
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function NotesPanel({ onChanged }: { onChanged?: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notes", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as { entries: Entry[] };
        const list = json.entries || [];
        setEntries(list);
        // Reset drafts for entries we no longer have; preserve unsaved local drafts.
        setDrafts((prev) => {
          const next: Record<string, Draft> = {};
          for (const e of list) {
            const existing = prev[e.id];
            next[e.id] = existing
              ? { ...existing, id: e.id, title: existing.dirty ? existing.title : e.name }
              : makeDraft(e);
          }
          // keep any new-note drafts (id starts with "new-")
          for (const key of Object.keys(prev)) {
            if (key.startsWith("new-")) next[key] = prev[key];
          }
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loadBody = useCallback(async (id: string) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || makeDraft(null)), saving: true, status: { tone: "", msg: "" } },
    }));
    try {
      const res = await fetch(`/api/admin/notes?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`load failed (${res.status})`);
      const json = (await res.json()) as { body: string };
      setDrafts((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || makeDraft(null)),
          body: json.body || "",
          loaded: true,
          saving: false,
          dirty: false,
          status: { tone: "", msg: "" },
        },
      }));
    } catch (err) {
      setDrafts((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || makeDraft(null)),
          saving: false,
          status: { tone: "err", msg: err instanceof Error ? err.message : "load failed" },
        },
      }));
    }
  }, []);

  const updateDraft = useCallback((key: string, patch: Partial<Draft>) => {
    setDrafts((prev) => {
      const cur = prev[key] || makeDraft(null);
      return { ...prev, [key]: { ...cur, ...patch, dirty: true } };
    });
  }, []);

  const saveExisting = useCallback(
    async (key: string) => {
      const d = drafts[key];
      if (!d || !d.id) return;
      if (!d.title.trim() || !d.body.trim()) {
        setDrafts((prev) => ({
          ...prev,
          [key]: { ...d, status: { tone: "err", msg: "title and body required" } },
        }));
        return;
      }
      setDrafts((prev) => ({ ...prev, [key]: { ...d, saving: true, status: { tone: "", msg: "saving…" } } }));
      try {
        const res = await fetch("/api/admin/notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: d.id, title: d.title, body: d.body }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || `save failed (${res.status})`);
        setDrafts((prev) => ({
          ...prev,
          [key]: { ...d, saving: false, dirty: false, status: { tone: "ok", msg: "saved" } },
        }));
        refresh();
        onChanged?.();
      } catch (err) {
        setDrafts((prev) => ({
          ...prev,
          [key]: {
            ...d,
            saving: false,
            status: { tone: "err", msg: err instanceof Error ? err.message : "save failed" },
          },
        }));
      }
    },
    [drafts, refresh, onChanged],
  );

  const saveNew = useCallback(
    async (key: string) => {
      const d = drafts[key];
      if (!d) return;
      if (!d.title.trim() || !d.body.trim()) {
        setDrafts((prev) => ({
          ...prev,
          [key]: { ...d, status: { tone: "err", msg: "title and body required" } },
        }));
        return;
      }
      setDrafts((prev) => ({ ...prev, [key]: { ...d, saving: true, status: { tone: "", msg: "saving…" } } }));
      try {
        const res = await fetch("/api/admin/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: d.title, body: d.body }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || `create failed (${res.status})`);
        // Drop the local draft; refresh will populate from server.
        setDrafts((prev) => {
          const { [key]: _gone, ...rest } = prev;
          void _gone;
          return rest;
        });
        setCreating(false);
        refresh();
        onChanged?.();
      } catch (err) {
        setDrafts((prev) => ({
          ...prev,
          [key]: {
            ...d,
            saving: false,
            status: { tone: "err", msg: err instanceof Error ? err.message : "create failed" },
          },
        }));
      }
    },
    [drafts, refresh, onChanged],
  );

  const remove = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Delete note "${name}"?`)) return;
      try {
        const res = await fetch("/api/admin/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (res.ok) {
          setDrafts((prev) => {
            const { [id]: _gone, ...rest } = prev;
            void _gone;
            return rest;
          });
          refresh();
          onChanged?.();
        }
      } catch {
        /* swallow */
      }
    },
    [refresh, onChanged],
  );

  const startNew = () => {
    const key = `new-${Date.now()}`;
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        id: null,
        title: "",
        body: "",
        loaded: true,
        saving: false,
        dirty: true,
        status: { tone: "", msg: "" },
      },
    }));
    setCreating(true);
  };

  const cancelNew = (key: string) => {
    setDrafts((prev) => {
      const { [key]: _gone, ...rest } = prev;
      void _gone;
      return rest;
    });
    setCreating(false);
  };

  const newKeys = Object.keys(drafts).filter((k) => k.startsWith("new-"));

  return (
    <section>
      <h2>notes ({entries.length})</h2>
      <p className="hint" style={{ marginBottom: 14 }}>
        markdown notes fed to the AI alongside your uploaded docs. ideal for FAQs, project blurbs, or
        anything you want to edit in-browser without re-uploading a file.
      </p>

      {newKeys.map((k) => {
        const d = drafts[k];
        return (
          <NoteEditor
            key={k}
            draft={d}
            kind="new"
            onChange={(patch) => updateDraft(k, patch)}
            onSave={() => saveNew(k)}
            onCancel={() => cancelNew(k)}
          />
        );
      })}

      {!creating && (
        <button className="save" onClick={startNew} disabled={loading}>
          + new note
        </button>
      )}

      <div style={{ marginTop: 18 }}>
        {loading ? (
          <div className="empty">loading…</div>
        ) : entries.length === 0 && newKeys.length === 0 ? (
          <div className="empty">no notes yet — create one above.</div>
        ) : (
          entries.map((e) => {
            const d = drafts[e.id] || makeDraft(e);
            return (
              <NoteCard
                key={e.id}
                entry={e}
                draft={d}
                onLoad={() => loadBody(e.id)}
                onChange={(patch) => updateDraft(e.id, patch)}
                onSave={() => saveExisting(e.id)}
                onDelete={() => remove(e.id, e.name)}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

function NoteEditor({
  draft,
  kind,
  onChange,
  onSave,
  onCancel,
}: {
  draft: Draft;
  kind: "new" | "edit";
  onChange: (patch: Partial<Draft>) => void;
  onSave: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="note-edit">
      <input
        className="note-title"
        value={draft.title}
        placeholder={kind === "new" ? "note title (e.g. Project highlights)" : "title"}
        onChange={(e) => onChange({ title: e.target.value })}
        disabled={draft.saving}
      />
      <textarea
        className="note-body"
        value={draft.body}
        placeholder="markdown content…"
        rows={kind === "new" ? 10 : 14}
        spellCheck={false}
        onChange={(e) => onChange({ body: e.target.value })}
        disabled={draft.saving}
      />
      <div className="note-actions">
        <button className="save" onClick={onSave} disabled={draft.saving || !draft.dirty}>
          {draft.saving ? "saving…" : kind === "new" ? "create note" : "save changes"}
        </button>
        {onCancel && (
          <button className="back" onClick={onCancel} disabled={draft.saving}>
            cancel
          </button>
        )}
        <span className={`status ${draft.status.tone}`}>{draft.status.msg || " "}</span>
        <span className="hint" style={{ marginLeft: "auto" }}>
          {draft.body.length.toLocaleString()} chars
        </span>
      </div>
    </div>
  );
}

function NoteCard({
  entry,
  draft,
  onLoad,
  onChange,
  onSave,
  onDelete,
}: {
  entry: Entry;
  draft: Draft;
  onLoad: () => void;
  onChange: (patch: Partial<Draft>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    if (!open && !draft.loaded) onLoad();
    setOpen((v) => !v);
  };

  return (
    <div className="note-card">
      <div className="note-head">
        <button className="note-toggle" onClick={toggle}>
          <span className="caret">{open ? "▾" : "▸"}</span>
          <span className="note-name">{entry.name}</span>
          <span className="note-meta">
            {entry.chars.toLocaleString()} chars · {fmtDate(entry.uploadedAt)}
          </span>
        </button>
        <button className="rm" onClick={onDelete}>
          delete
        </button>
      </div>
      {open && (
        <div className="note-edit">
          {!draft.loaded && draft.saving ? (
            <div className="empty">loading…</div>
          ) : (
            <>
              <input
                className="note-title"
                value={draft.title}
                onChange={(e) => onChange({ title: e.target.value })}
                disabled={draft.saving}
              />
              <textarea
                className="note-body"
                value={draft.body}
                rows={14}
                spellCheck={false}
                onChange={(e) => onChange({ body: e.target.value })}
                disabled={draft.saving}
              />
              <div className="note-actions">
                <button className="save" onClick={onSave} disabled={draft.saving || !draft.dirty}>
                  {draft.saving ? "saving…" : "save changes"}
                </button>
                <span className={`status ${draft.status.tone}`}>{draft.status.msg || " "}</span>
                <span className="hint" style={{ marginLeft: "auto" }}>
                  {draft.body.length.toLocaleString()} chars
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
