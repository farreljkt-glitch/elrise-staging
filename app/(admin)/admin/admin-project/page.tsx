"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
type Project={id:string;name:string;code:string};
type Manager={id:string;name:string;email:string;isActive:boolean;
 managedProject:{id:string;name:string;code:string;isActive:boolean}|null;
 invitation:{expiresAt:string;usedAt:string|null}|null};
export default function AdminPtManagers(){
  const [projects,setProjects]=useState<Project[]>([]);const [admins,setAdmins]=useState<Manager[]>([]);
  const [projectId,setProjectId]=useState("");const [name,setName]=useState("");const [email,setEmail]=useState("");
  const [invite,setInvite]=useState<{token:string;email:string;expiresAt:string}|null>(null);
  const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const [p,a]=await Promise.all([
        fetch("/api/admin/projects",{cache:"no-store"}),
        fetch("/api/admin/admin-project-invitations",{cache:"no-store"}),
      ]);
      const [pj,ad]=await Promise.all([p.json(),a.json()]);
      if(!p.ok||!a.ok)throw new Error(pj.error||ad.error||"Tidak bisa memuat Admin Project");
      setProjects(pj.projects);setAdmins(ad.admins);
      setProjectId(prev=>pj.projects.some((v:Project)=>v.id===prev)?prev:(pj.projects[0]?.id??""));
    }finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Gagal memuat"));},[load]);
  async function submit(e:React.FormEvent){
    e.preventDefault();if(busy||!projectId)return;
    setBusy(true);setError("");setInvite(null);
    try{
      const response=await fetch("/api/admin/admin-project-invitations",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({projectId,name,email}),
      });
      const body=await response.json();
      if(!response.ok)throw new Error(body.error||"Undangan gagal");
      setInvite(body);setName("");setEmail("");await load();
    }catch(e){setError(e instanceof Error?e.message:"Gagal membuat undangan");}
    finally{setBusy(false);}
  }
  const link=invite&&typeof window!=="undefined"?
    window.location.origin+"/aktivasi-admin?token="+encodeURIComponent(invite.token):"";
  return <main className="space-y-5 p-5">
    <Link href="/admin/project" className="text-sm underline">← Project PT</Link>
    <h1 className="text-2xl font-bold">Admin Project PT</h1>
    <p className="text-sm opacity-75">Undang Admin Project khusus project milik PT Anda. Akun akan nonaktif hingga aktivasi.</p>
    {error&&<p role="alert" className="rounded border border-red-600 p-3 text-sm text-red-600">{error}</p>}
    <form onSubmit={submit} className="space-y-3 rounded-xl border p-4">
      <h2 className="font-semibold">Buat Undangan Admin Project</h2>
      <label className="block text-sm">Project aktif
        <select required className="mt-1 block w-full rounded border p-2"
          value={projectId} onChange={e=>setProjectId(e.target.value)}>
          {!projects.length&&<option value="">Buat project terlebih dahulu</option>}
          {projects.map(p=><option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
        </select>
      </label>
      <label className="block text-sm">Nama
        <input required minLength={2} maxLength={180} className="mt-1 block w-full rounded border p-2"
          value={name} onChange={e=>setName(e.target.value)} placeholder="Manager SCBD"/>
      </label>
      <label className="block text-sm">Email
        <input required type="email" maxLength={191} className="mt-1 block w-full rounded border p-2"
          value={email} onChange={e=>setEmail(e.target.value)} placeholder="manager.scbd@ptdemo.test"/>
      </label>
      <button disabled={busy||loading||!projectId} className="rounded bg-teal-700 px-4 py-2 text-sm text-white disabled:opacity-50">
        {busy?"Memproses...":"Buat Undangan"}
      </button>
    </form>
    {invite&&<section className="space-y-2 rounded-xl border p-4">
      <p className="font-semibold">Undangan untuk {invite.email}</p>
      <p className="text-xs">Tautan aktivasi satu kali, berlaku hingga {new Date(invite.expiresAt).toLocaleString("id-ID")}. Kirim melalui kanal privat.</p>
      <input aria-label="Tautan aktivasi Admin Project" readOnly value={link} className="w-full rounded border p-2 text-xs"/>
      <button type="button" className="rounded border px-3 py-1 text-sm"
        onClick={()=>void navigator.clipboard.writeText(link)}>Salin tautan</button>
      <button type="button" className="ml-3 text-sm underline" onClick={()=>setInvite(null)}>Tutup</button>
    </section>}
    <section className="rounded-xl border p-4">
      <h2 className="mb-3 font-semibold">Admin Project ({admins.length})</h2>
      {admins.map(a=><div key={a.id} className="border-b py-2 text-sm">
        <b>{a.name}</b> · {a.email} · {a.managedProject?.name??"Belum ada project"} · {a.isActive?"Aktif":"Belum Aktif"}
        {!a.isActive&&a.invitation&&!a.invitation.usedAt&&
          <p className="text-xs opacity-75">Undangan berlaku hingga {new Date(a.invitation.expiresAt).toLocaleString("id-ID")}</p>}
      </div>)}
      {!loading&&!admins.length&&<p className="text-sm">Belum ada Admin Project.</p>}
    </section>
  </main>;
}
