-- Chapters: named groups of notes inside a subject, one level deep. Deleting
-- a chapter leaves its notes loose in the subject.
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Chapter_subjectId_order_idx" ON "Chapter"("subjectId", "order");

ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Milestone" ADD COLUMN "chapterId" TEXT;

CREATE INDEX "Milestone_chapterId_idx" ON "Milestone"("chapterId");

ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
