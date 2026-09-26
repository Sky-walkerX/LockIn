import { defineConfig } from "prisma/config";

// The Prisma CLI's settings (migrate, generate). The app itself connects in
// lib/prisma.ts. Variables come from the environment; a local .env is read
// when there is one.
try {
  process.loadEnvFile();
} catch {
  // No .env: the environment already has what's needed (Docker, Vercel, CI).
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // Migrations need a direct or session connection: Supabase's transaction
    // pooler (DATABASE_URL there) can't run them, so DIRECT_URL wins when set.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
