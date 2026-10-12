-- Jalankan sebagai DBA/root MySQL setelah mengganti placeholder password.
-- Sesuaikan host akun dengan DATABASE_URL aktual dan akun gajiku_app yang benar.
CREATE DATABASE IF NOT EXISTS hris_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'hris_app'@'127.0.0.1' IDENTIFIED BY 'GANTI_PASSWORD_KUAT_HRIS';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, REFERENCES ON hris_db.* TO 'hris_app'@'127.0.0.1';
-- Buat definer khusus untuk VIEW; berikan SELECT hanya ke tabel/kolom sumber yang diperlukan.
-- Jalankan GRANT sumber untuk hris_view_reader (bukan hris_app) sesuai kebijakan DBA.
CREATE USER IF NOT EXISTS 'hris_view_reader'@'localhost' IDENTIFIED BY 'GANTI_PASSWORD_KUAT_VIEW';
GRANT SELECT (id, user_id, periode, nominal, admin_fee, status, final_approved_at) ON gajiku_db.transactions TO 'hris_view_reader'@'localhost';
GRANT SELECT (id, email) ON gajiku_db.users TO 'hris_view_reader'@'localhost';
GRANT SELECT (id_pegawai, email) ON gajiku_db.pegawai TO 'hris_view_reader'@'localhost';
-- GRANT ke gajiku_app dilakukan di akhir 02_views_hris.sql setelah view tersedia.
-- Penting: hris_app tidak diberi akses langsung ke tabel Gajiku.
FLUSH PRIVILEGES;
-- Tidak ada GRANT ALL pada gajiku_db. Jangan jalankan tanpa mengganti password dan memeriksa akun.
