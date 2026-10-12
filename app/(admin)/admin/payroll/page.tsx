"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SALARY_CYCLE_LABELS } from "@/lib/constants";
import { useAuth } from "@/lib/mock-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { MOCK_PAYROLL_PERIODS } from "@/lib/mock-data/payroll";
import { PayrollPeriod } from "@/lib/types";
import { formatRupiah, formatDate } from "@/lib/formatters";
import {
  DollarSign,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Eye,
  FileCheck,
  Calculator,
} from "lucide-react";

export default function AdminPayrollPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const clientId = user?.clientId || "client-1";

  const [periods, setPeriods] = useState<PayrollPeriod[]>(
    MOCK_PAYROLL_PERIODS.filter((p) => p.clientId === clientId)
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPeriodMonth, setNewPeriodMonth] = useState("2026-04");
  const [newPeriodCycle, setNewPeriodCycle] = useState("SIKLUS_A");

  const handleCreatePeriod = () => {
    const newPeriod: PayrollPeriod = {
      id: `pay-period-${Date.now()}`,
      clientId,
      clientName: user?.clientName || "PT Sumber Makmur Sejahtera",
      periodName: "April 2026",
      periodCode: newPeriodMonth,
      salaryCycle: newPeriodCycle as any,
      employeeCount: 3,
      totalGross: 29550000,
      totalDeductions: 500000,
      totalNet: 29050000,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
    };

    setPeriods([newPeriod, ...periods]);
    showToast("success", "Draft Periode Dibuat", "Kalkulasi payroll awal berhasil dihitung secara otomatis.");
    setIsCreateModalOpen(false);
  };

  const handleLockPeriod = (periodId: string) => {
    setPeriods((prev) =>
      prev.map((p) => (p.id === periodId ? { ...p, status: "LOCKED" } : p))
    );
    showToast("info", "Periode Dikunci", "Payroll terkunci. Data tidak dapat diubah kembali.");
  };

  // Safety: this page currently uses mock payroll records. A browser-only
  // status change must never be presented as an actual bank payment.
  const handleMarkPaid = (_periodId: string) => {
    showToast("warning", "Pembayaran belum tersedia", "Status PAID hanya boleh ditetapkan oleh backend setelah verifikasi transfer dan otorisasi.");
  };

  const columns: Column<PayrollPeriod>[] = [
    {
      header: "Periode & Siklus",
      cell: (row) => (
        <div>
          <Link
            href={`/admin/payroll/${row.id}`}
            className="font-semibold text-[var(--text-primary)] hover:text-[var(--teal)] transition-colors block"
          >
            {row.periodName}
          </Link>
          <span className="text-xs font-mono text-[var(--blue)]">
            {SALARY_CYCLE_LABELS[row.salaryCycle] ?? row.salaryCycle}
          </span>
        </div>
      ),
    },
    {
      header: "Pegawai",
      cell: (row) => (
        <span className="font-mono text-[var(--text-primary)] tabular-nums">{row.employeeCount} Orang</span>
      ),
    },
    {
      header: "Total Bruto",
      cell: (row) => (
        <span className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
          {formatRupiah(row.totalGross)}
        </span>
      ),
    },
    {
      header: "Potongan & Kasbon",
      cell: (row) => (
        <span className="font-mono text-xs text-[var(--danger)] tabular-nums">
          -{formatRupiah(row.totalDeductions)}
        </span>
      ),
    },
    {
      header: "Gaji Bersih (Neto)",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-[var(--teal)] tabular-nums">
          {formatRupiah(row.totalNet)}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge
          size="sm"
          variant={
            row.status === "PAID"
              ? "success"
              : row.status === "LOCKED"
              ? "info"
              : row.status === "REVIEW"
              ? "warning"
              : "neutral"
          }
          dot
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Aksi",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link href={`/admin/payroll/${row.id}`}>
            <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
              Rincian
            </Button>
          </Link>

          {row.status === "REVIEW" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLockPeriod(row.id)}
              leftIcon={<Lock className="w-3.5 h-3.5" />}
            >
              Kunci
            </Button>
          )}

          {row.status === "LOCKED" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleMarkPaid(row.id)}
              className="bg-emerald-600 hover:bg-emerald-500"
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Verifikasi Pembayaran
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penggajian & Payroll"
        description="Kelola batch periode gaji bulanan, integrasi potongan kasbon Gajiku, serta penguncian slip gaji resmi."
        breadcrumbs={[{ label: "Admin" }, { label: "Payroll" }]}
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Buat Periode Baru
          </Button>
        }
      />

      {/* Ketentuan Keamanan & Aturan Payroll */}
      <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-3 text-xs text-[var(--text-secondary)]">
        <AlertTriangle className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="block text-[var(--text-primary)] mb-0.5 font-semibold">
            Aturan Baku Pembayaran Payroll & Kasbon:
          </strong>
          1. Periode yang berstatus <strong className="text-[var(--teal)] font-mono">LOCKED</strong> tidak dapat dihitung ulang secara otomatis.
          2. Transaksi kasbon Gajiku yang sukses sebelum tanggal cut-off otomatis ditarik sebagai komponen potongan gaji.
          3. Perubahan data pegawai setelah periode dikunci tidak akan merevisi nilai gaji periode tersebut.
        </div>
      </div>

      {/* Tabel */}
      <Table
        columns={columns}
        data={periods}
        keyExtractor={(row) => row.id}
        emptyTitle="Belum Ada Periode Payroll"
        emptyDescription="Klik tombol 'Buat Periode Baru' untuk memulai kalkulasi gaji."
      />

      {/* Modal Buat Periode */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Periode Payroll Baru"
        description="Sistem akan otomatis menghitung akumulasi absensi, denda alpha/terlambat, dan potongan kasbon periode tersebut."
        footer={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleCreatePeriod}
              leftIcon={<Calculator className="w-4 h-4" />}
            >
              Hitung Draft Sekarang
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Bulan Periode"
            value={newPeriodMonth}
            onChange={(e) => setNewPeriodMonth(e.target.value)}
            options={[
              { value: "2026-04", label: "April 2026" },
              { value: "2026-05", label: "Mei 2026" },
            ]}
          />
          <Select
            label="Siklus Penggajian"
            value={newPeriodCycle}
            onChange={(e) => setNewPeriodCycle(e.target.value)}
            options={[
              { value: "SIKLUS_A", label: "Siklus A (periode mulai tgl 1)" },
              { value: "SIKLUS_B", label: "Siklus B (periode mulai tgl 16)" },
              { value: "SIKLUS_C", label: "Siklus C (periode mulai tgl 21)" },
              { value: "SIKLUS_D", label: "Siklus D (periode mulai tgl 26)" },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
