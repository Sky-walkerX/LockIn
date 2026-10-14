-- When the commit a note is anchored at was made, as the agent saw it, so a
-- reader can tell which of two notes describes the later code.
ALTER TABLE "Milestone" ADD COLUMN "anchorCommitAt" TIMESTAMP(3);
