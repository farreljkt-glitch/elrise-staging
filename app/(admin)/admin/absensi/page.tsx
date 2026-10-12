"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/mock-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { MOCK_ATTENDANCE } from "@/lib/mock-data/attendance";
import { MOCK_PROJECTS } from "@/lib/mock-data/projects";
import { AttendanceRecord } from "@/lib/types";
import { formatDate } from "@/lib/formatters";
import {
  CalendarCheck,
  Search,
  Eye,
  ShieldAlert,
  MapPin,
  Camera,
  Wifi,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function AdminAbsensiPage() {
  const { user } = useAuth();
  const clientId = user?.clientId || "client-1";

  const clientAttendance = MOCK_ATTENDANCE.filter((a) => a.clientId === clientId);
  const clientProjects = MOCK_PROJECTS.filter((p) => p.clientId === clientId);

  const [attendanceList] = useState<AttendanceRecord[]>(clientAttendance);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [onlySuspicious, setOnlySuspicious] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const filteredAttendance = attendanceList.filter((att) => {
    const matchesSearch =
      att.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      att.employeeCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || att.status === statusFilter;
    const matchesProject = projectFilter === "ALL" || att.projectId === projectFilter;
    const matchesSuspicious = onlySuspicious ? att.isSuspicious : true;

    return matchesSearch && matchesStatus && matchesProject && matchesSuspicious;
  });

  const columns: Column<AttendanceRecord>[] = [
    {
      header: "Tanggal & Pegawai",
      cell: (row) => (
        <div>
          <span className="font-semibold text-[var(--text-primary)] block">{row.employeeName}</span>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-muted)]">
            <span className="font-mono text-[var(--teal)]">{row.employeeCode}</span>
            <span>·</span>
            <span>{row.projectName}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Jam Masuk / Pulang",
      cell: (row) => (
        <div className="flex flex-col font-mono text-xs">
          <span className="text-[var(--text-primary)]">Masuk: {row.checkInTime || "-"}</span>
          <span className="text-[var(--text-muted)]">Pulang: {row.checkOutTime || "-"}</span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <div>
          <Badge
            size="sm"
            variant={
              row.status === "HADIR"
                ? "success"
                : row.status === "TELAT"
                ? "warning"
                : row.status === "ALPHA"
                ? "danger"
                : "info"
            }
          >
            {row.status}
          </Badge>
          {row.lateMinutes > 0 && (
            <span className="text-[10px] text-[var(--warning)] block mt-0.5 font-mono">
              +{row.lateMinutes} Menit
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Validasi Sensor",
      cell: (row) => (
        <div className="flex items-center gap-2">
          {/* GPS indicator */}
          <div
            className={`p-1 rounded text-xs flex items-center gap-1 ${
              row.gpsValid
                ? "bg-[var(--success)]/10 text-[var(--success)]"
                : "bg-[var(--danger)]/10 text-[var(--danger)]"
            }`}
            title={`GPS: ${row.gpsAccuracyMeters}m`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px]">{row.gpsAccuracyMeters}m</span>
          </div>

          {/* IP indicator */}
          <div
            className={`p-1 rounded text-xs flex items-center ${
              row.ipValid
                ? "bg-[var(--success)]/10 text-[var(--success)]"
                : "bg-[var(--surface-3)] text-[var(--text-muted)]"
            }`}
            title={`IP: ${row.ipAddress}`}
          >
            <Wifi className="w-3.5 h-3.5" />
          </div>

          {/* Camera indicator */}
          <div
            className={`p-1 rounded text-xs flex items-center ${
              row.photoVerified
                ? "bg-[var(--success)]/10 text-[var(--success)]"
                : "bg-[var(--surface-3)] text-[var(--text-muted)]"
            }`}
            title="Foto Selfie Terverifikasi"
          >
            <Camera className="w-3.5 h-3.5" />
          </div>
        </div>
      ),
    },
    {
      header: "Flag",
      cell: (row) =>
        row.isSuspicious ? (
          <Badge size="sm" variant="danger" dot>
            Mencurigakan
          </Badge>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">Normal</span>
        ),
    },
    {
      header: "Aksi",
      align: "right",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedRecord(row)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Audit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring & Verifikasi Absensi"
        description="Pantau kehadiran harian, validasi radius koordinat GPS, alamat IP jaringan kantor, dan deteksi anomali."
        breadcrumbs={[{ label: "Admin" }, { label: "Absensi" }]}
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Cari nama atau ID pegawai..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "ALL", label: "Semua Status" },
                { value: "HADIR", label: "Hadir" },
                { value: "TELAT", label: "Terlambat" },
                { value: "CUTI", label: "Cuti" },
                { value: "DINAS", label: "Dinas Luar" },
              ]}
            />
          </div>

          <div className="w-44">
            <Select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              options={[
                { value: "ALL", label: "Semua Project" },
                ...clientProjects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer select-none bg-[var(--surface-2)] px-3 py-2 rounded-lg border border-[var(--border)]">
            <input
              type="checkbox"
              checked={onlySuspicious}
              onChange={(e) => setOnlySuspicious(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--danger)]"
            />
            <span className="text-[var(--danger)] font-medium">Hanya Mencurigakan</span>
          </label>
        </div>

        <div className="text-xs text-[var(--text-muted)] font-mono">
          Total Log: <strong className="text-[var(--text-primary)] tabular-nums">{filteredAttendance.length}</strong>
        </div>
      </div>

      {/* Tabel */}
      <Table
        columns={columns}
        data={filteredAttendance}
        keyExtractor={(row) => row.id}
        emptyTitle="Tidak Ada Log Absensi"
        emptyDescription="Tidak ada data absensi yang sesuai kriteria pencarian."
      />

      {/* Modal Detail & Audit Sensor Absensi */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Audit Verifikasi Sensor Absensi"
        description={`Record ID: ${selectedRecord?.id} · Tanggal ${selectedRecord ? formatDate(selectedRecord.date) : ""}`}
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            {/* Warning jika suspicious */}
            {selectedRecord.isSuspicious && (
              <div className="p-3.5 rounded-xl bg-[var(--danger)]/15 border border-[var(--danger)]/30 text-[var(--danger)] flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[var(--text-primary)] mb-0.5">Peringatan Anomali Lokasi:</strong>
                  {selectedRecord.suspiciousReason}
                </div>
              </div>
            )}

            {/* Grid Informasi Pegawai */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--surface-2)]">
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Pegawai</span>
                <span className="text-[var(--text-primary)] font-semibold text-sm">{selectedRecord.employeeName}</span>
                <span className="text-[var(--teal)] font-mono block">{selectedRecord.employeeCode}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Penempatan Cabang</span>
                <span className="text-[var(--text-primary)] font-medium">{selectedRecord.projectName}</span>
              </div>
            </div>

            {/* Sensor Telemetry List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[var(--blue)]" />
                  <span>Validasi Radius GPS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[var(--text-primary)]">{selectedRecord.gpsAccuracyMeters} Meter</span>
                  {selectedRecord.gpsValid ? (
                    <Badge size="sm" variant="success">Dalam Radius</Badge>
                  ) : (
                    <Badge size="sm" variant="danger">Di Luar Batas</Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-[var(--teal)]" />
                  <span>Validasi IP Jaringan Kantor</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[var(--text-primary)]">{selectedRecord.ipAddress}</span>
                  {selectedRecord.ipValid ? (
                    <Badge size="sm" variant="success">IP Whitelist</Badge>
                  ) : (
                    <Badge size="sm" variant="neutral">IP Eksternal</Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[var(--info)]" />
                  <span>Verifikasi Foto Selfie Wajah</span>
                </div>
                <Badge size="sm" variant={selectedRecord.photoVerified ? "success" : "neutral"}>
                  {selectedRecord.photoVerified ? "Terverifikasi Liveness" : "Tidak Ada Foto"}
                </Badge>
              </div>
            </div>

            {/* Visual Map Placeholder (Radar/Grid SVG) */}
            <div className="p-4 rounded-xl bg-[var(--surface-3)] border border-[var(--border)] text-center relative overflow-hidden">
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-[var(--teal)] flex items-center justify-center relative mb-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--teal)]/20 animate-ping absolute" />
                  <MapPin className="w-6 h-6 text-[var(--teal)] relative z-10" />
                </div>
                <span className="text-[var(--text-primary)] font-semibold">Simulasi Geo-Fence Terintegrasi</span>
                <span className="text-[11px] text-[var(--text-muted)] mt-1">
                  Koordinat: Lat -6.3021, Lng 107.0984 · Radius Kantor: 100m
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
