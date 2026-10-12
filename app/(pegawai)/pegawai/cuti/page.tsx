"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/mock-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { MOCK_LEAVE_BALANCES, MOCK_LEAVE_REQUESTS } from "@/lib/mock-data/leave";
import { LeaveRequest } from "@/lib/types";
import { formatDate } from "@/lib/formatters";
import { Plus, CalendarDays, CheckCircle2, Clock, XCircle } from "lucide-react";

export default function PegawaiCutiPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const empId = user?.employeeId || "emp-1";

  const [balance, setBalance] = useState(
    MOCK_LEAVE_BALANCES[empId] || { annualQuota: 12, usedDays: 4, remainingDays: 8 }
  );
  const [requests, setRequests] = useState<LeaveRequest[]>(
    MOCK_LEAVE_REQUESTS.filter((l) => l.employeeId === empId)
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("TAHUNAN");
  const [startDate, setStartDate] = useState("2026-04-15");
  const [endDate, setEndDate] = useState("2026-04-16");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const err: Record<string, string> = {};

    if (!startDate) err.startDate = "Tanggal mulai wajib diisi.";
    if (!endDate) err.endDate = "Tanggal selesai wajib diisi.";

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        err.endDate = "Tanggal selesai tidak boleh sebelum tanggal mulai.";
      }
    }

    if (!reason.trim()) {
      err.reason = "Alasan pengajuan cuti wajib diisi.";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showToast("error", "Validasi Gagal", "Harap perbaiki formulir pengajuan cuti.");
      return;
    }

    // Hitung estimasi hari kerja
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (leaveType === "TAHUNAN" && totalDays > balance.remainingDays) {
      showToast(
        "error",
        "Saldo Tidak Cukup",
        `Saldo cuti tahunan Anda tersisa ${balance.remainingDays} hari, tidak dapat mengajukan ${totalDays} hari.`
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);

      const newRequest: LeaveRequest = {
        id: `leave-${Date.now()}`,
        employeeId: empId,
        employeeName: user?.name || "Budi Santoso",
        employeeCode: "SMS-2023-001",
        clientId: user?.clientId || "client-1",
        type: leaveType as any,
        startDate,
        endDate,
        totalDays,
        reason,
        status: "PENDING",
        appliedDate: new Date().toISOString(),
      };

      setRequests([newRequest, ...requests]);
      showToast("success", "Pengajuan Terkirim", "Permohonan cuti telah diajukan ke HR untuk ditinjau.");
      setIsModalOpen(false);
      setReason("");
    }, 600);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengajuan Cuti Mandiri"
        description="Lihat saldo cuti tahunan dan ajukan izin kerja atau cuti langsung ke manajemen HR."
        breadcrumbs={[{ label: "Pegawai" }, { label: "Cuti" }]}
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Ajukan Cuti Baru
          </Button>
        }
      />

      {/* Saldo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
          <span className="text-xs text-[var(--text-muted)] block font-medium">
            Total Kuota Cuti Tahunan
          </span>
          <span className="text-3xl font-bold text-[var(--text-primary)] font-mono mt-1 block">
            {balance.annualQuota} Hari
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
          <span className="text-xs text-[var(--text-muted)] block font-medium">
            Cuti yang Telah Terpakai
          </span>
          <span className="text-3xl font-bold text-[var(--warning)] font-mono mt-1 block">
            {balance.usedDays} Hari
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center">
          <span className="text-xs text-[var(--text-muted)] block font-medium">
            Sisa Saldo Cuti Aktif
          </span>
          <span className="text-3xl font-bold text-[var(--teal)] font-mono mt-1 block">
            {balance.remainingDays} Hari
          </span>
        </div>
      </div>

      {/* Riwayat Pengajuan */}
      <Card title="Riwayat Pengajuan Cuti Anda" description="Status persetujuan langsung dari HR">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--text-muted)]">
            Belum ada riwayat pengajuan cuti.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {requests.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text-primary)] text-sm">
                      {item.type} ({item.totalDays} Hari)
                    </span>
                    <Badge
                      size="sm"
                      variant={
                        item.status === "APPROVED"
                          ? "success"
                          : item.status === "PENDING"
                          ? "warning"
                          : "danger"
                      }
                      dot
                    >
                      {item.status === "APPROVED"
                        ? "Disetujui"
                        : item.status === "PENDING"
                        ? "Menunggu Persetujuan"
                        : "Ditolak"}
                    </Badge>
                  </div>
                  <p className="text-[var(--text-secondary)] mt-1">{item.reason}</p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-[var(--text-muted)] font-mono">
                    <span>Rentang: {item.startDate} s/d {item.endDate}</span>
                    <span>Diajukan: {formatDate(item.appliedDate)}</span>
                  </div>
                </div>

                {item.rejectionReason && (
                  <div className="p-2.5 rounded-lg bg-[var(--danger)]/10 text-[var(--danger)] text-[11px] max-w-xs">
                    <strong>Alasan Ditolak:</strong> {item.rejectionReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Form Pengajuan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Formulir Pengajuan Cuti"
        description="Lengkapi tanggal dan alasan pengajuan cuti secara jelas."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Jenis Cuti / Izin"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            options={[
              { value: "TAHUNAN", label: "Cuti Tahunan (Potong Saldo)" },
              { value: "SAKIT", label: "Cuti Sakit (Surat Dokter)" },
              { value: "MELAHIRKAN", label: "Cuti Melahirkan" },
              { value: "PENTING", label: "Izin Keperluan Penting" },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tanggal Mulai"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              error={errors.startDate}
              required
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              error={errors.endDate}
              required
            />
          </div>

          <Textarea
            label="Alasan Permohonan Cuti"
            placeholder="Jelaskan keperluan cuti..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={errors.reason}
            rows={3}
            required
          />

          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Kirimkan Permohonan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
