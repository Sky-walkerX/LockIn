import prisma from "@/lib/prisma";

// The full plan tree for a subject: milestones with their tasks, loose tasks
// (no milestone), and resources. Subtasks nest one level: top-level subtasks
// carry their children. Shared by the subject page and the exports, so both
// see the same shape. With `relationJoins` this is one statement.

const subtasks = {
  where: { parentId: null },
  orderBy: { order: "asc" as const },
  include: { children: { orderBy: { order: "asc" as const } } },
} as const;

const taskInclude = {
  orderBy: [{ order: "asc" as const }, { createdAt: "asc" as const }],
  include: { subtasks },
};

export const subjectTreeInclude = {
  milestones: { orderBy: { order: "asc" as const }, include: { tasks: taskInclude } },
  tasks: { where: { milestoneId: null }, ...taskInclude },
  // The extracted document text can run to megabytes; nothing here needs it.
  resources: { orderBy: { createdAt: "desc" as const }, omit: { extracted: true } },
};

export function loadSubjectTree(userId: string, id: string) {
  return prisma.subject.findFirst({ where: { id, userId }, include: subjectTreeInclude });
}

export type SubjectTree = NonNullable<Awaited<ReturnType<typeof loadSubjectTree>>>;
