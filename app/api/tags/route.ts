import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { z } from "zod";

const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const UpdateTagSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const DeleteTagSchema = z.object({
  id: z.string(),
});

// GET /api/tags - Get all tags for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tags = await prisma.tag.findMany({
      where: { userId: token.sub },
      include: { _count: { select: { todos: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateTagSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    // Check for duplicate tag name
    const existing = await prisma.tag.findUnique({
      where: { name_userId: { name: parsed.data.name, userId: token.sub } },
    });

    if (existing) {
      return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
    }

    const tag = await prisma.tag.create({
      data: {
        name: parsed.data.name,
        color: parsed.data.color || "#6366f1",
        userId: token.sub,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/tags - Update a tag
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateTagSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const tag = await prisma.tag.updateMany({
      where: { id: parsed.data.id, userId: token.sub },
      data: {
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.color && { color: parsed.data.color }),
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/tags - Delete a tag
export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = DeleteTagSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const deleted = await prisma.tag.deleteMany({
      where: { id: parsed.data.id, userId: token.sub },
    });

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
