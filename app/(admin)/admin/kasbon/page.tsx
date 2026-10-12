"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/mock-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { MOCK_KASBON_TRANSACTIONS } from "@/lib/mock-data/kasbon";
import { MOCK_CLIENTS } from "@/lib/mock-data/clients";
import { KasbonTransaction } from "@/lib/types";
import { formatRupiah } from "@/lib/formatters";
import {
  WalletCards,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

export default function AdminKasbonPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const clientId = user?.clientId || "client-1";

  const clientInfo = MOCK_CLIENTS.find((c) => c.id === clientId);
  const isIntegrationActive = clientInfo?.kasbonIntegration ?? true;

  const [transactions, setTransactions] = useState<KasbonTransaction[]>(
    MOCK_KASBON_TRANSACTIONS.filter((k) => k.clientId === clientId)
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncGajiku = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast(
        "success",
        "Sinkronisasi Berhasil",
        "Data transaksi kasbon teranyar berhasil diambil dari server Gajiku-Live."
      );
    }, 800);
  };

  const columns: Column<KasbonTransaction>[] = [
    {
      header: "ID Transaksi Gajiku",
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-[var(--teal)] block">
            {row.gajikuTxId}
          </span>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">{row.createdAt}</span>
        </div>
      ),
    },
    {
      header: "Pegawai Peminjam",
      cell: (row) => (
        <div>
          <span className="font-semibold text-[var(--text-primary)] block">{row.employeeName}</span>
          <span className="text-xs font-mono text-[var(--text-muted)]">{row.employeeCode}</span>
        </div>
      ),
    },
    {
      header: "Periode",
      accessorKey: "periodCode",
      cell: (row) => <span className="font-mono text-xs text-[var(--text-primary)]">{row.periodCode}</span>,
    },
    {
      header: "Nominal Kasbon",
      cell: (row) => (
        <span className="font-mono text-xs text-[var(--text-primary)] font-semibold tabular-nums">
          {formatRupiah(row.amount)}
        </span>
      ),
    },
    {
      header: "Biaya Admin",
      cell: (row) => (
        <span className="font-mono text-xs text-[var(--text-muted)] tabular-nums">
          {formatRupiah(row.adminFee)}
        </span>
      ),
    },
    {
      header: "Total Potongan Gaji",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-[var(--warning)] tabular-nums">
          {formatRupiah(row.totalDeduction)}
        </span>
      ),
    },
    {
      header: "Status Transaksi",
      cell: (row) => (
        <Badge
          size="sm"
          variant={
            row.status === "SETTLED"
              ? "success"
              : row.status === "SUKSES"
              ? "info"
              : row.status === "BELUM_SETTLED"
              ? "warning"
              : "danger"
          }
          dot
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Status Settlement Payroll",
      cell: (row) => (
        <span className="text-xs text-[var(--text-secondary)]">
          {row.settlementStatus}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekonsiliasi Kasbon Gajiku"
        description="Monitoring pinjaman tunai instan pegawai dari aplikasi Gajiku-Live dan status settlement potongan payroll."
        breadcrumbs={[{ label: "Admin" }, { label: "Kasbon Gajiku" }]}
        action={
          isIntegrationActive ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncGajiku}
              isLoading={isSyncing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Sinkronkan Data Gajiku
            </Button>
          ) : undefined
        }
      />

      {/* Banner Jika Integrasi Nonaktif */}
      {!isIntegrationActive && (
        <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-3 text-xs text-[var(--text-muted)]">
          <Info className="w-5 h-5 text-[var(--blue)] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block text-[var(--text-primary)] mb-0.5">Integrasi Tidak Aktif</strong>
            Integrasi kasbon Gajiku belum diaktifkan untuk klien ini. Hubungi Superadmin pada konfigurasi MOU untuk menghubungkan endpoint API Gajiku.
          </div>
        </div>
      )}

      {/* Banner Keamanan Finansial */}
      <div className="p-4 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/30 flex items-start gap-3 text-xs text-[var(--warning)]">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="block text-[var(--text-primary)] mb-0.5">
            Protokol Keamanan Rekonsiliasi Kasbon:
          </strong>
          Jika koneksi API atau jaringan data kasbon mengalami kendala, modul payroll dilarang keras menganggap nilai kasbon pegawai sebagai Rp0 secara otomatis. Lakukan verifikasi manual sebelum mengunci payroll.
        </div>
      </div>

      {/* Tabel */}
      <Table
        columns={columns}
        data={transactions}
        keyExtractor={(row) => row.id}
        emptyTitle="Tidak Ada Transaksi Kasbon"
        emptyDescription="Belum ada riwayat penarikan dana kasbon dari pegawai pada periode ini."
      />
    </div>
  );
}
