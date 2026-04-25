# portfolio-shawon

Terminal-first personal portfolio + AI "ask-shawon" chat, with an admin panel for uploading PDFs / notes as additional grounding for the AI.

## Stack

- Next.js 15 (App Router, TS, Node runtime; ask flow runs as a Server Action so there is no public `/api/ask` URL)
- OpenAI streaming chat completions, model is admin-configurable at runtime
- `ai/rsc` `createStreamableValue` to stream tokens out of the server action
- `@vercel/blob` for the knowledge base (raw uploads + parsed text sidecars + a manifest JSON)
- `unpdf` for serverless-friendly PDF text extraction
- HTTP Basic middleware guard on `/admin*` and `/api/admin/*`

## Local dev

```bash
pnpm install
cp .env.example .env.local
# fill in OPENAI_API_KEY, BLOB_READ_WRITE_TOKEN (optional locally), ADMIN_USER, ADMIN_PASS
pnpm dev
```

Visit `http://localhost:3000`. Admin is at `/admin` (defaults to `admin` / `admin`).

## Env vars

| Name                    | Required | Notes                                          |
| ----------------------- | -------- | ---------------------------------------------- |
| `OPENAI_API_KEY`        | yes      | Server-side only. Never shipped to the browser. |
| `OPENAI_MODEL`          | no       | Defaults to `gpt-4o-mini`.                     |
| `BLOB_READ_WRITE_TOKEN` | yes\*    | Required for admin uploads. Auto-injected on Vercel when a Blob store is attached. |
| `ADMIN_USER`            | no       | Defaults to `admin`.                           |
| `ADMIN_PASS`            | no       | Defaults to `admin`. **Change this.**          |

## Deploy

```bash
vercel --cwd . --scope shawonmajids-projects
# set env vars (do NOT echo the key):
vercel env add OPENAI_API_KEY production
# paste when prompted
vercel --prod
```

## Knowledge base

Uploads are parsed to plain text and stored in Vercel Blob as:

- `kb/raw/{id}.{ext}` — original file
- `kb/text/{id}.txt` — extracted text
- `kb/manifest.json` — entries index (read by the AI every 60s)

On each `ask` server-action call the system prompt concatenates `PROFILE` (hard-coded in `lib/profile.ts`) + up to 60k chars of uploaded text, then streams the OpenAI response token-by-token to the terminal.

## Admin runtime settings

`/admin` exposes a settings panel that writes a `settings/manifest-*.json` blob to Vercel Blob (same pattern as the KB manifest). Controls:

- AI ask kill switch (disable globally without redeploy)
- OpenAI model (free-text + suggestion list)
- Per-IP per-hour rate limit (presets 10 / 20 / 50 / 100, custom integer, or unlimited)
- Rotating typing headlines at the top of the terminal
- Status badge mode + label (open to work / busy / offline / custom)

Settings are cached in-process for 60s; reload the home page to pick up changes.
