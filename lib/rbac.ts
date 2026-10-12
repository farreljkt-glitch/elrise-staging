import "server-only";
import type { Prisma, Role } from "@prisma/client";
import { requireUser } from "@/lib/auth-server";

export async function requireRole(...roles: Role[]) { return requireUser(roles); }
// Gunakan filter ini pada SEMUA query tenant; clientId tidak pernah diambil dari input browser.
export function tenantWhere(clientId: string | null): Prisma.StringFilter | string {
  if (!clientId) throw new Error("Akun ini belum terhubung ke klien.");
  return clientId;
}
export function assertOwnEmployee(sessionEmployeeId: string | null, requestedEmployeeId: string) {
  if (!sessionEmployeeId || sessionEmployeeId !== requestedEmployeeId) throw new Error("Anda hanya dapat mengakses data milik sendiri.");
}
