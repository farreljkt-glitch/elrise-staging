"use client";

// Halaman Detail Slip Gaji Print-Friendly
// Dilengkapi styling media print dan tombol window.print()

import React from "react";
import { SALARY_CYCLE_LABELS } from "@/lib/constants";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/mock-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/brand/Logo";
import { useToast } from "@/components/ui/Toast";
import { MOCK_PAYROLL_ITEMS } from "@/lib/mock-data/payroll";
import { MOCK_EMPLOYEES } from "@/lib/mock-data/employees";
import { formatRupiah, formatDate } from "@/lib/formatters";
import { Printer, Download, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function PegawaiSlipDetailPage() {
  const params = useParams();
  const slipId = params?.id as string;
  const { user } = useAuth();
  const { showToast } = useToast();

  const slip =
    MOCK_PAYROLL_ITEMS.find((s) => s.id === slipId) || MOCK_PAYROLL_ITEMS[0];
  const employee =
    MOCK_EMPLOYEES.find((e) => e.id === slip.employeeId) || MOCK_EMPLOYEES[0];

  const periodTitle = slip.payrollPeriodId.includes("feb")
    ? "Februari 2026"
    : "Maret 2026";

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    showToast(
      "info",
      "Mode Demo",
      "Fitur unduh PDF langsung menghasilkan dokumen print dialog browser."
    );
    window.print();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header navigasi (sembunyi saat dicetak) */}
      <div className="print:hidden">
        <PageHeader
          title={`Slip Gaji — ${periodTitle}`}
          description={`Dokumen resmi bukti pembayaran gaji karyawan (${employee.name}).`}
          breadcrumbs={[
            { label: "Pegawai" },
            { label: "Slip Gaji", href: "/pegawai/slip" },
            { label: periodTitle },
          ]}
          action={
            <div className="flex items-center gap-2">
              <Link href="/pegawai/slip">
                <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Kembali
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Unduh PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Cetak Slip
              </Button>
            </div>
          }
        />
      </div>

      {/* DOKUMEN SLIP GAJI PRINTABLE CONTAINER */}
      <div className="p-8 sm:p-10 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Kop Surat / Header Slip */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-[var(--border)] print:border-black/20 gap-4">
          <div>
            <Logo variant="full" size="md" />
            <span className="text-xs text-[var(--text-muted)] print:text-gray-600 block mt-2">
              Sistem HRIS & Pendamping Gajiku-Live
            </span>
          </div>

          <div className="text-left sm:text-right">
            <h2 className="text-lg font-bold text-[var(--text-primary)] print:text-black uppercase tracking-wider">
              SLIP GAJI KARYAWAN
            </h2>
            <span className="text-xs font-mono text-[var(--teal)] print:text-black font-semibold block">
              Periode: {periodTitle}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] print:text-gray-500 font-mono">
              Status: {slip.status === "PAID" ? "LUNAS DITRANSFER" : "DALAM REVIEW"}
            </span>
          </div>
        </div>

        {/* Identitas Karyawan */}
        <div className="grid grid-cols-2 gap-4 py-6 border-b border-[var(--border)] print:border-black/20 text-xs">
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-28 text-[var(--text-muted)] print:text-gray-600">Nama Pegawai</span>
              <span className="font-semibold text-[var(--text-primary)] print:text-black">: {employee.name}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-[var(--text-muted)] print:text-gray-600">ID Pegawai</span>
              <span className="font-mono text-[var(--teal)] print:text-black font-semibold">: {employee.employeeCode}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-[var(--text-muted)] print:text-gray-600">Jabatan</span>
              <span className="text-[var(--text-primary)] print:text-black">: {employee.position}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-left sm:text-right">
            <div className="flex sm:justify-end">
              <span className="w-28 text-[var(--text-muted)] print:text-gray-600 sm:text-left">Perusahaan</span>
              <span className="text-[var(--text-primary)] print:text-black">: {employee.clientName}</span>
            </div>
            <div className="flex sm:justify-end">
              <span className="w-28 text-[var(--text-muted)] print:text-gray-600 sm:text-left">Rekening Bank</span>
              <span className="font-mono text-[var(--text-primary)] print:text-black">: {employee.bankName} - {employee.bankAccount}</span>
            </div>
            <div className="flex sm:justify-end">
              <span className="w-28 text-[var(--text-muted)] print:text-gray-600 sm:text-left">Siklus Gaji</span>
              <span className="text-[var(--text-primary)] print:text-black">: {SALARY_CYCLE_LABELS[employee.salaryCycle] ?? employee.salaryCycle}</span>
            </div>
          </div>
        </div>

        {/* Tabel Komponen Pendapatan & Potongan (2 Kolom Sejajar) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-[var(--border)] print:border-black/20 text-xs">
          {/* Kolom Kiri: PENDAPATAN */}
          <div className="space-y-2">
            <div className="pb-2 font-bold text-[var(--text-primary)] print:text-black uppercase tracking-wider text-[11px] border-b border-[var(--border)] print:border-black/20 flex justify-between">
              <span>A. Pendapatan</span>
              <span>Jumlah</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-[var(--text-secondary)] print:text-gray-700">Gaji Pokok</span>
              <span className="font-mono text-[var(--text-primary)] print:text-black">{formatRupiah(slip.basicSalary)}</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-[var(--text-secondary)] print:text-gray-700">Tunjangan Tetap</span>
              <span className="font-mono text-[var(--text-primary)] print:text-black">{formatRupiah(slip.fixedAllowance)}</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-[var(--text-secondary)] print:text-gray-700">Tunjangan Makan</span>
              <span className="font-mono text-[var(--text-primary)] print:text-black">{formatRupiah(slip.mealAllowance)}</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-[var(--text-secondary)] print:text-gray-700">Tunjangan Transport</span>
              <span className="font-mono text-[var(--text-primary)] print:text-black">{formatRupiah(slip.transportAllowance)}</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-[var(--text-secondary)] print:text-gray-700">Upah Lembur</span>
              <span className="font-mono text-[var(--text-primary)] print:text-black">{formatRupiah(slip.overtimePay)}</span>
            </div>

            <div className="pt-2 border-t border-[var(--border)] print:border-black/20 flex justify-between font-bold text-[var(--text-primary)] print:text-black">
              <span>Total Pendapatan (Bruto)</span>
              <span className="font-mono text-[var(--teal)] print:text-black">{formatRupiah(slip.totalEarnings)}</span>
            </div>
          </div>

          {/* Kolom Kanan: POTONGAN */}
          <div className="space-y-2">
            <div className="pb-2 font-bold text-[var(--text-primary)] print:text-black uppercase tracking-wider text-[11px] border-b border-[var(--border)] print:border-black/20 flex justify-between">
              <span>B. Potongan</span>
              <span>Jumlah</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-[var(--text-secondary)] print:text-gray-700">Potongan Kasbon Gajiku</span>
              <span className="font-mono text-[var(--warning)] print:text-black">
                {slip.kasbonDeduction > 0 ? formatRupiah(slip.kasbonDeduction) : "Rp0"}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-[var(--text-secondary)] print:text-gray-700">Potongan Alpha / Absen</span>
              <span className="font-mono text-[var(--danger)] print:text-black">
                {slip.alphaDeduction > 0 ? formatRupiah(slip.alphaDeduction) : "Rp0"}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-[var(--text-secondary)] print:text-gray-700">BPJS Ketenagakerjaan / Kesehatan</span>
              <span className="font-mono text-[var(--text-primary)] print:text-black">{formatRupiah(slip.otherDeductions)}</span>
            </div>

            <div className="flex justify-between py-1 opacity-0">
              <span>Placeholder spacer</span>
              <span>Rp0</span>
            </div>

            <div className="flex justify-between py-1 opacity-0">
              <span>Placeholder spacer</span>
              <span>Rp0</span>
            </div>

            <div className="pt-2 border-t border-[var(--border)] print:border-black/20 flex justify-between font-bold text-[var(--text-primary)] print:text-black">
              <span>Total Potongan</span>
              <span className="font-mono text-[var(--danger)] print:text-black">-{formatRupiah(slip.totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Ringkasan Gaji Bersih (Take Home Pay) */}
        <div className="my-6 p-4 rounded-xl bg-[var(--surface-2)] print:bg-gray-100 border border-[var(--border)] print:border-black/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--text-muted)] print:text-gray-600 block font-medium uppercase">
              Gaji Bersih Diterima (Take Home Pay)
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] print:text-gray-500">
              Total Pendapatan (A) dikurangi Total Potongan (B)
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[var(--teal)] print:text-black tabular-nums">
            {formatRupiah(slip.netSalary)}
          </div>
        </div>

        {/* Tanda Tangan Footer */}
        <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
          <div>
            <span className="text-[var(--text-muted)] print:text-gray-600 block mb-12">Penerima (Karyawan)</span>
            <span className="font-bold text-[var(--text-primary)] print:text-black border-t border-[var(--border)] print:border-black/30 pt-1 px-4 inline-block">
              {employee.name}
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] print:text-gray-600 block mb-12">Disetujui oleh HRD</span>
            <span className="font-bold text-[var(--text-primary)] print:text-black border-t border-[var(--border)] print:border-black/30 pt-1 px-4 inline-block">
              Dewi Sartika (HR Lead)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
