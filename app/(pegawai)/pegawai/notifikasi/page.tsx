"use client";

import React, { useState } from "react";
import { BellRing, CalendarCheck, CheckCheck, Megaphone, Receipt, type LucideIcon } from "lucide-react";

type Notif = { id: string; title: string; body: string; time: string; icon: LucideIcon; unread: boolean };

// Data demo — nanti dari tabel notifikasi per pengguna.
const INITIAL: Notif[] = [
  { id: "n1", title: "Cuti disetujui", body: "Pengajuan cuti tahunan 2–4 April 2026 telah disetujui HR.", time: "2 jam lalu", icon: CalendarCheck, unread: true },
  { id: "n2", title: "Slip gaji Maret tersedia", body: "Slip gaji periode Maret 2026 sudah dapat dilihat dan diunduh.", time: "Kemarin", icon: Receipt, unread: true },
  { id: "n3", title: "Pengumuman baru", body: "Jadwal libur Hari Raya Idul Fitri telah dipublikasikan.", time: "3 hari lalu", icon: Megaphone, unread: false },
  { id: "n4", title: "Pengingat absen pulang", body: "Jangan lupa absen pulang sebelum meninggalkan lokasi kerja.", time: "5 hari lalu", icon: BellRing, unread: false },
];

export default function PegawaiNotifikasiPage() {
  const [items, setItems] = useState(INITIAL);
  const unread = items.filter((n) => n.unread).length;

  return (
    <div className="space-y-5">
      <header className="anim-in flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--text-primary)]">Notifikasi</h1>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"}</p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => setItems((l) => l.map((n) => ({ ...n, unread: false })))}
            className="press flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--teal)]"
          >
            <CheckCheck className="h-4 w-4" /> Tandai dibaca
          </button>
        )}
      </header>

      <ul className="m-card divide-y divide-[var(--border)] overflow-hidden">
        {items.map((n, i) => (
          <li key={n.id} className="anim-in" style={{ "--i": i } as React.CSSProperties}>
            <button
              type="button"
              onClick={() => setItems((l) => l.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}
              className="press-sm flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors active:bg-[var(--surface-2)]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[image:var(--grad-soft)] text-[var(--teal)]">
                <n.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={`text-sm text-[var(--text-primary)] ${n.unread ? "font-bold" : "font-semibold"}`}>{n.title}</span>
                  {n.unread && <span className="h-2 w-2 rounded-full bg-[var(--teal)]" aria-label="Belum dibaca" />}
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-[var(--text-secondary)]">{n.body}</span>
                <span className="mt-1 block text-[11px] text-[var(--text-muted)]">{n.time}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
