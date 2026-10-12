"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/mock-auth";
import {
  Home,
  LayoutGrid,
  Bell,
  UserRound,
  Users2,
  CalendarCheck,
  Building2,
  FileText,
  History,
  WalletCards,
  Banknote,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** prefix rute tambahan yang dianggap bagian dari tab ini */
  also?: string[];
  badge?: boolean;
};

const PEGAWAI_ITEMS: NavItem[] = [
  { label: "Beranda", href: "/pegawai/dashboard", icon: Home },
  {
    label: "Menu",
    href: "/pegawai/menu",
    icon: LayoutGrid,
    also: ["/pegawai/absen", "/pegawai/cuti", "/pegawai/slip", "/pegawai/kehadiran", "/pegawai/dokumen", "/pegawai/kinerja", "/pegawai/pelatihan"],
  },
  { label: "Notifikasi", href: "/pegawai/notifikasi", icon: Bell, badge: true },
  { label: "Akun", href: "/pegawai/profil", icon: UserRound },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "Beranda", href: "/admin/dashboard", icon: Home },
  { label: "Pegawai", href: "/admin/pegawai", icon: Users2 },
  { label: "Absensi", href: "/admin/absensi", icon: CalendarCheck },
  { label: "Payroll", href: "/admin/payroll", icon: Banknote },
  { label: "Kasbon", href: "/admin/kasbon", icon: WalletCards },
];

const SUPERADMIN_ITEMS: NavItem[] = [
  { label: "Beranda", href: "/superadmin/dashboard", icon: Home },
  { label: "Klien", href: "/superadmin/klien", icon: Building2 },
  { label: "Project", href: "/superadmin/project", icon: Users2 },
  { label: "MOU", href: "/superadmin/mou", icon: FileText },
  { label: "Audit", href: "/superadmin/audit", icon: History },
];

const inTab = (pathname: string, item: NavItem) =>
  [item.href, ...(item.also ?? [])].some((p) => pathname === p || pathname.startsWith(p + "/"));

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  // tab yang baru ditekan: indikator langsung bergeser tanpa menunggu halaman tujuan selesai dimuat
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => setPending(null), [pathname]);

  if (!user) return null;

  const items = user.role === "PEGAWAI" ? PEGAWAI_ITEMS : user.role === "ADMIN" ? ADMIN_ITEMS : SUPERADMIN_ITEMS;
  const routeIndex = items.findIndex((i) => inTab(pathname, i));
  const pendingIndex = pending ? items.findIndex((i) => i.href === pending) : -1;
  const activeIndex = pendingIndex >= 0 ? pendingIndex : routeIndex;

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="m-glass md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] safe-area-pb"
    >
      <div className="relative mx-auto flex max-w-lg items-stretch px-1">
        <span
          aria-hidden
          className="nav-indicator"
          style={{
            width: `${100 / items.length}%`,
            transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
            opacity: activeIndex < 0 ? 0 : 1,
          }}
        >
          <span />
        </span>

        {items.map((item, idx) => {
          const Icon = item.icon;
          const active = idx === activeIndex;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-current={active ? "page" : undefined}
              onClick={() => setPending(item.href)}
              className="press group relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-0.5 pt-1"
            >
              <span className="relative">
                <Icon
                  strokeWidth={active ? 2.4 : 1.9}
                  className={`h-[22px] w-[22px] transition-all duration-200 ${
                    active ? "-translate-y-0.5 scale-110 text-[var(--teal)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                  }`}
                />
                {item.badge && (
                  <span className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--danger)] ring-2 ring-[var(--surface)]" aria-label="Ada notifikasi baru" />
                )}
              </span>
              <span
                className={`text-[11px] leading-none transition-colors duration-200 ${
                  active ? "font-semibold text-[var(--text-primary)]" : "font-medium text-[var(--text-muted)]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
