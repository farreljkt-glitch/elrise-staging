"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
type Employee = {
  id:string;code:string;name:string;email:string;position:string;salary:string;
  active:boolean;projectId:string;projectName:string;cycle:string;joinedAt:string|null;accountActive:boolean;
};
type Project={id:string;name:string};
export default function PegawaiDetailPage(){
  const params=useParams<{id:string}>();const router=useRouter();
  const [item,setItem]=useState<Employee|null>(null);const [projects,setProjects]=useState<Project[]>([]);
  const [name,setName]=useState("");const [position,setPosition]=useState("");
  const [projectId,setProjectId]=useState("");const [salary,setSalary]=useState("");
  const [error,setError]=useState("");const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);
  async function load(){
    setError("");setLoading(true);
    try{
      const [res,pr]=await Promise.all([
        fetch("/api/admin/employees/"+encodeURIComponent(params.id),{cache:"no-store"}),
        fetch("/api/admin/projects",{cache:"no-store"})
      ]);
      if(!res.ok||!pr.ok)throw new Error("Tidak dapat membaca pegawai atau project.");
      const data=await res.json(),p=await pr.json();
      setItem(data.employee);setProjects(p.projects);
      setName(data.employee.name);setPosition(data.employee.position);
      setProjectId(data.employee.projectId);setSalary(data.employee.salary);
    }catch(e){setError(e instanceof Error?e.message:"Gagal memuat pegawai");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[params.id]);
  async function update(patch:Record<string,unknown>){
    if(busy)return;setBusy(true);setError("");
    try{
      const res=await fetch("/api/admin/employees/"+encodeURIComponent(params.id),{
        method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(patch)
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Perubahan ditolak");
      await load();router.refresh();
    }catch(e){setError(e instanceof Error?e.message:"Perubahan gagal");}
    finally{setBusy(false);}
  }
  if(loading)return <main className="p-6">Memuat data pegawai...</main>;
  return <main className="mx-auto max-w-3xl space-y-5 p-5">
    <Link href="/admin/pegawai" className="text-sm underline">← Daftar Pegawai</Link>
    <h1 className="text-2xl font-bold">Detail Pegawai</h1>
    {error&&<p role="alert" className="rounded-lg border border-red-500 p-3 text-red-600">{error}</p>}
    {!item?<p>Pegawai tidak ditemukan atau tidak bisa diakses.</p>:<>
      <section className="space-y-2 rounded-xl border p-5">
        <h2 className="text-lg font-semibold">{item.name}</h2>
        <p className="text-sm opacity-75">{item.code} · {item.email}</p>
        <p className="text-sm">Project: {item.projectName} · Siklus: {item.cycle}</p>
        <p className="text-sm">Status: {item.active?"Aktif":"Nonaktif"} · Akun: {item.accountActive?"Aktif":"Belum aktif"}</p>
        <p className="text-xs opacity-65">Riwayat absensi, cuti dan payroll belum ditampilkan sampai API riwayat terverifikasi.</p>
      </section>
      <form className="space-y-4 rounded-xl border p-5" onSubmit={e=>{e.preventDefault();void update({name,position,projectId,baseSalaryIdr:salary});}}>
        <h2 className="text-lg font-semibold">Edit Data</h2>
        <label className="block text-sm">Nama<input required minLength={2} maxLength={180} value={name} onChange={e=>setName(e.target.value)} className="mt-1 block w-full rounded border p-2"/></label>
        <label className="block text-sm">Jabatan<input maxLength={120} value={position} onChange={e=>setPosition(e.target.value)} className="mt-1 block w-full rounded border p-2"/></label>
        <label className="block text-sm">Project<select value={projectId} onChange={e=>setProjectId(e.target.value)} className="mt-1 block w-full rounded border p-2">
          {projects.find(p=>p.id===projectId)===undefined&&<option value={projectId}>{item.projectName} (nonaktif)</option>}
          {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select></label>
        <label className="block text-sm">Gaji pokok (Rp)<input inputMode="numeric" pattern="(0|[1-9][0-9]*)" required value={salary} onChange={e=>setSalary(e.target.value)} className="mt-1 block w-full rounded border p-2"/></label>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy||!item.active} type="submit" className="rounded bg-teal-700 px-4 py-2 text-sm text-white disabled:opacity-50">Simpan Perubahan</button>
          {item.active?<button disabled={busy} type="button" onClick={()=>{if(confirm("Nonaktifkan pegawai dan cabut sesi loginnya?"))void update({active:false});}} className="rounded border border-red-600 px-4 py-2 text-sm text-red-600">Nonaktifkan Pegawai</button>
          :<button disabled={busy} type="button" onClick={()=>void update({active:true})} className="rounded border px-4 py-2 text-sm">Aktifkan Data Pegawai</button>}
        </div>
      </form>
    </>}
  </main>;
}
