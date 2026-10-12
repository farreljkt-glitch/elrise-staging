# Terhubung Gajiku — HRIS Elkyno

Aplikasi HRIS multi-klien Next.js App Router + TypeScript + Prisma/MySQL. UI awal tetap dipertahankan; fondasi autentikasi server, skema database, integrasi view, audit dan fungsi perhitungan telah ditambahkan. **Jangan langsung memakai data gaji asli sebelum menjalankan seluruh checklist release di bawah.** Integrasi Gajiku memerlukan verifikasi skema legacy aktual.

## Status yang jujur

- Login memakai endpoint server, bcrypt dan cookie JWT `httpOnly`. Throttle persisten MySQL berlaku per fingerprint IP dan kombinasi IP/email; lockout akun tidak dipicu dari percobaan gagal agar akun target tidak mudah diserang DoS. Alur ganti kata sandi pertama kali diwajibkan pada halaman dan endpoint absensi/foto. Reverse proxy harus menghapus `X-Real-IP` kiriman klien dan menulis ulang nilainya. Banyak halaman UI masih mock data; anggap halaman yang belum tersambung sebagai prototype.
- Schema Prisma mencakup klien, project, setting MOU, pengguna, pegawai, absensi, cuti, payroll, settlement dan audit.
- Tersedia helper payroll, mapping periode, settlement, dan query view kasbon berparameter. Settlement masih memerlukan implementasi transaksi final di workflow payroll sebelum produksi.
- View `v_gajiku_kasbon` sudah memakai kontrak kolom yang diberikan (`periode`, `nominal`, `admin_fee`, `final_approved_at`, `p.id_pegawai`). Tetap verifikasi schema/privilege di staging sebelum menjalankan SQL di server.
- Validasi GPS/selfie di browser tidak membuktikan lokasi/identitas secara mutlak; fake GPS dan foto layar masih mungkin. Gunakan IP kantor, timestamp server, watermark, flag mencurigakan dan pemeriksaan admin.

## Persyaratan

- Node.js LTS yang kompatibel dengan Next.js 15
- MySQL 8.0+
- Akun database khusus `hris_app`, bukan root
- TLS/HTTPS di reverse proxy untuk production

## Setup lokal

1. Salin `.env.example` menjadi `.env` dan isi `DATABASE_URL`, `AUTH_SECRET` (minimal 32 byte acak), `UPLOAD_DIR`, serta kredensial seed. Jangan commit `.env`.
2. Periksa dan edit `integration/sql/01_users_grants.sql` dengan password kuat dan akun Gajiku aktual; jalankan sebagai DBA/root. Jangan menjalankan placeholder apa adanya.
3. Install dependency dengan satu package manager yang konsisten, misalnya `npm install`.
4. Jalankan `npx prisma generate`, lalu terapkan schema di development dengan `npx prisma db push`. Untuk production, gunakan migration yang direview dan diuji; jangan memakai `db push` sebagai prosedur deployment tanpa backup/review.
5. Setelah tabel HRIS dibuat, jalankan `integration/sql/02_views_hris.sql` sebagai DBA dan verifikasi semua grants/definer. Jangan memberi akses langsung ke tabel Gajiku kepada `hris_app`.
6. Seed superadmin: `npm run db:seed`. Password seed minimal 16 karakter. Hapus variabel password seed setelahnya. Login pertama akan diarahkan ke `/ganti-password`; kata sandi baru minimal 12 karakter. Pastikan skema terbaru sudah diterapkan agar tabel `LoginThrottle` tersedia.
7. Jalankan `npm run dev`.
8. Tes: `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`.

## Integrasi dua database

Arsitektur yang dimaksud:

- HRIS menulis hanya ke `hris_db`.
- Gajiku menulis hanya ke `gajiku_db`.
- HRIS membaca kasbon melalui `hris_db.v_gajiku_kasbon` saja; tidak melakukan query Prisma langsung ke tabel Gajiku.
- Gajiku dapat membaca `hris_db.v_kehadiran` dengan akun read-only.

Urutan SQL:

1. Verifikasi struktur database Gajiku dengan `SHOW CREATE TABLE transactions;`, `SHOW CREATE TABLE users;`, dan `SHOW CREATE TABLE pegawai;`.
2. Sesuaikan host akun Gajiku dan password placeholder pada `integration/sql/01_users_grants.sql`, lalu jalankan sebagai DBA. `hris_view_reader` hanya diberi SELECT kolom sumber yang diperlukan.
3. Terapkan schema HRIS di staging.
4. Jalankan `integration/sql/02_views_hris.sql` setelah tabel HRIS tersedia; skrip ini membuat view dengan definer khusus dan memberi grant view ke akun Gajiku. Sesuaikan host akun Gajiku bila bukan `localhost`.
5. Jalankan `integration/sql/03_verify_views.sql` dan cek hasil mapping ID pegawai serta jumlah transaksi secara manual.
6. Uji kondisi Gajiku mati/grant dicabut: payroll harus gagal jelas, bukan menganggap kasbon nol.

View kasbon memakai `t.periode`, `t.nominal`, `t.admin_fee`, `t.final_approved_at`, dan `p.id_pegawai` sesuai kontrak yang diberikan. Jangan memberi `GRANT ALL` ke `gajiku_db`.

## Periode payroll

Pemetaan helper: A = tanggal 1 sampai akhir bulan; B = tanggal 16 sampai tanggal 15 bulan berikutnya; C = tanggal 21 sampai tanggal 20 bulan berikutnya; D = tanggal 26 sampai tanggal 25 bulan berikutnya. Key memakai bulan awal siklus (`YYYY-MM`). Untuk klien mingguan, `mapWeeklyPeriod()` membutuhkan tanggal awal eksplisit; konfigurasi cutoff mingguan per tenant belum selesai.

## Keamanan dan keterbatasan

- Session JWT HS256 ditandatangani dengan `AUTH_SECRET`; cookie `httpOnly`, `SameSite=Lax`, dan `Secure` di production.
- Endpoint login memakai throttle tersimpan di MySQL per IP dan per kombinasi fingerprint IP + email, jendela 15 menit. Race condition tetap perlu diuji; tambahkan rate limit di reverse proxy/WAF. Aplikasi Next.js tidak dapat memverifikasi peer socket proxy hanya dari `X-Real-IP`, jadi firewall wajib membatasi port aplikasi agar hanya reverse proxy yang bisa mengaksesnya.
- Akun admin/pegawai harus dibuat melalui provisioning server yang memvalidasi tenant; jangan membuat akun langsung melalui SQL di operasi normal.
- `TRUSTED_PROXY_IPS` yang kosong membuat validasi IP absensi gagal-aman. Isi konfigurasi dan batasi akses langsung ke port Next.js dengan firewall; konfigurasi environment saja tidak cukup untuk membuktikan request datang dari proxy.
- File selfie/lampiran harus berada di luar `public/`, diverifikasi magic bytes dan dibatasi ukuran; route file wajib memeriksa kepemilikan data.
- Alur ganti kata sandi pertama kali sudah tersedia. Reset password admin, pencabutan seluruh sesi setelah password berubah, dan provisioning akun tenant masih harus ditambahkan sebelum production.
- Implementasikan seluruh mutasi CRUD, approval, payroll lock/paid, settlement, dan ekspor sebagai Server Actions/Route Handler dengan validasi Zod, session server, tenant filter, transaksi, dan audit log. UI mock yang tersisa belum memenuhi kontrak ini.
- Backup terenkripsi dan uji pemulihan harus dilakukan secara berkala.

## Checklist sebelum data asli

- [ ] Skema Gajiku aktual dan mapping ID pegawai diverifikasi.
- [ ] Schema Prisma diuji di staging, backup sebelum migrasi.
- [ ] Autentikasi, ganti password pertama, reset password, suspend klien diuji.
- [ ] Setiap query/mutasi punya filter tenant di server; uji IDOR lintas klien.
- [ ] Endpoint upload foto aman, file privat, batas ukuran dan MIME magic-bytes aktif.
- [ ] GPS/IP/timestamp server dan duplicate attendance diuji.
- [ ] Perhitungan gaji direkonsiliasi manual oleh tim payroll.
- [ ] Lock periode dan settlement kasbon diuji terhadap request paralel.
- [ ] Payroll gagal saat view kasbon tidak tersedia.
- [ ] Lint, typecheck, unit test, build, backup/restore lulus.
- [ ] Hanya setelah semua lulus, lakukan pilot dengan data terbatas.


## Cutover kasbon Gajiku (wajib sebelum payroll)

1. Tentukan bulan pertama kasbon yang memang harus dikelola HRIS, misalnya `2026-10`. Jangan mengisi berdasarkan perkiraan; cocokkan dengan tanggal cutover dan rekonsiliasi finance.
2. Isi `ClientSetting.kasbonStartPeriod` per klien dalam format `YYYY-MM` sebelum mengaktifkan `kasbonGajikuEnabled`. Tidak ada default otomatis untuk mencegah kasbon historis ikut terpotong.
3. Payroll kasbon bulanan akan mengambil `kasbonStartPeriod <= periode <= periode payroll` dan mengecualikan `gajikuTxId` yang sudah ada di `KasbonSettlement`.
4. Format mingguan `W:YYYY-MM-DD` ditolak dengan sengaja. Jangan mengaktifkan payroll mingguan sampai model cutoff mingguan per klien, pembandingan periode, dan test settlement mingguan dibuat.
5. Pada staging, buat data historis sebelum start period, data tepat pada start period, data periode berjalan, data masa depan, dan data yang sudah settle. Pastikan hanya data pada rentang cutover yang belum settle yang dihitung. Cocokkan hasilnya dengan laporan keuangan Gajiku.

## Keamanan login dan sesi

- Limit per email: 8 percobaan gagal per jendela 15 menit. Limit IP: 40 percobaan gagal per jendela 15 menit. IP-wide throttling dilewati jika X-Real-IP tidak tersedia agar semua pengguna tidak masuk satu bucket `unknown`; karena itu firewall harus membatasi port Next.js (umumnya 3000) agar hanya reverse proxy dapat mengaksesnya. Reverse proxy wajib menghapus X-Real-IP dari request publik dan menulis ulang nilainya. `TRUSTED_PROXY_IPS` bukan pengganti firewall.
- `tokenVersion` dicocokkan dengan database oleh `getSession`; perubahan password menaikkan versinya agar sesi lama ditolak oleh server.
- CSP mengizinkan `unsafe-eval` hanya saat development. Produksi masih menggunakan `unsafe-inline` untuk kompatibilitas Next.js; nonce CSP perlu implementasi terpisah dan pengujian sebelum diaktifkan.
- Verifikasi font watermark selfie di VPS staging. Jika teks tidak dirender, instal paket font DejaVu dan ulangi uji portrait/landscape.


## Catatan cakupan kasbon
Kasbon adalah fitur Gajiku-Live. HRIS hanya membaca kasbon `sukses` (read-only, lewat view) untuk potongan payroll dan tidak mengelola pengajuan atau approval kasbon.
Jika `kasbonGajikuEnabled` nonaktif tetapi Gajiku mencatat kasbon sukses pada periode payroll, payroll ditolak sampai integrasi diaktifkan atau direkonsiliasi.
