"use client";
import {useEffect,useState} from "react";
type Type={id:string;name:string;paid:boolean};
type Balance={leaveTypeId:string;year:number;quota:number;used:number};
type Row={id:string;type:string;startDate:string;endDate:string;reason:string;status:string;reviewReason:string|null};
export default function CutiKaryawan(){
 const [rows,setRows]=useState<Row[]>([]),[types,setTypes]=useState<Type[]>([]);
 const [balances,setBalances]=useState<Balance[]>([]);
 const [typeId,setTypeId]=useState(""),[start,setStart]=useState(""),[end,setEnd]=useState("");
 const [reason,setReason]=useState(""),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 async function refresh(){
  const response=await fetch("/api/leave-requests",{cache:"no-store"});
  const data=await response.json();if(!response.ok)throw new Error(data.error||"Gagal membaca cuti");
  setRows(data.rows);setTypes(data.types);setBalances(data.balances);
  setTypeId(v=>v||data.types[0]?.id||"");
 }
 useEffect(()=>{void refresh().catch(e=>setError(e instanceof Error?e.message:"Gagal memuat"));},[]);
 async function submit(event:React.FormEvent){
  event.preventDefault();setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/leave-requests",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({leaveTypeId:typeId,startDate:start,endDate:end,reason}),
   });
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Pengajuan gagal");
   setReason("");setMessage("Pengajuan tercatat di database, menunggu persetujuan.");
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Pengajuan gagal");}
  finally{setBusy(false);}
 }
 return <main className="space-y-5 p-5">
  <h1 className="text-2xl font-bold">Pengajuan Cuti</h1>
  <p className="text-sm opacity-75">Data tersimpan ke MySQL. Saldo berkurang hanya setelah persetujuan sah.</p>
  {error&&<p role="alert" className="text-red-600">{error}</p>}
  {message&&<p role="status" className="rounded border p-3 text-sm">{message}</p>}
  <form onSubmit={submit} className="space-y-3 rounded-xl border p-4">
   <label className="block text-sm">Jenis Cuti
    <select required className="mt-1 block w-full rounded border p-2" value={typeId} onChange={e=>setTypeId(e.target.value)}>
     {!types.length&&<option value="">Jenis cuti belum disiapkan HR</option>}
     {types.map(t=><option key={t.id} value={t.id}>{t.name}{t.paid?" · Berbayar":" · Tidak berbayar"}</option>)}
    </select></label>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="block text-sm">Tanggal mulai<input required type="date" className="mt-1 block w-full rounded border p-2" value={start} onChange={e=>setStart(e.target.value)}/></label>
    <label className="block text-sm">Tanggal selesai<input required type="date" className="mt-1 block w-full rounded border p-2" value={end} onChange={e=>setEnd(e.target.value)}/></label>
   </div>
   <label className="block text-sm">Alasan<textarea required minLength={5} maxLength={1500} className="mt-1 block w-full rounded border p-2" rows={3} value={reason} onChange={e=>setReason(e.target.value)}/></label>
   <button disabled={busy||!typeId} className="rounded bg-teal-700 px-4 py-2 text-sm text-white disabled:opacity-50">{busy?"Menyimpan...":"Ajukan Cuti"}</button>
  </form>
  <section className="space-y-2 rounded-xl border p-4"><h2 className="font-semibold">Saldo Cuti Berbayar</h2>
   {balances.map(b=><p key={b.leaveTypeId+"-"+b.year} className="text-sm">
    {types.find(t=>t.id===b.leaveTypeId)?.name||"Cuti"} ({b.year}): {Math.max(0,b.quota-b.used)} / {b.quota} hari tersisa
   </p>)}
   {!balances.length&&<p className="text-sm opacity-70">Saldo belum dikonfigurasi Admin PT.</p>}
  </section>
  <section className="space-y-2"><h2 className="font-semibold">Riwayat Pengajuan</h2>
   {rows.map(row=><article key={row.id} className="rounded-xl border p-3 text-sm">
    <b>{row.type}</b> · {row.startDate} sampai {row.endDate} · {row.status}
    <p>{row.reason}</p>{row.reviewReason&&<p className="text-red-600">{row.reviewReason}</p>}
   </article>)}
   {!rows.length&&<p className="text-sm opacity-70">Belum ada pengajuan.</p>}
  </section>
 </main>;
}
