import React from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, HeartPulse, Briefcase, Baby, Star, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { LEAVE_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import type { LeaveRequest, LeaveType } from "@/lib/types";

const TYPE_VIEW: Record<LeaveType, { label: string; Icon: LucideIcon }> = {
  TAHUNAN: { label: "Cuti Tahunan", Icon: CalendarDays },
  SAKIT: { label: "Izin Sakit", Icon: HeartPulse },
  MELAHIRKAN: { label: "Cuti Melahirkan", Icon: Baby },
  PENTING: { label: "Izin Keperluan Penting", Icon: Briefcase },
  IZIN_KHUSUS: { label: "Izin Khusus", Icon: Star },
};

const STATUS_SHORT: Record<string, string> = { PENDING: "Menunggu", APPROVED: "Disetujui", REJECTED: "Ditolak" };

function range(r: LeaveRequest) {
  const a = formatDate(r.startDate).replace(/ \d{4}$/, "");
  const b = formatDate(r.endDate);
  return r.startDate === r.endDate ? b : `${a} – ${b}`;
}

export function RecentRequests({ items }: { items: LeaveRequest[] }) {
  if (items.length === 0) {
    return (
      <div className="m-card p-6 text-center text-sm text-[var(--text-muted)]">
        Belum ada pengajuan. <Link href="/pegawai/cuti" className="font-semibold text-[var(--teal)]">Ajukan cuti</Link>
      </div>
    );
  }
  return (
    <ul className="m-card divide-y divide-[var(--border)] overflow-hidden">
      {items.map((r, i) => {
        const { label, Icon } = TYPE_VIEW[r.type];
        const st = LEAVE_STATUS_LABELS[r.status];
        return (
          <li key={r.id} className="anim-in" style={{ "--i": i } as React.CSSProperties}>
            <Link href="/pegawai/cuti" className="press-sm flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-[var(--surface-2)]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[image:var(--grad-soft)] text-[var(--blue)]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{label}</span>
                <span className="block truncate text-xs text-[var(--text-muted)]">{range(r)}</span>
              </span>
              <Badge size="sm" variant={st?.variant ?? "neutral"}>{STATUS_SHORT[r.status] ?? r.status}</Badge>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
