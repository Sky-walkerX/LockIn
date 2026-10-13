import type { NextAuthOptions } from "next-auth";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { mailConfigured } from "@/lib/mail";
import { NO_ACCOUNT_HASH, canCreateAccount, normalizeEmail, userByEmail } from "@/lib/accounts/policy";
import { sessionStands } from "@/lib/accounts/session";
import { EMAIL_NOT_VERIFIED, TOO_MANY_ATTEMPTS } from "@/lib/accounts/errors";
import { clientAddress, countPasswordTry } from "@/lib/limits/rate";


export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    // Only when configured: a self-hosted copy without Google credentials
    // signs in with email and password, and the sign-in page hides the button.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // One message for every way this fails, so the form can't be used to
        // find out which addresses have accounts.
        const refused = new Error("Invalid credentials");
        if (!credentials?.email || !credentials?.password) throw refused;

        const address = clientAddress(new Headers(req?.headers as Record<string, string> | undefined));
        if (await countPasswordTry(normalizeEmail(credentials.email), address)) throw new Error(TOO_MANY_ATTEMPTS);

        const user = await userByEmail(credentials.email);
        const matches = await bcrypt.compare(credentials.password, user?.password ?? NO_ACCOUNT_HASH);
        if (!user?.password || !matches) throw refused;

        // Said only to someone who knows the password. Without email set up
        // there's no link to send, so an unconfirmed address signs in.
        if (!user.emailVerifiedAt && mailConfigured()) throw new Error(EMAIL_NOT_VERIFIED);

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      // Google says whether the address is the account holder's own.
      const email = user.email;
      if (!email || (profile as GoogleProfile | undefined)?.email_verified !== true) return false;

      try {
        let existing = await userByEmail(email);
        if (existing) {
          // Signing in with Google lands in the account that has this address
          // only if the address was proven by whoever made that account.
          // Otherwise anyone could register someone's address with a password
          // of their own and wait for the owner to arrive through Google.
          if (!existing.emailVerifiedAt) return "/login?error=AccountExists";
        } else {
          if (!(await canCreateAccount())) return "/login?error=SignupClosed";
          existing = await prisma.user.create({
            data: { email: normalizeEmail(email), name: user.name, emailVerifiedAt: new Date() },
          });
        }
        // The session carries the notebook's own id, not Google's.
        user.id = existing.id;
        return true;
      } catch (error) {
        console.error("Signing in with Google failed", error);
        return false;
      }
    },

    async jwt({ token, user }) {
      // `user` is here only at sign-in.
      if (user) {
        token.id = user.id;
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        // Written once: what a later password change is compared with.
        token.signedInAt = Date.now();
        return token;
      }
      // Every later read of the session: it ends when the password changes or
      // the account is deleted. Throwing makes NextAuth clear the cookie.
      if (token.sub && !(await sessionStands(token.sub, token.signedInAt))) {
        throw new Error("This session has ended");
      }
      return token;
    },

    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.email) session.user.email = token.email as string;
      if (token.name) session.user.name = token.name as string;
      return session;
    },
  },
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string | null;
    name?: string | null;
    /** When this session's holder signed in (ms). */
    signedInAt?: number;
  }
}
