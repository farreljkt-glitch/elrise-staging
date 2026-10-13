"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function GantiPasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    if (newPassword !== confirmPassword) { setMessage("Konfirmasi kata sandi tidak sama."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.message ?? "Kata sandi gagal diperbarui."); return; }
      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await sessionResponse.json(); const role = data?.user?.role;
      if (role === "SUPERADMIN") router.replace("/superadmin/dashboard");
      else if (role === "ADMIN") router.replace("/admin/dashboard");
      else if (role === "ADMIN_PROJECT") router.replace("/project/dashboard");
      else if (role === "PEGAWAI") router.replace("/pegawai/dashboard");
      else router.replace("/login");
      router.refresh();
    } catch { setMessage("Server tidak dapat dihubungi. Perubahan belum dikonfirmasi."); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
    <section className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
      <div className="mb-6 flex justify-center"><Logo variant="full" size="md" /></div>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-2)]"><LockKeyhole className="h-6 w-6 text-[var(--teal)]" /></div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Perbarui Kata Sandi</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Untuk keamanan, ubah kata sandi awal sebelum melanjutkan.</p>
      </div>
      <form className="space-y-4" onSubmit={submit}>
        <Input label="Kata sandi saat ini" type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
        <Input label="Kata sandi baru (minimal 12 karakter)" type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={12} required />
        <Input label="Ulangi kata sandi baru" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={12} required />
        {message && <p role="alert" className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">{message}</p>}
        <Button type="submit" className="w-full" isLoading={busy}>Simpan Kata Sandi</Button>
      </form>
    </section>
  </main>;
}
