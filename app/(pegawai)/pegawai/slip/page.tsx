"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/mock-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MOCK_PAYROLL_ITEMS } from "@/lib/mock-data/payroll";
import { PayrollItem } from "@/lib/types";
import { formatRupiah } from "@/lib/formatters";
import { Eye, FileText, Download } from "lucide-react";

export default function PegawaiSlipListPage() {
  const { user } = useAuth();
  const empId = user?.employeeId || "emp-1";

  // Hanya slip gaji milik pegawai yang login
  const mySlips = MOCK_PAYROLL_ITEMS.filter((p) => p.employeeId === empId);

  const columns: Column<PayrollItem>[] = [
    {
      header: "Periode Penggajian",
      cell: (row) => (
        <div>
          <span className="font-semibold text-[var(--text-primary)] block">
            {row.payrollPeriodId.includes("feb") ? "Februari 2026" : "Maret 2026"}
          </span>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            {row.payrollPeriodId.includes("feb") ? "Dibayarkan 25 Feb 2026" : "Proses Review"}
          </span>
        </div>
      ),
    },
    {
      header: "Total Pendapatan (Bruto)",
      cell: (row) => (
        <span className="font-mono text-xs text-[var(--text-primary)] tabular-nums">
          {formatRupiah(row.totalEarnings)}
        </span>
      ),
    },
    {
      header: "Total Potongan",
      cell: (row) => (
        <span className="font-mono text-xs text-[var(--danger)] tabular-nums">
          -{formatRupiah(row.totalDeductions)}
        </span>
      ),
    },
    {
      header: "Gaji Bersih (Net)",
      cell: (row) => (
        <span className="font-mono text-sm font-bold text-[var(--teal)] tabular-nums">
          {formatRupiah(row.netSalary)}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge
          size="sm"
          variant={row.status === "PAID" ? "success" : "warning"}
          dot
        >
          {row.status === "PAID" ? "Sudah Dibayar" : "Dalam Review"}
        </Badge>
      ),
    },
    {
      header: "Aksi",
      align: "right",
      cell: (row) => (
        <Link href={`/pegawai/slip/${row.id}`}>
          <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
            Buka Slip
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Slip Gaji Mandiri"
        description="Dokumentasi resmi penghasilan bulanan, rincian tunjangan, dan potongan kasbon Anda."
        breadcrumbs={[{ label: "Pegawai" }, { label: "Slip Gaji" }]}
      />

      <Table
        columns={columns}
        data={mySlips}
        keyExtractor={(row) => row.id}
        emptyTitle="Belum Ada Slip Gaji"
        emptyDescription="Slip gaji bulanan Anda akan muncul di sini setelah diproses oleh HR."
      />
    </div>
  );
}
