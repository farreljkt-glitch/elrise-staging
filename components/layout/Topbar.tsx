"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/mock-auth";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Bell,
  Search,
  UserCheck,
  LogOut,
  ChevronDown,
  Building,
  User as UserIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getInitials } from "@/lib/formatters";

export function Topbar() {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="m-glass h-16 px-4 sm:px-6 border-b border-[var(--border)] flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Mobile Brand */}
      <div className="flex items-center gap-3 md:hidden">
        <Link href="/" aria-label="Beranda elrise" className="press inline-flex">
          <Logo variant="wordmark" size="sm" />
        </Link>
      </div>

      {/* Desktop Search / Quick Role Switcher Indicator */}
      <div className="hidden md:flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari pegawai, project, atau transaksi..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--blue)] transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />

        {/* Pegawai (mobile): lonceng langsung membuka halaman Notifikasi */}
        {user.role === "PEGAWAI" && (
          <Link
            href="/pegawai/notifikasi"
            aria-label="Buka notifikasi"
            className="press relative grid h-10 w-10 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] md:hidden"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[var(--danger)] ring-2 ring-[var(--surface)]" />
          </Link>
        )}

        {/* Notifikasi Popover */}
        <div className={`relative ${user.role === "PEGAWAI" ? "hidden md:block" : ""}`}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="press p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors relative cursor-pointer"
            aria-label="Notifikasi sistem"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--teal)]" />
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shadow-2xl p-4 z-50 anim-pop"
              onClick={() => setNotifOpen(false)}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <span className="text-xs font-bold text-[var(--text-primary)]">Pemberitahuan Demo</span>
                <span className="text-[10px] text-[var(--teal)] font-medium">3 Baru</span>
              </div>
              <div className="divide-y divide-[var(--border)] text-xs py-1">
                <div className="py-2.5">
                  <p className="font-semibold text-[var(--text-primary)]">Payroll Maret 2026</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Draft payroll siap untuk di-review oleh HR Admin.
                  </p>
                </div>
                <div className="py-2.5">
                  <p className="font-semibold text-[var(--text-primary)]">Permohonan Cuti Baru</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Budi Santoso mengajukan cuti tahunan (3 hari).
                  </p>
                </div>
                <div className="py-2.5">
                  <p className="font-semibold text-[var(--text-primary)]">Sinkronisasi Gajiku Selesai</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    4 transaksi kasbon berhasil direkonsiliasi.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profil Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="press flex items-center gap-2 p-1 rounded-full md:rounded-lg md:p-1.5 hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            aria-label="Menu profil pengguna"
          >
            <div className="w-9 h-9 md:w-8 md:h-8 rounded-full md:rounded-lg bg-[image:var(--grad)] flex items-center justify-center text-xs font-bold text-[var(--on-accent)]">
              {getInitials(user.name)}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight truncate max-w-[120px]">
                {user.name}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">{user.role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] hidden lg:block" />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shadow-2xl p-2 z-50 text-xs anim-pop"
              onClick={() => setProfileOpen(false)}
            >
              <div className="p-3 border-b border-[var(--border)] mb-1">
                <div className="font-semibold text-[var(--text-primary)]">{user.name}</div>
                <div className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</div>
                {user.clientName && (
                  <div className="text-[10px] text-[var(--teal)] mt-1 flex items-center gap-1 truncate">
                    <Building className="w-3 h-3 shrink-0" />
                    <span>{user.clientName}</span>
                  </div>
                )}
              </div>

              {user.role === "PEGAWAI" && (
                <Link
                  href="/pegawai/profil"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profil Saya</span>
                </Link>
              )}

              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors cursor-pointer mt-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Sistem</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
