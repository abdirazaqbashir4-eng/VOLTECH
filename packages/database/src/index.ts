import "server-only";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export * from "./generated/prisma/client";

// Reuse a single PrismaClient across hot-reloads in dev, and across the three
// separate apps' server processes each importing this package, so we don't
// exhaust the Postgres connection pool.
const globalForPrisma = globalThis as unknown as { voltechDb?: PrismaClient };

function createClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Point it at a PostgreSQL connection string.");
  }
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.voltechDb ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.voltechDb = db;
}
