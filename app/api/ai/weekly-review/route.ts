import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// POST /api/ai/weekly-review - Generate AI weekly review
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tasks from the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [todos, timerSessions, user] = await Promise.all([
      prisma.todo.findMany({
        where: {
          userId: token.sub,
          OR: [
            { completedAt: { gte: weekAgo } },
            { createdAt: { gte: weekAgo } },
          ],
        },
        include: { tags: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.timerSession.findMany({
        where: {
          todo: { userId: token.sub },
          startedAt: { gte: weekAgo },
        },
      }),
      prisma.user.findUnique({
        where: { id: token.sub },
        select: { xp: true, level: true, streak: true },
      }),
    ]);

    const completedTasks = todos.filter((t) => t.isCompleted);
    const missedTasks = todos.filter(
      (t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date()
    );
    const totalFocusMinutes = timerSessions.reduce((acc, s) => acc + (s.duration || 0), 0);

    const prompt = `
You are an insightful productivity coach AI doing a weekly review for a user. Analyze their week and provide actionable feedback.

**Week Summary:**
- Tasks completed: ${completedTasks.length}
- Tasks missed/overdue: ${missedTasks.length}
- Total tasks created: ${todos.length}
- Focus sessions: ${timerSessions.length} (${Math.round(totalFocusMinutes / 60 * 10) / 10} hours)
- Current streak: ${user?.streak || 0} days
- Current level: ${user?.level || 1} (${user?.xp || 0} XP)

**Completed tasks this week:**
${completedTasks.map((t) => `- "${t.title}" (${t.priority} priority${t.tags.length > 0 ? `, tags: ${t.tags.map((tag) => tag.name).join(", ")}` : ""})`).join("\n") || "None"}

**Overdue/missed tasks:**
${missedTasks.map((t) => `- "${t.title}" (${t.priority} priority, due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "N/A"})`).join("\n") || "None"}

Respond with a JSON object:
{
  "summary": "2-3 sentence encouraging summary of the week",
  "accomplishments": ["list of key accomplishments"],
  "patterns": ["observed productivity patterns, both positive and areas for improvement"],
  "suggestionsForNextWeek": ["3-4 specific, actionable suggestions for next week"],
  "focusAreas": ["1-2 key areas to focus on"],
  "motivationalNote": "A short encouraging message"
}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanedJson = jsonMatch
      ? jsonMatch[0]
      : '{"summary": "Unable to generate review", "accomplishments": [], "patterns": [], "suggestionsForNextWeek": [], "focusAreas": [], "motivationalNote": "Keep going!"}';

    const review = JSON.parse(cleanedJson);

    return NextResponse.json({
      ...review,
      stats: {
        tasksCompleted: completedTasks.length,
        tasksMissed: missedTasks.length,
        totalCreated: todos.length,
        focusSessions: timerSessions.length,
        focusHours: Math.round(totalFocusMinutes / 60 * 10) / 10,
        streak: user?.streak || 0,
        level: user?.level || 1,
        xp: user?.xp || 0,
      },
    });
  } catch (error) {
    console.error("Error generating weekly review:", error);
    return NextResponse.json({ error: "Failed to generate weekly review" }, { status: 500 });
  }
}
