"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
type Client={id:string;name:string};
type Connection={id:string;externalTenantId:string;state:string;verifiedAt:string|null}|null;
type Employee={id:string;idPegawai:string;nama:string};
type Mapping={id:string;externalEmployeeId:string;verifiedAt:string|null;pegawai:Employee};
export default function GajikuDraftPage(){
 const [clients,setClients]=useState<Client[]>([]);
 const [clientId,setClientId]=useState("");
 const [connection,setConnection]=useState<Connection>(null);
 const [tenantExternal,setTenantExternal]=useState("");
 const [employees,setEmployees]=useState<Employee[]>([]);
 const [pegawaiId,setPegawaiId]=useState("");
 const [externalEmployeeId,setExternalEmployeeId]=useState("");
 const [mapped,setMapped]=useState<Mapping[]>([]);
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState("");
 useEffect(()=>{
  void fetch("/api/superadmin/clients",{cache:"no-store"}).then(async r=>{
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Gagal memuat daftar PT");
   setClients(d.clients);setClientId(d.clients[0]?.id??"");
  }).catch(e=>setError(e instanceof Error?e.message:"Gagal"));
 },[]);
 async function load(id:string){
  if(!id){setConnection(null);setEmployees([]);setMapped([]);return;}
  const [r1,r2]=await Promise.all([
   fetch("/api/superadmin/gajiku-connections?clientId="+encodeURIComponent(id),{cache:"no-store"}),
   fetch("/api/superadmin/gajiku-mappings?clientId="+encodeURIComponent(id),{cache:"no-store"}),
  ]);
  const [a,b]=await Promise.all([r1.json(),r2.json()]);
  if(!r1.ok||!r2.ok)throw new Error(a.error||b.error||"Gagal memuat mapping");
  setConnection(a.connection);setMapped(b.mapped);setEmployees(b.employees);
  setPegawaiId(b.employees[0]?.id||"");
 }
 useEffect(()=>{setError("");setSuccess("");void load(clientId).catch(e=>setError(e instanceof Error?e.message:"Gagal"));},[clientId]);
 async function save(url:string,values:Record<string,unknown>){
  setBusy(true);setError("");setSuccess("");
  try{
   const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Gagal menyimpan");
   setSuccess("Draft tersimpan di Elrise. Tidak ada panggilan ke Gajiku Live.");
   setExternalEmployeeId("");await load(clientId);
  }catch(e){setError(e instanceof Error?e.message:"Gagal");}
  finally{setBusy(false);}
 }
 return <main className="space-y-5 p-5">
  <Link href="/superadmin/klien" className="text-sm underline">← Daftar PT</Link>
  <h1 className="text-2xl font-bold">Draft Integrasi Gajiku</h1>
  <p className="rounded-lg border border-amber-600 p-3 text-sm">
   <b>Belum aktif.</b> Halaman ini hanya menyimpan identitas di database Elrise.
   Tidak menyambungkan API Gajiku, mengaktifkan bundle, mengubah plafon, atau mengirim kasbon.
   Verifikasi kontrak di Gajiku staging wajib sebelum aktivasi.
  </p>
  {error&&<p role="alert" className="text-red-600">{error}</p>}
  {success&&<p role="status" className="text-sm">{success}</p>}
  <label className="block text-sm">Pilih PT
   <select value={clientId} onChange={e=>setClientId(e.target.value)} className="mt-1 block w-full rounded border p-2">
    {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
   </select>
  </label>
  {!connection?<form className="space-y-3 rounded-lg border p-4" onSubmit={e=>{
    e.preventDefault();void save("/api/superadmin/gajiku-connections",{clientId,externalTenantId:tenantExternal});
   }}>
    <h2 className="font-semibold">Identitas tenant eksternal</h2>
    <label className="block text-sm">ID Tenant Gajiku (belum diverifikasi)
     <input value={tenantExternal} maxLength={191} required onChange={e=>setTenantExternal(e.target.value)}
      className="mt-1 block w-full rounded border p-2"/>
    </label>
    <button disabled={busy||!clientId} className="rounded bg-teal-700 px-4 py-2 text-white disabled:opacity-50">
     Simpan koneksi DISABLED
    </button>
   </form>:<section className="rounded-lg border p-4 text-sm">
    <b>Status koneksi:</b> {connection.state} — {connection.verifiedAt?"Terverifikasi":"Belum terverifikasi"}.
    <p>ID Tenant Gajiku: <code>{connection.externalTenantId}</code></p>
   </section>}
  {connection&&<form className="space-y-3 rounded-lg border p-4" onSubmit={e=>{
    e.preventDefault();void save("/api/superadmin/gajiku-mappings",{clientId,pegawaiId,externalEmployeeId});
   }}>
    <h2 className="font-semibold">Mapping pegawai (draft)</h2>
    <label className="block text-sm">Pegawai Elrise
     <select value={pegawaiId} required onChange={e=>setPegawaiId(e.target.value)}
      className="mt-1 block w-full rounded border p-2">
      {!employees.length&&<option value="">Tidak ada pegawai tersedia</option>}
      {employees.map(e=><option key={e.id} value={e.id}>{e.nama} ({e.idPegawai})</option>)}
     </select>
    </label>
    <label className="block text-sm">ID pegawai Gajiku (belum diverifikasi)
     <input value={externalEmployeeId} required maxLength={191}
      onChange={e=>setExternalEmployeeId(e.target.value)} className="mt-1 block w-full rounded border p-2"/>
    </label>
    <button disabled={busy||!pegawaiId||connection.state!=="DISABLED"||Boolean(connection.verifiedAt)}
     className="rounded border px-4 py-2 disabled:opacity-40">Simpan mapping sementara</button>
   </form>}
  <section className="rounded-lg border p-4">
   <h2 className="font-semibold">Mapping yang tersimpan ({mapped.length} ditampilkan)</h2>
   {mapped.map(m=><p key={m.id} className="border-b py-2 text-sm">
    {m.pegawai.nama} ({m.pegawai.idPegawai}) → <code>{m.externalEmployeeId}</code> · {m.verifiedAt?"Terverifikasi":"Draft"}
   </p>)}
   {!mapped.length&&<p className="text-sm opacity-70">Belum ada pegawai dimapping.</p>}
  </section>
 </main>;
}
