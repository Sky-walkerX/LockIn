# LockIn

A personal **study & resource hub** — not an AI generator. You're the brain; LockIn is the shelf + planner. Everything is organized around **Subjects**.

- **Subjects** (e.g. "Operating Systems", "GATE Prep") — each holds a plan and resources.
- **Plan** — an ordered list of **Milestones** (phases) with markdown notes, each holding a checklist of **Tasks**.
- **Resources** — saved URLs only: web links, AI chat links, book/PDF references.
- **Today** — a cross-subject view of tasks due or overdue.
- **Focus** — a timer (Pomodoro / stopwatch) that logs time against a task.
- **Progress** — streaks, completions, focus time and a GitHub-style activity heatmap.

Single user per account. Two interchangeable looks via the theme toggle: **Creative** (light, neobrutalist) and **Focus** (dark, editor-calm).

## Stack

Next.js (App Router) · React 19 · TypeScript · Prisma + PostgreSQL · NextAuth v4 (JWT) · TanStack React Query · shadcn/ui + Tailwind v4 · next-themes.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000 (auto-bumps to 3001 if taken)
```

Set the following in `.env` (Prisma CLI) **and** `.env.local` (the app):

```
DATABASE_URL=            # Postgres; if the password contains `$`, encode it as %24
AUTH_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=            # e.g. http://localhost:3001
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Commands

```bash
npm run dev      # Next.js + Turbopack
npm run build    # prisma generate && next build
npm run start    # serve the production build
npm run lint     # next lint

npx prisma db push   # sync schema to the database
npx prisma studio    # browse data
```

## Data model

`User ──< Subject ──< Milestone ──< Task ──< TimerSession`, and `Subject ──< Resource`.

The Prisma client is generated into `app/generated/prisma/` (committed) — regenerate with `npx prisma generate` after schema changes; never hand-edit.
