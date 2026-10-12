"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/mock-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { MOCK_LEAVE_REQUESTS, MOCK_LEAVE_BALANCES } from "@/lib/mock-data/leave";
import { LeaveRequest } from "@/lib/types";
import { formatDate } from "@/lib/formatters";
import {
  CalendarDays,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  FileText,
  Clock,
  User,
} from "lucide-react";

export default function AdminCutiPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const clientId = user?.clientId || "client-1";

  const [leaves, setLeaves] = useState<LeaveRequest[]>(
    MOCK_LEAVE_REQUESTS.filter((l) => l.clientId === clientId)
  );
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");

  // State untuk modal aksi
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const filteredLeaves = leaves.filter((l) => {
    if (activeTab === "ALL") return true;
    return l.status === activeTab;
  });

  const handleApprove = (leaveId: string) => {
    setLeaves((prev) =>
      prev.map((l) =>
        l.id === leaveId
          ? {
              ...l,
              status: "APPROVED",
              approvedOrRejectedDate: new Date().toISOString(),
              approvedOrRejectedBy: user?.name || "HR Admin",
            }
          : l
      )
    );
    showToast("success", "Pengajuan Disetujui", "Saldo cuti pegawai telah dipotong otomatis.");
    setSelectedLeave(null);
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      showToast("error", "Alasan Wajib Diisi", "Mohon berikan alasan penolakan cuti.");
      return;
    }

    if (!rejectingLeave) return;

    setLeaves((prev) =>
      prev.map((l) =>
        l.id === rejectingLeave.id
          ? {
              ...l,
              status: "REJECTED",
              rejectionReason,
              approvedOrRejectedDate: new Date().toISOString(),
              approvedOrRejectedBy: user?.name || "HR Admin",
            }
          : l
      )
    );
    showToast("warning", "Pengajuan Ditolak", "Notifikasi penolakan telah dikirimkan ke pegawai.");
    setRejectingLeave(null);
    setRejectionReason("");
    setSelectedLeave(null);
  };

  const columns: Column<LeaveRequest>[] = [
    {
      header: "Nama Pegawai",
      cell: (row) => (
        <div>
          <span className="font-semibold text-[var(--text-primary)] block">{row.employeeName}</span>
          <span className="text-xs font-mono text-[var(--teal)]">{row.employeeCode}</span>
        </div>
      ),
    },
    {
      header: "Jenis Cuti / Izin",
      cell: (row) => <Badge size="sm" variant="info">{row.type}</Badge>,
    },
    {
      header: "Durasi & Tanggal",
      cell: (row) => (
        <div>
          <span className="font-semibold text-[var(--text-primary)] font-mono text-xs block">
            {row.totalDays} Hari Kerja
          </span>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            {row.startDate} s/d {row.endDate}
          </span>
        </div>
      ),
    },
    {
      header: "Alasan Permohonan",
      cell: (row) => (
        <span className="text-xs text-[var(--text-secondary)] max-w-xs truncate block" title={row.reason}>
          {row.reason}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge
          size="sm"
          variant={
            row.status === "APPROVED"
              ? "success"
              : row.status === "PENDING"
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
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedLeave(row)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            Review
          </Button>

          {row.status === "PENDING" && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApprove(row.id)}
                className="bg-emerald-600 hover:bg-emerald-500 text-[var(--text-primary)]"
              >
                Setujui
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-[var(--danger)] hover:bg-[var(--danger)]/10"
                onClick={() => setRejectingLeave(row)}
              >
                Tolak
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Persetujuan Cuti & Izin Karyawan"
        description="Kelola alur permohonan cuti tahunan, sakit, melahirkan, serta izin khusus pegawai."
        breadcrumbs={[{ label: "Admin" }, { label: "Cuti & Izin" }]}
      />

      {/* Tabs Filter */}
      <div className="flex items-center gap-1 p-1 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] w-fit overflow-x-auto">
        {[
          { key: "PENDING", label: "Menunggu Persetujuan" },
          { key: "APPROVED", label: "Disetujui" },
          { key: "REJECTED", label: "Ditolak" },
          { key: "ALL", label: "Semua Riwayat" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-[var(--surface-3)] text-[var(--text-primary)] shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabel */}
      <Table
        columns={columns}
        data={filteredLeaves}
        keyExtractor={(row) => row.id}
        emptyTitle="Tidak Ada Pengajuan Cuti"
        emptyDescription="Tidak ada data permohonan pada kategori ini saat ini."
      />

      {/* Modal Detail Review Cuti */}
      <Modal
        isOpen={!!selectedLeave}
        onClose={() => setSelectedLeave(null)}
        title="Rincian Permohonan Cuti"
        description={`ID Pengajuan: ${selectedLeave?.id}`}
        footer={
          selectedLeave?.status === "PENDING" ? (
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setRejectingLeave(selectedLeave);
                }}
              >
                Tolak Pengajuan
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApprove(selectedLeave.id)}
              >
                Setujui Cuti Ini
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedLeave && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[var(--surface-2)] grid grid-cols-2 gap-3">
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Nama Pegawai</span>
                <span className="text-[var(--text-primary)] font-semibold text-sm">{selectedLeave.employeeName}</span>
                <span className="text-[var(--teal)] font-mono block">{selectedLeave.employeeCode}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">Jenis Pengajuan</span>
                <span className="text-[var(--text-primary)] font-medium">{selectedLeave.type}</span>
                <span className="text-[var(--text-muted)] block font-mono">
                  Diajukan: {formatDate(selectedLeave.appliedDate)}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-3)] space-y-2">
              <span className="text-[var(--text-muted)] block text-[10px] font-semibold uppercase">
                Alasan Pengajuan:
              </span>
              <p className="text-[var(--text-primary)] leading-relaxed">{selectedLeave.reason}</p>
            </div>

            {selectedLeave.rejectionReason && (
              <div className="p-3.5 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)]">
                <span className="block font-semibold mb-0.5">Catatan Penolakan:</span>
                {selectedLeave.rejectionReason}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Alasan Penolakan Wajib */}
      <Modal
        isOpen={!!rejectingLeave}
        onClose={() => setRejectingLeave(null)}
        title="Tolak Pengajuan Cuti"
        description="Wajib mengisi alasan penolakan agar karyawan memahami keputusan HR."
        footer={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setRejectingLeave(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleConfirmReject}>
              Konfirmasi Tolak Cuti
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Textarea
            label="Alasan Penolakan (Wajib)"
            placeholder="Contoh: Jadwal operasional sedang peak season audit logistik..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            required
          />
        </div>
      </Modal>
    </div>
  );
}
