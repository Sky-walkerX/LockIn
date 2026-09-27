import prisma from "@/lib/prisma";
import type { Milestone } from "@/app/generated/prisma/client";

// Writing notes: where a note lands in its subject.

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
 * Insert a note at the end of its subject (unless `order` is given). The
 * caller has already checked the subject belongs to the user.
 */
export async function insertNote(
  subjectId: string,
  input: { title: string; notes?: string; order?: number },
): Promise<Milestone> {
  const order = input.order ?? (await nextOrder(subjectId));
  return prisma.milestone.create({
    data: {
      subjectId,
      title: input.title,
      notes: input.notes ?? "",
      order,
    },
  });
}
