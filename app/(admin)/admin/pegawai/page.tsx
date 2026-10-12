"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Employee = {
  id: string; code: string; name: string; email: string; position: string;
  salary: string; active: boolean; cycle: string; joinedAt: string | null;
  project: string; projectId: string;
  accountStatus: "AKTIF" | "BELUM_AKTIF" | "BELUM_DIUNDANG";
};

export default function AdminPegawaiPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [invite, setInvite] = useState<{email:string; token:string; expiresAt:string}|null>(null);
  const [limited, setLimited] = useState(false);
  const [page,setPage] = useState(1);
  const [pages,setPages] = useState(1);
  const [total,setTotal] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/employees?q="+encodeURIComponent(search)+"&page="+page, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal mengambil data karyawan. Periksa sesi login.");
      const data = await res.json();
      setEmployees(data.employees); setLimited(Boolean(data.limited));setPages(Math.max(1,data.pages||1));setTotal(data.total||0);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal mengambil data"); }
    finally { setLoading(false); }
  }, [search,page]);
  useEffect(() => { const wait=setTimeout(()=>{void refresh();},250); return ()=>clearTimeout(wait); }, [refresh]);

  const visible = employees;

  async function issueInvite(employee: Employee) {
    if (!window.confirm(`Buat undangan aktivasi untuk ${employee.name} (${employee.email})?`)) return;
    setBusyId(employee.id); setError(""); setInvite(null);
    try {
      const res = await fetch("/api/admin/employee-invitations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pegawaiId: employee.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Undangan gagal dibuat");
      setInvite(data);
      await refresh();
    } catch(e) { setError(e instanceof Error ? e.message : "Undangan gagal dibuat"); }
    finally { setBusyId(null); }
  }
  const activationLink = invite && typeof window !== "undefined"
    ? `${window.location.origin}/aktivasi?token=${encodeURIComponent(invite.token)}` : "";

  return (
    <main className="space-y-5 p-4 md:p-7">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Master Pegawai</h1>
          <p className="text-sm opacity-70">Data langsung dari database PT Anda, bukan data demo.</p></div>
        <div className="flex gap-2">
          <Link href="/admin/pegawai/tambah" className="rounded-lg bg-teal-700 px-3 py-2 text-sm text-white">Tambah Pegawai</Link>
          <button onClick={()=>void refresh()} className="rounded-lg border px-3 py-2 text-sm">Muat ulang</button>
          <Link href="/admin/pegawai/import" className="rounded-lg bg-teal-700 px-3 py-2 text-sm text-white">Import CSV</Link>
        </div>
      </header>
      {error && <p role="alert" className="rounded-lg border border-red-400 p-3 text-sm text-red-600">{error}</p>}
      {invite && <section className="rounded-lg border p-4 space-y-2">
        <p className="font-semibold">Tautan aktivasi untuk {invite.email}</p>
        <p className="text-xs">Berlaku sampai {new Date(invite.expiresAt).toLocaleString("id-ID")}. Kirim secara privat. Tautan hanya ditampilkan saat ini.</p>
        <input aria-label="Tautan aktivasi" readOnly value={activationLink} className="w-full rounded border p-2 text-xs" />
        <button className="rounded border px-3 py-2 text-sm" onClick={()=>void navigator.clipboard.writeText(activationLink)}>Salin tautan</button>
        <button className="ml-2 text-sm underline" onClick={()=>setInvite(null)}>Tutup</button>
      </section>}
      <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
        placeholder="Cari nama, email, ID, atau jabatan"
        aria-label="Cari karyawan" className="w-full rounded-lg border p-3 text-sm" />
      <p className="text-sm opacity-70">{total} pegawai ditemukan. {limited?"Ada halaman berikutnya.":""}</p>
      {loading ? <p>Memuat karyawan...</p> :
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b">
              <th className="p-3">Karyawan</th><th className="p-3">Proyek</th>
              <th className="p-3">Siklus</th><th className="p-3">Gaji pokok</th>
              <th className="p-3">Akun</th><th className="p-3">Aksi</th>
            </tr></thead>
            <tbody>{visible.map(e=><tr key={e.id} className="border-b">
              <td className="p-3"><Link href={"/admin/pegawai/"+encodeURIComponent(e.id)} className="font-semibold underline">{e.name}</Link><div className="text-xs opacity-70">{e.code} · {e.email}</div></td>
              <td className="p-3">{e.project}</td>
              <td className="p-3">{e.cycle}</td>
              <td className="p-3">Rp{Number(e.salary).toLocaleString("id-ID")}</td>
              <td className="p-3">{!e.active ? "Nonaktif" : e.accountStatus === "AKTIF" ? "Aktif" : "Belum aktif"}</td>
              <td className="p-3">{e.accountStatus !== "AKTIF" && e.active &&
                <button disabled={busyId !== null} onClick={()=>void issueInvite(e)}
                  className="rounded border px-2 py-1 disabled:opacity-50">
                  {busyId === e.id ? "Memproses..." : "Buat undangan"}
                </button>}</td>
            </tr>)}</tbody>
          </table>
          {!visible.length && <p className="p-5 text-sm">Tidak ada karyawan yang cocok.</p>}
        </div>}
      <div className="flex gap-3 items-center">
        <button className="rounded border px-3 py-1 disabled:opacity-50" disabled={loading||page<=1} onClick={()=>setPage(p=>p-1)}>Sebelumnya</button>
        <span className="text-sm">{page} / {pages}</span>
        <button className="rounded border px-3 py-1 disabled:opacity-50" disabled={loading||page>=pages} onClick={()=>setPage(p=>p+1)}>Berikutnya</button>
      </div>
      <p className="text-xs opacity-60">Nilai gaji di tabel adalah gaji pokok, bukan THP untuk perhitungan plafon pinjaman.</p>
    </main>
  );
}
