> **DEPRECATED — JANGAN DIPAKAI SEBAGAI KONTRAK PRODUKSI.** Dokumen lama ini memakai gaji pokok + join email/view SQL. Kontrak baru adalah persentase pre-kasbon THP atau plafon tetap yang efektif per tanggal dengan mapping tenant/pegawai terverifikasi. Rujuk `integration/PHASE_Q7_CONTRACT_AUDIT.md`, `integration/GAJIKU_API_CONTRACT_V1.md`, dan `docs/PRODUCTION_READINESS_ROADMAP.md`. Tidak boleh mengeksekusi patch di Gajiku Live berdasarkan spesifikasi lama.

# Integrasi HRIS ↔ Gajiku-Live — spesifikasi (BELUM diterapkan ke Gajiku)

Status: prototipe untuk presentasi, belum ada klien/MOU. Kode Gajiku **tidak diubah**. Dokumen ini adalah
kontrak yang akan dipakai saat patch Gajiku dibuat. Diselaraskan dengan kode `Gajiku-Live-main` terbaru
(`compute_limits()` di `app/routes/web.py`, 2-layer approval, cutoff mingguan, `perusahaan_induk`).

## 1. Aturan bisnis (disepakati)
| Hal | Aturan |
|---|---|
| Sumber gaji | HRIS (`Pegawai.gajiPokok`). Gaji **tidak** keluar dari HRIS; hanya plafon. |
| Plafon bulanan | `floor(gajiPokok × kasbonPlafonPercent / 100)`, persen per klien (default 20). Contoh: gaji 10 jt, 20% → 2 jt. |
| Limit harian | `floor(plafon / 30)` (mingguan: plafon = 25% plafon bulanan, dibagi 7) |
| Saldo tarik REG | `min(limit_harian × HARI_HADIR − total_terpakai, sisa_plafon)` |
| Hari hadir | jumlah tanggal berbeda berstatus HADIR/TELAT yang sudah divalidasi, dari awal periode s.d. hari ini |
| Terpakai | kasbon `sukses` + `on-proses` pada periode berjalan (sama seperti Gajiku sekarang) |
| Potongan payroll | HRIS memotong kasbon `sukses` (nominal + admin_fee), sekali saja (`KasbonSettlement.gajikuTxId` UNIQUE) |

Implementasi acuan + tes: `lib/integration/kasbon-limit.ts`, `tests/kasbon-limit.test.ts`.
Perbedaan dari Gajiku saat ini: plafon dari HRIS (bukan 50% gaji Gajiku), pengali hari hadir (bukan `hari_ke` kalender),
saldo dibatasi sisa plafon (Gajiku sekarang bisa melampaui plafon di hari ke-31).

## 2. Kontrak data (semua view di `hris_db`, SELECT-only untuk `gajiku_app`)
| View | Arah | Kolom | Catatan |
|---|---|---|---|
| `v_kehadiran` | HRIS→Gajiku | `email, id_pegawai, tanggal, status` | hanya HADIR/TELAT yang `validatedAt` terisi |
| `v_plafon_kasbon` | HRIS→Gajiku | `email, id_pegawai, plafon_bulanan, siklus_gaji, cutoff_hari_mingguan` | hanya klien dengan kasbon aktif & pegawai aktif; **tanpa kolom gaji** |
| `v_gajiku_kasbon` | Gajiku→HRIS | `gajiku_tx_id, email, id_pegawai, periode, nominal, admin_fee, status, final_approved_at` | hanya `status='sukses'` (setelah Superadmin approve final) |

**Kunci pegawai = email (lowercase).** Alasan: join Gajiku memakai `users.email = pegawai.email`; `pegawai.id_pegawai`
default `''` dan unique index-nya (`WHERE id_pegawai <> ''`) tidak didukung MySQL sehingga gagal senyap.
HRIS menolak payroll bila email pegawai ganda di HRIS. Jalankan query di `03_verify_views.sql` sebelum go-live.

Query lintas-DB dari Gajiku cukup memakai koneksi yang sama (`FROM hris_db.v_kehadiran`) selama `gajiku_app`
punya SELECT pada view — tidak perlu koneksi kedua.

## 3. Rencana patch `compute_limits()` di Gajiku (pseudocode, fungsi asli: baris ±173–256 web.py)
```python
def hris_plafon(db, email):
    return db.execute(
        "SELECT plafon_bulanan, cutoff_hari_mingguan FROM hris_db.v_plafon_kasbon WHERE email = ?",
        (email.lower(),)).fetchone()

def hris_hari_hadir(db, email, start, end):
    r = db.execute(
        "SELECT COUNT(DISTINCT tanggal) FROM hris_db.v_kehadiran "
        "WHERE email = ? AND tanggal BETWEEN ? AND ?", (email.lower(), start, end)).fetchone()
    return int(r[0] or 0)

# di compute_limits(), setelah user_email & periode diketahui:
hp = hris_plafon(db, user_email)
if hp:                                   # pegawai dikelola HRIS -> aturan baru
    weekly = hp["cutoff_hari_mingguan"] is not None
    plafon_bulanan = int(hp["plafon_bulanan"])
    plafon = math.floor(plafon_bulanan * 0.25) if weekly else plafon_bulanan
    limit_harian = math.floor(plafon / (7 if weekly else 30))
    hari = hris_hari_hadir(db, user_email, period_start, at_date)   # period_start: awal siklus / weekly_period_start
    saldo = min(max(limit_harian * hari - total_sukses, 0), max(plafon - total_sukses, 0))
else:                                    # tidak ada di HRIS -> perilaku lama (catat di log)
    ...
```
Kebijakan bila HRIS tidak terjangkau (error query): **tolak tarik** untuk pegawai yang seharusnya dikelola HRIS,
jangan jatuh ke aturan lama diam-diam.

## 4. Prasyarat keamanan sebelum patch dipakai
1. `current_sim_date()` membaca `?tanggal=` / `session["sim_date"]` dari client (temuan #1 `Audit.md` Gajiku).
   Untuk pegawai di HRIS, "hari ini" **wajib** `datetime.now(ZoneInfo("Asia/Jakarta")).date()`, parameter client diabaikan.
2. TOCTOU saat membuat transaksi (temuan #4 `Audit.md`): hitung saldo dan INSERT dalam satu transaksi dengan kunci baris.
3. Uji akses dengan akun `gajiku_app` (hanya SELECT pada tiga view; tidak boleh membaca tabel HRIS).

## 5. Belum didukung / menunggu MOU klien
- **Payroll mingguan di HRIS**: kolom `kasbonWeeklyCutoffDay` dan helper `weeklyPeriodKey` sudah ada untuk sisi limit,
  tetapi potongan payroll untuk key `W:` tetap diblokir (fail-closed) sampai ada klien yang benar-benar bayar mingguan.
- `kasbonStartPeriod` per klien harus diisi saat go-live agar kasbon lama tidak ikut terpotong.
- Mapping klien: `perusahaan_induk` Gajiku ↔ `Client` HRIS; `perusahaan` (project Windu Karya) ↔ `Project`.
