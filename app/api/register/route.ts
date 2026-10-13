import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { mailConfigured } from "@/lib/mail";
import { sendVerification } from "@/lib/accounts/emails";
import { PASSWORD_MAX, PASSWORD_MIN, appOrigin, canCreateAccount, normalizeEmail } from "@/lib/accounts/policy";

const RegisterSchema = z.object({
  name: z.string().trim().max(100).optional().nullable(),
  email: z.email("Enter a valid email address").max(254),
  password: z
    .string()
    .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
    .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`),
});

// POST /api/register - a new account with an email and password. Where the
// instance can send email, the account can't sign in until the address is
// confirmed from the link this sends (`verify: true` in the reply).
export async function POST(request: Request) {
  try {
    const parsed = RegisterSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid registration data";
      return NextResponse.json({ message }, { status: 400 });
    }
    const { name, password } = parsed.data;
    const email = normalizeEmail(parsed.data.email);

    if (!(await canCreateAccount())) {
      return NextResponse.json({ message: "Sign-up is closed on this notebook." }, { status: 403 });
    }

    // Addresses are stored in lower case now; one stored earlier in another
    // case is still the same account.
    const taken = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } });
    if (taken) return NextResponse.json({ message: "User with this email already exists" }, { status: 409 });

    // The unique index on email is still the last word when two sign-ups race (P2002).
    const user = await prisma.user.create({
      data: { email, password: await bcrypt.hash(password, 10), name: name || null },
    });

    const verify = mailConfigured();
    if (verify) {
      try {
        await sendVerification(user, appOrigin(request));
      } catch (error) {
        console.error("Sending the confirmation email failed", error);
        return NextResponse.json(
          { message: "Your account was created, but the confirmation email couldn't be sent. Sign in to send it again." },
          { status: 502 },
        );
      }
    }

    return NextResponse.json(
      {
        message: verify ? "Check your email for a link to confirm your address." : "User registered successfully",
        verify,
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Something went wrong during registration" }, { status: 500 });
  }
}
