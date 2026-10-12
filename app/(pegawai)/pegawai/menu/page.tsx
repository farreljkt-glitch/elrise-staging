"use client";

import React from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/mock-auth";
import { MenuGrid } from "@/components/pegawai/MenuGrid";
import { ThemeSelector } from "@/components/ui/ThemeToggle";

export default function PegawaiMenuPage() {
  const { logout } = useAuth();
  return (
    <div className="space-y-6">
      <header className="anim-in">
        <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--text-primary)]">Menu</h1>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">Semua layanan karyawan dalam satu tempat.</p>
      </header>

      <section className="m-card anim-in p-5" style={{ "--i": 1 } as React.CSSProperties}>
        <MenuGrid />
      </section>

      <section className="m-card anim-in p-5" style={{ "--i": 2 } as React.CSSProperties}>
        <h2 className="mb-3 text-sm font-bold text-[var(--text-primary)]">Tampilan</h2>
        <ThemeSelector />
      </section>

      <button
        type="button"
        onClick={logout}
        className="press anim-in flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--danger)]"
        style={{ "--i": 3 } as React.CSSProperties}
      >
        <LogOut className="h-4 w-4" /> Keluar
      </button>
    </div>
  );
}
