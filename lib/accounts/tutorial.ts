import prisma from "@/lib/prisma";
import { insertNote } from "@/lib/notes/write";
import { createTask } from "@/lib/tasks/create";
import { TUTORIAL_NOTES, TUTORIAL_TASKS, TUTORIAL_TITLE } from "./tutorial-notes";

// Every new notebook opens with a Tutorial section: how to write notes here,
// each kind of formatting as typed and as it reads. Existing accounts never
// get one, and the owner deletes it like any other section.

const TUTORIAL_COLOR = "#2F5FA0"; // pen blue, from the subject palette

/**
 * Writes the Tutorial into a new account. The notes go in one at a time so
 * their pages run 1, 2, 3… in reading order. Never throws: a notebook that
 * couldn't get its tutorial is still a notebook, so sign-up carries on.
 */
export async function createTutorial(userId: string): Promise<boolean> {
  try {
    const subject = await prisma.subject.create({
      data: {
        userId,
        title: TUTORIAL_TITLE,
        description: "How to write notes here. Delete it when you're done.",
        color: TUTORIAL_COLOR,
      },
    });
    let first: string | null = null;
    for (const [order, note] of TUTORIAL_NOTES.entries()) {
      const written = await insertNote(userId, subject.id, { ...note, order });
      first ??= written.id;
    }
    for (const title of TUTORIAL_TASKS) {
      await createTask(userId, { subjectId: subject.id, milestoneId: first, title });
    }
    return true;
  } catch (error) {
    console.error("Writing the Tutorial into a new notebook failed", error);
    return false;
  }
}
