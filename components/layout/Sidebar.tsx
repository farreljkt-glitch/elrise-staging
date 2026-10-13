"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/mock-auth";
import { Logo } from "@/components/brand/Logo";
import {
  LayoutDashboard,
  Building2,
  MapPin,
  FileText,
  Users2,
  History,
  UserCheck2,
  CalendarCheck,
  CalendarDays,
  DollarSign,
  WalletCards,
  Clock,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getInitials } from "@/lib/formatters";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  // Menu navigasi per role
  const getNavLinks = () => {
    switch (user.role) {
      case "SUPERADMIN":
        return [
          { label: "Dashboard", href: "/superadmin/dashboard", icon: LayoutDashboard },
          { label: "Manajemen Klien", href: "/superadmin/klien", icon: Building2 },
          { label: "Master Project", href: "/superadmin/project", icon: MapPin },
          { label: "Konfigurasi MOU", href: "/superadmin/mou", icon: FileText },
          { label: "Manajemen Admin", href: "/superadmin/admin", icon: Users2 },
          { label: "Audit Log", href: "/superadmin/audit", icon: History },
        ];
      case "ADMIN":
        return [
          { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
          { label: "Master Pegawai", href: "/admin/pegawai", icon: UserCheck2 },
          { label: "Project PT", href: "/admin/project", icon: MapPin },
          { label: "Admin Project", href: "/admin/admin-project", icon: Users2 },
          { label: "Absensi & Validasi", href: "/admin/absensi", icon: CalendarCheck },
          { label: "Cuti & Izin", href: "/admin/cuti", icon: CalendarDays },
          { label: "Payroll", href: "/admin/payroll", icon: DollarSign },
          { label: "Kebijakan Kasbon", href: "/admin/kasbon", icon: WalletCards },
          { label: "Review Pengajuan Kasbon", href: "/admin/kasbon/pengajuan", icon: WalletCards },
        ];
      case "PEGAWAI":
        return [
          { label: "Beranda", href: "/pegawai/dashboard", icon: LayoutDashboard },
          { label: "Absen Mandiri", href: "/pegawai/absen", icon: Clock },
          { label: "Pengajuan Kasbon", href: "/pegawai/kasbon", icon: WalletCards },
          { label: "Pengajuan Cuti", href: "/pegawai/cuti", icon: CalendarDays },
          { label: "Slip Gaji", href: "/pegawai/slip", icon: DollarSign },
          { label: "Profil Saya", href: "/pegawai/profil", icon: User },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 bg-[var(--surface)] border-r border-[var(--border)] transition-all duration-200 z-30 select-none ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center overflow-hidden">
          {collapsed ? <Logo variant="icon" /> : <Logo variant="full" size="sm" />}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          title={collapsed ? "Perluas menu" : "Ciutkan menu"}
          aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User Identity Mini Card */}
      <div className={`p-4 border-b border-[var(--border)] bg-[var(--surface-2)]/30 ${collapsed ? "text-center" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--surface-3)] border border-[var(--border)] text-[var(--text-primary)] font-semibold flex items-center justify-center shrink-0 text-xs">
            {getInitials(user.name)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{user.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge
                  size="sm"
                  variant={
                    user.role === "SUPERADMIN"
                      ? "info"
                      : user.role === "ADMIN"
                      ? "warning"
                      : "success"
                  }
                >
                  {user.role}
                </Badge>
              </div>
            </div>
          )}
        </div>
        {!collapsed && user.clientName && (
          <div className="mt-2 text-[11px] text-[var(--text-muted)] truncate flex items-center gap-1">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{user.clientName}</span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {!collapsed && (
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Menu Utama
          </div>
        )}
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? "text-[var(--text-primary)] bg-[var(--surface-2)] shadow-sm font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]/60"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              {/* Indikator aktif gradient */}
              {isActive && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md"
                  style={{
                    background: "var(--grad)",
                  }}
                />
              )}
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? "text-[var(--teal)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                }`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Footer Info & Logout */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-2)]/20 space-y-2">
        {/* Status Koneksi Demo */}
        {!collapsed && (
          <div className="flex items-center justify-between px-2 py-1.5 rounded bg-[var(--surface-2)]/40 text-[11px] text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
              <span>Mode Demo Lokal</span>
            </div>
            <Wifi className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </div>
        )}

        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
          title="Keluar"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Keluar Sistem</span>}
        </button>
      </div>
    </aside>
  );
}
