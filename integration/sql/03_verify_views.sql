-- ==============================================================================
-- 03_verify_views.sql
-- Skrip Verifikasi & Pengujian View Integrasi HRIS - Gajiku
-- ==============================================================================

USE hris_db;

-- 1. Uji Baca View Kehadiran
SELECT 'Menguji View v_kehadiran...' AS test_step;
SELECT email, id_pegawai, tanggal, status 
FROM hris_db.v_kehadiran 
LIMIT 5;

-- 2. Uji Baca View Kasbon Gajiku
SELECT 'Menguji View v_gajiku_kasbon...' AS test_step;
SELECT gajiku_tx_id, id_pegawai, periode, nominal, admin_fee, status 
FROM hris_db.v_gajiku_kasbon 
LIMIT 5;

-- 2b. View plafon (tidak boleh memuat kolom gaji)
SELECT 'Menguji View v_plafon_kasbon...' AS test_step;
SELECT email, id_pegawai, plafon_bulanan, siklus_gaji, cutoff_hari_mingguan FROM hris_db.v_plafon_kasbon LIMIT 5;

-- 2c. Kunci email WAJIB unik di antara pegawai yang berhak kasbon (kedua query harus 0 baris)
SELECT 'Email ganda di v_plafon_kasbon (harus kosong):' AS test_step;
SELECT email, COUNT(*) AS n FROM hris_db.v_plafon_kasbon GROUP BY email HAVING n > 1;
-- Jalankan sebagai DBA pada gajiku_db: email kosong / ganda di pegawai Gajiku (harus kosong)
-- SELECT LOWER(TRIM(email)) e, COUNT(*) n FROM gajiku_db.pegawai GROUP BY e HAVING e = '' OR n > 1;
-- Transaksi sukses yang tidak punya pasangan pegawai (harus 0):
-- SELECT COUNT(*) FROM gajiku_db.transactions t JOIN gajiku_db.users u ON u.id=t.user_id
--   LEFT JOIN gajiku_db.pegawai p ON LOWER(p.email)=LOWER(u.email) WHERE t.status='sukses' AND p.id IS NULL;

-- 3. Uji Keamanan: Pastikan user hris_app TIDAK BISA menulis ke tabel Gajiku
-- Baris berikut ini SEHARUSNYA GAGAL dengan error 'Access denied':
-- INSERT INTO gajiku_db.transactions (id) VALUES ('test-unauthorized');
