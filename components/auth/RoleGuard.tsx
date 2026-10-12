"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/mock-auth";
import { UserRole } from "@/lib/types";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getRoleDashboardPath } from "@/lib/permissions";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--blue)] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Jika belum login atau role tidak diizinkan
  if (!user || !allowedRoles.includes(user.role)) {
    const targetDashboard = user ? getRoleDashboardPath(user.role) : "/login";

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[var(--danger)]/15 text-[var(--danger)] flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Akses Ditolak (403)</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
            Halaman ini membutuhkan hak akses khusus role{" "}
            <strong className="text-[var(--text-primary)] font-mono">{allowedRoles.join(" atau ")}</strong>.
            Akun Anda saat ini login sebagai{" "}
            <span className="text-[var(--warning)] font-semibold">{user?.role || "GUEST"}</span>.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link href={targetDashboard} className="w-full">
              <Button variant="primary" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Kembali ke Dashboard Saya
              </Button>
            </Link>


          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
