import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { Prisma } from "@/app/generated/prisma"

const RegisterSchema = z.object({
  name: z.string().trim().max(100).optional().nullable(),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(request: Request) {
  try {
    const parsed = RegisterSchema.safeParse(await request.json())
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid registration data"
      return NextResponse.json({ message }, { status: 400 })
    }
    const { name, email, password } = parsed.data

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10)

    // No pre-check for an existing user: the unique index on email is the
    // race-free source of truth (P2002 = duplicate).
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    })

    // Return a subset of user data, excluding sensitive information like password
    return NextResponse.json(
      {
        message: "User registered successfully",
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Something went wrong during registration" }, { status: 500 })
  }
}
