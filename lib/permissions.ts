// Utility perizinan (RBAC) untuk memverifikasi hak akses pengguna

import { UserRole } from "./types";

export function canAccessModule(role: UserRole | undefined, modulePath: string): boolean {
  if (!role) return false;

  // SUPERADMIN punya akses ke modul /superadmin
  if (modulePath.startsWith("/superadmin")) {
    return role === "SUPERADMIN";
  }

  // ADMIN punya akses ke modul /admin
  if (modulePath.startsWith("/admin")) {
    return role === "ADMIN";
  }

  // PEGAWAI punya akses ke modul /pegawai
  if (modulePath.startsWith("/pegawai")) {
    return role === "PEGAWAI";
  }

  return true;
}

export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case "SUPERADMIN":
      return "/superadmin/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    case "PEGAWAI":
      return "/pegawai/dashboard";
    default:
      return "/login";
  }
}
