# Status Implementasi — Terhubung Gajiku

Dokumen ini sengaja eksplisit agar prototype tidak keliru dianggap production-ready.

## Ditambahkan pada paket ini
- Skema Prisma MySQL untuk entitas inti HRIS.
- Koneksi Prisma tanpa fallback memori.
- Login API berbasis bcrypt + JWT cookie httpOnly, logout, pembacaan sesi, middleware role, throttle percobaan login persisten di MySQL, dan alur wajib ganti kata sandi pertama kali.
- Seed superadmin yang memerlukan kredensial environment.
- Audit log helper server-side.
- Endpoint absensi pegawai dengan pengambilan foto kamera dari browser, GPS, validasi radius di server, timestamp server, watermark, penyimpanan file privat, check-in/out dan route foto berotorisasi.
- Service pembacaan view kasbon dengan parameterized query.
- Helper perhitungan payroll integer rupiah, pemilihan kasbon belum settle, mapping periode, serta unit test.
- Skrip SQL integrasi dan dokumentasi keamanan/setup yang diperbarui.

## Belum boleh dianggap selesai / wajib dilengkapi sebelum produksi
- Banyak halaman dashboard, master pegawai, project, MOU, cuti, payroll, slip, kasbon, dan audit pada UI lama masih menggunakan mock data/state. Belum semua tombol tersambung ke Server Actions atau database. Jangan gunakan hasil layar tersebut sebagai data bisnis.
- Belum ada CRUD server lengkap untuk klien/project/MOU/pegawai, import/export Excel, approval cuti/koreksi, PDF slip, dan workflow payroll DRAFT → REVIEW → LOCKED → PAID.
- Workflow settlement belum dibungkus transaksi database final yang sekaligus mengunci periode, membuat payroll item, dan memasukkan KasbonSettlement secara atomik. Constraint UNIQUE tersedia sebagai lapisan proteksi, tetapi bukan pengganti transaksi workflow.
- Alur ganti password wajib saat login pertama sudah tersedia. `requireUser` juga menolak akun yang belum mengganti password. Perubahan password menaikkan `tokenVersion`, sehingga sesi lama tidak lagi valid; reset password admin dan provisioning akun tenant masih perlu dilengkapi.
- Throttle login menggunakan batas 8 per IP/email dan 40 per IP. Jika IP tidak tersedia, throttle IP-wide dilewati untuk menghindari satu bucket unknown bersama; firewall wajib memastikan port 3000 hanya dapat diakses reverse proxy yang menimpa X-Real-IP. Uji beban dan race-condition masih wajib.
- Kontrak SQL view kasbon memakai asumsi nama kolom legacy. Verifikasi dengan `SHOW CREATE TABLE` di database Gajiku aktual sebelum membuat view.
- Perubahan tambahan: penyelarasan `eslint-config-next` ke major Next.js 15, forced password-change middleware, dan tes periode tahun kabisat/validasi input. Build dan seluruh tes masih belum terverifikasi pada paket ini karena dependency belum diinstal di lingkungan pengerjaan.
- Mapping siklus diperbaiki: A = tanggal 1 sampai akhir bulan; B = tanggal 16 sampai tanggal 15 bulan berikutnya; C = tanggal 21 sampai tanggal 20 bulan berikutnya; D = tanggal 26 sampai tanggal 25 bulan berikutnya. Periode Gajiku memakai bulan awal siklus sebagai key. Mingguan masih memakai helper terpisah dan belum memiliki konfigurasi cutoff mingguan per tenant.
- View kasbon kini memakai kolom kontrak Gajiku `periode`, `nominal`, `admin_fee`, `final_approved_at`, serta `p.id_pegawai`. SQL menyebut definer khusus `hris_view_reader`; DBA wajib memverifikasi grants, akun Gajiku, dan hak minimalnya sebelum dieksekusi.
- Aturan jaringan absensi menggunakan enum Prisma dan menolak konfigurasi tidak dikenal. Watermark menyesuaikan ukuran gambar. Pemeriksaan check-in/check-out duplikat dipindahkan sebelum penulisan selfie; konflik bersamaan tetap perlu diuji karena hanya constraint database yang menjamin serialisasi.
- Kasbon sukses yang belum settle difilter menggunakan `ClientSetting.kasbonStartPeriod <= periode <= periodeKey`. Periode awal go-live wajib dikonfigurasi jika integrasi kasbon aktif; kasbon historis sebelum batas ini tidak ditarik meski tabel settlement masih kosong. Format mingguan `W:` ditolak secara eksplisit sampai cutoff mingguan dikonfigurasi dan didukung.
- Login menambahkan throttle per IP dan per kombinasi IP/email serta menghindari lockout akun yang bisa dipicu penyerang. IP attendance tidak dianggap tersedia jika `TRUSTED_PROXY_IPS` kosong; konfigurasi ini tidak dapat menggantikan firewall. Port Next.js harus hanya dapat diakses dari reverse proxy yang menimpa `X-Real-IP`.
- Foto live dari kamera tidak bisa dibuktikan hanya dari payload HTTP; validasi format/magic bytes bukan bukti sumber kamera. Batasi melalui UI, audit dan dokumentasikan keterbatasan web.

**Status rilis:** development/hardening bundle — bukan paket siap payroll production. Wajib staging, review keamanan, verifikasi schema Gajiku, dan rekonsiliasi manual sebelum data gaji asli dipakai.

- Login menggunakan dummy bcrypt cost 12 yang dibuat sekali saat proses dimulai. Throttle IP-wide memiliki limit lebih tinggi daripada per-email dan tidak memakai bucket IP unknown bersama. Tetap wajib menutup akses langsung ke port Next.js di firewall.
- `ClientSetting.kasbonStartPeriod` ditambahkan sebagai batas go-live (format `YYYY-MM`). Pastikan diisi sebelum `kasbonGajikuEnabled=true`; tidak ada default otomatis agar tidak menebak tanggal cutover.
- `tokenVersion` pada User dipakai untuk mencabut sesi lama setelah perubahan password.
- CSP mengizinkan `unsafe-eval` hanya pada development untuk kompatibilitas Next.js dev; produksi tidak memuatnya.
- Check-in tidak menimpa hari cuti/izin/libur, dan record hari yang sudah ada tanpa check-in dapat diperbarui bila statusnya bukan CUTI/IZIN/LIBUR.
- `suspiciousFlags` masih belum diisi secara menyeluruh; watermark font perlu diperiksa di staging (pasang fonts-dejavu jika teks tidak tampil). Lockfile ditambahkan jika berhasil dibuat oleh npm.


## Batas cakupan: kasbon milik Gajiku (v5)
- Kasbon/tarik gaji (pengajuan, approval, pencairan) sepenuhnya domain **Gajiku-Live**. HRIS tetap HRIS: tidak punya alur pengajuan/approval kasbon.
- HRIS hanya **membaca** kasbon berstatus `sukses` lewat view `v_gajiku_kasbon` untuk dipotong di payroll, dan menyediakan kehadiran lewat `v_kehadiran` untuk Gajiku.
- Halaman `/admin/kasbon` diperlakukan sebagai rekonsiliasi baca-saja, bukan modul kasbon.

## Perubahan v5
- Throttle login dipisah: email+IP (8), IP (40), email-global (100). Penyerang tidak bisa lagi memblokir login pemilik akun dengan 8 percobaan dari IP lain. Sukses login hanya membersihkan bucket email+IP.
- Folder `v3/` yang ikut terbawa di zip v4 dihapus.
- Payroll menolak jika modul kasbon nonaktif tetapi Gajiku mencatat kasbon `sukses` pada periode payroll, atau jika `ClientSetting` belum ada. Gangguan membaca Gajiku tidak memblokir klien yang modulnya nonaktif.
- `selectUnsettledKasbon` menerima batas awal/akhir periode dari pemanggil sebagai lapis kedua setelah filter SQL.
- Test baru: `tests/login-throttle.test.ts` dan konsistensi konfigurasi kasbon di `tests/payroll.test.ts`.

## Belum dikerjakan
- Check-in menimpa status `DINAS`/`ALPHA` yang sudah ada menjadi `HADIR`/`TELAT`.
- Pembatasan percobaan pada `change-password` (`currentPassword`).
- Workflow payroll (lock/paid) dan settlement atomik dalam satu transaksi.

## v6 — Redesain mobile + tema (elrise)
- Logo resmi elrise (public/brand/*.png: ikon, wordmark, lockup; varian terang & gelap + ikon aplikasi). Komponen: components/brand/Logo.tsx.
- Warna merek: navy #123054, teal #31A28E. Token light/dark di app/globals.css; `data-theme` di <html>, skrip no-flash di layout, ThemeProvider (lib/theme.tsx), toggle di header, pemilih Terang/Gelap/Otomatis di Menu & Profil.
- Teks putih hanya di atas gradien `--grad` (kontras >= 4.8:1). Aksen teks memakai token yang diturunkan agar >= 4.5:1 di kedua mode. Slip gaji selalu tercetak dengan token terang.
- Pegawai mobile: Beranda (kartu kehadiran, Menu Utama 4x2, ringkasan, Pengajuan Terbaru, Pengumuman), /pegawai/menu, /pegawai/notifikasi, /pegawai/kehadiran, bottom nav 4 tab dengan indikator bergeser. Menu Dokumen/Kinerja/Pelatihan bertanda "Segera" (di luar scope).
- Animasi: CSS transform/opacity <= 220ms, template.tsx per role, press-scale, stagger, skeleton; dimatikan oleh prefers-reduced-motion.
- BELUM terverifikasi: typecheck/lint/build penuh (npm tidak terjangkau di sandbox). Hanya cek sintaks + screenshot replika statis. Notifikasi/pengumuman masih data demo; kartu kehadiran memakai /api/absen dan fallback demo bila DB belum aktif.

## v7 — Integrasi Gajiku (keputusan bisnis)
- Aturan limit: limit harian × hari hadir; plafon = % gaji HRIS (per klien, `ClientSetting.kasbonPlafonPercent`, default 20). Gaji tidak dikirim ke Gajiku, hanya plafon (`v_plafon_kasbon`).
- Kunci pegawai ke Gajiku = email (id_pegawai Gajiku tidak dijamin unik). View kehadiran/kasbon kini membawa kolom `email`; HRIS menolak payroll jika email ganda.
- `lib/integration/kasbon-limit.ts` + tes (11 assertion lulus via shim). Label siklus diperbaiki (A/B/C/D mulai tgl 1/16/21/26; sebelumnya "Cut-off 20/25" yang salah). Form klien punya field plafon %.
- Spesifikasi patch Gajiku: `integration/GAJIKU_PATCH.md` (belum diterapkan; belum ada klien). Payroll mingguan (`W:`) tetap diblokir.
- Perlu `prisma db push` karena ada 2 kolom baru di ClientSetting. Typecheck/build penuh belum terverifikasi.
