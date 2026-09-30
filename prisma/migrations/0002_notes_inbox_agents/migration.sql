-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "isInbox" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "source" TEXT,
ADD COLUMN     "witnessedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "preview" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiToken_tokenHash_key" ON "ApiToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ApiToken_userId_createdAt_idx" ON "ApiToken"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Subject_userId_isInbox_idx" ON "Subject"("userId", "isInbox");

-- CreateIndex
CREATE INDEX "Milestone_subjectId_updatedAt_idx" ON "Milestone"("subjectId", "updatedAt" DESC);

-- AddForeignKey
ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

