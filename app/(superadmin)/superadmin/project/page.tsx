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
import { MOCK_PROJECTS } from "@/lib/mock-data/projects";
import { MOCK_CLIENTS } from "@/lib/mock-data/clients";
import { Project } from "@/lib/types";
import { Plus, Search, MapPin, Building2, Save } from "lucide-react";

export default function SuperadminProjectPage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(MOCK_CLIENTS[0]?.id || "");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("-6.3021");
  const [longitude, setLongitude] = useState("107.0984");
  const [radius, setRadius] = useState("100");
  const [isHeadquarters, setIsHeadquarters] = useState(false);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesClient = clientFilter === "ALL" || p.clientId === clientFilter;
    return matchesSearch && matchesClient;
  });

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !selectedClientId) {
      showToast("error", "Validasi Gagal", "Mohon lengkapi semua isian formulir.");
      return;
    }

    const client = MOCK_CLIENTS.find((c) => c.id === selectedClientId);

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      code,
      name,
      clientId: selectedClientId,
      clientName: client?.name || "Perusahaan",
      address,
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
      attendanceRadiusMeters: parseInt(radius) || 100,
      employeeCount: 0,
      isHeadquarters,
      isActive: true,
    };

    setProjects([newProject, ...projects]);
    showToast("success", "Project Disimpan", `Lokasi project ${name} berhasil dibuat.`);
    setIsModalOpen(false);

    // Reset
    setName("");
    setCode("");
    setAddress("");
  };

  const columns: Column<Project>[] = [
    {
      header: "Nama Project / Cabang",
      cell: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">{row.name}</span>
            {row.isHeadquarters && <Badge size="sm" variant="info">Kantor Utama</Badge>}
          </div>
          <span className="text-xs text-[var(--text-muted)]">{row.address}</span>
        </div>
      ),
    },
    {
      header: "Kode",
      accessorKey: "code",
      cell: (row) => <span className="font-mono text-[var(--teal)] font-bold">{row.code}</span>,
    },
    {
      header: "Perusahaan Induk",
      cell: (row) => (
        <span className="text-xs text-[var(--text-secondary)] font-medium">
          {row.clientName}
        </span>
      ),
    },
    {
      header: "Geo-Radius",
      cell: (row) => (
        <div className="flex flex-col text-xs font-mono">
          <span className="text-[var(--text-primary)] tabular-nums">{row.attendanceRadiusMeters} meter</span>
          <span className="text-[10px] text-[var(--text-muted)]">{row.latitude}, {row.longitude}</span>
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
      header: "Status",
      cell: (row) => (
        <Badge variant={row.isActive ? "success" : "neutral"} size="sm" dot>
          {row.isActive ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Project & Lokasi Kantor"
        description="Kelola master cabang penempatan kerja, koordinat GPS kantor, dan batas radius toleransi absensi."
        breadcrumbs={[{ label: "Superadmin" }, { label: "Project" }]}
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tambah Project
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Cari nama project, kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            options={[
              { value: "ALL", label: "Semua Klien Induk" },
              ...MOCK_CLIENTS.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </div>

      {/* Tabel */}
      <Table
        columns={columns}
        data={filteredProjects}
        keyExtractor={(row) => row.id}
        emptyTitle="Project Tidak Ditemukan"
        emptyDescription="Belum ada data project yang sesuai dengan filter pencarian."
      />

      {/* Modal Tambah Project */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Lokasi Project Baru"
        description="Daftarkan kantor cabang atau site operasional untuk validasi geo-fencing absensi pegawai."
      >
        <form onSubmit={handleSaveProject} className="space-y-4">
          <Select
            label="Klien Induk (Perusahaan)"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            options={MOCK_CLIENTS.map((c) => ({ value: c.id, label: c.name }))}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nama Project"
              placeholder="Contoh: Gudang Surabaya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Kode Project"
              placeholder="Contoh: SBY-01"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
          </div>

          <Input
            label="Alamat Lokasi"
            placeholder="Alamat fisik kantor..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Latitude"
              placeholder="-6.3021"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
            />
            <Input
              label="Longitude"
              placeholder="107.0984"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
            />
            <Input
              label="Radius (Meter)"
              type="number"
              placeholder="100"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isHq"
              checked={isHeadquarters}
              onChange={(e) => setIsHeadquarters(e.target.checked)}
              className="rounded bg-[var(--surface-2)] border-[var(--border)] text-[var(--blue)] cursor-pointer"
            />
            <label htmlFor="isHq" className="text-xs text-[var(--text-secondary)] cursor-pointer">
              Tetapkan sebagai Kantor Pusat (Headquarters)
            </label>
          </div>

          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" leftIcon={<Save className="w-4 h-4" />}>
              Simpan Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
