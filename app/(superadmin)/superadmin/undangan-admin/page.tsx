"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
type Client={id:string;name:string};
type Project={id:string;name:string};
type Admin={id:string;name:string;email:string;role:"ADMIN"|"ADMIN_PROJECT";isActive:boolean;managedProject:{name:string}|null};
export default function SuperadminInvites(){
  const [clients,setClients]=useState<Client[]>([]);
  const [clientId,setClientId]=useState("");
  const [projects,setProjects]=useState<Project[]>([]);
  const [projectId,setProjectId]=useState("");
  const [role,setRole]=useState<"ADMIN"|"ADMIN_PROJECT">("ADMIN");
  const [name,setName]=useState("");const [email,setEmail]=useState("");
  const [admins,setAdmins]=useState<Admin[]>([]);
  const [token,setToken]=useState("");const [expiresAt,setExpiresAt]=useState("");
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  useEffect(()=>{void fetch("/api/superadmin/clients",{cache:"no-store"})
    .then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Gagal memuat PT");return d;})
    .then(d=>{const arr=d.clients as Client[];setClients(arr);setClientId(arr[0]?.id||"");})
    .catch(e=>setError(e instanceof Error?e.message:"Gagal memuat PT"));},[]);
  useEffect(()=>{
    setToken("");setProjectId("");setProjects([]);setAdmins([]);
    if(!clientId)return;
    let mounted=true;
    Promise.all([
      fetch("/api/superadmin/projects?clientId="+encodeURIComponent(clientId),{cache:"no-store"}).then(r=>r.json()),
      fetch("/api/superadmin/admin-accounts?clientId="+encodeURIComponent(clientId),{cache:"no-store"}).then(r=>r.json()),
    ]).then(([p,a])=>{if(mounted){setProjects(p.projects||[]);setAdmins(a.admins||[]);}})
      .catch(()=>{if(mounted)setError("Gagal membaca proyek atau akun");});
    return()=>{mounted=false;};
  },[clientId]);
  async function revoke(admin:Admin){
    if(!window.confirm("Cabut akses login "+admin.name+"? Sesi aktif akan langsung tidak berlaku."))return;
    setBusy(true);setError("");setMessage("");
    try{
      const r=await fetch("/api/superadmin/admin-accounts/"+encodeURIComponent(admin.id),{
        method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:false}),
      });
      const d=await r.json();if(!r.ok)throw new Error(d.error||"Gagal menonaktifkan");
      const updated=await fetch("/api/superadmin/admin-accounts?clientId="+encodeURIComponent(clientId),{cache:"no-store"});
      if(updated.ok)setAdmins((await updated.json()).admins);
      setMessage("Akses admin dinonaktifkan dan seluruh sesi lama dicabut.");
    }catch(e){setError(e instanceof Error?e.message:"Gagal menonaktifkan");}
    finally{setBusy(false);}
  }
  async function invite(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError("");setToken("");
    try{
      const res=await fetch("/api/superadmin/admin-invitations",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({clientId,role,name,email,projectId:role==="ADMIN_PROJECT"?projectId:null}),
      });
      const data=await res.json();if(!res.ok)throw new Error(data.error||"Undangan gagal");
      setToken(data.token);setExpiresAt(data.expiresAt);setEmail("");setName("");
      const accounts=await fetch("/api/superadmin/admin-accounts?clientId="+encodeURIComponent(clientId),{cache:"no-store"});
      if(accounts.ok)setAdmins((await accounts.json()).admins);
    }catch(err){setError(err instanceof Error?err.message:"Gagal");}
    finally{setBusy(false);}
  }
  const link=token&&typeof window!=="undefined"
    ?window.location.origin+"/aktivasi-admin?token="+encodeURIComponent(token):"";
  return <main className="space-y-5 p-5">
    <Link href="/superadmin/klien" className="text-sm underline">← Klien</Link>
    <h1 className="text-2xl font-bold">Undangan Admin PT / Admin Project</h1>
    <p className="text-sm opacity-70">Akun dibuat nonaktif. Hanya aktif setelah undangan sekali pakai digunakan. Tautan bersifat rahasia, bagikan lewat kanal privat.</p>
    {error&&<p role="alert" className="text-red-600">{error}</p>}
    {message&&<p role="status" className="text-sm">{message}</p>}
    <form onSubmit={invite} className="space-y-3 rounded-xl border p-4">
      <label className="block text-sm">PT
        <select required value={clientId} onChange={e=>setClientId(e.target.value)} className="mt-1 block w-full rounded border p-2">
          {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="block text-sm">Role
        <select value={role} onChange={e=>setRole(e.target.value as "ADMIN"|"ADMIN_PROJECT")} className="mt-1 block w-full rounded border p-2">
          <option value="ADMIN">Admin PT</option><option value="ADMIN_PROJECT">Admin Project</option>
        </select>
      </label>
      {role==="ADMIN_PROJECT"&&<label className="block text-sm">Project yang dikelola
        <select required value={projectId} onChange={e=>setProjectId(e.target.value)} className="mt-1 block w-full rounded border p-2">
          <option value="">Pilih project aktif</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>}
      <label className="block text-sm">Nama
        <input required minLength={2} maxLength={180} className="mt-1 block w-full rounded border p-2" value={name} onChange={e=>setName(e.target.value)}/>
      </label>
      <label className="block text-sm">Email
        <input required type="email" maxLength={191} className="mt-1 block w-full rounded border p-2" value={email} onChange={e=>setEmail(e.target.value)}/>
      </label>
      <button disabled={busy || !clientId || (role==="ADMIN_PROJECT" && !projectId)} className="rounded bg-teal-700 px-4 py-2 text-white disabled:opacity-50">{busy?"Memproses...":"Buat undangan"}</button>
    </form>
    {token&&<section className="space-y-2 rounded-xl border p-4">
      <p className="font-semibold">Tautan sekali pakai (berakhir {new Date(expiresAt).toLocaleString("id-ID")})</p>
      <input readOnly aria-label="Tautan aktivasi" className="w-full rounded border p-2 text-xs" value={link}/>
      <button className="rounded border px-3 py-1" onClick={()=>void navigator.clipboard.writeText(link)}>Salin tautan</button>
      <button className="ml-2 underline" onClick={()=>setToken("")}>Tutup</button>
    </section>}
    <section className="space-y-2 rounded-xl border p-4">
      <h2 className="font-semibold">Akun Admin PT / Project</h2>
      {admins.map(a=><p key={a.id} className="border-b py-2 text-sm">{a.name} · {a.email} — {a.role} {a.managedProject?.name||""} — {a.isActive?"Aktif":"Belum aktif"}
        {a.isActive&&<button disabled={busy} onClick={()=>void revoke(a)} className="ml-3 rounded border border-red-600 px-2 py-1 text-red-600 disabled:opacity-50">Nonaktifkan</button>}
      </p>)}
      {!admins.length&&<p className="text-sm opacity-70">Belum ada akun admin.</p>}
    </section>
  </main>;
}
