"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function PegawaiLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["PEGAWAI"]}>
      <AppShell>{children}</AppShell>
    </RoleGuard>
  );
}
