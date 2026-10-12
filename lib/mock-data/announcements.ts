export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string; // YYYY-MM-DD
}

// Data demo — nanti diganti data dari tabel pengumuman per klien.
export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    title: "Jadwal Libur Hari Raya Idul Fitri",
    body: "Libur bersama Idul Fitri dimulai 30 Maret s/d 3 April 2026. Pengajuan cuti pada tanggal merah bersama tidak memotong kuota tahunan.",
    date: "2026-03-20",
  },
  {
    id: "ann-2",
    title: "Batas Penarikan Kasbon Gajiku",
    body: "Penarikan dana via aplikasi Gajiku untuk periode berjalan ditutup pada cut-off tanggal 20 pukul 23:59 WIB.",
    date: "2026-03-15",
  },
  {
    id: "ann-3",
    title: "Pembaruan Aturan Absensi",
    body: "Absen masuk wajib dengan foto selfie langsung dari kamera dan lokasi GPS di dalam radius kantor.",
    date: "2026-03-10",
  },
];
