"use client";

// Login HRIS melalui API server dengan cookie httpOnly.
// Client Component karena membutuhkan interaksi form, local state, dan navigasi router.
// Autentikasi diperiksa oleh server.

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/mock-auth";
import { Logo } from "@/components/brand/Logo";
import { BrandMark } from "@/components/brand/BrandMark";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Silakan lengkapi alamat email dan kata sandi.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        showToast("success", "Login Berhasil", "Selamat datang kembali!");
        const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
        const sessionData = await sessionResponse.json();
        if (sessionData?.user?.mustChangePassword) { router.replace("/ganti-password"); return; }
        const role = sessionData?.user?.role;
        if (role === "SUPERADMIN") router.push("/superadmin/dashboard");
        else if (role === "ADMIN") router.push("/admin/dashboard");
        else if (role === "PEGAWAI") router.push("/pegawai/dashboard");
        else router.push("/login");
      } else {
        setErrorMessage(result.message || "Email atau kata sandi tidak sesuai.");
        showToast("error", "Login Gagal", result.message);
      }
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg)] p-4 sm:p-8">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <Logo variant="full" size="md" />
        <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--surface)] px-3 py-1.5 rounded-full border border-[var(--border)]">
          <span className="w-2 h-2 rounded-full bg-[var(--teal)] animate-pulse" />
          <span>Sistem HRIS & Pendamping Gajiku-Live</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Masuk ke Akun
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5">
              Kelola kepegawaian, absensi, slip gaji, dan kasbon dalam satu portal.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Alamat Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@perusahaan.com"
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Kata Sandi"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              required
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {errorMessage && (
              <div className="p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-xs">
                {errorMessage}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Masuk Sekarang
            </Button>
          </form>

          <p className="mt-6 text-xs text-[var(--text-muted)] text-center">Gunakan akun yang dibuat oleh superadmin. Akun demo dan pergantian role browser dinonaktifkan.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center pt-4">
        <BrandMark />
      </div>
    </div>
  );
}
