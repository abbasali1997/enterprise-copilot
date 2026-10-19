import "dotenv/config";
import { type Prisma, PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

// packages/db/src/index.ts
export { Prisma } from "./generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma: PrismaClient = new PrismaClient({
  adapter,
});

export type DbClient = Prisma.TransactionClient | typeof prisma;
