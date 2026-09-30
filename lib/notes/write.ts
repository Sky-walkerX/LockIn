import prisma from "@/lib/prisma";
import type { Milestone } from "@/app/generated/prisma/client";
import { WEB_SOURCE } from "./source";

// Writing notes: where a note lands, its order, and who has to witness it.

/** The order a note appended to the end of a subject gets. */
export async function nextOrder(subjectId: string): Promise<number> {
  const last = await prisma.milestone.findFirst({
    where: { subjectId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return last ? last.order + 1 : 0;
}

/**
 * Insert a note at the end of its subject (unless `order` is given). Notes
 * typed in the app are witnessed as they're written; anyone else's wait.
 * The caller has already checked the subject belongs to the user.
 */
export async function insertNote(
  subjectId: string,
  input: { title: string; notes?: string; order?: number; source?: string },
): Promise<Milestone> {
  const source = input.source ?? WEB_SOURCE;
  const order = input.order ?? (await nextOrder(subjectId));
  return prisma.milestone.create({
    data: {
      subjectId,
      title: input.title,
      notes: input.notes ?? "",
      order,
      source,
      witnessedAt: source === WEB_SOURCE ? new Date() : null,
    },
  });
}
