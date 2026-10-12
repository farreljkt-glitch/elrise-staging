import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl">
        <h2 className="text-4xl font-extrabold text-[var(--teal)] font-mono">404</h2>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mt-2">Halaman Tidak Ditemukan</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
          Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>
        <div className="mt-6">
          <Link href="/">
            <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
