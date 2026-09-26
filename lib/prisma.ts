import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { poolConfig } from "./db-config";

declare global {
  var prisma: PrismaClient | undefined;
}

// Prisma 7 talks to Postgres through the pg driver (see db-config.ts for how
// DATABASE_URL becomes its settings). One client per process; in development
// it survives hot reloads on globalThis.
function create(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg(poolConfig(process.env.DATABASE_URL ?? "")) });
}

const prisma = globalThis.prisma ?? create();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;
