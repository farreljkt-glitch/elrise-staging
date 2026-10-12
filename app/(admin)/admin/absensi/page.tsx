"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
type Row={id:string;code:string;name:string;project:string;status:string;
  checkedInAt:string|null;checkedOutAt:string|null;validated:boolean;suspicious:boolean};
type Page={date:string;page:number;pages:number;total:number;rows:Row[]};
export default function AdminAttendancePage() {
  const [date,setDate]=useState(()=>new Date().toISOString().slice(0,10));
  const [page,setPage]=useState(1);const [data,setData]=useState<Page|null>(null);
  const [error,setError]=useState("");const [loading,setLoading]=useState(false);
  useEffect(()=>{
    let active=true;setLoading(true);setError("");
    fetch("/api/admin/attendance?date="+encodeURIComponent(date)+"&page="+page,{cache:"no-store"})
      .then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body.error||"Gagal membaca absensi");return body;})
      .then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Error");})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[date,page]);
  const time=(iso:string|null)=>iso?new Date(iso).toLocaleTimeString("id-ID",{timeZone:"Asia/Jakarta",hour:"2-digit",minute:"2-digit"}):"-";
  return <main className="space-y-5 p-5">
    <h1 className="text-2xl font-bold">Monitoring Absensi</h1>
    <p className="text-sm opacity-70">Data nyata dari MySQL tenant Anda; halaman ini read-only. Koreksi dan approval admin ditambahkan setelah alur persetujuannya tersedia.</p>
    <label className="flex items-center gap-3 text-sm">Tanggal
      <input className="rounded border p-2" type="date" value={date} onChange={e=>{setDate(e.target.value);setPage(1);}}/>
    </label>
    {error&&<p role="alert" className="text-red-600">{error}</p>}
    {loading?<p>Memuat data...</p>:<p className="text-sm">Total absensi: {data?.total??0}</p>}
    <div className="overflow-auto rounded-xl border"><table className="w-full text-sm">
      <thead><tr className="border-b"><th className="p-3 text-left">Pegawai</th><th className="p-3 text-left">Project</th>
        <th className="p-3">Masuk</th><th className="p-3">Pulang</th><th className="p-3">Status</th><th className="p-3">Validasi</th></tr></thead>
      <tbody>{data?.rows.map(r=><tr className="border-b" key={r.id}>
        <td className="p-3">{r.name}<div className="text-xs opacity-60">{r.code}</div></td>
        <td className="p-3">{r.project}</td><td className="p-3 text-center">{time(r.checkedInAt)}</td>
        <td className="p-3 text-center">{time(r.checkedOutAt)}</td>
        <td className="p-3 text-center">{r.status}</td><td className="p-3 text-center">{r.validated?"Tervalidasi":"Belum"}{r.suspicious?" · Flag":""}</td>
      </tr>)}</tbody></table>
      {!data?.rows.length&&<p className="p-4 text-sm opacity-70">Tidak ada data absensi untuk tanggal tersebut.</p>}
    </div>
    <div className="flex items-center gap-3">
      <button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Sebelumnya</button>
      <span className="text-sm">{page} / {Math.max(data?.pages??0,1)}</span>
      <button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page>=(data?.pages??1)} onClick={()=>setPage(p=>p+1)}>Berikutnya</button>
      <Link className="ml-auto text-sm underline" href="/admin/pegawai">Daftar pegawai</Link>
    </div>
  </main>;
}
