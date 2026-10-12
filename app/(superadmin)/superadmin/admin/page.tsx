"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { MOCK_ADMIN_LIST } from "@/lib/mock-data/users";
import { MOCK_CLIENTS } from "@/lib/mock-data/clients";
import { User } from "@/lib/types";
import { Plus, Search, Key, ShieldOff, ShieldCheck, Mail } from "lucide-react";

export default function SuperadminAdminPage() {
  const { showToast } = useToast();
  const [admins, setAdmins] = useState<User[]>(MOCK_ADMIN_LIST);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [clientId, setClientId] = useState(MOCK_CLIENTS[0]?.id || "");
  const [position, setPosition] = useState("HR Operations Specialist");

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.clientName && a.clientName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast("error", "Validasi Gagal", "Lengkapi seluruh isian.");
      return;
    }

    const client = MOCK_CLIENTS.find((c) => c.id === clientId);

    const newAdmin: User = {
      id: `usr-admin-${Date.now()}`,
      name,
      email,
      role: "ADMIN",
      clientId,
      clientName: client?.name,
      position,
    };

    setAdmins([...admins, newAdmin]);
    showToast("success", "Admin Dibuat", `Akun admin ${name} berhasil didaftarkan.`);
    setIsModalOpen(false);
    setName("");
    setEmail("");
  };

  const handleResetPassword = (adminName: string) => {
    showToast("info", "Reset Password Terkirim", `Tautan reset sandi telah dikirimkan ke email ${adminName}.`);
  };

  const columns: Column<User>[] = [
    {
      header: "Nama Admin",
      cell: (row) => (
        <div>
          <div className="font-semibold text-[var(--text-primary)]">{row.name}</div>
          <span className="text-xs text-[var(--text-muted)]">{row.position || "HR Admin"}</span>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: (row) => <span className="text-xs font-mono text-[var(--text-secondary)]">{row.email}</span>,
    },
    {
      header: "Perusahaan Klien",
      cell: (row) => (
        <span className="text-xs text-[var(--teal)] font-medium">{row.clientName || "-"}</span>
      ),
    },
    {
      header: "Status",
      cell: () => <Badge variant="success" size="sm" dot>Aktif</Badge>,
    },
    {
      header: "Login Terakhir",
      cell: () => (
        <span className="text-xs text-[var(--text-muted)] font-mono">Hari ini, 08:30 WIB</span>
      ),
    },
    {
      header: "Aksi",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleResetPassword(row.name)}
            leftIcon={<Key className="w-3.5 h-3.5 text-[var(--warning)]" />}
          >
            Reset Sandi
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--danger)] hover:bg-[var(--danger)]/10"
            onClick={() => showToast("warning", "Status Diubah", `Admin ${row.name} dinonaktifkan.`)}
          >
            Nonaktifkan
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pengguna Admin Klien"
        description="Kelola akun pengelola SDM/HR yang memiliki akses portal Admin pada masing-masing entitas perusahaan mitra."
        breadcrumbs={[{ label: "Superadmin" }, { label: "Manajemen Admin" }]}
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tambah Admin Baru
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="w-full sm:w-80">
        <Input
          placeholder="Cari admin, email, klien..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Tabel Admin */}
      <Table
        columns={columns}
        data={filteredAdmins}
        keyExtractor={(row) => row.id}
        emptyTitle="Tidak Ada Admin"
        emptyDescription="Tidak ditemukan data admin klien yang sesuai."
      />

      {/* Modal Tambah Admin */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Daftarkan Pengguna Admin HR Baru"
        description="Pengguna ini akan memiliki wewenang mengelola absensi, payroll, dan data pegawai pada klien yang dipilih."
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <Select
            label="Klien / Perusahaan Penugasan"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            options={MOCK_CLIENTS.map((c) => ({ value: c.id, label: c.name }))}
            required
          />

          <Input
            label="Nama Lengkap Admin"
            placeholder="Contoh: Siti Rahmah, S.Psi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Alamat Email (Login)"
            type="email"
            placeholder="admin.hr@perusahaan.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Jabatan Resmi"
            placeholder="Contoh: HR Operations Manager"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />

          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit">
              Simpan Akun Admin
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
