"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { MOCK_CLIENTS } from "@/lib/mock-data/clients";
import { MOCK_AUDIT_LOGS } from "@/lib/mock-data/audit";
import { formatRupiah, formatDateTime } from "@/lib/formatters";
import {
  Building2,
  Users,
  ShieldAlert,
  Wallet,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Plus,
} from "lucide-react";

export default function SuperadminDashboardPage() {
  const [filterMonth, setFilterMonth] = useState("2026-03");
  const [filterClientStatus, setFilterClientStatus] = useState("ALL");

  const totalClients = MOCK_CLIENTS.length;
  const activeClients = MOCK_CLIENTS.filter((c) => c.status === "AKTIF").length;
  const suspendedClients = MOCK_CLIENTS.filter((c) => c.status === "SUSPEND").length;
  const totalEmployees = MOCK_CLIENTS.reduce((acc, c) => acc + c.employeeCount, 0);
  const totalAdminCount = 2; // dari mock users
  const currentMonthPayroll = 77850000; // total dari 2 klien

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Superadmin"
        description="Ringkasan operasional lintas perusahaan klien, status integrasi Gajiku, dan aktivitas sistem."
        breadcrumbs={[{ label: "Superadmin" }, { label: "Dashboard" }]}
        action={
          <div className="flex items-center gap-2">
            <Link href="/superadmin/klien/tambah">
              <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                Tambah Klien
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-44">
            <Select
              options={[
                { value: "2026-03", label: "Maret 2026" },
                { value: "2026-02", label: "Februari 2026" },
                { value: "2026-01", label: "Januari 2026" },
              ]}
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            />
          </div>
          <div className="w-44">
            <Select
              options={[
                { value: "ALL", label: "Semua Status Klien" },
                { value: "AKTIF", label: "Hanya Aktif" },
                { value: "SUSPEND", label: "Hanya Suspend" },
              ]}
              value={filterClientStatus}
              onChange={(e) => setFilterClientStatus(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--teal)] bg-[var(--teal)]/10 px-3 py-1.5 rounded-lg border border-[var(--teal)]/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Status Sistem: Operasional Normal (Demo)</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Klien Aktif"
          value={activeClients}
          subtext={`${suspendedClients} klien disuspend`}
          icon={<Building2 className="w-4 h-4" />}
          accentColor="blue"
        />
        <StatCard
          label="Total Pegawai Terdaftar"
          value={totalEmployees}
          subtext="Lintas 3 project cabang"
          icon={<Users className="w-4 h-4" />}
          accentColor="teal"
        />
        <StatCard
          label="Payroll Berjalan"
          value={formatRupiah(currentMonthPayroll)}
          subtext="Periode Maret 2026"
          icon={<Wallet className="w-4 h-4" />}
          accentColor="success"
        />
        <StatCard
          label="Integrasi Gajiku"
          value="1 / 2 Klien"
          subtext="Koneksi API & webhook aktif"
          icon={<Activity className="w-4 h-4" />}
          accentColor="warning"
        />
      </div>

      {/* Visual Chart & Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribusi Pegawai per Klien */}
        <Card
          title="Distribusi Pegawai per Perusahaan"
          description="Perbandingan alokasi karyawan aktif di setiap entitas"
          className="lg:col-span-2"
          action={
            <Link href="/superadmin/klien" className="text-xs text-[var(--teal)] hover:underline flex items-center gap-1">
              <span>Kelola Klien</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="space-y-4 py-2">
            {MOCK_CLIENTS.map((client) => {
              const percentage = Math.round((client.employeeCount / totalEmployees) * 100);
              return (
                <div key={client.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-primary)]">{client.name}</span>
                    <span className="text-[var(--text-secondary)] font-mono tabular-nums">
                      {client.employeeCount} Pegawai ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        background: "var(--grad)",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span>{client.projectCount} Project Aktif</span>
                    <span>
                      Gajiku: {client.kasbonIntegration ? "Terhubung" : "Tidak Aktif"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Status Perhatian */}
        <Card
          title="Perlu Perhatian"
          description="Entitas dan konfigurasi yang butuh peninjauan"
        >
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/30 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-[var(--text-primary)]">MOU PT Digital Niaga Jaya</div>
                <p className="text-[var(--text-secondary)] mt-0.5 leading-tight">
                  Integrasi kasbon Gajiku belum diaktifkan oleh admin klien.
                </p>
                <Link
                  href="/superadmin/mou"
                  className="text-[var(--warning)] hover:underline font-medium block mt-1.5"
                >
                  Buka Konfigurasi MOU &rarr;
                </Link>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-[var(--danger)] shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-[var(--text-primary)]">1 Absensi Mencurigakan</div>
                <p className="text-[var(--text-secondary)] mt-0.5 leading-tight">
                  Percobaan absensi di luar radius (+240m) terdeteksi di PT Sumber Makmur Sejahtera.
                </p>
                <Link
                  href="/superadmin/audit"
                  className="text-[var(--blue)] hover:underline font-medium block mt-1.5"
                >
                  Periksa di Audit Log &rarr;
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Log Aktivitas Terkini */}
      <Card
        title="Aktivitas Sistem Lintas Klien"
        description="Audit trail perubahan konfigurasi dan transaksi terbaru"
        action={
          <Link href="/superadmin/audit" className="text-xs text-[var(--teal)] hover:underline flex items-center gap-1">
            <span>Lihat Semua Log</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        }
      >
        <div className="divide-y divide-[var(--border)]">
          {MOCK_AUDIT_LOGS.slice(0, 4).map((log) => (
            <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <div className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    log.status === "SUCCESS"
                      ? "bg-[var(--success)]"
                      : log.status === "WARNING"
                      ? "bg-[var(--warning)]"
                      : "bg-[var(--danger)]"
                  }`}
                />
                <div>
                  <div className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                    <span>{log.userName}</span>
                    <span className="text-[var(--text-muted)]">·</span>
                    <span className="text-[var(--teal)]">{log.clientName || "Sistem"}</span>
                  </div>
                  <p className="text-[var(--text-secondary)] mt-0.5">{log.description}</p>
                </div>
              </div>
              <span className="text-[var(--text-muted)] font-mono text-[11px] shrink-0 sm:text-right">
                {formatDateTime(log.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
