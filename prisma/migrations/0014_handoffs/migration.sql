-- Batons: where an agent left a piece of work, for the next agent to pick up.
CREATE TYPE "HandoffStatus" AS ENUM ('OPEN', 'PICKED_UP', 'SUPERSEDED');

CREATE TABLE "Handoff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "tried" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "next" TEXT NOT NULL,
    "nextAt" TEXT,
    "pages" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "subjectId" TEXT,
    "taskId" TEXT,
    "noteId" TEXT,
    "repo" TEXT,
    "branch" TEXT,
    "commit" TEXT,
    "status" "HandoffStatus" NOT NULL DEFAULT 'OPEN',
    "pickedUpAt" TIMESTAMP(3),
    "pickedUpBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Handoff_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Handoff_userId_status_createdAt_idx" ON "Handoff"("userId", "status", "createdAt" DESC);

CREATE INDEX "Handoff_userId_repo_idx" ON "Handoff"("userId", "repo");

ALTER TABLE "Handoff" ADD CONSTRAINT "Handoff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Handoff" ADD CONSTRAINT "Handoff_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Handoff" ADD CONSTRAINT "Handoff_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Handoff" ADD CONSTRAINT "Handoff_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

