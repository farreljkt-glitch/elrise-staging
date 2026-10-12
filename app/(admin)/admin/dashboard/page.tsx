"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/mock-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_EMPLOYEES } from "@/lib/mock-data/employees";
import { MOCK_ATTENDANCE } from "@/lib/mock-data/attendance";
import { MOCK_LEAVE_REQUESTS } from "@/lib/mock-data/leave";
import { MOCK_PAYROLL_PERIODS } from "@/lib/mock-data/payroll";
import { MOCK_KASBON_TRANSACTIONS } from "@/lib/mock-data/kasbon";
import { formatRupiah, formatDateTime } from "@/lib/formatters";
import {
  Users,
  CalendarCheck,
  Clock,
  CalendarDays,
  DollarSign,
  WalletCards,
  UserPlus,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const clientId = user?.clientId || "client-1";

  // Data terisolasi untuk klien admin
  const employees = MOCK_EMPLOYEES.filter((e) => e.clientId === clientId);
  const attendanceToday = MOCK_ATTENDANCE.filter((a) => a.clientId === clientId);
  const pendingLeaves = MOCK_LEAVE_REQUESTS.filter(
    (l) => l.clientId === clientId && l.status === "PENDING"
  );
  const activePayroll = MOCK_PAYROLL_PERIODS.find(
    (p) => p.clientId === clientId && p.periodCode === "2026-03"
  );
  const kasbonCurrent = MOCK_KASBON_TRANSACTIONS.filter(
    (k) => k.clientId === clientId && k.periodCode === "2026-03"
  );
  const totalKasbon = kasbonCurrent.reduce((sum, k) => sum + k.amount, 0);

  const hadirCount = attendanceToday.filter((a) => a.status === "HADIR").length;
  const telatCount = attendanceToday.filter((a) => a.status === "TELAT").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard HR — ${user?.clientName || "PT Sumber Makmur Sejahtera"}`}
        description="Ringkasan kehadiran hari ini, approval cuti, kalkulasi payroll periode berjalan, dan kasbon terhubung."
        breadcrumbs={[{ label: "Admin" }, { label: "Dashboard" }]}
        action={
          <div className="flex items-center gap-2">
            <Link href="/admin/pegawai/tambah">
              <Button size="sm" variant="primary" leftIcon={<UserPlus className="w-4 h-4" />}>
                Tambah Pegawai
              </Button>
            </Link>
          </div>
        }
      />

      {/* Quick Action Ribbon */}
      <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between gap-3 overflow-x-auto">
        <span className="text-xs font-semibold text-[var(--text-secondary)] whitespace-nowrap hidden sm:inline">
          Aksi Cepat:
        </span>
        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          <Link href="/admin/pegawai/tambah">
            <Button size="sm" variant="outline" className="text-xs">
              + Pegawai Baru
            </Button>
          </Link>
          <Link href="/admin/absensi">
            <Button size="sm" variant="secondary" className="text-xs">
              Review Absensi
            </Button>
          </Link>
          <Link href="/admin/cuti">
            <Button size="sm" variant="secondary" className="text-xs">
              Review Cuti ({pendingLeaves.length})
            </Button>
          </Link>
          <Link href="/admin/payroll">
            <Button size="sm" variant="secondary" className="text-xs">
              Kelola Payroll
            </Button>
          </Link>
          <Link href="/admin/kasbon">
            <Button size="sm" variant="outline" className="text-xs text-[var(--teal)]">
              Rekonsiliasi Kasbon
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Pegawai Aktif"
          value={employees.length}
          subtext="Total tenaga kerja"
          icon={<Users className="w-4 h-4" />}
          accentColor="blue"
        />
        <StatCard
          label="Hadir Hari Ini"
          value={hadirCount}
          subtext="Tepat waktu"
          icon={<CalendarCheck className="w-4 h-4" />}
          accentColor="success"
        />
        <StatCard
          label="Terlambat"
          value={telatCount}
          subtext="Perlu perhatian"
          icon={<Clock className="w-4 h-4" />}
          accentColor="warning"
        />
        <StatCard
          label="Cuti Menunggu"
          value={pendingLeaves.length}
          subtext="Menunggu HR"
          icon={<CalendarDays className="w-4 h-4" />}
          accentColor="info"
        />
        <StatCard
          label="Payroll Berjalan"
          value={formatRupiah(activePayroll?.totalNet || 0)}
          subtext="Status: Review"
          icon={<DollarSign className="w-4 h-4" />}
          accentColor="teal"
        />
        <StatCard
          label="Kasbon Gajiku"
          value={formatRupiah(totalKasbon)}
          subtext={`${kasbonCurrent.length} transaksi`}
          icon={<WalletCards className="w-4 h-4" />}
          accentColor="blue"
        />
      </div>

      {/* Grafik Kehadiran 7 Hari & Quick Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Absensi 7 Hari */}
        <Card
          title="Tren Kehadiran Mingguan (7 Hari Terakhir)"
          description="Rasio kehadiran tepat waktu vs keterlambatan karyawan"
          className="lg:col-span-2"
          action={
            <Link href="/admin/absensi" className="text-xs text-[var(--teal)] hover:underline flex items-center gap-1">
              <span>Detail Log Absensi</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="pt-4 pb-2">
            <div className="grid grid-cols-7 gap-2 sm:gap-4 text-center items-end h-44">
              {[
                { day: "Sen", hadir: 5, telat: 0, alpha: 0, date: "23 Mar" },
                { day: "Sel", hadir: 4, telat: 1, alpha: 0, date: "24 Mar" },
                { day: "Rab", hadir: 4, telat: 0, alpha: 1, date: "25 Mar" },
                { day: "Kam", hadir: 5, telat: 0, alpha: 0, date: "26 Mar" },
                { day: "Jum", hadir: 3, telat: 1, alpha: 0, date: "27 Mar" },
                { day: "Sab", hadir: 0, telat: 0, alpha: 0, date: "28 Mar", isOff: true },
                { day: "Min", hadir: 0, telat: 0, alpha: 0, date: "29 Mar", isOff: true },
              ].map((item, idx) => {
                const total = item.hadir + item.telat;
                const barHeightPercent = item.isOff ? 8 : Math.max(20, (total / 5) * 100);

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-mono tabular-nums text-[var(--text-muted)] group-hover:text-[var(--text-primary)] mb-1.5">
                      {item.isOff ? "-" : `${total}/5`}
                    </span>
                    <div className="w-full max-w-[28px] bg-[var(--surface-3)] rounded-t-lg overflow-hidden flex flex-col justify-end h-32">
                      <div
                        className="w-full rounded-t-lg transition-all duration-300"
                        style={{
                          height: `${barHeightPercent}%`,
                          background: item.isOff
                            ? "var(--surface-3)"
                            : item.telat > 0
                            ? "linear-gradient(to top, var(--blue), var(--warning))"
                            : "linear-gradient(to top, var(--blue), var(--teal))",
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-primary)] mt-2">{item.day}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{item.date}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[var(--teal)]" />
                <span>Hadir Tepat Waktu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[var(--warning)]" />
                <span>Terlambat</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[var(--surface-3)]" />
                <span>Hari Libur</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Antrean Approval Cuti */}
        <Card
          title="Pengajuan Cuti Menunggu"
          description="Permohonan yang memerlukan konfirmasi HR"
          action={
            <Link href="/admin/cuti" className="text-xs text-[var(--teal)] hover:underline flex items-center gap-1">
              <span>Semua Cuti</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          {pendingLeaves.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--text-muted)]">
              Tidak ada pengajuan cuti yang tertunda.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {pendingLeaves.map((leave) => (
                <div key={leave.id} className="py-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--text-primary)]">{leave.employeeName}</span>
                    <Badge size="sm" variant="warning">
                      {leave.totalDays} Hari
                    </Badge>
                  </div>
                  <p className="text-[var(--text-secondary)] text-[11px] leading-snug">
                    &ldquo;{leave.reason}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {leave.startDate} s/d {leave.endDate}
                    </span>
                    <Link href="/admin/cuti">
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-[var(--teal)]">
                        Tinjau &rarr;
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Alert Absensi Mencurigakan Jika Ada */}
      {attendanceToday.some((a) => a.isSuspicious) && (
        <div className="p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[var(--danger)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--text-primary)] block font-semibold">
                Perhatian: Terdapat 1 Absensi dengan Flag Mencurigakan Hari Ini
              </strong>
              <p className="text-[var(--text-secondary)] mt-0.5">
                Pegawai <span className="text-[var(--text-primary)] font-medium">Rian Pratama</span> terdeteksi melakukan check-in dengan akurasi GPS buruk (+240m di luar batas radius kantor).
              </p>
            </div>
          </div>
          <Link href="/admin/absensi">
            <Button size="sm" variant="danger" className="shrink-0 text-xs">
              Investigasi Absensi
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
