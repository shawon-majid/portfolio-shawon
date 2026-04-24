"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Kind = "user" | "sys" | "ai" | "err";
type Line = { id: number; kind: Kind; text: string };
type ChatTurn = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "what do you do at Vyg.ai?",
  "show me your strongest project",
  "what's your AI/ML stack?",
  "are you open to work?",
  "tell me about DeepAgents",
  "where are you based?",
];

const TAGLINES = [
  "I build AI-augmented backends.",
  "Currently shipping at Vyg.ai — remote, from Sylhet.",
  "Agentic workflows. LangGraph. Serverless on AWS + GCP.",
  "Cut AI inference cost 50% with batch pipelines.",
  "Champion — Code Samurai 2024.",
  "Open to work on hard AI-systems problems.",
];

function localAnswer(q: string): string {
  const s = q.toLowerCase();
  if (/^\s*$/.test(s)) return "ask me anything — or try /help.";
  if (/^(hi|hello|hey|yo|sup|salam)/.test(s)) return "hey — ask me anything about my work, projects, or stack.";
  if (/contact|email|reach|phone/.test(s))
    return "email: shawon.majid@gmail.com\nphone: +880 1729 379229\nlinkedin: linkedin.com/in/shawon-majid";
  if (/where|based|location|live|from/.test(s)) return "Sylhet, Bangladesh — working remote across US + BD teams.";
  if (/vyg/.test(s))
    return "Software Engineer at Vyg.ai (Feb 2025 – present). Conversation Insights at ~2.5k/day, an OAuth-protected MCP server, CDP infra on GCP via Pulumi + Helm, and a 50% inference-cost cut via batch.";
  if (/project/.test(s))
    return "featured:\n• Conversation Insights (Vyg.ai)\n• DeepAgents (Indigo) — LangGraph meeting assistant\n• Re:elify — text→video reels\n• EcoSync — waste mgmt (Code Samurai '24 champion)\n• Budget AI — NL expense tracker";
  if (/stack|skill|tech/.test(s))
    return "TS + Python first. LangGraph/LangChain for agents. OpenAI + Gemini for models. AWS (SST) + GCP (Pulumi, Helm). Postgres, MongoDB, Redis, Qdrant. Next.js.";
  if (/open.*work|hire|avail|role|job/.test(s))
    return "Yes — open to senior backend / AI-engineering roles. Email: shawon.majid@gmail.com.";
  return "I'm offline right now. Try /help for commands, or email shawon.majid@gmail.com.";
}

function useTyper(lines: string[], opts?: { typeMs?: number; holdMs?: number; eraseMs?: number }) {
  const { typeMs = 38, holdMs = 2200, eraseMs = 18 } = opts || {};
  const [i, setI] = useState(0);
  const [txt, setTxt] = useState("");
  const [phase, setPhase] = useState<"type" | "hold" | "erase">("type");
  useEffect(() => {
    const cur = lines[i % lines.length];
    let t: ReturnType<typeof setTimeout>;
    if (phase === "type") {
      if (txt.length < cur.length) t = setTimeout(() => setTxt(cur.slice(0, txt.length + 1)), typeMs);
      else t = setTimeout(() => setPhase("hold"), 50);
    } else if (phase === "hold") {
      t = setTimeout(() => setPhase("erase"), holdMs);
    } else {
      if (txt.length > 0) t = setTimeout(() => setTxt(txt.slice(0, -1)), eraseMs);
      else {
        setI(i + 1);
        setPhase("type");
      }
    }
    return () => clearTimeout(t);
  }, [txt, phase, i, lines, typeMs, holdMs, eraseMs]);
  return txt;
}

function useClock() {
  const [t, setT] = useState<Date | null>(null);
  useEffect(() => {
    setT(new Date());
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}
function syl(t: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
    hour12: false,
  }).format(t);
}

export default function Terminal() {
  const now = useClock();
  const [history, setHistory] = useState<Line[]>([
    { id: 0, kind: "sys", text: "ask-shawon v1.0 — type anything about me, or /help." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [convo, setConvo] = useState<ChatTurn[]>([]);
  const [streaming, setStreaming] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(1);
  const tagline = useTyper(TAGLINES);

  const push = useCallback((kind: Kind, text: string) => {
    setHistory((h) => [...h, { id: idRef.current++, kind, text }]);
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [history, busy, streaming]);

  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    focus();
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === "INPUT") return;
      if (e.key === "/" || (e.key.length === 1 && !e.metaKey && !e.ctrlKey)) focus();
      if (e.ctrlKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setHistory([]);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", focus);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", focus);
    };
  }, []);

  const submit = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q || busy) return;
      push("user", q);

      if (q === "/help") {
        push("sys", "commands: /help · /clear · /contact · /resume · /projects · /stack · /links");
        return;
      }
      if (q === "/clear") {
        setHistory([]);
        return;
      }
      if (q === "/contact") {
        push("ai", "email: shawon.majid@gmail.com\nphone: +880 1729 379229\nbased: Sylhet, Bangladesh");
        return;
      }
      if (q === "/links") {
        push("ai", "• github.com/shawon-majid\n• linkedin.com/in/shawon-majid\n• facebook.com/shawon.majid");
        return;
      }
      if (q === "/resume") {
        push("ai", "→ opening resume PDF in a new tab");
        window.open("/uploads/Shawon-Majid-FlowCV-Resume-20260214.pdf", "_blank");
        return;
      }
      if (q === "/projects") {
        push(
          "ai",
          "featured:\n• Conversation Insights (Vyg.ai) — 2.5k conversations/day, prod\n• DeepAgents (Indigo) — LangGraph meeting assistant\n• Re:elify — text → video reels (1st runner-up CSE Carnival '24)\n• EcoSync — waste mgmt for Dhaka City Corp (Code Samurai '24 champion)\n• Budget AI — NL expense tracker",
        );
        return;
      }
      if (q === "/stack") {
        push(
          "ai",
          "TypeScript · Python · LangGraph · LangChain · OpenAI · AWS (SST) · GCP · Pulumi · Kubernetes · Postgres · Redis · Qdrant · Next.js",
        );
        return;
      }

      setBusy(true);
      setStreaming("");
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, history: convo }),
        });
        if (!res.ok || !res.body) throw new Error(`status ${res.status}`);
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let acc = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = dec.decode(value, { stream: true });
          acc += chunk;
          setStreaming(acc);
        }
        const clean = acc.trim() || localAnswer(q);
        setStreaming("");
        push("ai", clean);
        setConvo((c) => [...c, { role: "user", content: q }, { role: "assistant", content: clean }]);
      } catch {
        setStreaming("");
        const fallback = localAnswer(q);
        push("ai", fallback);
        setConvo((c) => [...c, { role: "user", content: q }, { role: "assistant", content: fallback }]);
      } finally {
        setBusy(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [busy, convo, push],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !busy) {
      e.preventDefault();
      const v = input;
      setInput("");
      submit(v);
    }
  };

  const fillChip = (q: string) => {
    if (busy) return;
    setInput("");
    submit(q);
  };

  return (
    <div className="app">
      <header className="bar">
        <div className="brand">
          <span className="sq" /> shawon.majid
        </div>
        <nav className="bar-links">
          <a href="https://github.com/shawon-majid" target="_blank" rel="noreferrer">github</a>
          <a href="https://linkedin.com/in/shawon-majid" target="_blank" rel="noreferrer">linkedin</a>
          <a href="mailto:shawon.majid@gmail.com">email</a>
          <a href="/uploads/Shawon-Majid-FlowCV-Resume-20260214.pdf" target="_blank">resume</a>
        </nav>
        <div className="bar-meta">
          <span className="pulse">
            <i /> open to work
          </span>
          <span suppressHydrationWarning>{now ? `${syl(now)} · SYL` : "—— · SYL"}</span>
        </div>
      </header>

      <main className="stage">
        <div className="term">
          <div className="term-hd">
            <div className="dots">
              <i />
              <i />
              <i />
            </div>
            <div className="term-title">
              ask-shawon — <b>~/portfolio</b> — zsh
            </div>
            <div className="term-model">
              <span className="dotlive" /> gpt-4o-mini
            </div>
          </div>

          <div className="term-body" ref={bodyRef}>
            <div className="line banner">
              <span className="ps">◆</span>
              <span className="who">shawon</span>
              <span className="t">
                {tagline}
                <span className="cur" />
              </span>
            </div>
            {history.map((h) => {
              if (h.kind === "user")
                return (
                  <div className="line user" key={h.id}>
                    <span className="ps">❯</span>
                    <span className="who">you</span>
                    <span className="t">{h.text}</span>
                  </div>
                );
              if (h.kind === "sys")
                return (
                  <div className="line sys" key={h.id}>
                    <span className="ps">·</span>
                    <span className="who">sys</span>
                    <span className="t">{h.text}</span>
                  </div>
                );
              if (h.kind === "err")
                return (
                  <div className="line err" key={h.id}>
                    <span className="ps">!</span>
                    <span className="who">err</span>
                    <span className="t">{h.text}</span>
                  </div>
                );
              return (
                <div className="line ai" key={h.id}>
                  <span className="ps">◆</span>
                  <span className="who">shawon</span>
                  <span className="t">{h.text}</span>
                </div>
              );
            })}
            {busy && (
              <div className="line ai">
                <span className="ps">◆</span>
                <span className="who">shawon</span>
                <span className="t">
                  {streaming ? (
                    streaming
                  ) : (
                    <span className="typing">
                      <i />
                      <i />
                      <i />
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          <form className="term-input" onSubmit={(e) => e.preventDefault()}>
            <span className="ps">❯</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={busy ? "thinking…" : "ask me anything  —  or /help"}
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
            />
          </form>
        </div>

        <div className="hints">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => fillChip(s)}>
              {s}
            </button>
          ))}
        </div>
      </main>

      <footer className="foot">
        <span>built with next.js · react · openai</span>
        <span className="keys">
          <kbd>/</kbd> focus <kbd>Ctrl</kbd>+<kbd>L</kbd> clear <kbd>↵</kbd> send
        </span>
        <span suppressHydrationWarning>© {new Date().getFullYear()} shawon majid</span>
      </footer>
    </div>
  );
}
