/**
 * Singleton Prisma Client for Next.js.
 *
 * In development, Next.js hot-reload creates new module instances on every
 * change, which would exhaust the database connection pool if a new
 * PrismaClient were instantiated each time. This module stores the client on
 * the global object so that a single instance is reused across hot-reloads.
 *
 * In production, a new PrismaClient is created once per process (the global
 * trick is not needed, but it is harmless).
 */

import { PrismaClient } from "../../generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
