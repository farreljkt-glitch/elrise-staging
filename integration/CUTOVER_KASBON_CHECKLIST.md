# Checklist cutover kasbon (wajib sebelum payroll)

- [ ] Tentukan `kasbonStartPeriod` bersama finance/owner Gajiku; format `YYYY-MM`.
- [ ] Terapkan schema Prisma pada staging terlebih dahulu (`npx prisma db push` untuk environment prototype; produksi sebaiknya memakai migration yang direview).
- [ ] Isi `ClientSetting.kasbonStartPeriod` untuk setiap klien yang mengaktifkan `kasbonGajikuEnabled`.
- [ ] Pastikan tidak ada `W:YYYY-MM-DD`; payroll mingguan harus gagal-aman sampai cutoff mingguan didukung.
- [ ] Jalankan test: historis sebelum cutover, bulan cutover, periode berjalan, periode masa depan, sudah settle, dan view tidak tersedia.
- [ ] Bandingkan total transaksi yang akan dipotong dengan laporan kasbon Gajiku dan tanda tangan persetujuan finance.
- [ ] Jangan jalankan payroll nyata sebelum seluruh checklist selesai.
