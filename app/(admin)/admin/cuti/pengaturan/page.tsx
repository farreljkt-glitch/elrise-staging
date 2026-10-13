"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
type Type={id:string;name:string;paid:boolean;annualQuota:number|null;isActive:boolean};
type Employee={id:string;name:string;code:string};
export default function LeaveConfigurationPage(){
 const [types,setTypes]=useState<Type[]>([]),[employees,setEmployees]=useState<Employee[]>([]);
 const [name,setName]=useState(""),[paid,setPaid]=useState(true),[defaultQuota,setDefaultQuota]=useState("12");
 const [typeId,setTypeId]=useState(""),[year,setYear]=useState(String(new Date().getFullYear()));
 const [quota,setQuota]=useState("12"),[selected,setSelected]=useState<string[]>([]);
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 async function load(){
  const [rt,re]=await Promise.all([
    fetch("/api/admin/leave-types",{cache:"no-store"}),
    fetch("/api/admin/employees?page=1",{cache:"no-store"}),
  ]);
  const a=await rt.json(),b=await re.json();
  if(!rt.ok||!re.ok)throw new Error(a.error||b.error||"Data pengaturan tidak tersedia");
  setTypes(a.types);setTypeId(v=>v||a.types.find((x:Type)=>x.paid)?.id||"");
  setEmployees(b.employees.filter((e:{active:boolean})=>e.active).map(
    (e:{id:string;name:string;code:string})=>({id:e.id,name:e.name,code:e.code})));
 }
 useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Gagal memuat"));},[]);
 async function submit(url:string,body:unknown){
  if(busy)return;setBusy(true);setError("");setNotice("");
  try{
   const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const data=await res.json();if(!res.ok)throw new Error(data.error||"Permintaan ditolak");
   setNotice("Data berhasil disimpan di MySQL.");
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Gagal menyimpan");}
  finally{setBusy(false);}
 }
 return <main className="mx-auto max-w-4xl space-y-5 p-5">
  <Link href="/admin/cuti" className="text-sm underline">← Persetujuan cuti</Link>
  <h1 className="text-2xl font-bold">Pengaturan Jenis dan Saldo Cuti</h1>
  <p className="text-sm opacity-75">Hanya Admin PT. Kuota awal tidak akan menimpa saldo yang sudah digunakan. Pemilihan pegawai terbatas pada halaman pertama (maksimal 50); lakukan batch berikutnya untuk pegawai lainnya.</p>
  {error&&<p role="alert" className="rounded border border-red-500 p-3 text-sm text-red-600">{error}</p>}
  {notice&&<p role="status" className="rounded border p-3 text-sm">{notice}</p>}
  <form className="space-y-3 rounded-xl border p-4" onSubmit={e=>{
   e.preventDefault();void submit("/api/admin/leave-types",{
    name,paid,annualQuota:Number(defaultQuota)});
  }}>
   <h2 className="font-semibold">1. Buat jenis cuti</h2>
   <label className="block text-sm">Nama jenis cuti<input className="mt-1 block w-full rounded border p-2" required minLength={3} maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label>
   <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={paid} onChange={e=>setPaid(e.target.checked)}/>Cuti berbayar</label>
   <label className="block text-sm">Kuota standar (hari/tahun)<input type="number" min={0} max={365} required className="mt-1 block w-full rounded border p-2" value={defaultQuota} onChange={e=>setDefaultQuota(e.target.value)}/></label>
   <button disabled={busy} className="rounded bg-teal-700 px-3 py-2 text-sm text-white disabled:opacity-50">Simpan Jenis</button>
  </form>
  <form className="space-y-3 rounded-xl border p-4" onSubmit={e=>{
    e.preventDefault();void submit("/api/admin/leave-balances",{
     leaveTypeId:typeId,year:Number(year),quota:Number(quota),employeeIds:selected});
  }}>
   <h2 className="font-semibold">2. Berikan kuota awal pegawai</h2>
   <label className="block text-sm">Jenis cuti berbayar
    <select required className="mt-1 block w-full rounded border p-2" value={typeId} onChange={e=>setTypeId(e.target.value)}>
     {!types.some(t=>t.paid)&&<option value="">Buat jenis cuti berbayar terlebih dahulu</option>}
     {types.filter(t=>t.paid&&t.isActive).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
   </label>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="block text-sm">Tahun<input type="number" min={2020} max={2100} value={year} required onChange={e=>setYear(e.target.value)} className="mt-1 block w-full rounded border p-2"/></label>
    <label className="block text-sm">Kuota (hari)<input type="number" min={0} max={365} value={quota} required onChange={e=>setQuota(e.target.value)} className="mt-1 block w-full rounded border p-2"/></label>
   </div>
   <div className="max-h-64 overflow-y-auto rounded border p-3">
    {employees.map(e=><label key={e.id} className="flex items-center gap-2 py-1 text-sm">
     <input type="checkbox" checked={selected.includes(e.id)}
      onChange={ev=>setSelected(old=>ev.target.checked?[...old,e.id]:old.filter(id=>id!==e.id))}/>
     {e.name} ({e.code})
    </label>)}
    {!employees.length&&<p className="text-sm">Belum ada pegawai aktif.</p>}
   </div>
   <button disabled={busy||!typeId||selected.length===0} className="rounded bg-teal-700 px-3 py-2 text-sm text-white disabled:opacity-50">Berikan Kuota ({selected.length} pegawai)</button>
  </form>
 </main>;
}
