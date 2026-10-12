-- DEPRECATED/UNVERIFIED LEGACY SQL. DO NOT EXECUTE ON GAJIKU LIVE OR ELRISE PRODUCTION.\n-- View security/tenant mapping and finance loan limit logic do not match the approved contract.\n-- Jalankan sebagai DBA setelah schema HRIS diterapkan dan setelah membuat definer khusus.
-- Definer (mis. hris_view_reader@localhost) hanya perlu SELECT pada kolom sumber Gajiku
-- yang dipakai view ini, bukan hak tulis. Jangan gunakan root sebagai definer.
USE hris_db;

-- Jalankan setelah Prisma membuat tabel Attendance dan Pegawai.
GRANT SELECT (pegawaiId, tanggal, status, validatedAt) ON hris_db.Attendance TO 'hris_view_reader'@'localhost';
GRANT SELECT (id, idPegawai, email, gajiPokok, isActive, clientId, siklusGaji) ON hris_db.Pegawai TO 'hris_view_reader'@'localhost';
GRANT SELECT (clientId, kasbonGajikuEnabled, kasbonPlafonPercent, kasbonWeeklyCutoffDay) ON hris_db.ClientSetting TO 'hris_view_reader'@'localhost';

CREATE OR REPLACE ALGORITHM=MERGE DEFINER=`hris_view_reader`@`localhost` SQL SECURITY DEFINER VIEW v_kehadiran AS
SELECT LOWER(p.email) AS email, p.idPegawai AS id_pegawai, a.tanggal AS tanggal, a.status AS status
FROM hris_db.Attendance a JOIN hris_db.Pegawai p ON a.pegawaiId=p.id
WHERE a.status IN ('HADIR','TELAT')
  AND a.validatedAt IS NOT NULL;

CREATE OR REPLACE ALGORITHM=MERGE DEFINER=`hris_view_reader`@`localhost` SQL SECURITY DEFINER VIEW v_gajiku_kasbon AS
SELECT CAST(t.id AS CHAR(191)) AS gajiku_tx_id,
       LOWER(p.email) AS email,
       m.external_tenant_id AS external_tenant_id,
       p.id_pegawai AS id_pegawai,
       t.periode AS periode,
       CAST(t.nominal AS SIGNED) AS nominal,
       CAST(COALESCE(t.admin_fee,0) AS SIGNED) AS admin_fee,
       LOWER(t.status) AS status,
       t.final_approved_at AS final_approved_at
FROM gajiku_db.transactions t
JOIN gajiku_db.users u ON t.user_id=u.id
JOIN gajiku_db.pegawai p ON LOWER(p.email)=LOWER(u.email)
JOIN gajiku_db.elkyno_employee_tenant_map m ON m.employee_id=p.id_pegawai AND m.active=1 AND m.verified_at IS NOT NULL
WHERE t.status='sukses'
  AND u.email IS NOT NULL
  AND (SELECT COUNT(*) FROM gajiku_db.pegawai px WHERE LOWER(px.email)=LOWER(u.email))=1;

-- Plafon pinjaman per pegawai untuk Gajiku. HANYA plafon (bukan gaji) yang keluar dari HRIS.
-- Plafon = gajiPokok x kasbonPlafonPercent / 100, hanya untuk klien yang mengaktifkan kasbon Gajiku
-- dan pegawai aktif. Pegawai yang tidak tampil di view ini = tidak berhak kasbon (fail-closed di sisi Gajiku).
CREATE OR REPLACE ALGORITHM=MERGE DEFINER=`hris_view_reader`@`localhost` SQL SECURITY DEFINER VIEW v_plafon_kasbon AS
SELECT LOWER(p.email) AS email,
       p.idPegawai AS id_pegawai,
       CAST((p.gajiPokok * s.kasbonPlafonPercent) DIV 100 AS SIGNED) AS plafon_bulanan,
       p.siklusGaji AS siklus_gaji,
       s.kasbonWeeklyCutoffDay AS cutoff_hari_mingguan
FROM hris_db.Pegawai p JOIN hris_db.ClientSetting s ON s.clientId=p.clientId
WHERE s.kasbonGajikuEnabled=1 AND p.isActive=1;

-- Berikan SELECT kepada Gajiku setelah view benar-benar dibuat.
-- Nama kolom di atas diselaraskan dengan kontrak kode Gajiku yang diberikan.
GRANT SELECT ON hris_db.v_kehadiran TO 'gajiku_app'@'localhost';
GRANT SELECT ON hris_db.v_plafon_kasbon TO 'gajiku_app'@'localhost';
-- Pastikan akun definer punya SELECT minimum pada tabel HRIS dan tabel sumber Gajiku.
-- Perintah grant untuk gajiku_db diletakkan di 01_users_grants.sql.
