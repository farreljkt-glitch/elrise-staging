"use client";

import React from "react";
import { CheckCircle2, Clock4, MapPinOff } from "lucide-react";
import { useAuth } from "@/lib/mock-auth";
import { MOCK_ATTENDANCE } from "@/lib/mock-data/attendance";
import { Badge } from "@/components/ui/Badge";

const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(iso));

export default function PegawaiKehadiranPage() {
  const { user } = useAuth();
  const empId = user?.employeeId || "emp-1";
  // Demo: riwayat dari mock. Nanti dari endpoint riwayat absensi (HADIR/TELAT per hari).
  const rows = MOCK_ATTENDANCE.filter((a) => a.employeeId === empId).sort((a, b) => b.date.localeCompare(a.date));
  const hadir = rows.filter((r) => r.status === "HADIR").length;
  const telat = rows.filter((r) => r.status === "TELAT").length;

  return (
    <div className="space-y-5">
      <header className="anim-in">
        <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--text-primary)]">Kehadiran</h1>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">Riwayat absensi kamu.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="m-card anim-in p-4" style={{ "--i": 1 } as React.CSSProperties}>
          <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-[var(--text-primary)]">{hadir}</p>
          <p className="text-xs text-[var(--text-muted)]">Hadir tepat waktu</p>
        </div>
        <div className="m-card anim-in p-4" style={{ "--i": 2 } as React.CSSProperties}>
          <Clock4 className="h-5 w-5 text-[var(--warning)]" />
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-[var(--text-primary)]">{telat}</p>
          <p className="text-xs text-[var(--text-muted)]">Terlambat</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="m-card p-8 text-center text-sm text-[var(--text-muted)]">Belum ada riwayat absensi.</div>
      ) : (
        <ul className="m-card divide-y divide-[var(--border)] overflow-hidden">
          {rows.map((r, i) => (
            <li key={r.id} className="anim-in flex items-center gap-3 px-4 py-3.5" style={{ "--i": i } as React.CSSProperties}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{dayLabel(r.date)}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <span className="tabular-nums">{r.checkInTime?.slice(0, 5) ?? "--:--"} – {r.checkOutTime?.slice(0, 5) ?? "--:--"}</span>
                  {!r.gpsValid && <MapPinOff className="h-3.5 w-3.5 text-[var(--danger)]" aria-label="Lokasi di luar radius" />}
                </p>
              </div>
              <Badge size="sm" variant={r.status === "HADIR" ? "success" : r.status === "TELAT" ? "warning" : "neutral"} dot>
                {r.status === "TELAT" ? `Telat ${r.lateMinutes} mnt` : r.status === "HADIR" ? "Hadir" : r.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
