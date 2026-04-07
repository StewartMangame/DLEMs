import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getPrisma = () => {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  // Resolve DB path relative to this file's location (backend/src/lib/)
  const dbFile = process.env.DATABASE_URL?.replace("file:", "") || "../backend/prisma/v2.db";
  
  const dbPath = path.isAbsolute(dbFile) 
    ? dbFile 
    : path.join(process.cwd(), dbFile);

  console.log("DEBUG Prisma paths:", { cwd: process.cwd(), dbFile, dbPath });

  // Prisma 7 uses adapter factories
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  
  const prisma = new PrismaClient({
    log: ["query"],
    adapter,
  });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
  return prisma;
};

export const prisma = getPrisma();
