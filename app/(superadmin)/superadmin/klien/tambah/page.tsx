"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft, Save, Building } from "lucide-react";

export default function TambahKlienPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [picName, setPicName] = useState("");
  const [status, setStatus] = useState("AKTIF");
  const [brandColor, setBrandColor] = useState("#2f8cf0");
  const [kasbonIntegration, setKasbonIntegration] = useState(true);
  const [plafonPercent, setPlafonPercent] = useState("20");
  const plafonNum = Number(plafonPercent);
  const plafonValid = plafonPercent.trim() !== "" && Number.isFinite(plafonNum) && plafonNum >= 0 && plafonNum <= 100;
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !code.trim() || !contactEmail.trim()) {
      showToast("error", "Validasi Gagal", "Mohon lengkapi seluruh kolom bertanda bintang.");
      return;
    }

    if (kasbonIntegration && !plafonValid) {
      showToast("error", "Validasi Gagal", "Plafon kasbon harus berupa persen 0 sampai 100.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast("success", "Klien Ditambahkan", `Perusahaan ${name} berhasil didaftarkan ke sistem.`);
      router.push("/superadmin/klien");
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Pendaftaran Klien Baru"
        description="Daftarkan entitas perusahaan mitra baru untuk mulai menggunakan sistem HRIS dan integrasi kasbon."
        breadcrumbs={[
          { label: "Superadmin" },
          { label: "Klien", href: "/superadmin/klien" },
          { label: "Tambah Baru" },
        ]}
        action={
          <Link href="/superadmin/klien">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Kembali
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card
          title="Informasi Perusahaan"
          description="Masukkan data legalitas dan penanggung jawab entitas klien."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nama Perusahaan"
                placeholder="Contoh: PT Sumber Makmur Sejahtera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Kode Perusahaan (Singkatan 3-4 Huruf)"
                placeholder="Contoh: SMS"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
            </div>

            <Textarea
              label="Alamat Kantor / Operasional"
              placeholder="Alamat lengkap lokasi kantor pusat..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Email Kontak Resmi"
                type="email"
                placeholder="hrd@perusahaan.co.id"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
              <Input
                label="Nomor Telepon Kantor"
                placeholder="021-8980123"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
              />
              <Input
                label="Nama PIC / Contact Person"
                placeholder="Bambang Sudirjo"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
              <Select
                label="Status Klien Awal"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: "AKTIF", label: "Aktif (Dapat langsung digunakan)" },
                  { value: "SUSPEND", label: "Ditangguhkan" },
                ]}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Warna Identitas Brand (Opsional)
                </label>
                <div className="flex items-center gap-3 h-10">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-[var(--border)]"
                  />
                  <span className="text-xs font-mono text-[var(--text-primary)]">{brandColor}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-[var(--text-primary)] block">
                  Integrasi Kasbon Gajiku
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Aktifkan fitur pendamping pinjaman kasbon instan untuk pegawai klien ini.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={kasbonIntegration}
                  onChange={(e) => setKasbonIntegration(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--surface-3)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
              </label>
            </div>

            {kasbonIntegration && (
              <div className="anim-in rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <Input
                  label="Plafon kasbon (% dari gaji pokok)"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={plafonPercent}
                  onChange={(e) => setPlafonPercent(e.target.value)}
                  error={plafonPercent !== "" && !plafonValid ? "Isi angka 0 sampai 100" : undefined}
                  helperText="Gaji tetap di HRIS; yang dikirim ke Gajiku hanya plafonnya."
                />
                {plafonValid && (
                  <p className="mt-3 text-xs text-[var(--text-secondary)]">
                    Contoh: gaji Rp10.000.000 → plafon{" "}
                    <strong className="text-[var(--text-primary)]">Rp{Math.floor((10_000_000 * plafonNum) / 100).toLocaleString("id-ID")}</strong>
                    , limit harian Rp{Math.floor(Math.floor((10_000_000 * plafonNum) / 100) / 30).toLocaleString("id-ID")} × jumlah hari hadir.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
            <Link href="/superadmin/klien">
              <Button variant="ghost" type="button">
                Batalkan
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              isLoading={isLoading}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Simpan Data Klien
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
