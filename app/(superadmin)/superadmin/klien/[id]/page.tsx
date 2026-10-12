"use client";

// Dynamic route detail klien Superadmin
// Client Component karena memiliki tab interaktif dan visualisasi detail.

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { MOCK_CLIENTS } from "@/lib/mock-data/clients";
import { MOCK_PROJECTS } from "@/lib/mock-data/projects";
import { MOCK_EMPLOYEES } from "@/lib/mock-data/employees";
import { MOCK_ADMIN_LIST } from "@/lib/mock-data/users";
import { MOCK_AUDIT_LOGS } from "@/lib/mock-data/audit";
import { formatDate, formatDateTime } from "@/lib/formatters";
import {
  Building2,
  Users,
  MapPin,
  FileText,
  Activity,
  ArrowLeft,
  Mail,
  Phone,
  User,
  CheckCircle2,
} from "lucide-react";

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params?.id as string;
  const client = MOCK_CLIENTS.find((c) => c.id === clientId) || MOCK_CLIENTS[0];

  const [activeTab, setActiveTab] = useState<"ringkasan" | "project" | "admin" | "mou" | "aktivitas">("ringkasan");

  const clientProjects = MOCK_PROJECTS.filter((p) => p.clientId === client.id);
  const clientEmployees = MOCK_EMPLOYEES.filter((e) => e.clientId === client.id);
  const clientAdmins = MOCK_ADMIN_LIST.filter((a) => a.clientId === client.id);
  const clientLogs = MOCK_AUDIT_LOGS.filter((l) => l.clientId === client.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={`Entitas ${client.code} · ${client.address}`}
        breadcrumbs={[
          { label: "Superadmin" },
          { label: "Klien", href: "/superadmin/klien" },
          { label: client.name },
        ]}
        badge={
          <Badge variant={client.status === "AKTIF" ? "success" : "danger"} dot>
            {client.status}
          </Badge>
        }
        action={
          <div className="flex items-center gap-2">
            <Link href="/superadmin/klien">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Kembali ke Daftar
              </Button>
            </Link>
            <Link href="/superadmin/mou">
              <Button variant="outline" size="sm" leftIcon={<FileText className="w-4 h-4" />}>
                Edit MOU
              </Button>
            </Link>
          </div>
        }
      />

      {/* Tabs Header */}
      <div className="flex items-center gap-1 p-1 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] overflow-x-auto">
        {(
          [
            { key: "ringkasan", label: "Ringkasan" },
            { key: "project", label: `Project (${clientProjects.length})` },
            { key: "admin", label: `Admin (${clientAdmins.length})` },
            { key: "mou", label: "Konfigurasi MOU" },
            { key: "aktivitas", label: `Aktivitas (${clientLogs.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? "bg-[var(--surface-3)] text-[var(--text-primary)] shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content: Ringkasan */}
      {activeTab === "ringkasan" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Pegawai"
              value={clientEmployees.length}
              subtext="Terdaftar di sistem"
              icon={<Users className="w-4 h-4" />}
              accentColor="blue"
            />
            <StatCard
              label="Lokasi Project"
              value={clientProjects.length}
              subtext="Kantor & cabang aktif"
              icon={<MapPin className="w-4 h-4" />}
              accentColor="teal"
            />
            <StatCard
              label="Integrasi Gajiku"
              value={client.kasbonIntegration ? "Aktif" : "Nonaktif"}
              subtext="Sinkronisasi payroll kasbon"
              icon={<Activity className="w-4 h-4" />}
              accentColor={client.kasbonIntegration ? "success" : "neutral"}
            />
            <StatCard
              label="Periode Payroll Terakhir"
              value="Maret 2026"
              subtext="Status: Review"
              icon={<FileText className="w-4 h-4" />}
              accentColor="warning"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Kontak & PIC Resmi" description="Penanggung jawab entitas">
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)]">
                  <User className="w-4 h-4 text-[var(--teal)] shrink-0" />
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px]">Nama PIC</span>
                    <span className="font-semibold text-[var(--text-primary)]">{client.picName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)]">
                  <Mail className="w-4 h-4 text-[var(--blue)] shrink-0" />
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px]">Email Kontak</span>
                    <span className="font-semibold text-[var(--text-primary)]">{client.contactEmail}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)]">
                  <Phone className="w-4 h-4 text-[var(--success)] shrink-0" />
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px]">Telepon</span>
                    <span className="font-semibold text-[var(--text-primary)]">{client.contactPhone}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Status Kemitraan" description="Informasi legalitas dan MOU">
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Tanggal Terdaftar</span>
                  <span className="text-[var(--text-primary)] font-mono">{formatDate(client.createdAt)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Perubahan Terakhir</span>
                  <span className="text-[var(--text-primary)] font-mono">24 Maret 2026</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Siklus Gaji Didukung</span>
                  <span className="text-[var(--teal)] font-semibold">Siklus A & B</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[var(--text-secondary)]">Validasi Absensi</span>
                  <span className="text-[var(--text-primary)]">Selfie + Geo-fence 100m</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab Content: Project */}
      {activeTab === "project" && (
        <Card title="Daftar Project & Lokasi Kantor" description="Lokasi geo-fence absensi">
          <div className="divide-y divide-[var(--border)]">
            {clientProjects.map((p) => (
              <div key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-[var(--text-primary)] text-sm">{p.name}</h4>
                    <span className="font-mono text-[var(--teal)] font-bold">{p.code}</span>
                    {p.isHeadquarters && <Badge size="sm" variant="info">Kantor Utama</Badge>}
                  </div>
                  <p className="text-[var(--text-muted)] mt-1">{p.address}</p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-[var(--text-secondary)]">
                    <span>Radius: {p.attendanceRadiusMeters} meter</span>
                    <span>Koordinat: {p.latitude}, {p.longitude}</span>
                  </div>
                </div>
                <div className="shrink-0 font-mono text-[var(--text-primary)]">
                  {p.employeeCount} Pegawai Terdaftar
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab Content: Admin */}
      {activeTab === "admin" && (
        <Card title="Daftar Admin Perusahaan" description="Pengguna dengan hak akses manajemen HR">
          <div className="divide-y divide-[var(--border)]">
            {clientAdmins.map((a) => (
              <div key={a.id} className="py-4 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] text-sm">{a.name}</h4>
                  <p className="text-[var(--text-secondary)]">{a.email}</p>
                  <span className="text-[11px] text-[var(--text-muted)] mt-1 block">{a.position}</span>
                </div>
                <Badge variant="success" size="sm">Aktif</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab Content: MOU */}
      {activeTab === "mou" && (
        <Card title="Ringkasan Konfigurasi MOU Klien" description="Aturan operasional dan absensi aktif">
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-2">
              <h4 className="font-semibold text-[var(--text-primary)]">Modul Sistem yang Diaktifkan:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <span className="text-[var(--success)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Absensi Harian
                </span>
                <span className="text-[var(--success)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cuti & Izin
                </span>
                <span className="text-[var(--success)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Payroll Otomatis
                </span>
                <span className={client.kasbonIntegration ? "text-[var(--success)] flex items-center gap-1.5" : "text-[var(--text-muted)] flex items-center gap-1.5"}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Kasbon Gajiku
                </span>
              </div>
            </div>
            <div className="pt-2">
              <Link href="/superadmin/mou">
                <Button variant="primary" size="sm">
                  Buka Halaman Editor MOU Lengkap
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Tab Content: Aktivitas */}
      {activeTab === "aktivitas" && (
        <Card title="Riwayat Aktivitas Klien" description="Log interaksi sistem">
          <div className="divide-y divide-[var(--border)]">
            {clientLogs.map((l) => (
              <div key={l.id} className="py-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">{l.userName}: </span>
                  <span className="text-[var(--text-secondary)]">{l.description}</span>
                </div>
                <span className="text-[var(--text-muted)] font-mono text-[11px] shrink-0">
                  {formatDateTime(l.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
