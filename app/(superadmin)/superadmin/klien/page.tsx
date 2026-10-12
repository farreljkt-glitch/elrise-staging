"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { MOCK_CLIENTS } from "@/lib/mock-data/clients";
import { Client } from "@/lib/types";
import { formatDate } from "@/lib/formatters";
import {
  Plus,
  Search,
  Building2,
  ExternalLink,
  ShieldAlert,
  CheckCircle,
  FileText,
  SlidersHorizontal,
} from "lucide-react";

export default function SuperadminKlienPage() {
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [search, setSearch] = useState("");
  const [clientToSuspend, setClientToSuspend] = useState<Client | null>(null);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.picName.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleStatus = (client: Client) => {
    if (client.status === "AKTIF") {
      setClientToSuspend(client);
    } else {
      // Aktifkan kembali
      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? { ...c, status: "AKTIF" } : c))
      );
      showToast("success", "Klien Diaktifkan", `${client.name} kini berstatus aktif.`);
    }
  };

  const confirmSuspend = () => {
    if (!clientToSuspend) return;
    setClients((prev) =>
      prev.map((c) => (c.id === clientToSuspend.id ? { ...c, status: "SUSPEND" } : c))
    );
    showToast("warning", "Klien Ditangguhkan", `${clientToSuspend.name} telah disuspend.`);
    setClientToSuspend(null);
  };

  const columns: Column<Client>[] = [
    {
      header: "Nama Perusahaan",
      cell: (row) => (
        <div className="flex flex-col">
          <Link
            href={`/superadmin/klien/${row.id}`}
            className="font-semibold text-[var(--text-primary)] hover:text-[var(--blue)] transition-colors"
          >
            {row.name}
          </Link>
          <span className="text-xs text-[var(--text-muted)]">{row.address}</span>
        </div>
      ),
    },
    {
      header: "Kode",
      accessorKey: "code",
      cell: (row) => (
        <span className="font-mono font-bold text-[var(--teal)]">{row.code}</span>
      ),
    },
    {
      header: "Project",
      cell: (row) => (
        <span className="font-mono tabular-nums text-[var(--text-primary)]">{row.projectCount} Lokasi</span>
      ),
    },
    {
      header: "Pegawai",
      cell: (row) => (
        <span className="font-mono tabular-nums text-[var(--text-primary)]">{row.employeeCount} Orang</span>
      ),
    },
    {
      header: "Kasbon Gajiku",
      cell: (row) => (
        <Badge variant={row.kasbonIntegration ? "success" : "neutral"} size="sm">
          {row.kasbonIntegration ? "Terhubung" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge
          variant={row.status === "AKTIF" ? "success" : "danger"}
          size="sm"
          dot
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Terdaftar",
      cell: (row) => (
        <span className="text-xs text-[var(--text-secondary)] font-mono">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      header: "Aksi",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link href={`/superadmin/klien/${row.id}`}>
            <Button variant="ghost" size="sm" title="Lihat detail">
              Detail
            </Button>
          </Link>
          <Link href="/superadmin/mou">
            <Button variant="ghost" size="sm" title="Konfigurasi MOU">
              MOU
            </Button>
          </Link>
          <Button
            variant={row.status === "AKTIF" ? "outline" : "primary"}
            size="sm"
            onClick={() => handleToggleStatus(row)}
            className={row.status === "AKTIF" ? "text-[var(--danger)] hover:bg-[var(--danger)]/10" : ""}
          >
            {row.status === "AKTIF" ? "Suspend" : "Aktifkan"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Perusahaan Klien"
        description="Daftar seluruh perusahaan klien yang terdaftar dalam ekosistem HRIS Terhubung Gajiku."
        breadcrumbs={[{ label: "Superadmin" }, { label: "Klien" }]}
        action={
          <Link href="/superadmin/klien/tambah">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Tambah Klien Baru
            </Button>
          </Link>
        }
      />

      {/* Toolbar Pencarian */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Cari nama perusahaan, kode, atau PIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Tabel Klien */}
      <Table
        columns={columns}
        data={filteredClients}
        keyExtractor={(row) => row.id}
        emptyTitle="Klien Tidak Ditemukan"
        emptyDescription="Tidak ada data perusahaan klien yang cocok dengan kata kunci pencarian Anda."
      />

      {/* Modal Konfirmasi Suspend */}
      <ConfirmDialog
        isOpen={!!clientToSuspend}
        onClose={() => setClientToSuspend(null)}
        onConfirm={confirmSuspend}
        title={`Suspend Perusahaan ${clientToSuspend?.name}?`}
        message="Menangguhkan perusahaan ini akan membatasi admin dan seluruh pegawai klien tersebut untuk melakukan login atau transaksi baru."
        confirmText="Ya, Suspend Klien"
      />
    </div>
  );
}
