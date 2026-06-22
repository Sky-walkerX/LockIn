# Study & Resource Hub — Rebrand Design

**Date:** 2026-06-22
**Status:** Approved (design); implementation not started
**Repo:** evolves the existing PlanWise codebase (Next.js 15 App Router, React 19, TypeScript, Prisma/Postgres, NextAuth v4, React Query, shadcn/ui)

## 1. Overview

Repurpose the existing AI-wrapper todo app into a **personal study & resource hub** organized around **Subjects**. The app is explicitly *not* an AI generator — the user is the brain; the app is the shelf and the planner. It is a single-user-per-account personal tool.

The center of gravity is a **Subject** (e.g. "Operating Systems", "GATE Prep", "System Design"). Each subject holds two things:

- **A plan** — an ordered list of **Milestones** (phases of learning), each with its own freeform markdown notes, individually checkable and reorderable. Each milestone contains a checklist of **Tasks** (the concrete things to do). Exactly one level of nesting.
- **Resources** — saved URLs (no file uploads in v1): web links, AI chat links (Claude/Gemini/ChatGPT conversations), and book/PDF references.

A cross-subject **Today** view surfaces tasks due / in progress across all subjects, so the app is a productivity tool and not just a filing cabinet.

## 2. Goals & non-goals

**Goals**
- Organize study material and plans by Subject in one place.
- Real progress tracking: milestone completion + task checklists with progress bars.
- Cross-subject "what should I do today" glance.
- Keep the genuinely useful existing machinery: focus timer, study-activity heatmap, auth.
- A fresh, redesigned-from-scratch UI.

**Non-goals (v1)**
- No PDF/file uploads — resources are URLs only. (Possible fast-follow; the `Resource` row would later gain a `fileUrl`.)
- No AI generation of any kind (smart plans, suggestions, task breakdown all removed).
- No gamification (XP / levels / streaks).
- No multi-user collaboration, sharing, or real-time.
- No arbitrary nesting of milestones (one level of sub-tasks only).

## 3. Build approach

**Clean schema rewrite + dev DB reset.** Rewrite `schema.prisma` to the new model in one pass, reset the dev database (existing rows are throwaway dev data — **to be confirmed before running**), delete the dead AI/gamification code, then build the new feature modules. No incremental data migration, since there is no production data to preserve.

## 4. Data model

Five models. `Todo` is **renamed to `Task`** to reflect its new meaning (a concrete to-do under a milestone).

```
User ──< Subject ──< Milestone ──< Task ──< TimerSession
            └──────< Resource
```

### User (trimmed)
Keep: `id`, `email`, `name?`, `password?`, `createdAt`, `updatedAt`.
**Remove:** `xp`, `level`, `streak`, `lastActiveDate`, and the `suggestions` relation.
Relations: `subjects[]`, `resources[]`, `tasks[]`.

### Subject (new)
- `id`, `userId`
- `title` (required)
- `description?` (short, optional)
- `color?` (optional, for card accent)
- `isArchived` (Boolean, default false)
- `createdAt`, `updatedAt`
- Relations: `milestones[]`, `resources[]`, `tasks[]`

### Milestone (new)
- `id`, `subjectId`
- `title` (required)
- `notes` (String, markdown — optional/empty default)
- `order` (Int — for manual reordering within a subject)
- `isCompleted` (Boolean, default false)
- `createdAt`, `updatedAt`
- Relations: `tasks[]`
- Progress = % of its tasks completed (derived, not stored).

### Task (renamed from Todo)
- `id`, `userId`
- `subjectId` (**required** — a task always belongs to a subject)
- `milestoneId?` (**optional** — a task may sit directly on a subject without a milestone)
- `title`, `description?`
- `isCompleted` (Boolean, default false), `completedAt?`
- `dueDate?`
- `priority` (`Priority` enum, default MEDIUM)
- `estimatedTime?` (Int, minutes), `timeSpent?` (Int, minutes)
- `createdAt`
- **Remove:** `isAiSuggested`
- Relations: `timerSessions[]`

### Resource (new)
- `id`, `userId`, `subjectId`
- `type` (`ResourceType` enum: `LINK` | `AI_CHAT` | `PDF` | `BOOK`)
- `url` (required)
- `title` (required)
- `note?` (optional)
- `createdAt`, `updatedAt`

### TimerSession (kept)
- `id`, `startedAt`, `endedAt?`, `duration?` (minutes)
- `taskId` (renamed from `todoId`), relation to `Task`

### Enums
- Keep `Priority` (LOW / MEDIUM / HIGH).
- Add `ResourceType` (LINK / AI_CHAT / PDF / BOOK).
- **Delete** `SuggestionType`.

## 5. Cut vs. kept

**Cut entirely:**
- `app/api/ai/breakdown/`, `app/api/ai/smart-plan/`, `app/api/ai-suggestions/`
- `app/components/ai-suggestion-panel.tsx`, `app/components/spotify-widget.tsx`, `app/components/analytics/xp.tsx`
- Hooks: `use-ai-suggestions.ts`, `use-smart-plan.ts`, `use-task-breakdown.ts`
- The `Suggestion` model + `SuggestionType` enum
- `@google/generative-ai` dependency, `GEMINI_API_KEY` env var
- Gamification fields on `User`

**Kept (logic/data — visuals get redesigned, see §9):**
- Auth: NextAuth v4 (Google + credentials), the per-route `getToken({ secret: AUTH_SECRET }).sub` protection pattern, `/api/auth/[...nextauth]`, `/api/register`, `lib/authOptions.ts`, `lib/prisma.ts` singleton.
- Focus **timer** + `TimerSession` — now attaches to a `Task`. **Needs a real persistence endpoint** (currently appears client-only; no timer API route exists).
- **Activity heatmap + stat cards** — re-themed "study activity", driven by completed tasks + timer sessions, **XP removed**.
- React Query setup, shadcn/ui primitives, Tailwind v4, next-themes.

## 6. Pages & navigation

Subject-first, with a cross-subject Today view.

- **`/` (home)** — grid of Subject cards (each with a progress bar) **+** a cross-subject **Today** strip (tasks due / in progress pulled from all subjects).
- **`/subjects/[id]`** — the subject page, two areas (tabs or two-column):
  - **Plan**: ordered milestones; each milestone expands to its markdown notes + task checklist; add/reorder/complete milestones; add/complete tasks.
  - **Resources**: list grouped by `type`; "add resource" = pick type + paste URL + title + optional note.
- **`/analytics`** — study-activity heatmap + stat cards (no XP).
- **Kept auth pages:** `/login`, `/signup`, `/forgot-password`.

## 7. API routes

All new/adapted routes follow the existing pattern: `getToken({ req, secret: process.env.AUTH_SECRET })` → check `token.sub` (401 if missing) → Zod-validate body → Prisma, scoped to `userId = token.sub`.

- **New:** `/api/subjects` (GET list, POST create), `/api/subjects/[id]` (GET/PUT/DELETE); `/api/milestones` + `/api/milestones/[id]`; `/api/resources` + `/api/resources/[id]`.
- **Adapted:** `/api/todos*` → `/api/tasks*` (`/api/tasks`, `/api/tasks/[id]`, `/api/tasks/bulk`), gaining `subjectId`/`milestoneId`.
- **New (timer persistence):** an endpoint to start/stop a timer session for a task (e.g. `/api/tasks/[id]/timer` or `/api/timer-sessions`), updating `Task.timeSpent` on stop.
- **Kept:** `/api/auth/[...nextauth]`, `/api/register`.

## 8. Data layer (hooks)

React Query hooks, `credentials: "include"`, `invalidateQueries` on mutation success — matching the existing `useTodos` pattern.

- **New:** `useSubjects`, `useMilestones`, `useResources`.
- **Adapted:** `useTodos` → `useTasks` (queryKey `["tasks"]`, with subject/milestone-scoped variants).
- **Kept:** `use-analytics`, `use-activity-heatmap`.
- **Removed:** `use-ai-suggestions`, `use-smart-plan`, `use-task-breakdown`.

## 9. UI redesign (from scratch)

The visual layer is **rebuilt from scratch**, not reused. We keep shadcn/ui primitives (`app/components/ui/*`), Tailwind v4, next-themes, the data-layer hooks, and the API patterns — but the page-level and feature components (`Dashboard`, `today-tasks`, `Navbar`, analytics layout, timer UI) are redesigned rather than carried over. New visual identity to match the rebrand (see §11 naming).

> Detailed visual/component design is deferred to the implementation phase; this spec fixes the information architecture, data model, and behavior. The frontend-design skill should be used when building the UI.

## 10. New dependency

- **`react-markdown`** — render milestone notes. Editing is a plain `<textarea>` with a write/preview toggle. No WYSIWYG editor in v1.

## 11. Open items to confirm

1. **Product name** — the app is being renamed; the new name is **TBD**. Affects `app/layout.tsx` metadata, README, and visual identity. Does not block schema/API work.
2. **Dev DB reset** — confirm there is no data in the current database worth keeping before the destructive schema rewrite.
3. **Timer persistence shape** — confirm endpoint design (`/api/tasks/[id]/timer` vs. a dedicated `/api/timer-sessions`).

## 12. Out of scope (candidate fast-follows)

- PDF/file uploads to blob storage (`Resource.fileUrl`).
- In-app PDF/AI-chat preview/embedding.
- Tags/search across resources and subjects.
- Reminders/notifications for due tasks.
