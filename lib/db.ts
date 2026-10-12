import { PrismaClient } from "@prisma/client";

// Satu PrismaClient per proses development agar hot reload tidak membuka banyak koneksi.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export async function assertDatabaseReady() {
  try { await db.$queryRaw`SELECT 1`; }
  catch (error) {
    console.error("Koneksi database HRIS gagal.", error instanceof Error ? error.message : "unknown");
    throw new Error("Database HRIS tidak dapat diakses. Periksa DATABASE_URL dan status MySQL.");
  }
}
