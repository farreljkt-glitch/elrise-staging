"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, LogIn, LogOut, MapPin, ShieldAlert } from "lucide-react";
import { MOCK_ATTENDANCE } from "@/lib/mock-data/attendance";

type Today = { checkIn: string | null; checkOut: string | null; status: string | null; gpsValid: boolean | null };

const WIB = "Asia/Jakarta";
const hhmm = (d: Date) => d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: WIB }).replace(".", ":");
const isoToHhmm = (iso?: string | null) => (iso ? hhmm(new Date(iso)) : null);

const STATUS_VIEW: Record<string, { label: string; dot: string }> = {
  HADIR: { label: "Hadir", dot: "#6ee7b7" },
  TELAT: { label: "Terlambat", dot: "#fcd34d" },
};

/** Kartu kehadiran hari ini. Data nyata dari /api/absen; bila API/DB belum aktif memakai data demo agar tampilan tetap terlihat. */
export function AttendanceHero({ employeeId, greetingName }: { employeeId: string; greetingName: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const [today, setToday] = useState<Today | undefined>(undefined); // undefined = memuat

  useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/absen", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("api"))))
      .then((data) => {
        if (cancelled) return;
        const a = data?.attendance;
        setToday(
          a
            ? { checkIn: isoToHhmm(a.checkInAt), checkOut: isoToHhmm(a.checkOutAt), status: a.status ?? null, gpsValid: true }
            : { checkIn: null, checkOut: null, status: null, gpsValid: null },
        );
      })
      .catch(() => {
        if (cancelled) return;
        const m = MOCK_ATTENDANCE.find((x) => x.employeeId === employeeId && x.date === "2026-03-27");
        setToday({ checkIn: m?.checkInTime?.slice(0, 5) ?? null, checkOut: m?.checkOutTime?.slice(0, 5) ?? null, status: m?.status ?? null, gpsValid: m ? m.gpsValid : null });
      });
    return () => { cancelled = true; };
  }, [employeeId]);

  const dateLabel = now
    ? new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: WIB }).format(now)
    : " ";
  const statusView = today?.status ? STATUS_VIEW[today.status] ?? { label: today.status, dot: "#93c5fd" } : null;
  const finished = !!today?.checkOut;
  const cta = !today?.checkIn ? { label: "Absen Masuk", Icon: LogIn } : finished ? { label: "Lihat Absensi", Icon: ArrowRight } : { label: "Absen Pulang", Icon: LogOut };

  return (
    <section className="m-hero p-5 anim-in" aria-label="Kehadiran hari ini">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-white/80">Kehadiran Hari Ini</p>
          <p className="mt-0.5 text-[13px] text-white/70">{dateLabel}</p>

          <p className="mt-3 text-[44px] font-extrabold leading-none tracking-tight tabular-nums" aria-live="off">
            {now ? hhmm(now) : "--:--"}
            <span className="ml-1.5 align-baseline text-sm font-semibold text-white/70">WIB</span>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {today === undefined ? (
              <span className="skeleton h-6 w-20 !rounded-full !bg-white/20" />
            ) : statusView ? (
              <span className="m-chip text-white" style={{ background: "rgba(255,255,255,.16)" }}>
                <span className="h-2 w-2 rounded-full" style={{ background: statusView.dot }} />
                {statusView.label}
              </span>
            ) : (
              <span className="m-chip text-white" style={{ background: "rgba(255,255,255,.16)" }}>Belum absen</span>
            )}
            {today?.checkIn && (
              <span className="text-[13px] font-medium text-white/90">Check in {today.checkIn} WIB</span>
            )}
          </div>
          {today?.checkOut && <p className="mt-1 text-[13px] text-white/80">Check out {today.checkOut} WIB</p>}
        </div>

        {/* peta + pin lokasi */}
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className="m-map h-[92px] w-[92px] grid place-items-center">
            <span className="relative grid h-9 w-9 place-items-center">
              {today?.gpsValid && <span className="pin-ping" />}
              <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white shadow-lg" style={{ color: "#123054" }}>
                <MapPin className="h-5 w-5" fill="currentColor" strokeWidth={1.5} />
              </span>
            </span>
          </div>
          {today?.gpsValid === true ? (
            <span className="m-chip text-[11px]" style={{ background: "rgba(255,255,255,.92)", color: "#0c5a49" }}>
              <BadgeCheck className="h-3.5 w-3.5" /> Lokasi Valid
            </span>
          ) : today?.gpsValid === false ? (
            <span className="m-chip text-[11px]" style={{ background: "rgba(255,255,255,.92)", color: "#8a1c12" }}>
              <ShieldAlert className="h-3.5 w-3.5" /> Di luar radius
            </span>
          ) : (
            <span className="m-chip text-[11px] text-white/85" style={{ background: "rgba(255,255,255,.12)" }}>Lokasi dicek saat absen</span>
          )}
        </div>
      </div>

      <Link
        href="/pegawai/absen"
        className="press relative z-10 mt-4 flex h-12 items-center justify-center gap-2 rounded-2xl text-[15px] font-bold"
        style={{ background: "#ffffff", color: "#123054" }}
      >
        <cta.Icon className="h-[18px] w-[18px]" />
        {cta.label}
      </Link>
      <span className="sr-only">Halo {greetingName}</span>
    </section>
  );
}
