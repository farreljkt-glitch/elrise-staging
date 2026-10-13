import {
  Fingerprint,
  CalendarDays,
  Receipt,
  CalendarCheck,
  UserRound,
  FileText,
  Target,
  GraduationCap,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

export type PegawaiMenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** fitur di luar ruang lingkup saat ini: tampil tapi belum bisa dibuka */
  soon?: boolean;
};

/** Susunan mengikuti grid "Menu Utama" 4×2. Ubah di sini bila MOU klien menambah/mengurangi fitur. */
export const PEGAWAI_MENU: PegawaiMenuItem[] = [
  { label: "Absensi", href: "/pegawai/absen", icon: Fingerprint },
  { label: "Cuti & Izin", href: "/pegawai/cuti", icon: CalendarDays },
  { label: "Slip Gaji", href: "/pegawai/slip", icon: Receipt },
  { label: "Kehadiran", href: "/pegawai/kehadiran", icon: CalendarCheck },
  { label: "Profil Saya", href: "/pegawai/profil", icon: UserRound },
  { label: "Dokumen", href: "/pegawai/dokumen", icon: FileText, soon: true },
  { label: "Kinerja", href: "/pegawai/kinerja", icon: Target, soon: true },
  { label: "Kasbon", href: "/pegawai/kasbon", icon: WalletCards },
];
