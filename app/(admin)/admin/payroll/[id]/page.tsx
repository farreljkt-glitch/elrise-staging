"use client";

// Dynamic route rincian payroll per pegawai Admin
// Client Component untuk interaksi detail rincian.

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MOCK_PAYROLL_PERIODS, MOCK_PAYROLL_ITEMS } from "@/lib/mock-data/payroll";
import { PayrollItem } from "@/lib/types";
import { formatRupiah } from "@/lib/formatters";
import { ArrowLeft, Eye, DollarSign, WalletCards } from "lucide-react";

export default function AdminPayrollDetailPage() {
  const params = useParams();
  const periodId = params?.id as string;

  const period =
    MOCK_PAYROLL_PERIODS.find((p) => p.id === periodId) || MOCK_PAYROLL_PERIODS[0];
  const items = MOCK_PAYROLL_ITEMS.filter((i) => i.payrollPeriodId === period.id);

  const [selectedItem, setSelectedItem] = useState<PayrollItem | null>(null);

  const columns: Column<PayrollItem>[] = [
    {
      header: "Nama Pegawai",
      cell: (row) => (
        <div>
          <span className="font-semibold text-[var(--text-primary)] block">{row.employeeName}</span>
          <span className="text-xs font-mono text-[var(--teal)]">{row.employeeCode}</span>
        </div>
      ),
    },
    {
      header: "Gaji Pokok",
      cell: (row) => (
        <span className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
          {formatRupiah(row.basicSalary)}
        </span>
      ),
    },
    {
      header: "Total Tunjangan",
      cell: (row) => (
        <span className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
          {formatRupiah(row.fixedAllowance + row.mealAllowance + row.transportAllowance + row.overtimePay)}
        </span>
      ),
    },
    {
      header: "Potongan Kasbon",
      cell: (row) => (
        <span className="font-mono text-xs text-[var(--warning)] tabular-nums">
          {row.kasbonDeduction > 0 ? `-${formatRupiah(row.kasbonDeduction)}` : "-"}
        </span>
      ),
    },
    {
      header: "Potongan Alpha/Lain",
      cell: (row) => (
        <span className="font-mono text-xs text-[var(--danger)] tabular-nums">
          {row.alphaDeduction + row.otherDeductions > 0
            ? `-${formatRupiah(row.alphaDeduction + row.otherDeductions)}`
            : "-"}
        </span>
      ),
    },
    {
      header: "Gaji Bersih (Net)",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-[var(--teal)] tabular-nums">
          {formatRupiah(row.netSalary)}
        </span>
      ),
    },
    {
      header: "Aksi",
      align: "right",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedItem(row)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Rincian
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Rincian Payroll — ${period.periodName}`}
        description={`Daftar penghasilan bruto, rincian potongan, dan gaji bersih pegawai (${period.salaryCycle}).`}
        breadcrumbs={[
          { label: "Admin" },
          { label: "Payroll", href: "/admin/payroll" },
          { label: period.periodName },
        ]}
        badge={<Badge variant="warning">{period.status}</Badge>}
        action={
          <Link href="/admin/payroll">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Kembali ke Daftar Periode
            </Button>
          </Link>
        }
      />

      {/* Tabel */}
      <Table
        columns={columns}
        data={items.length > 0 ? items : MOCK_PAYROLL_ITEMS.slice(0, 3)}
        keyExtractor={(row) => row.id}
        emptyTitle="Tidak Ada Item Payroll"
        emptyDescription="Belum ada data rincian gaji untuk periode ini."
      />

      {/* Modal Detail Komponen Slip Gaji */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Rincian Komponen Gaji Pegawai"
        description={`${selectedItem?.employeeName} (${selectedItem?.employeeCode})`}
      >
        {selectedItem && (
          <div className="space-y-4 text-xs">
            {/* Pendapatan */}
            <div className="p-3.5 rounded-xl bg-[var(--surface-2)] space-y-2">
              <span className="text-[var(--teal)] font-semibold uppercase text-[10px] tracking-wider block">
                Komponen Pendapatan (Earnings)
              </span>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Gaji Pokok</span>
                <span className="text-[var(--text-primary)] font-mono">{formatRupiah(selectedItem.basicSalary)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Tunjangan Tetap</span>
                <span className="text-[var(--text-primary)] font-mono">{formatRupiah(selectedItem.fixedAllowance)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Tunjangan Makan</span>
                <span className="text-[var(--text-primary)] font-mono">{formatRupiah(selectedItem.mealAllowance)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Tunjangan Transport</span>
                <span className="text-[var(--text-primary)] font-mono">{formatRupiah(selectedItem.transportAllowance)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Upah Lembur</span>
                <span className="text-[var(--text-primary)] font-mono">{formatRupiah(selectedItem.overtimePay)}</span>
              </div>
              <div className="flex justify-between pt-1 font-semibold text-[var(--text-primary)]">
                <span>Total Bruto</span>
                <span className="font-mono text-[var(--teal)]">{formatRupiah(selectedItem.totalEarnings)}</span>
              </div>
            </div>

            {/* Potongan */}
            <div className="p-3.5 rounded-xl bg-[var(--surface-2)] space-y-2">
              <span className="text-[var(--danger)] font-semibold uppercase text-[10px] tracking-wider block">
                Komponen Potongan (Deductions)
              </span>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Potongan Kasbon Gajiku</span>
                <span className="text-[var(--warning)] font-mono">{formatRupiah(selectedItem.kasbonDeduction)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Potongan Alpha / Terlambat</span>
                <span className="text-[var(--danger)] font-mono">{formatRupiah(selectedItem.alphaDeduction)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Iuran BPJS / Lainnya</span>
                <span className="text-[var(--danger)] font-mono">{formatRupiah(selectedItem.otherDeductions)}</span>
              </div>
              <div className="flex justify-between pt-1 font-semibold text-[var(--text-primary)]">
                <span>Total Potongan</span>
                <span className="font-mono text-[var(--danger)]">-{formatRupiah(selectedItem.totalDeductions)}</span>
              </div>
            </div>

            {/* Net Total */}
            <div className="p-3.5 rounded-xl bg-[var(--teal)]/15 border border-[var(--teal)]/30 flex items-center justify-between">
              <span className="text-sm font-bold text-[var(--text-primary)]">Gaji Bersih Ditransfer (Take Home Pay)</span>
              <span className="text-base font-extrabold font-mono text-[var(--teal)] tabular-nums">
                {formatRupiah(selectedItem.netSalary)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
