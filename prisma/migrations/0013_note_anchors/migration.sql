-- The code a note is about (repo, commit, files) and when an agent last
-- checked it, a flag for the user when it may be out of date, the note it
-- replaces, and the key a session's captured note is found by.
ALTER TABLE "Milestone" ADD COLUMN     "anchorCommit" TEXT,
ADD COLUMN     "anchorFiles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "anchorRepo" TEXT,
ADD COLUMN     "captureKey" TEXT,
ADD COLUMN     "checkedAt" TIMESTAMP(3),
ADD COLUMN     "checkedBy" TEXT,
ADD COLUMN     "staleAt" TIMESTAMP(3),
ADD COLUMN     "staleBy" TEXT,
ADD COLUMN     "staleReason" TEXT,
ADD COLUMN     "supersedesId" TEXT;

CREATE UNIQUE INDEX "Milestone_captureKey_key" ON "Milestone"("captureKey");

CREATE INDEX "Milestone_supersedesId_idx" ON "Milestone"("supersedesId");

ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
