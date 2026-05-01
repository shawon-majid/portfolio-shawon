# portfolio-shawon

Terminal-first personal portfolio + AI "ask-shawon" chat, with an admin panel for uploading PDFs / writing markdown notes as additional grounding for the AI.

## Stack

- Next.js 15 (App Router, TS, Node runtime; ask flow runs as a Server Action so there is no public `/api/ask` URL)
- [OpenRouter](https://openrouter.ai) streaming chat completions via `@openrouter/sdk`, model is admin-configurable at runtime
- `ai/rsc` `createStreamableValue` to stream tokens out of the server action
- `@vercel/blob` for the knowledge base (raw uploads + parsed text sidecars + a manifest JSON)
- `unpdf` for serverless-friendly PDF text extraction
- HTTP Basic middleware guard on `/admin*` and `/api/admin/*`

## Local dev

```bash
pnpm install
cp .env.example .env.local
# fill in OPENROUTER_API_KEY, BLOB_READ_WRITE_TOKEN (optional locally), ADMIN_USER, ADMIN_PASS
pnpm dev
```

Visit `http://localhost:3000`. Admin is at `/admin` (defaults to `admin` / `admin`).

## Env vars

| Name                    | Required | Notes                                          |
| ----------------------- | -------- | ---------------------------------------------- |
| `OPENROUTER_API_KEY`    | yes      | Server-side only. Never shipped to the browser. |
| `OPENROUTER_MODEL`      | no       | Defaults to `openrouter/free` (free-model auto-router). |
| `OPENROUTER_REFERER`    | no       | Sent as `HTTP-Referer` for OpenRouter attribution. |
| `OPENROUTER_APP_TITLE`  | no       | Sent as `X-OpenRouter-Title`. Defaults to `ask-shawon`. |
| `BLOB_READ_WRITE_TOKEN` | yes\*    | Required for admin uploads. Auto-injected on Vercel when a Blob store is attached. |
| `ADMIN_USER`            | no       | Defaults to `admin`.                           |
| `ADMIN_PASS`            | no       | Defaults to `admin`. **Change this.**          |

## Deploy

```bash
vercel --cwd . --scope shawonmajids-projects
# set env vars (do NOT echo the key):
vercel env add OPENROUTER_API_KEY production
# paste when prompted
vercel --prod
```

## Knowledge base

The AI is grounded by two sources:

1. **Uploaded docs** (PDF / markdown / plain text) — parsed to text and stored in Vercel Blob as:
   - `kb/raw/{id}.{ext}` — original file
   - `kb/text/{id}.txt` — extracted text
2. **Inline notes** — markdown written/edited directly in the admin panel. Stored as the same `kb/raw/{id}.md` + `kb/text/{id}.txt` pair, but flagged `editable: true` in the manifest so the UI shows them in the notes section.

A single `kb/manifest-*.json` blob lists all entries; on each `ask` server-action call the system prompt concatenates `PROFILE` (hard-coded in `lib/profile.ts`) + up to 60k chars of knowledge text, then streams the OpenRouter response token-by-token.

## Admin runtime settings

`/admin` exposes:

- **Runtime settings** — AI kill switch, OpenRouter model id (with suggestions), per-IP per-hour rate limit, status badge, rotating typing headlines.
- **Notes** — multi-entry markdown editor. Create / expand / edit / save / delete inline. No file roundtrip.
- **Upload** — drag-drop PDF / txt / md (max 10 MB, 20 docs combined with notes).

Settings & manifest are cached in-process for 60s; reload the home page to pick up changes.
