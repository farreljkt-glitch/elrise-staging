"use client";

import React from "react";
import { SALARY_CYCLE_LABELS } from "@/lib/constants";
import { useAuth } from "@/lib/mock-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ThemeSelector } from "@/components/ui/ThemeToggle";
import { MOCK_EMPLOYEES } from "@/lib/mock-data/employees";
import { formatDate, maskAccountNumber, getInitials } from "@/lib/formatters";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  CreditCard,
  Calendar,
  ShieldCheck,
  Lock,
} from "lucide-react";

export default function PegawaiProfilPage() {
  const { user } = useAuth();
  const empId = user?.employeeId || "emp-1";

  const employee =
    MOCK_EMPLOYEES.find((e) => e.id === empId) || MOCK_EMPLOYEES[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Profil Karyawan Mandiri"
        description="Kelola dan periksa kebenaran data identitas kepegawaian, penempatan, dan rekening bank."
        breadcrumbs={[{ label: "Pegawai" }, { label: "Profil Saya" }]}
      />

      {/* Hero Profil Header */}
      <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-20 h-20 rounded-2xl bg-[image:var(--grad)] flex items-center justify-center text-2xl font-black text-[var(--on-accent)] shrink-0 shadow-lg">
          {getInitials(employee.name)}
        </div>

        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">{employee.name}</h2>
            <Badge variant="success" size="sm" dot>
              {employee.status}
            </Badge>
          </div>
          <span className="text-xs font-mono text-[var(--teal)] font-bold block mt-0.5">
            {employee.employeeCode}
          </span>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {employee.position} · {employee.department}
          </p>
          <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
            {employee.clientName} ({employee.projectName})
          </span>
        </div>
      </div>

      <Card title="Tampilan" description="Pilih mode terang, gelap, atau ikuti pengaturan perangkat">
        <ThemeSelector />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Pribadi & Kontak */}
        <Card title="Data Pribadi & Kontak" description="Informasi komunikasi aktif">
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)]">
              <Mail className="w-4 h-4 text-[var(--blue)] shrink-0" />
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Email Perusahaan</span>
                <span className="text-[var(--text-primary)] font-mono font-medium">{employee.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)]">
              <Phone className="w-4 h-4 text-[var(--teal)] shrink-0" />
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Nomor WhatsApp / HP</span>
                <span className="text-[var(--text-primary)] font-mono font-medium">{employee.phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)]">
              <Calendar className="w-4 h-4 text-[var(--info)] shrink-0" />
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Tanggal Bergabung</span>
                <span className="text-[var(--text-primary)] font-mono font-medium">{formatDate(employee.joinDate)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Rekening Bank & Payroll */}
        <Card title="Rekening Pembayaran Gaji" description="Nomor rekening disamarkan untuk privasi">
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)]">
              <CreditCard className="w-4 h-4 text-[var(--warning)] shrink-0" />
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Bank Penggajian</span>
                <span className="text-[var(--text-primary)] font-semibold">Bank {employee.bankName}</span>
                <span className="text-sm font-mono text-[var(--teal)] font-bold block mt-0.5">
                  {maskAccountNumber(employee.bankAccount)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)]">
              <Briefcase className="w-4 h-4 text-[var(--teal)] shrink-0" />
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Siklus Penggajian</span>
                <span className="text-[var(--text-primary)] font-semibold">
                  {SALARY_CYCLE_LABELS[employee.salaryCycle] ?? employee.salaryCycle}
                </span>
              </div>
            </div>

            {employee.eWallet && (
              <div className="p-3 rounded-lg bg-[var(--surface-2)] flex items-center justify-between">
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px]">Akun E-Wallet</span>
                  <span className="text-[var(--text-primary)] font-mono">{employee.eWallet}</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Catatan Privasi & Perubahan Data */}
      <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-start gap-3 text-xs text-[var(--text-secondary)]">
        <ShieldCheck className="w-5 h-5 text-[var(--teal)] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="block text-[var(--text-primary)] mb-0.5 font-semibold">Perubahan Data Rekening:</strong>
          Untuk alasan keamanan dan pencegahan kesalahan transfer penggajian, perubahan nomor rekening bank atau nama pemilik rekening wajib dilaporkan langsung ke tim HRD dengan melampirkan foto buku tabungan resmi.
        </div>
      </div>
    </div>
  );
}
