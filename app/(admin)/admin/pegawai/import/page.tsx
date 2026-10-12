"use client";

import { useState } from "react";
import Link from "next/link";

type PreviewRow = { row: number; employeeCode: string; name: string; email: string; projectId: string; errors: string[] };
type Preview = { mode: string; total: number; valid: number; rows: PreviewRow[]; approvalTicket: string | null };

export default function ImportPegawaiPage() {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [invite, setInvite] = useState("");

  async function request(path: string, body: string, headers: Record<string,string> = {}) {
    const response = await fetch(path, { method: "POST", credentials: "same-origin", headers, body });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }
  async function selectFile(file?: File) {
    if (!file) return;
    setPreview(null); setConfirm(false); setCompleted(false); setMessage("");
    if (file.size > 1024 * 1024) {setMessage("Maksimal 1 MB");return;}
    if (file.name.toLowerCase().endsWith(".csv")) {setCsv(await file.text());return;}
    if (file.name.toLowerCase().endsWith(".xlsx")) {
      setLoading(true);
      try {
        const form = new FormData();form.append("file",file);
        const res = await fetch("/api/admin/employee-import/convert",{method:"POST",body:form});
        const data=await res.json();
        if(!res.ok)throw new Error(data.error||"Konversi Excel gagal");
        setCsv(data.csv);setMessage("Excel dikonversi. Selanjutnya klik Periksa CSV untuk validasi database.");
      }catch(e){setCsv("");setMessage(e instanceof Error?e.message:"Konversi gagal");}
      finally{setLoading(false);}
      return;
    }
    setMessage("Pilih file CSV atau XLSX maksimal 1 MB");
  }
  async function doPreview() {
    setLoading(true); setMessage(""); setConfirm(false);
    try {
      const data = await request("/api/admin/employee-import/preview", csv, { "content-type": "text/csv" });
      setPreview(data); setMessage(`${data.valid} dari ${data.total} baris valid. Periksa sebelum menyimpan.`);
    } catch (e) { setPreview(null); setMessage(e instanceof Error ? e.message : "Preview gagal"); }
    finally { setLoading(false); }
  }
  async function doCommit() {
    if (!preview || preview.valid !== preview.total || !preview.total || !preview.approvalTicket || !confirm) return;
    setLoading(true); setMessage("");
    try {
      const bytes = new TextEncoder().encode(csv);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const hash = [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
      const result = await request("/api/admin/employee-import/commit", csv, { "content-type": "text/csv", "x-import-sha256": hash, "x-import-approval": preview.approvalTicket || "" });
      setCompleted(true); setPreview(null); setConfirm(false); setMessage(`${result.imported} karyawan berhasil disimpan. Akun login belum otomatis aktif.`);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Import gagal. Ulangi preview."); }
    finally { setLoading(false); }
  }
  async function issueInvite() {
    setLoading(true); setMessage(""); setInvite("");
    try {
      const result = await request("/api/admin/employee-invitations", JSON.stringify({ pegawaiId: employeeId.trim() }), { "content-type": "application/json" });
      const link = `${window.location.origin}/aktivasi?token=${encodeURIComponent(result.token)}`;
      setInvite(link); setMessage(`Undangan untuk ${result.email} berlaku sampai ${new Date(result.expiresAt).toLocaleString("id-ID")}. Kirim secara privat.`);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Gagal membuat undangan"); }
    finally { setLoading(false); }
  }
  return <main className="mx-auto max-w-5xl space-y-6 p-6">
    <Link href="/admin/pegawai" className="text-sm underline">← Kembali ke Karyawan</Link>
    <h1 className="text-2xl font-semibold">Import Karyawan (CSV/Excel)</h1>
    <p className="text-sm opacity-75">Preview terlebih dahulu. Proses ini hanya menyimpan data karyawan, bukan membuat akun atau mengaktifkan plafon Gajiku.</p>
    <section className="space-y-3 rounded-xl border p-5">
      <p className="text-sm">Kolom wajib pada CSV atau baris pertama Excel: <code>employee_code,name,email,project_id,base_salary_idr</code>. Gunakan ID proyek yang terdaftar di Elrise.</p>
      <input aria-label="Pilih file CSV" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e => void selectFile(e.target.files?.[0])} />
      <div><button type="button" disabled={!csv || loading || completed} onClick={() => void doPreview()} className="rounded-lg bg-slate-800 px-4 py-2 text-white disabled:opacity-50">Periksa CSV</button></div>
      {preview && <div className="space-y-3">
        <p>{preview.valid}/{preview.total} valid</p>
        <div className="overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr>{["Baris","Kode","Nama","Email","Proyek","Validasi"].map(x=><th className="border p-2 text-left" key={x}>{x}</th>)}</tr></thead><tbody>{preview.rows.map(r=><tr key={r.row}><td className="border p-2">{r.row}</td><td className="border p-2">{r.employeeCode}</td><td className="border p-2">{r.name}</td><td className="border p-2">{r.email}</td><td className="border p-2">{r.projectId}</td><td className="border p-2">{r.errors.length?r.errors.join("; "):"OK"}</td></tr>)}</tbody></table></div>
        {preview.total>0 && preview.valid===preview.total && <><label className="flex gap-2 text-sm"><input type="checkbox" checked={confirm} onChange={e=>setConfirm(e.target.checked)}/>Saya sudah memeriksa semua data dan ingin menyimpannya.</label><button type="button" disabled={!confirm||loading} onClick={()=>void doCommit()} className="rounded-lg bg-emerald-700 px-4 py-2 text-white disabled:opacity-50">Simpan {preview.total} karyawan</button></>}
      </div>}
    </section>
    <section className="space-y-3 rounded-xl border p-5">
      <h2 className="text-lg font-semibold">Undangan aktivasi akun</h2>
      <p className="text-sm opacity-75">Masukkan ID internal karyawan (bukan kode CSV). Undangan hanya dapat dibuat untuk karyawan yang sudah tersimpan. Fitur daftar/pemilihan ID belum terhubung.</p>
      <input className="w-full rounded border p-2" value={employeeId} onChange={e=>setEmployeeId(e.target.value)} placeholder="ID internal karyawan" aria-label="ID internal karyawan" />
      <button type="button" disabled={!employeeId.trim()||loading} onClick={()=>void issueInvite()} className="rounded-lg bg-slate-800 px-4 py-2 text-white disabled:opacity-50">Buat undangan</button>
      {invite && <div className="space-y-2"><p className="text-sm">Tautan sekali pakai (jangan bagikan secara publik):</p><textarea readOnly value={invite} rows={3} className="w-full rounded border p-2 text-sm"/><button type="button" onClick={()=>void navigator.clipboard.writeText(invite)} className="rounded border px-3 py-2">Salin tautan</button></div>}
    </section>
    {message && <p role="status" className="rounded-lg border p-3 text-sm">{message}</p>}
  </main>;
}
