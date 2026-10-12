"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { MOCK_CLIENTS, MOCK_MOU_CONFIG } from "@/lib/mock-data/clients";
import { MouConfig } from "@/lib/types";
import {
  FileText,
  AlertTriangle,
  Save,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CalendarDays,
  DollarSign,
} from "lucide-react";

export default function SuperadminMouPage() {
  const { showToast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState("client-1");

  // State konfigurasi
  const initialConfig = MOCK_MOU_CONFIG[selectedClientId] || MOCK_MOU_CONFIG["client-1"];
  const [config, setConfig] = useState<MouConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);

  // Ganti klien
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    if (MOCK_MOU_CONFIG[clientId]) {
      setConfig(MOCK_MOU_CONFIG[clientId]);
    }
  };

  const handleSave = (isDraft = false) => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast(
        "success",
        isDraft ? "Draft MOU Tersimpan" : "Konfigurasi MOU Diterapkan",
        "Aturan baru akan efektif berlaku untuk transaksi absensi dan payroll periode berjalan."
      );
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Konfigurasi MOU & Ketentuan Kerja"
        description="Atur modul aktif, aturan jam kerja, mekanisme validasi absensi, dan formula potongan payroll per klien."
        breadcrumbs={[{ label: "Superadmin" }, { label: "Konfigurasi MOU" }]}
        action={
          <div className="w-64">
            <Select
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              options={MOCK_CLIENTS.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
        }
      />

      {/* Peringatan Konsekuensi MOU */}
      <div className="p-4 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/30 flex items-start gap-3 text-xs text-[var(--warning)]">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="block text-[var(--text-primary)] mb-0.5">Peringatan Kebijakan & Perhitungan:</strong>
          Perubahan pada konfigurasi MOU ini akan langsung memengaruhi perhitungan keterlambatan absensi, approval cuti, dan potongan gaji pada kalkulasi payroll berikutnya untuk klien terpilih.
        </div>
      </div>

      {/* SECTION 1: Modul Aktif */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--teal)]" />
            <span>1. Modul Sistem yang Diaktifkan</span>
          </div>
        }
        description="Tentukan fitur apa saja yang dapat diakses oleh admin dan pegawai klien ini"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              key: "attendance",
              label: "Modul Absensi Harian",
              desc: "Pencatatan check-in/out, shift, dan telemetry sensor.",
            },
            {
              key: "leave",
              label: "Modul Pengajuan Cuti & Izin",
              desc: "Pengajuan saldo cuti tahunan dan sakit mandiri.",
            },
            {
              key: "payroll",
              label: "Modul Payroll Otomatis",
              desc: "Kalkulasi bruto, tunjangan, dan slip gaji elektronik.",
            },
            {
              key: "gajikuKasbon",
              label: "Integrasi Kasbon Gajiku",
              desc: "Sinkronisasi saldo potong gaji otomatis dengan Gajiku-Live.",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]"
            >
              <div>
                <span className="text-sm font-semibold text-[var(--text-primary)] block">{item.label}</span>
                <span className="text-xs text-[var(--text-muted)]">{item.desc}</span>
              </div>
              <input
                type="checkbox"
                checked={config.modules[item.key as keyof typeof config.modules]}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    modules: { ...config.modules, [item.key]: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-[var(--teal)] bg-[var(--surface-3)] border-[var(--border)] cursor-pointer"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* SECTION 2: Aturan Kerja */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--blue)]" />
            <span>2. Aturan Jam Kerja & Toleransi</span>
          </div>
        }
        description="Jadwal reguler dan toleransi perhitungan keterlambatan pegawai"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Jam Mulai Kerja (Shift Pagi)"
            type="time"
            value={config.workRules.startTime}
            onChange={(e) =>
              setConfig({
                ...config,
                workRules: { ...config.workRules, startTime: e.target.value },
              })
            }
          />
          <Input
            label="Jam Selesai Kerja"
            type="time"
            value={config.workRules.endTime}
            onChange={(e) =>
              setConfig({
                ...config,
                workRules: { ...config.workRules, endTime: e.target.value },
              })
            }
          />
          <Input
            label="Toleransi Terlambat (Menit)"
            type="number"
            value={config.workRules.gracePeriodMinutes}
            onChange={(e) =>
              setConfig({
                ...config,
                workRules: {
                  ...config.workRules,
                  gracePeriodMinutes: parseInt(e.target.value) || 0,
                },
              })
            }
            helperText="Di atas menit ini dihitung status TELAT"
          />
        </div>
      </Card>

      {/* SECTION 3: Validasi Absensi */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--teal)]" />
            <span>3. Ketentuan Validasi Absensi & Keamanan</span>
          </div>
        }
        description="Sensor yang wajib diverifikasi saat tombol check-in ditekan"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Kombinasi Metode Validasi"
              value={config.attendanceValidation.validationCombo}
              onChange={(e) =>
                setConfig({
                  ...config,
                  attendanceValidation: {
                    ...config.attendanceValidation,
                    validationCombo: e.target.value as any,
                  },
                })
              }
              options={[
                { value: "GPS_OR_IP", label: "GPS atau IP Kantor (Salah satu valid)" },
                { value: "GPS_AND_IP", label: "GPS dan IP Kantor (Keduanya wajib valid)" },
                { value: "GPS_ONLY", label: "Hanya GPS Lokasi Kantor" },
                { value: "IP_ONLY", label: "Hanya IP Jaringan Kantor" },
              ]}
            />
            <Input
              label="Batas Radius GPS (Meter)"
              type="number"
              value={config.attendanceValidation.gpsRadiusMeters}
              onChange={(e) =>
                setConfig({
                  ...config,
                  attendanceValidation: {
                    ...config.attendanceValidation,
                    gpsRadiusMeters: parseInt(e.target.value) || 50,
                  },
                })
              }
            />
            <Input
              label="Maksimal Toleransi Akurasi GPS (Meter)"
              type="number"
              value={config.attendanceValidation.maxGpsAccuracyMeters}
              onChange={(e) =>
                setConfig({
                  ...config,
                  attendanceValidation: {
                    ...config.attendanceValidation,
                    maxGpsAccuracyMeters: parseInt(e.target.value) || 30,
                  },
                })
              }
              helperText="Mencegah spoofing koordinat kasar"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-[var(--border)]">
            <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={config.attendanceValidation.requireSelfie}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    attendanceValidation: {
                      ...config.attendanceValidation,
                      requireSelfie: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded text-[var(--teal)] bg-[var(--surface-3)] border-[var(--border)]"
              />
              <span>Wajib Foto Selfie Wajah (Kamera Depan)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={config.attendanceValidation.requireOfficeIp}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    attendanceValidation: {
                      ...config.attendanceValidation,
                      requireOfficeIp: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded text-[var(--teal)] bg-[var(--surface-3)] border-[var(--border)]"
              />
              <span>Wajib Terhubung ke IP Whitelist Kantor</span>
            </label>
          </div>
        </div>
      </Card>

      {/* SECTION 4: Aturan Cuti & Payroll */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title={
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[var(--info)]" />
              <span>4. Pengaturan Cuti</span>
            </div>
          }
          description="Kebijakan kuota dan hak cuti karyawan"
        >
          <div className="space-y-4">
            <Input
              label="Kuota Cuti Tahunan (Hari)"
              type="number"
              value={config.leaveRules.annualQuota}
              onChange={(e) =>
                setConfig({
                  ...config,
                  leaveRules: {
                    ...config.leaveRules,
                    annualQuota: parseInt(e.target.value) || 12,
                  },
                })
              }
            />
            <div className="space-y-2 text-xs text-[var(--text-secondary)]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.leaveRules.allowBeforeProbation}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      leaveRules: {
                        ...config.leaveRules,
                        allowBeforeProbation: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-[var(--blue)] bg-[var(--surface-3)]"
                />
                <span>Boleh mengambil cuti sebelum masa kerja 1 tahun</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.leaveRules.singleLevelApproval}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      leaveRules: {
                        ...config.leaveRules,
                        singleLevelApproval: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-[var(--blue)] bg-[var(--surface-3)]"
                />
                <span>Persetujuan cukup 1 tingkat (langsung ke HR)</span>
              </label>
            </div>
          </div>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[var(--success)]" />
              <span>5. Formula Payroll & Potongan</span>
            </div>
          }
          description="Komponen tunjangan dan denda kehadiran"
        >
          <div className="space-y-4">
            <Input
              label="Potongan Alpha per Hari (Rupiah)"
              type="number"
              value={config.payrollRules.alphaDeductionPerDay}
              onChange={(e) =>
                setConfig({
                  ...config,
                  payrollRules: {
                    ...config.payrollRules,
                    alphaDeductionPerDay: parseInt(e.target.value) || 0,
                  },
                })
              }
              helperText="Nominal yang langsung dipotong jika karyawan tidak hadir tanpa keterangan"
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.payrollRules.mealAllowance}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      payrollRules: {
                        ...config.payrollRules,
                        mealAllowance: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-[var(--success)]"
                />
                <span className="text-[var(--text-primary)]">Tunjangan Makan</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.payrollRules.transportAllowance}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      payrollRules: {
                        ...config.payrollRules,
                        transportAllowance: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-[var(--success)]"
                />
                <span className="text-[var(--text-primary)]">Tunjangan Transport</span>
              </label>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <Button variant="ghost" onClick={() => handleClientChange(selectedClientId)}>
          Batalkan
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => handleSave(true)} disabled={isSaving}>
            Simpan Draft
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSave(false)}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Simpan Perubahan MOU
          </Button>
        </div>
      </div>
    </div>
  );
}
