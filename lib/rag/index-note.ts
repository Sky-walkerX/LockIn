import prisma from "@/lib/prisma";
import { chunkSource, hashContent } from "./chunk";
import { embedOnServer } from "./ingest";
import type { LiveSource } from "./sources";
import { storeChunks } from "./store";

// Under the ingest service's MAX_EMBED_BATCH (128), with room to spare.
const EMBED_BATCH = 64;

/** One note as a live source, built the way `listLiveSources` builds it, or
 *  null when the note is gone or has nothing to index. */
async function liveNoteSource(userId: string, noteId: string): Promise<LiveSource | null> {
  const note = await prisma.milestone.findFirst({
    where: { id: noteId, subject: { userId } },
    select: { id: true, title: true, notes: true, subject: { select: { id: true, title: true } } },
  });
  if (!note || !note.notes.trim()) return null;

  const entry = {
    source: "MILESTONE" as const,
    sourceId: note.id,
    subjectId: note.subject.id,
    subjectTitle: note.subject.title,
    milestoneTitle: note.title,
    text: note.notes,
  };
  const chunks = chunkSource(entry);
  if (chunks.length === 0) return null;
  return { ...entry, contentHash: hashContent(entry.text), chunks };
}

/**
 * Embeds and stores one note's chunks on the server, so a note an agent saves
 * over MCP is searchable by meaning straight away instead of when the user
 * next opens the app. Fails soft: without the ingest service, or if it errors,
 * the note stays stale and the browser's indexer picks it up as before.
 * Returns how many chunks were written.
 */
export async function indexNoteOnServer(userId: string, noteId: string): Promise<number> {
  const live = await liveNoteSource(userId, noteId);
  if (!live) return 0;

  // The embedder sees the breadcrumb, two newlines, then the content,
  // exactly as the browser sends it.
  const texts = live.chunks.map((c) => `${c.breadcrumb}\n\n${c.content}`);
  const vectors: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const result = await embedOnServer(texts.slice(i, i + EMBED_BATCH), "passage");
    if (!result.ok) return 0;
    vectors.push(...result.vectors);
  }

  const chunks = live.chunks.map((c, i) => ({
    source: live.source,
    sourceId: live.sourceId,
    ordinal: c.ordinal,
    breadcrumb: c.breadcrumb,
    content: c.content,
    contentHash: live.contentHash,
    embedding: vectors[i],
  }));

  // Read the note again: if it changed or went while we were embedding,
  // storeChunks sees a different hash (or nothing) and writes nothing.
  const now = await liveNoteSource(userId, noteId);
  return storeChunks(userId, chunks, now ? [now] : []);
}
