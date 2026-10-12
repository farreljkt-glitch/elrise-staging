"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { MOCK_AUDIT_LOGS } from "@/lib/mock-data/audit";
import { MOCK_CLIENTS } from "@/lib/mock-data/clients";
import { AuditLog } from "@/lib/types";
import { formatDateTime } from "@/lib/formatters";
import { Search, Eye, History, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function SuperadminAuditPage() {
  const [logs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [selectedClient, setSelectedClient] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    const matchesModule = selectedModule === "ALL" || log.module === selectedModule;
    const matchesClient = selectedClient === "ALL" || log.clientId === selectedClient;
    return matchesSearch && matchesModule && matchesClient;
  });

  const columns: Column<AuditLog>[] = [
    {
      header: "Waktu & Tanggal",
      cell: (row) => (
        <span className="text-xs font-mono text-[var(--text-secondary)]">
          {formatDateTime(row.timestamp)}
        </span>
      ),
    },
    {
      header: "Pengguna / Pelaku",
      cell: (row) => (
        <div>
          <span className="font-semibold text-[var(--text-primary)] block">{row.userName}</span>
          <span className="text-[11px] text-[var(--teal)] font-mono">{row.userRole}</span>
        </div>
      ),
    },
    {
      header: "Klien Induk",
      cell: (row) => (
        <span className="text-xs text-[var(--text-secondary)]">
          {row.clientName || "Sistem Elkyno"}
        </span>
      ),
    },
    {
      header: "Modul & Aksi",
      cell: (row) => (
        <div>
          <Badge size="sm" variant="info">{row.module}</Badge>
          <span className="text-xs font-mono text-[var(--text-primary)] block mt-1">{row.action}</span>
        </div>
      ),
    },
    {
      header: "Deskripsi Perubahan",
      cell: (row) => (
        <span className="text-xs text-[var(--text-secondary)] max-w-xs truncate block" title={row.description}>
          {row.description}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge
          size="sm"
          variant={
            row.status === "SUCCESS"
              ? "success"
              : row.status === "WARNING"
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
      header: "Aksi",
      align: "right",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedLog(row)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Detail
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail & Riwayat Sistem"
        description="Rekam jejak komprehensif seluruh aktivitas login, transaksi absensi, approval cuti, dan perubahan konfigurasi sistem."
        breadcrumbs={[{ label: "Superadmin" }, { label: "Audit Log" }]}
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Cari user, aksi, deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-44">
            <Select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              options={[
                { value: "ALL", label: "Semua Modul" },
                { value: "Absensi", label: "Modul Absensi" },
                { value: "Payroll", label: "Modul Payroll" },
                { value: "Cuti", label: "Modul Cuti" },
                { value: "MOU", label: "Modul MOU" },
              ]}
            />
          </div>
          <div className="w-48">
            <Select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              options={[
                { value: "ALL", label: "Semua Klien" },
                ...MOCK_CLIENTS.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
        </div>

        <div className="text-xs text-[var(--text-muted)] font-mono">
          Total Log: <strong className="text-[var(--text-primary)] tabular-nums">{filteredLogs.length}</strong>
        </div>
      </div>

      {/* Tabel */}
      <Table
        columns={columns}
        data={filteredLogs}
        keyExtractor={(row) => row.id}
        emptyTitle="Tidak Ada Log"
        emptyDescription="Tidak ada data audit yang sesuai dengan filter yang dipilih."
      />

      {/* Modal Detail Audit Log */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Rincian Catatan Audit"
        description={`Log ID: ${selectedLog?.id}`}
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--surface-2)]">
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Waktu Eksekusi</span>
                <span className="font-mono text-[var(--text-primary)] font-semibold">
                  {formatDateTime(selectedLog.timestamp)}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">IP Address Pelaku</span>
                <span className="font-mono text-[var(--teal)] font-semibold">
                  {selectedLog.ipAddress}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Pengguna:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {selectedLog.userName} ({selectedLog.userRole})
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Entitas Klien:</span>
                <span className="text-[var(--text-primary)]">{selectedLog.clientName || "Sistem Pusat"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Modul Sistem:</span>
                <span className="text-[var(--blue)] font-semibold">{selectedLog.module}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Aksi Eksekusi:</span>
                <span className="font-mono text-[var(--text-primary)]">{selectedLog.action}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--surface-3)]">
              <span className="text-[var(--text-muted)] block text-[10px] mb-1 font-semibold uppercase">
                Deskripsi Lengkap
              </span>
              <p className="text-[var(--text-primary)] leading-relaxed">{selectedLog.description}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
