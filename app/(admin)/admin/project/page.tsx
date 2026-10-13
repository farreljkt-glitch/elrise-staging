"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
type Project={id:string;code:string;name:string;isActive:boolean;
  _count:{employees:number;projectManagers:number}};
export default function AdminPtProjects(){
  const [rows,setRows]=useState<Project[]>([]);
  const [code,setCode]=useState("");const [name,setName]=useState("");
  const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");const [message,setMessage]=useState("");
  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const result=await fetch("/api/admin/projects?all=1",{cache:"no-store"});
      const data=await result.json();
      if(!result.ok)throw new Error(data.error||"Daftar project tidak tersedia");
      setRows(data.projects);
    }finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Gagal memuat project"));},[load]);
  async function save(event:React.FormEvent){
    event.preventDefault();if(busy)return;
    setBusy(true);setError("");setMessage("");
    try{
      const result=await fetch("/api/admin/projects",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,name}),
      });
      const data=await result.json();
      if(!result.ok)throw new Error(data.error||"Project gagal disimpan");
      setCode("");setName("");setMessage("Project disimpan di PT Anda.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Gagal menyimpan");}
    finally{setBusy(false);}
  }
  return <main className="space-y-5 p-5">
    <h1 className="text-2xl font-bold">Project PT</h1>
    <p className="text-sm opacity-75">Project milik PT Anda. Pegawai boleh dibuat meskipun belum ada Admin Project.</p>
    <div className="flex flex-wrap gap-3 text-sm">
      <Link href="/admin/admin-project" className="underline">Kelola Admin Project →</Link>
      <Link href="/admin/pegawai/tambah" className="underline">Tambah Pegawai →</Link>
    </div>
    {error&&<p role="alert" className="rounded border border-red-600 p-3 text-sm text-red-600">{error}</p>}
    {message&&<p role="status" className="text-sm">{message}</p>}
    <form onSubmit={save} className="space-y-3 rounded-xl border p-4">
      <h2 className="font-semibold">Tambah Project</h2>
      <label className="block text-sm">Kode Project
        <input required maxLength={50} pattern="[A-Za-z0-9_-]{2,50}"
          value={code} onChange={e=>setCode(e.target.value.toUpperCase())}
          placeholder="SITE-SCBD" className="mt-1 block w-full rounded border p-2"/>
      </label>
      <label className="block text-sm">Nama Project
        <input required minLength={2} maxLength={180} value={name}
          onChange={e=>setName(e.target.value)} placeholder="Site SCBD"
          className="mt-1 block w-full rounded border p-2"/>
      </label>
      <button disabled={busy} className="rounded bg-teal-700 px-4 py-2 text-sm text-white disabled:opacity-50">
        {busy?"Menyimpan...":"Simpan Project"}
      </button>
    </form>
    <section className="rounded-xl border p-4">
      <h2 className="mb-3 font-semibold">Project PT ({rows.length})</h2>
      {loading&&<p className="text-sm">Memuat project...</p>}
      {rows.map(row=><div key={row.id} className="border-b py-2 text-sm">
        <b>{row.name}</b> ({row.code}) · {row.isActive?"Aktif":"Nonaktif"}
        <p className="opacity-70">{row._count.employees} pegawai · {row._count.projectManagers} Admin Project</p>
      </div>)}
      {!loading&&!rows.length&&<p className="text-sm">Belum ada project. Buat project pertama di atas.</p>}
    </section>
  </main>;
}
