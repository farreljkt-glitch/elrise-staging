"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
type Client={id:string;code:string;name:string;status:"AKTIF"|"SUSPEND"|"NONAKTIF";_count:{employees:number;projects:number};bundleSubscription:{mode:string}|null};
export default function SuperadminClients(){
  const [clients,setClients]=useState<Client[]>([]);const [name,setName]=useState("");const [code,setCode]=useState("");
  const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  async function load(){
    const response=await fetch("/api/superadmin/clients",{cache:"no-store"});
    const data=await response.json();if(!response.ok)throw new Error(data.error||"Gagal memuat klien");
    setClients(data.clients);
  }
  useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Gagal memuat"));},[]);
  async function create(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError("");
    try{
      const res=await fetch("/api/superadmin/clients",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,name})});
      const data=await res.json();if(!res.ok)throw new Error(data.error||"Gagal membuat klien");
      setName("");setCode("");await load();
    }catch(e){setError(e instanceof Error?e.message:"Gagal");}finally{setBusy(false);}
  }
  async function change(client:Client,status:Client["status"]){
    if(!confirm("Ubah status tenant "+client.name+" menjadi "+status+"?"))return;
    setBusy(true);setError("");
    try{
      const res=await fetch("/api/superadmin/clients/"+encodeURIComponent(client.id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
      const d=await res.json();if(!res.ok)throw new Error(d.error||"Gagal mengubah");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Gagal");}finally{setBusy(false);}
  }
  return <main className="space-y-5 p-5">
    <h1 className="text-2xl font-bold">Klien Elrise</h1><Link href="/superadmin/undangan-admin" className="inline-block rounded border px-3 py-2 text-sm">Kelola undangan Admin PT / Project →</Link>
    <p className="text-sm opacity-70">Sumber data: MySQL. Tenant baru dibuat dengan semua modul dinonaktifkan sampai konfigurasi selesai. Mode awal ELRISE_ONLY.</p>
    {error&&<p role="alert" className="text-red-600">{error}</p>}
    <form onSubmit={create} className="flex flex-wrap items-end gap-3 rounded-xl border p-4">
      <label className="text-sm">Kode PT<input required minLength={2} maxLength={40} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} className="mt-1 block rounded border p-2"/></label>
      <label className="text-sm">Nama PT<input required minLength={2} maxLength={180} value={name} onChange={e=>setName(e.target.value)} className="mt-1 block rounded border p-2"/></label>
      <button disabled={busy} className="rounded bg-teal-700 px-4 py-2 text-white disabled:opacity-50">Daftarkan PT</button>
    </form>
    <div className="overflow-auto rounded-xl border"><table className="w-full text-sm"><thead><tr className="border-b"><th className="p-3 text-left">PT</th><th className="p-3">Project</th><th className="p-3">Pegawai</th><th className="p-3">Paket</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr></thead>
      <tbody>{clients.map(c=><tr key={c.id} className="border-b"><td className="p-3">{c.name}<div className="text-xs opacity-60">{c.code}</div></td>
        <td className="p-3 text-center">{c._count.projects}</td><td className="p-3 text-center">{c._count.employees}</td>
        <td className="p-3 text-center">{c.bundleSubscription?.mode||"—"}</td><td className="p-3 text-center">{c.status}</td>
        <td className="p-3 text-center">{c.status==="AKTIF"?
          <button disabled={busy} className="rounded border px-3 py-1" onClick={()=>void change(c,"SUSPEND")}>Suspend</button>:
          <button disabled={busy} className="rounded border px-3 py-1" onClick={()=>void change(c,"AKTIF")}>Aktifkan</button>}</td>
      </tr>)}</tbody></table></div>
  </main>;
}
