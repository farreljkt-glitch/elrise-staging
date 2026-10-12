"use client";
import { useEffect,useState } from "react";
type Client={id:string;name:string};type Project={id:string;code:string;name:string;isActive:boolean;_count:{employees:number}};
export default function SuperadminProjects(){
  const [clients,setClients]=useState<Client[]>([]);const [clientId,setClientId]=useState("");
  const [projects,setProjects]=useState<Project[]>([]);const [name,setName]=useState("");const [code,setCode]=useState("");
  const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  useEffect(()=>{fetch("/api/superadmin/clients",{cache:"no-store"}).then(r=>r.json()).then(d=>{setClients(d.clients||[]);setClientId(d.clients?.[0]?.id||"");}).catch(()=>setError("Gagal memuat tenant"));},[]);
  async function load(){
    if(!clientId)return;const res=await fetch("/api/superadmin/projects?clientId="+encodeURIComponent(clientId),{cache:"no-store"});
    const data=await res.json();if(!res.ok)throw new Error(data.error||"Gagal memuat proyek");
    setProjects(data.projects);
  }
  useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Gagal"));},[clientId]);
  async function create(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError("");
    try{
      const res=await fetch("/api/superadmin/projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientId,code,name})});
      const data=await res.json();if(!res.ok)throw new Error(data.error||"Gagal menambahkan proyek");
      setCode("");setName("");await load();
    }catch(e){setError(e instanceof Error?e.message:"Gagal");}finally{setBusy(false);}
  }
  return <main className="space-y-5 p-5">
    <h1 className="text-2xl font-bold">Project PT</h1>
    {error&&<p role="alert" className="text-red-600">{error}</p>}
    <label className="block text-sm">Pilih PT<select className="ml-2 rounded border p-2" value={clientId} onChange={e=>setClientId(e.target.value)}>
      {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <form onSubmit={create} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <label className="text-sm">Kode<input required minLength={2} maxLength={50} className="mt-1 block rounded border p-2" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/></label>
      <label className="text-sm">Nama Project<input required minLength={2} maxLength={180} className="mt-1 block rounded border p-2" value={name} onChange={e=>setName(e.target.value)}/></label>
      <button className="rounded bg-teal-700 px-4 py-2 text-white disabled:opacity-50" disabled={!clientId||busy}>Tambah Project</button>
    </form>
    <div className="rounded border">{projects.map(p=><p className="border-b p-3 text-sm" key={p.id}>{p.code} — {p.name} · {p._count.employees} pegawai · {p.isActive?"Aktif":"Nonaktif"}</p>)}{!projects.length&&<p className="p-4 text-sm">Belum ada project.</p>}</div>
  </main>;
}
