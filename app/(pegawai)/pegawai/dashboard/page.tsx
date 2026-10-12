"use client";

import React from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Receipt, WalletCards } from "lucide-react";
import { useAuth } from "@/lib/mock-auth";
import { MOCK_EMPLOYEES } from "@/lib/mock-data/employees";
import { MOCK_LEAVE_BALANCES, MOCK_LEAVE_REQUESTS } from "@/lib/mock-data/leave";
import { MOCK_PAYROLL_ITEMS } from "@/lib/mock-data/payroll";
import { MOCK_KASBON_TRANSACTIONS } from "@/lib/mock-data/kasbon";
import { MOCK_ANNOUNCEMENTS } from "@/lib/mock-data/announcements";
import { formatRupiah } from "@/lib/formatters";
import { AttendanceHero } from "@/components/pegawai/AttendanceHero";
import { MenuGrid } from "@/components/pegawai/MenuGrid";
import { RecentRequests } from "@/components/pegawai/RecentRequests";
import { AnnouncementCarousel } from "@/components/pegawai/AnnouncementCarousel";

function SectionHead({ title, href, action = "Lihat semua" }: { title: string; href?: string; action?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
      {href && (
        <Link href={href} className="press-sm flex items-center gap-0.5 text-[13px] font-semibold text-[var(--teal)]">
          {action} <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function Tile({ icon, label, value, hint, i }: { icon: React.ReactNode; label: string; value: string; hint: string; i: number }) {
  return (
    <div className="m-card anim-in min-w-[168px] flex-1 p-4" style={{ "--i": i } as React.CSSProperties}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--grad-soft)] text-[var(--teal)]">{icon}</span>
      <p className="mt-3 text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p className="mt-0.5 text-lg font-extrabold tabular-nums tracking-tight text-[var(--text-primary)]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{hint}</p>
    </div>
  );
}

export default function PegawaiDashboardPage() {
  const { user } = useAuth();
  const empId = user?.employeeId || "emp-1";

  // Data terisolasi: hanya milik pegawai yang sedang login (demo; nanti dari API)
  const employee = MOCK_EMPLOYEES.find((e) => e.id === empId) || MOCK_EMPLOYEES[0];
  const leaveBalance = MOCK_LEAVE_BALANCES[empId] || { annualQuota: 12, usedDays: 4, remainingDays: 8 };
  const latestPayroll = MOCK_PAYROLL_ITEMS.find((p) => p.employeeId === empId);
  const totalKasbon = MOCK_KASBON_TRANSACTIONS.filter((k) => k.employeeId === empId && k.periodCode === "2026-03").reduce((acc, k) => acc + k.amount, 0);
  const requests = MOCK_LEAVE_REQUESTS.filter((r) => r.employeeId === empId)
    .sort((a, b) => b.appliedDate.localeCompare(a.appliedDate))
    .slice(0, 3);
  const firstName = employee.name.split(" ")[0];

  return (
    <div className="space-y-7">
      <header className="anim-in">
        <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--text-primary)]">Halo, {firstName} 👋</h1>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          {employee.position} · {employee.clientName}
        </p>
      </header>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8">
        <div className="space-y-7">
          <AttendanceHero employeeId={empId} greetingName={firstName} />

          <section>
            <SectionHead title="Menu Utama" href="/pegawai/menu" action="Semua" />
            <MenuGrid />
          </section>

          <section aria-label="Ringkasan">
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
              <Tile i={0} icon={<CalendarDays className="h-[18px] w-[18px]" />} label="Sisa cuti tahunan" value={`${leaveBalance.remainingDays} hari`} hint={`dari kuota ${leaveBalance.annualQuota} hari`} />
              <Tile i={1} icon={<Receipt className="h-[18px] w-[18px]" />} label="Gaji bersih" value={formatRupiah(latestPayroll?.netSalary || 0)} hint="Periode Maret 2026" />
              <Tile i={2} icon={<WalletCards className="h-[18px] w-[18px]" />} label="Potongan kasbon" value={formatRupiah(totalKasbon)} hint="dari Gajiku, otomatis" />
            </div>
          </section>
        </div>

        <div className="space-y-7">
          <section>
            <SectionHead title="Pengajuan Terbaru" href="/pegawai/cuti" />
            <RecentRequests items={requests} />
          </section>

          <section>
            <SectionHead title="Pengumuman" />
            <AnnouncementCarousel items={MOCK_ANNOUNCEMENTS} />
          </section>
        </div>
      </div>
    </div>
  );
}
