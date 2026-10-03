# LockIn

The open-source notebook your AI tools write to.

You learn things inside Claude, Codex and Cursor every day, and most of it is gone when the session ends. LockIn keeps it. Your agents save notes into it over MCP, you file them by subject, and any model you choose answers questions from them.

- **Notes by subject.** Markdown with code, plus the PDFs and links you're reading, filed under the subject they belong to.
- **Agents write here.** Claude Code, Codex, Cursor or any MCP client can save, search and read your notes. Everything an agent saves says who recorded it and waits for you to witness it.
- **Ask your notes.** Chat with a model in your browser (WebGPU), on your own machine (Ollama, LM Studio), or from Anthropic, OpenAI, Gemini or OpenRouter with your own key. Answers cite the pages of your notes they came from.
- **Read without distraction.** Any note opens full screen.
- **A plan when you want one.** Tasks, focus time, exam pace and spaced revision live in each subject's Plan tab, out of the way until you need them.
- **Yours.** AGPL-3.0, self-hostable with one command, and everything exports to Markdown or JSON.

## Self-hosting

You need Docker with Compose.

```bash
git clone https://github.com/Sky-walkerX/LockIn.git && cd LockIn
cp .env.example .env
# set AUTH_SECRET in .env:  openssl rand -base64 32
docker compose up -d
```

Open http://localhost:3000 and create an account. The first start builds the image, waits for Postgres and applies the database migrations before the app starts.

What runs:

| Service | What it does |
|---|---|
| `db` | Postgres 17. Data in the `db` volume. |
| `migrate` | Applies migrations (`prisma migrate deploy`) and exits. |
| `app` | LockIn on port 3000. Note images and PDFs are stored in the `uploads` volume. |
| `ingest` | Optional. PDF and web-page text extraction plus server-side embeddings. |

To add text extraction and server-side embeddings, set `INGEST_SECRET` (any long random string) and `INGEST_URL=http://ingest:8080` in `.env`, then:

```bash
docker compose --profile ingest up -d
```

The ingest image carries its embedding model, so it's about 1 GB. Without it, keyword search works, and the browser does embeddings itself.

To update, pull and rebuild. Migrations run on start:

```bash
git pull && docker compose up -d --build
```

Settings in `.env`:

| Variable | |
|---|---|
| `AUTH_SECRET` | Required. Signs sessions and upload links. |
| `PUBLIC_URL` | The address people open LockIn at. Default `http://localhost:3000`. |
| `LOCKIN_PORT` | Host port. Default `3000`. |
| `POSTGRES_PASSWORD` | Password for the bundled Postgres. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional. "Continue with Google" appears only when both are set. |
| `INGEST_URL`, `INGEST_SECRET` | Optional. See above. |

Put a reverse proxy (Caddy, nginx, Traefik) in front for HTTPS, and set `PUBLIC_URL` to the public address.

## Connect your agents (MCP)

LockIn runs an MCP server at `/api/mcp` (Streamable HTTP). In LockIn, open **Settings → Connect your agents**, create a token named after the agent, and copy the setup it shows. For Claude Code:

```bash
claude mcp add --transport http lockin https://your-lockin/api/mcp \
  --header "Authorization: Bearer lk_pat_…"
```

Settings also shows the Codex (`~/.codex/config.toml`) and Cursor (`~/.cursor/mcp.json`) versions.

Tools:

| Tool | |
|---|---|
| `list_subjects` | Subjects and how many notes each has, plus the Inbox. |
| `search_notes` | By meaning when the ingest service runs, and always by keyword. Notes and resources come with their page. |
| `get_note` | One note, task or subtask in full by its id. A note comes with its plan: tasks, their notes and nested subtasks. |
| `get_plan` | A subject's whole plan: each note's tasks and subtasks with what's done, plus tasks under no note. |
| `save_note` | A new note under a named subject. With no subject, or one that doesn't exist, it goes to the Inbox. |
| `append_to_note` | Adds to the end of a note. Never replaces anything. On a note the same agent recorded it just continues it; on anyone else's it goes under a dated "From Codex" line. |
| `edit_note` | Retitles a note, or replaces one exact passage in it. Only notes that agent recorded; yours stay append-only. The note goes back to "To witness". |
| `move_note` | Files a note under another subject, or the Inbox. Its tasks go with it. |
| `add_task` | A task under a note, or in a subject's tasks that aren't under a note. |
| `add_subtask` | A subtask under a task, or under one of its top-level subtasks. |
| `update_plan_item` | Ticks a task or subtask done or not done, renames it, or adds to its notes. Completing a recurring task schedules the next one. |

Agents can't delete anything.

Each agent gets its own token. Its notes are stamped with the token's name, and you can revoke one without touching the others. Only a hash of each token is stored. A token can make 60 requests a minute; past that it gets `429` with `Retry-After`.

**Claude.ai, ChatGPT and other apps that sign in** don't need a token. Add a custom connector with the URL `https://your-lockin/api/mcp`; the app sends you to LockIn to sign in and allow it. LockIn is its own OAuth 2.1 server for this (PKCE, Client ID Metadata Documents and dynamic registration, rotating refresh tokens), so it works the same self-hosted. Connected apps are listed in Settings, where you can disconnect them.

## Ask (⌘J)

Ask runs the model in your browser, on your machine, or at a provider with your own key. LockIn's server builds the prompt from your notes and stores the transcript, but never sees your endpoint or API key: the browser calls the model directly. Keep several connections and pick one at the top of Ask.

- **Your own key:** Anthropic, OpenAI, Gemini or OpenRouter. The key stays in this browser. Questions, and the notes used to answer them, go from the browser to that provider. Note autocomplete only runs on local and in-browser models.

- **In browser:** WebLLM on WebGPU. Pick a model in Ask's settings and download it once; the browser caches it. Needs recent Chrome or Edge.
- **Local server:** any OpenAI-compatible server (Ollama, LM Studio, llama.cpp, vLLM). The browser calls it directly, so it has to allow LockIn's origin:

```bash
OLLAMA_ORIGINS=https://your-lockin ollama serve
# macOS app: launchctl setenv OLLAMA_ORIGINS "https://your-lockin", then restart Ollama
```

Running both on localhost needs no configuration.

When your notes outgrow one prompt, Ask stops trimming and starts searching: notes are chunked and embedded (by the ingest service, or in the browser), and a question gets an outline of the subject plus the passages that score as relevant.

Every note and saved resource has a page number in the notebook. The model sees each one labelled with its page and cites it like `[p. 12]`; in the reply that's a link to the note. Under each answer, **From your notebook** lists the passages it used and the pages it cited. A citation of a passage opens the note scrolled to it, with the passage marked.

## Development

```bash
pnpm install
pnpm dev             # http://localhost:3000
pnpm test            # vitest
pnpm lint            # eslint
pnpm build           # prisma generate && next build
pnpm db:migrate      # prisma migrate deploy
```

Environment for development (`.env` for the Prisma CLI and `.env.local` for the app):

```
DATABASE_URL=     # Postgres, runtime. Supabase: transaction pooler (:6543, pgbouncer=true)
DIRECT_URL=       # Postgres, migrations. Supabase: session pooler (:5432, no pgbouncer params)
AUTH_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=     # e.g. http://localhost:3000
```

Optional: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `INGEST_URL` / `INGEST_SECRET`, and `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` to store uploads in Supabase Storage instead of `./storage`.

`DIRECT_URL` must not be a copy of `DATABASE_URL` on Supabase: pgbouncer in transaction mode can't run DDL, and migrations hang instead of failing.

`AUTH_SECRET` is not optional. NextAuth's own routes fall back to an internal secret, so sign-in appears to work without it, but every API route reads the JWT with `getToken` and returns 401.

**Schema changes** go through migrations: edit `prisma/schema.prisma`, then `pnpm exec prisma migrate dev --name what-changed`. A database that was set up with `db push` before migrations existed is marked at the baseline once (`pnpm exec prisma migrate resolve --applied 0001_baseline`) and migrates normally after that.

The Prisma client is generated into `app/generated/prisma/` (not committed) by `pnpm build`, or on its own with `pnpm exec prisma generate`.

### Data model

`User ──< Subject ──< Milestone ──< Task ──< Subtask`, with `Subject ──< Resource`, `User ──< ApiToken`, `User ──< OAuthGrant ──< OAuthToken` (apps that signed in) and the chat and embedding tables beside them.

A note is stored as a `Milestone` row (its title and `notes` markdown), and a subject's Plan tasks can hang off it. The Inbox is a `Subject` with `isInbox`. `Milestone.source` records who wrote a note ("web", or an agent's name), and `witnessedAt` records when the user signed off on an agent's note.

### Design

`PRODUCT.md` is the product brief and `DESIGN.md` the design system (the Lab Book look: cloth spine, grid paper, clean reading pages).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Report security issues privately, as [SECURITY.md](SECURITY.md) describes.

## License

[AGPL-3.0-or-later](LICENSE). You can use, change and self-host LockIn freely. If you run a modified version as a service for others, you have to publish your changes.
