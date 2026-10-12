"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/mock-auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { MOCK_EMPLOYEES } from "@/lib/mock-data/employees";
import { MOCK_PROJECTS } from "@/lib/mock-data/projects";
import { ArrowLeft, Save, UserCheck } from "lucide-react";

export default function TambahPegawaiPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const clientId = user?.clientId || "client-1";
  const clientName = user?.clientName || "PT Sumber Makmur Sejahtera";

  const clientProjects = MOCK_PROJECTS.filter((p) => p.clientId === clientId);

  // Form states
  const [employeeCode, setEmployeeCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("Operasional & Pabrik");
  const [projectId, setProjectId] = useState(clientProjects[0]?.id || "");
  const [basicSalary, setBasicSalary] = useState("6500000");
  const [fixedAllowance, setFixedAllowance] = useState("500000");
  const [salaryCycle, setSalaryCycle] = useState("SIKLUS_A");
  const [joinDate, setJoinDate] = useState("2026-03-01");
  const [bankName, setBankName] = useState("BCA");
  const [bankAccount, setBankAccount] = useState("");
  const [eWallet, setEWallet] = useState("");
  const [status, setStatus] = useState("TETAP");

  // Error validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const err: Record<string, string> = {};

    if (!employeeCode.trim()) {
      err.employeeCode = "ID Pegawai wajib diisi.";
    } else {
      // Cek duplikasi
      const duplicate = MOCK_EMPLOYEES.some(
        (e) => e.employeeCode.toLowerCase() === employeeCode.trim().toLowerCase()
      );
      if (duplicate) {
        err.employeeCode = "ID Pegawai sudah terdaftar dalam sistem.";
      }
    }

    if (!name.trim()) err.name = "Nama lengkap wajib diisi.";

    if (!email.trim()) {
      err.email = "Alamat email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      err.email = "Format email tidak valid.";
    }

    if (!projectId) err.projectId = "Project penempatan wajib dipilih.";
    if (!joinDate) err.joinDate = "Tanggal masuk kerja wajib diisi.";

    const salaryNum = parseInt(basicSalary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      err.basicSalary = "Gaji pokok harus berupa angka positif.";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showToast("error", "Validasi Gagal", "Periksa kembali isian formulir yang ditandai merah.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast("success", "Pegawai Ditambahkan", `Karyawan ${name} (${employeeCode}) berhasil didaftarkan.`);
      router.push("/admin/pegawai");
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Tambah Pegawai Baru"
        description={`Pendaftaran data karyawan baru untuk entitas ${clientName}.`}
        breadcrumbs={[
          { label: "Admin" },
          { label: "Pegawai", href: "/admin/pegawai" },
          { label: "Tambah Baru" },
        ]}
        action={
          <Link href="/admin/pegawai">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Kembali
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Identitas Pribadi & Pekerjaan */}
        <Card title="Data Pribadi & Pekerjaan" description="Informasi identitas dan penempatan jabatan">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="ID / Nomor Induk Pegawai (Unik)"
                placeholder="Contoh: SMS-2026-030"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                error={errors.employeeCode}
                required
              />
              <Input
                label="Nama Lengkap Pegawai"
                placeholder="Contoh: Muhammad Firdaus"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Perusahaan"
                type="email"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                required
              />
              <Input
                label="Nomor WhatsApp / HP"
                placeholder="0812-xxxx-xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Jabatan"
                placeholder="Contoh: Production Staff"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
              />
              <Input
                label="Departemen"
                placeholder="Contoh: Operasional & Pabrik"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
              <Select
                label="Penempatan Project Kantor"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                error={errors.projectId}
                options={clientProjects.map((p) => ({ value: p.id, label: p.name }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Tanggal Bergabung (Join Date)"
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                error={errors.joinDate}
                required
              />
              <Select
                label="Status Karyawan"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: "TETAP", label: "Karyawan Tetap (PKWTT)" },
                  { value: "KONTRAK", label: "Karyawan Kontrak (PKWT)" },
                  { value: "PROBATION", label: "Masa Percobaan (Probation)" },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* SECTION 2: Kompensasi & Payroll */}
        <Card title="Data Gaji & Rekening Bank" description="Komponen payroll dan rekening penyaluran gaji">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Gaji Pokok (Rupiah)"
                type="number"
                placeholder="6500000"
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
                error={errors.basicSalary}
                required
              />
              <Input
                label="Tunjangan Tetap (Rupiah)"
                type="number"
                placeholder="500000"
                value={fixedAllowance}
                onChange={(e) => setFixedAllowance(e.target.value)}
              />
              <Select
                label="Siklus Penggajian"
                value={salaryCycle}
                onChange={(e) => setSalaryCycle(e.target.value)}
                options={[
                  { value: "SIKLUS_A", label: "Siklus A (periode mulai tgl 1)" },
                  { value: "SIKLUS_B", label: "Siklus B (periode mulai tgl 16)" },
                  { value: "SIKLUS_C", label: "Siklus C (periode mulai tgl 21)" },
                  { value: "SIKLUS_D", label: "Siklus D (periode mulai tgl 26)" },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[var(--border)]">
              <Select
                label="Nama Bank Penggajian"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                options={[
                  { value: "BCA", label: "Bank BCA" },
                  { value: "Mandiri", label: "Bank Mandiri" },
                  { value: "BRI", label: "Bank BRI" },
                  { value: "BNI", label: "Bank BNI" },
                  { value: "BSI", label: "Bank Syariah Indonesia" },
                ]}
              />
              <Input
                label="Nomor Rekening Bank"
                placeholder="Nomor rekening pencairan gaji"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                required
              />
              <Input
                label="Akun E-Wallet (Opsional)"
                placeholder="Gopay / OVO / DANA"
                value={eWallet}
                onChange={(e) => setEWallet(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
            <Link href="/admin/pegawai">
              <Button variant="ghost" type="button">
                Batal
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              isLoading={isLoading}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Simpan Data Pegawai
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
