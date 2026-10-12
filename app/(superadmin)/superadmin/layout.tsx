"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["SUPERADMIN"]}>
      <AppShell>{children}</AppShell>
    </RoleGuard>
  );
}
