# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project direction — "LockIn" rebrand (in progress)

This repo is mid-rebrand from an AI-wrapper todo app into **LockIn**, a **personal study & resource hub** organized around Subjects. It is *not* an AI generator — the user is the brain; the app is the shelf + planner. Single user per account.

**Product name:** **LockIn** (decided 2026-06-22; old identities were "PlanWise" / `todo` in package.json — package name not yet changed).

**The product:** the central unit is a **Subject** (e.g. "Operating Systems", "GATE Prep"). Each subject holds:
- **A plan** — an ordered list of **Milestones** (phases), each with markdown `notes`, individually checkable/reorderable. Each milestone holds a checklist of **Tasks**. One level of nesting only.
- **Resources** — saved URLs only (no file uploads in v1): web links, AI chat links (Claude/Gemini/ChatGPT), book/PDF references.

A cross-subject **Today** view surfaces tasks due/overdue across all subjects.

> Full design spec: [docs/superpowers/specs/2026-06-22-study-hub-rebrand-design.md](docs/superpowers/specs/2026-06-22-study-hub-rebrand-design.md)

### Progress

**Done & verified live (both modes, against the new DB):**
- **Backend**: schema rewritten (`Todo`→`Task`, gamification/`Suggestion` removed); new API routes (`subjects`, `milestones`, `resources`, `tasks` + `tasks/bulk`, `tasks/[id]/timer`); new hooks (`useSubjects`, `useMilestones`, `useResources`, `useTasks`/`useTodayTasks`) on `lib/fetcher.ts` + `lib/auth.ts`. Dead Gemini/gamification/spotify code deleted.
- **Database is LIVE** — new Supabase project (ap-south-1); schema applied via `npx prisma db push` (see Database).
- **Two-mode design system** (`app/globals.css`) — Creative (light, neobrutalist) + Focus (dark, editor). See "Two modes" under Architecture.
- **Layout + Navbar** rebuilt (fonts, LockIn metadata, Creative⇄Focus toggle).
- **Home** done: `app/page.tsx` + `app/components/home/{subject-card,today-panel,new-subject}.tsx`. Verified end-to-end (signup→login→create subject/milestone/task→completion→progress + Today/overdue).
- **Subject page** done & verified live (both modes): `app/subjects/[id]/page.tsx` + `app/components/subject/{subject-header,milestone-section,milestone-item,task-row,add-task,resource-section,resource-item,new-resource,markdown}.tsx`. Header (edit/archive/delete via popovers) + plan (milestones: complete, inline rename, reorder via order-swap up/down, delete; markdown `notes` view/edit) + task checklists (subject-tinted checkboxes, inline edit popover for title/priority/due) + loose tasks + resources (typed: LINK/AI_CHAT/PDF/BOOK). `react-markdown` + `remark-gfm` installed; `@google/generative-ai` removed from node_modules.
- **Analytics** done (`/analytics`): `app/components/analytics-page.tsx` + `analytics/{stats-card,heatmap}.tsx`; hooks `use-analytics`/`use-activity-heatmap` rewired off `useTasks()` (study stats — completions, streaks, focus minutes, weekly chart, GitHub-style heatmap, per-subject progress; XP/levels/pomodoro gamification dropped).
- **Focus timer** done (`/focus`): `app/components/timer.tsx` (Pomodoro/stopwatch, logs time via `POST /api/tasks/[id]/timer` start/stop) + `app/focus/page.tsx`; "Focus" added to Navbar.
- **Auth pages** restyled + rebranded to LockIn (`login`/`signup`/`forgot-password` + shared `app/components/auth-shell.tsx`); `package.json` name → `lockin`, README rewritten, dead `Dashboard.tsx` deleted.
- **Whole project is `tsc`-clean and `npm run build` passes.** First UI commit landed on branch `feat/lockin-study-hub-ui`.

**Remaining (polish, optional):**
- `/api/forgot-password` route doesn't exist — the forgot-password form posts to it and shows an error; wire it up if password reset is wanted.
- Google OAuth redirect URI must match the running port (`NEXTAUTH_URL`); dev port floats (3000→3001→3002) when busy.

## Commands

```bash
npm run dev      # Next 16 + Turbopack. Port 3000 is taken by another app ("SkillSwap") → LockIn dev runs on 3001
npm run build    # `prisma generate` then `next build`
npm run start    # serve the production build
npm run lint     # next lint

npx prisma generate   # regenerate client into app/generated/prisma (see Database)
npx prisma db push    # sync schema to the DB (used instead of migrate — Supabase pooler can't make migrate's shadow DB)
npx prisma studio
```

Test account (seeded demo data): `test@lockin.dev` / `lockin1234`.

No test runner is configured (no framework, scripts, or test files). Verify changes via `npx tsc --noEmit`, `npm run build`, and manual runs.

## Architecture

Next.js **16.2.2** (App Router) + React 19 + TypeScript, Prisma 6 + PostgreSQL, NextAuth v4 (JWT), TanStack React Query, shadcn/ui (new-york) + Tailwind v4 + next-themes. (package.json still pins `next@15.3.8`, but node_modules resolved 16.2.2 via the security bumps; dynamic route `params` is a Promise — handled. `middleware.ts` shows a "use proxy instead" deprecation warning under 16.)

### Two modes (the theme toggle is a personality switch)
`next-themes` (class strategy, **default `dark`**) drives **one component tree, two looks** via tokens in `app/globals.css`:
- **Creative** (`:root`, light) — neobrutalist: cream bg, thick black borders, hard offset shadows, Archivo + Space Mono, **bold** per-subject colors, yellow Today block.
- **Focus** (`.dark`) — editor/tiling-wm calm: near-black, hairline borders, no shadows, JetBrains Mono, **softened** subject colors (`color-mix`), `//`-comment section labels, line-numbered Today list, a vim statusline.

Key tokens: `--lk-bw` (border width), `--lk-shadow`, `--lk-font-{display,body,mono}`, `--lk-hero-bg`; the shadcn semantic tokens (`--background`/`--foreground`/`--accent`=lime/…) are remapped to LockIn values so shadcn primitives stay on-theme. Per-subject color: set `style={{ "--c": hex } as React.CSSProperties}` on a `.lk-subject` element (Focus auto-softens it). Helper classes: `.lk-card/.lk-hero/.lk-bar/.lk-pill/.lk-swatch/.lk-sec/.lk-statusbar/.lk-pct/.lk-display/.lk-mono`. Fonts loaded in `layout.tsx` via `next/font` (`--font-archivo/-hanken/-space-mono/-jetbrains`).

### Data model (`prisma/schema.prisma`)
`User ──< Subject ──< Milestone ──< Task ──< TimerSession`, and `Subject ──< Resource`.
- **Subject**: `title`, `description?`, `color?`, `isArchived`; has many milestones/resources/tasks.
- **Milestone**: `title`, `notes` (markdown, default `""`), `order` (manual sort), `isCompleted`; has many tasks. Progress is derived (% of its tasks done), not stored.
- **Task** (renamed from `Todo`): `subjectId` **required**, `milestoneId` **optional** (a task can sit directly on a subject). Has `priority`, `dueDate?`, `estimatedTime?`, `timeSpent?`, `completedAt?`.
- **Resource**: `type` (`LINK`/`AI_CHAT`/`PDF`/`BOOK`), `url`, `title`, `note?`.
- **TimerSession**: `taskId`, `startedAt`, `endedAt?`, `duration?` (minutes).
- Enums: `Priority`, `ResourceType`. `onDelete`: cascade down the tree; deleting a milestone sets its tasks' `milestoneId` to null (SetNull).

### API routes (`app/api/*`)
All follow one pattern: `const userId = await getUserId(request)` (from `lib/auth.ts`, reads the NextAuth JWT `sub`) → 401 if null → Zod-validate the body → Prisma scoped to the user.
- **Ownership scoping:** `Subject`/`Task`/`Resource` carry `userId`, so writes use `updateMany`/`deleteMany` with `where: { id, userId }` (404 if `count === 0`). `Milestone` has no `userId` — it is scoped through its subject: `findFirst({ where: { id, subject: { userId } } })`.
- **Routes:** `/api/subjects` (+`[id]`), `/api/milestones` (+`[id]`), `/api/resources` (+`[id]`), `/api/tasks` (+`[id]`, `/bulk`, `/[id]/timer`).
- `GET /api/subjects` returns a progress DTO (`totalTasks`/`completedTasks`). `GET /api/subjects/[id]` returns the full subject (milestones→tasks, loose tasks, resources).
- `GET /api/tasks` filters: `?subjectId`, `?milestoneId`, or `?today=true` (incomplete, due ≤ end of today, with subject info).
- `POST /api/tasks/[id]/timer` with `{ action: "start" | "stop" }`; stop closes the open session, computes minutes, and increments `Task.timeSpent` in a transaction.
- Dynamic routes use the **Next.js 15 async params** signature: `{ params }: { params: Promise<{ id: string }> }` then `const { id } = await params`.
- **Kept:** `/api/auth/[...nextauth]`, `/api/register`.

### Data layer (`hooks/*`)
React Query hooks built on `lib/fetcher.ts` (the `api` helper sends `credentials: "include"` + JSON; `asJson` throws the API error message). Query keys: `["subjects"]`, `["subject", id]`, `["tasks", params]`, `["resources", subjectId]`. Mutations invalidate the affected keys (a task change invalidates `tasks`, `subjects`, and `subject`).
- **New:** `useSubjects`/`useSubject`, `useMilestones`, `useResources`, `useTasks`/`useTodayTasks` (+ create/update/delete + `useTaskTimer`).
- **Analytics:** `use-analytics` (study `StudyStats`) and `use-activity-heatmap` (`HeatmapDay[]`) now derive from `useTasks()` via `useMemo` (no separate fetch, no gamification).

### Auth (kept)
NextAuth v4, `jwt` strategy, in `lib/authOptions.ts`. Google OAuth + Credentials (bcrypt). **No PrismaAdapter** — the `signIn` callback manually upserts Google users. Secret env var is `AUTH_SECRET`. Route protection is per-route via `getUserId`/`token.sub`; `middleware.ts` only nominally guards `/profile/*`.

### Database (Prisma + PostgreSQL)
- **The Prisma client generates to `app/generated/prisma/` (committed, non-standard).** Regenerate with `npx prisma generate` after schema changes; never hand-edit. Import types from `@/app/generated/prisma`; use the singleton `@/lib/prisma`.
- **LIVE** on a new Supabase project (ap-south-1, session pooler port 5432). Schema applied with **`npx prisma db push`** — no migration files (Supabase's pooler can't create the shadow DB that `prisma migrate dev` needs); `prisma/migrations/` holds only `migration_lock.toml`. Re-run `db push` after schema changes.
- **⚠ `$` in `DATABASE_URL` must be percent-encoded as `%24`.** Next.js expands `$...` in env values (dotenv-expand), mangling a `$`-containing DB password at runtime (Prisma CLI does *not* expand, so `db push` works but the app fails auth with "credentials not valid"). `%24` decodes back to `$` in Postgres and is safe for both. Keep `DATABASE_URL` synced in **both** `.env` (Prisma CLI) and `.env.local` (the app — which *overrides* `.env`).

### Frontend status
**Complete & `tsc`-clean — whole UI rebuilt; `npm run build` passes.** Pages: `app/page.tsx` (Home), `app/subjects/[id]/page.tsx` (Subject), `app/analytics/page.tsx` (Progress), `app/focus/page.tsx` (Focus), `app/{login,signup,forgot-password}/page.tsx` (auth). Components in `app/components/{home,subject,analytics}/*`, `timer.tsx`, `auth-shell.tsx`, `Navbar.tsx`. Design tokens + helpers (`.lk-prose`/`.lk-check`/`.lk-iconbtn`/`.lk-tag` + the base set) in `app/globals.css`. shadcn primitives in `app/components/ui/*` kept. Verified live in both modes.

### Path alias
`@/*` maps to the repo root (`tsconfig.json`).

## Environment variables
In `.env` (Prisma CLI) **and** `.env.local` (the app; overrides `.env`): `DATABASE_URL` (live; **`$`→`%24` encoded**, see Database), `AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (currently `http://localhost:3001`, because port 3000 is the user's other app "SkillSwap"), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. `GEMINI_API_KEY` unused (AI removed).
