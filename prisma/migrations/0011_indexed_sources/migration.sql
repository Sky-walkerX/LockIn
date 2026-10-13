-- CreateTable
CREATE TABLE "IndexedSource" (
    "source" "ChunkSource" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "embeddingModel" TEXT NOT NULL,
    "chunkCount" INTEGER NOT NULL,

    CONSTRAINT "IndexedSource_pkey" PRIMARY KEY ("source","sourceId")
);

-- CreateIndex
CREATE INDEX "IndexedSource_userId_idx" ON "IndexedSource"("userId");

-- AddForeignKey
ALTER TABLE "IndexedSource" ADD CONSTRAINT "IndexedSource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- What's indexed already stays indexed: each source's passages were written
-- together, so one hash and one count describe them.
INSERT INTO "IndexedSource" ("source", "sourceId", "userId", "contentHash", "embeddingModel", "chunkCount")
SELECT "source", "sourceId", min("userId"), min("contentHash"), min("embeddingModel"), count(*)
FROM "NoteChunk"
GROUP BY "source", "sourceId";
