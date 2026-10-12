"use client";

// Landing Page / Quick Portal Switcher
// Memungkinkan penguji atau user memilih portal sesuai peran secara instan.

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  Building2,
  User,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
  DollarSign,
  WalletCards,
  Lock,
} from "lucide-react";

export default function HomePage() {
  const handleEnterRole = () => { window.location.assign("/login"); };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg)] p-4 sm:p-8">
      {/* Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-[var(--border)]">
        <Logo variant="full" size="md" />
        <Link href="/login">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Buka Form Login
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl w-full mx-auto my-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--teal)] font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--teal)] animate-pulse" />
          <span>Sistem HRIS Multi-Klien Pendamping Gajiku-Live</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] max-w-3xl mx-auto leading-tight">
          Solusi HRIS Modern & Rekonsiliasi Kasbon untuk Perusahaan
        </h1>

        <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto mt-4 leading-relaxed">
          Platform terpadu untuk pengelolaan absensi geo-fence, pengajuan cuti, perhitungan payroll multi-siklus, dan sinkronisasi otomatis kasbon Gajiku.
        </p>

        {/* Portal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
          {/* Card Superadmin */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--blue)]/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--blue)]/15 text-[var(--blue)] flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--blue)] transition-colors">
                Portal Superadmin
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Kelola seluruh perusahaan klien, project cabang, konfigurasi MOU aturan absensi, dan audit trail lintas entitas.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-[var(--text-muted)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--blue)] shrink-0" />
                  <span>Isolasi Multi-Klien</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--blue)] shrink-0" />
                  <span>Konfigurasi MOU Fleksibel</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleEnterRole}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Masuk ke akun
              </Button>
            </div>
          </div>

          {/* Card Admin Klien */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--warning)]/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--warning)]/15 text-[var(--warning)] flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--warning)] transition-colors">
                Portal Admin Klien
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Kelola data pegawai, pantau absensi & radius GPS, verifikasi cuti, proses payroll, dan rekonsiliasi kasbon Gajiku.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-[var(--text-muted)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--warning)] shrink-0" />
                  <span>Kalkulasi Payroll Siklus A–D</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--warning)] shrink-0" />
                  <span>Deteksi Absensi Mencurigakan</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleEnterRole}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Masuk sebagai Admin HR
              </Button>
            </div>
          </div>

          {/* Card Pegawai */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--teal)]/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--teal)]/15 text-[var(--teal)] flex items-center justify-center mb-4">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--teal)] transition-colors">
                Portal Pegawai Mandiri
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Check-in/out cepat dengan simulasi GPS kantor, pengajuan cuti instan, lihat slip gaji bulanan, dan profil terlindungi.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-[var(--text-muted)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" />
                  <span>Mobile-First Thumb Experience</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" />
                  <span>Slip Gaji Siap Cetak / Print</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleEnterRole}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Masuk ke akun
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center pt-8 border-t border-[var(--border)]">
        <BrandMark />
      </footer>
    </div>
  );
}
