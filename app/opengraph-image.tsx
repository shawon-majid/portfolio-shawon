import { ImageResponse } from "next/og";

// Branded social-share card (1200×630). Next auto-wires this to og:image and,
// via the twitter metadata in layout.tsx, to the Twitter card too.
export const runtime = "nodejs";
export const alt = "Shawon Majid — Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0c0c0a";
const BG2 = "#131311";
const INK = "#e9e6db";
const INK2 = "#c4c0b0";
const MUTED = "#6f6a5c";
const ACCENT = "#e24a1a";
const RULE = "#2e2c25";

const TITLE = "ask-shawon — ~/portfolio — zsh";
const NAME = "Shawon Majid";
const TAGLINE = "Software Engineer · AI-augmented backends · serverless infra";
const PROMPT = "> open to senior backend & AI-engineering roles";
const SITE = "shawonmajid.com";

/** Fetch a truetype subset of JetBrains Mono from Google Fonts. Returns null
 *  on any failure so the image still renders in a fallback font. */
async function loadMono(text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const mono = await loadMono([TITLE, NAME, TAGLINE, PROMPT, SITE].join(" "));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
          backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(226,74,26,0.10), transparent 60%)`,
          padding: 64,
          fontFamily: mono ? "JetBrains Mono" : "monospace",
        }}
      >
        <div
          style={{
            width: 1040,
            display: "flex",
            flexDirection: "column",
            borderRadius: 18,
            border: `1px solid ${RULE}`,
            background: `linear-gradient(180deg, ${BG2}, #100f0d)`,
            boxShadow: "0 40px 80px -30px rgba(0,0,0,0.8)",
            overflow: "hidden",
          }}
        >
          {/* window header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "20px 26px",
              borderBottom: `1px solid ${RULE}`,
            }}
          >
            <div style={{ display: "flex", gap: 9 }}>
              <div style={{ width: 15, height: 15, borderRadius: 8, background: "#ff5f57" }} />
              <div style={{ width: 15, height: 15, borderRadius: 8, background: "#febc2e" }} />
              <div style={{ width: 15, height: 15, borderRadius: 8, background: "#28c840" }} />
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center", color: MUTED, fontSize: 22 }}>
              {TITLE}
            </div>
            <div style={{ width: 45 }} />
          </div>

          {/* body */}
          <div style={{ display: "flex", flexDirection: "column", padding: "56px 56px 60px" }}>
            <div style={{ display: "flex", marginBottom: 30 }}>
              <div style={{ width: 22, height: 22, background: ACCENT }} />
            </div>
            <div style={{ display: "flex", color: INK, fontSize: 92, fontWeight: 500, letterSpacing: -2 }}>
              {NAME}
            </div>
            <div style={{ display: "flex", color: INK2, fontSize: 30, marginTop: 18 }}>{TAGLINE}</div>
            <div style={{ display: "flex", color: ACCENT, fontSize: 26, marginTop: 40 }}>{PROMPT}</div>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 40, right: 56, display: "flex", color: MUTED, fontSize: 22 }}>
          {SITE}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: mono
        ? [{ name: "JetBrains Mono", data: mono, weight: 500 as const, style: "normal" as const }]
        : undefined,
    },
  );
}
