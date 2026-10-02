---
name: verify
description: Build, run, and drive LockIn locally to verify changes end-to-end (embedded Postgres + headless Chrome).
---

# Verifying LockIn changes

## Build / typecheck
```bash
npx tsc --noEmit
pnpm build           # prisma generate + next build
```

## Database
Fresh clones have **no `.env` / `.env.local`** (gitignored) — the app cannot reach
the real Supabase DB. Boot a throwaway Postgres instead (no Docker/psql on this
machine):

```bash
# in a scratch dir:
npm i embedded-postgres
node -e '…'   # see pg.mjs pattern: initialise(), start(), createDatabase("lockin"), port 54321
DATABASE_URL="postgresql://postgres:postgres@localhost:54321/lockin" \
DIRECT_URL="postgresql://postgres:postgres@localhost:54321/lockin" npx prisma db push
```

## Run the app
Pass env inline — do NOT create `.env` files in the repo:

```bash
DATABASE_URL=… DIRECT_URL=… AUTH_SECRET=x NEXTAUTH_SECRET=x \
NEXTAUTH_URL=http://localhost:3001 npx next dev --turbopack -p 3001
```

Create a user via `POST /api/register` (`{email, password≥8}`), then log in.

## Drive the API (curl)
NextAuth credentials login for a cookie jar:
```bash
CSRF=$(curl -s -c jar http://localhost:3001/api/auth/csrf | jq -r .csrfToken)
curl -b jar -c jar -X POST http://localhost:3001/api/auth/callback/credentials \
  --data-urlencode "csrfToken=$CSRF" --data-urlencode "email=…" \
  --data-urlencode "password=…" --data-urlencode "json=true"
```
Then hit `/api/subjects`, `/api/tasks`, etc. with `-b jar`.

## Drive the GUI
No Playwright browsers installed; use `playwright-core` + system Chrome:
```js
const browser = await chromium.launch({ channel: "chrome", headless: true });
```
- Login form: `input[type=email]`, `input[type=password]`, submit → waits for `/`.
- Theme: set `localStorage.theme` to `"light"`/`"dark"` and reload, or click the
  spine's "Light paper"/"Dark paper" button. The default is `system`.
- The spine is `aside[aria-label="Notebook spine"]`; below `md` it lives in a
  sheet opened by the "Open the notebook spine" button.
- Subject page: `/subjects/<id>` is the Notes tab; `?note=<id>` opens a note,
  `?tab=plan` / `?tab=resources` the other tabs. Old `?open=milestone:<id>`
  links redirect to `?note=`, `?open=task:` / `?open=subtask:` to Plan.
- Notes: create through `#new-note` (Enter); the new note opens in the editor
  (`.cm-editor`). The note page's "Edit" button opens it for existing notes.
- Inbox: `/inbox`. `POST /api/milestones` without `subjectId` files there;
  `source: "claude-code"` makes an agent note that waits for "Witness".
- Simulate slow network via CDP `Network.emulateNetworkConditions` to see
  optimistic UI vs server reconcile; block a route with `page.route` to check
  a failed save reopens the editor with the text.

## Gotchas
- Turbopack dev can serve a **stale root layout per-route** after editing
  `app/layout.tsx` — restart the dev server before trusting font/class probes.
- `page.keyboard.type` of multi-line markdown fights the editor's list
  auto-continue; set notes via `PUT /api/milestones/[id]` when you need
  well-formed content for rendering checks.
- Headless Chrome won't open a window narrower than ~500px, so a 390px
  `--window-size` screenshot is really ~500px wide and looks clipped. Use a
  Playwright context with `viewport: { width: 390 }`, or frame the page in a
  390px iframe.
- Full-page screenshots cut the sticky spine off at viewport height. That's
  the capture, not the layout.
- Prisma 6.11 batches same-tick `findUnique` calls; with
  `relationLoadStrategy: "join"` the batched query panics ("Option::unwrap()
  on a None value"). Use `findFirst` for join-strategy loads.
- Flows worth driving: create a note (URL gets the real id, editor opens),
  add task/subtask on Plan (row must appear instantly), note ▲▼ reorder on
  Plan, move a note between sections (its tasks follow), witness an agent
  note, complete a recurring task (next occurrence keeps its position), the
  reader on the Resources tab, notes edit/preview/save in BOTH themes.

## MCP server
- Create a token with `POST /api/tokens {name}` (cookie session); the response
  carries `secret` once. Its name becomes the `source` on saved notes.
- Drive `/api/mcp` with the real client from the repo's node_modules:
  `@modelcontextprotocol/sdk/client/index.js` + `client/streamableHttp.js`,
  `requestInit: { headers: { Authorization: "Bearer <secret>" } }`.
- Without `INGEST_URL`, `search_notes` answers "by keyword" only; that's the
  intended fallback, not a failure.
