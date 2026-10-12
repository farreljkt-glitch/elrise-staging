"use client";

// Dynamic route detail pegawai Admin
// Client Component karena memiliki navigasi tab dan state view.

import React, { useState } from "react";
import { SALARY_CYCLE_LABELS } from "@/lib/constants";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MOCK_EMPLOYEES } from "@/lib/mock-data/employees";
import { MOCK_ATTENDANCE } from "@/lib/mock-data/attendance";
import { MOCK_LEAVE_REQUESTS, MOCK_LEAVE_BALANCES } from "@/lib/mock-data/leave";
import { MOCK_PAYROLL_ITEMS } from "@/lib/mock-data/payroll";
import { formatRupiah, formatDate, maskAccountNumber } from "@/lib/formatters";
import {
  ArrowLeft,
  User,
  Briefcase,
  CreditCard,
  DollarSign,
  CalendarCheck,
  CalendarDays,
  FileText,
  Mail,
  Phone,
  Building2,
} from "lucide-react";

export default function EmployeeDetailPage() {
  const params = useParams();
  const empId = params?.id as string;
  const employee = MOCK_EMPLOYEES.find((e) => e.id === empId) || MOCK_EMPLOYEES[0];

  const [activeTab, setActiveTab] = useState<"profil" | "absensi" | "cuti" | "payroll">("profil");

  const empAttendance = MOCK_ATTENDANCE.filter((a) => a.employeeId === employee.id);
  const empLeaves = MOCK_LEAVE_REQUESTS.filter((l) => l.employeeId === employee.id);
  const empLeaveBalance = MOCK_LEAVE_BALANCES[employee.id] || {
    annualQuota: 12,
    usedDays: 0,
    remainingDays: 12,
  };
  const empPayrolls = MOCK_PAYROLL_ITEMS.filter((p) => p.employeeId === employee.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee.name}
        description={`${employee.position} · ${employee.projectName}`}
        breadcrumbs={[
          { label: "Admin" },
          { label: "Pegawai", href: "/admin/pegawai" },
          { label: employee.name },
        ]}
        badge={
          <Badge
            variant={employee.status === "TETAP" ? "success" : "info"}
            dot
          >
            {employee.status}
          </Badge>
        }
        action={
          <Link href="/admin/pegawai">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Kembali
            </Button>
          </Link>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] overflow-x-auto">
        {(
          [
            { key: "profil", label: "Data Pribadi & Payroll" },
            { key: "absensi", label: `Riwayat Absensi (${empAttendance.length})` },
            { key: "cuti", label: `Riwayat Cuti (${empLeaves.length})` },
            { key: "payroll", label: `Slip Gaji (${empPayrolls.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === t.key
                ? "bg-[var(--surface-3)] text-[var(--text-primary)] shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Profil & Payroll */}
      {activeTab === "profil" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Data Pribadi & Pekerjaan" description="Informasi kepegawaian resmi">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">ID Pegawai</span>
                <span className="font-mono text-[var(--teal)] font-bold">{employee.employeeCode}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Email</span>
                <span className="text-[var(--text-primary)] font-mono">{employee.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Nomor WhatsApp</span>
                <span className="text-[var(--text-primary)] font-mono">{employee.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Departemen</span>
                <span className="text-[var(--text-primary)]">{employee.department}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Lokasi Kerja</span>
                <span className="text-[var(--text-primary)]">{employee.projectName}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[var(--text-muted)]">Tanggal Bergabung</span>
                <span className="text-[var(--text-primary)] font-mono">{formatDate(employee.joinDate)}</span>
              </div>
            </div>
          </Card>

          <Card title="Kompensasi & Rekening Bank" description="Struktur gaji pokok dan pencairan">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Gaji Pokok</span>
                <span className="text-[var(--text-primary)] font-mono font-bold text-sm">
                  {formatRupiah(employee.basicSalary)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Tunjangan Tetap</span>
                <span className="text-[var(--text-primary)] font-mono">{formatRupiah(employee.fixedAllowance)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Tunjangan Makan</span>
                <span className="text-[var(--text-primary)] font-mono">{formatRupiah(employee.mealAllowance)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Tunjangan Transport</span>
                <span className="text-[var(--text-primary)] font-mono">{formatRupiah(employee.transportAllowance)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Siklus Penggajian</span>
                <span className="text-[var(--blue)] font-semibold">
                  {SALARY_CYCLE_LABELS[employee.salaryCycle] ?? employee.salaryCycle}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[var(--text-muted)]">Rekening {employee.bankName}</span>
                <span className="text-[var(--text-primary)] font-mono font-semibold">
                  {employee.bankAccount}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Riwayat Absensi */}
      {activeTab === "absensi" && (
        <Card title="Riwayat Absensi Pegawai" description="Catatan kehadiran dan verifikasi sensor">
          {empAttendance.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-4 text-center">Belum ada riwayat absensi.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {empAttendance.map((att) => (
                <div key={att.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)] font-mono">{formatDate(att.date)}</span>
                      <Badge size="sm" variant={att.status === "HADIR" ? "success" : "warning"}>
                        {att.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[var(--text-muted)] font-mono text-[11px]">
                      <span>Masuk: {att.checkInTime || "-"}</span>
                      <span>Keluar: {att.checkOutTime || "-"}</span>
                      <span>GPS: {att.gpsAccuracyMeters}m</span>
                    </div>
                  </div>
                  {att.isSuspicious && (
                    <Badge size="sm" variant="danger">
                      Mencurigakan
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: Riwayat Cuti */}
      {activeTab === "cuti" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[var(--surface-2)] text-center">
              <span className="text-[11px] text-[var(--text-muted)] block">Kuota Cuti</span>
              <span className="text-xl font-bold text-[var(--text-primary)] font-mono">
                {empLeaveBalance.annualQuota} Hari
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface-2)] text-center">
              <span className="text-[11px] text-[var(--text-muted)] block">Cuti Terpakai</span>
              <span className="text-xl font-bold text-[var(--warning)] font-mono">
                {empLeaveBalance.usedDays} Hari
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface-2)] text-center">
              <span className="text-[11px] text-[var(--text-muted)] block">Sisa Saldo</span>
              <span className="text-xl font-bold text-[var(--teal)] font-mono">
                {empLeaveBalance.remainingDays} Hari
              </span>
            </div>
          </div>

          <Card title="Daftar Pengajuan Cuti">
            {empLeaves.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">Belum ada pengajuan cuti.</p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {empLeaves.map((leave) => (
                  <div key={leave.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-primary)]">{leave.type} ({leave.totalDays} hari)</span>
                        <Badge
                          size="sm"
                          variant={leave.status === "APPROVED" ? "success" : leave.status === "PENDING" ? "warning" : "danger"}
                        >
                          {leave.status}
                        </Badge>
                      </div>
                      <p className="text-[var(--text-secondary)] mt-0.5">{leave.reason}</p>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      {leave.startDate} s/d {leave.endDate}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: Slip Gaji */}
      {activeTab === "payroll" && (
        <Card title="Riwayat Pembayaran Slip Gaji">
          {empPayrolls.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-4 text-center">Belum ada slip gaji.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {empPayrolls.map((slip) => (
                <div key={slip.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] text-sm">
                      Periode {slip.payrollPeriodId.includes("feb") ? "Februari 2026" : "Maret 2026"}
                    </span>
                    <div className="flex items-center gap-3 mt-1 text-[var(--text-muted)]">
                      <span>Bruto: {formatRupiah(slip.totalEarnings)}</span>
                      <span>Potongan: {formatRupiah(slip.totalDeductions)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-[var(--teal)] block tabular-nums">
                      {formatRupiah(slip.netSalary)}
                    </span>
                    <Badge size="sm" variant={slip.status === "PAID" ? "success" : "warning"}>
                      {slip.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
