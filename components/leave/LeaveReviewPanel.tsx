"use client";
import {useCallback,useEffect,useState} from "react";
type Row={id:string;name:string;code:string;type:string;startDate:string;endDate:string;reason:string;status:string;reviewReason:string|null};
export function LeaveReviewPanel(){
 const [status,setStatus]=useState("MENUNGGU"),[rows,setRows]=useState<Row[]>([]);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
  const response=await fetch("/api/leave-requests?status="+status,{cache:"no-store"});
  const data=await response.json();if(!response.ok)throw new Error(data.error||"Gagal memuat cuti");
  setRows(data.rows);
 },[status]);
 useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Gagal memuat"));},[load]);
 async function review(id:string,decision:"APPROVE"|"REJECT"){
  if(busy)return;
  let reason="";
  if(decision==="REJECT"){reason=window.prompt("Alasan penolakan (minimal 5 karakter):")||"";if(reason.trim().length<5)return;}
  else if(!window.confirm("Setujui cuti ini? Saldo cuti berbayar akan dikurangi."))return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/leave-requests/"+encodeURIComponent(id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({decision,...(decision==="REJECT"?{reason}:{})}),
   });
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Gagal mereview");
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Review gagal");}
  finally{setBusy(false);}
 }
 return <main className="space-y-5 p-5">
  <h1 className="text-2xl font-bold">Persetujuan Cuti</h1>
  <p className="text-sm opacity-75">Data MySQL sesuai scope PT/project. Saldo hanya berubah setelah persetujuan berhasil.</p>
  {error&&<p role="alert" className="text-red-600">{error}</p>}
  <div className="flex flex-wrap gap-2">{["MENUNGGU","DISETUJUI","DITOLAK"].map(s=>
   <button key={s} className={"rounded border px-3 py-2 text-sm "+(status===s?"bg-teal-700 text-white":"")} onClick={()=>setStatus(s)}>{s}</button>)}</div>
  <div className="space-y-3">{rows.map(r=><article key={r.id} className="space-y-2 rounded-xl border p-4">
    <h2 className="font-semibold">{r.name} ({r.code})</h2>
    <p className="text-sm">{r.type} · {r.startDate} sampai {r.endDate} · {r.status}</p>
    <p className="text-sm">{r.reason}</p>
    {r.reviewReason&&<p className="text-sm text-red-600">Catatan: {r.reviewReason}</p>}
    {r.status==="MENUNGGU"&&<div className="flex gap-2">
      <button disabled={busy} className="rounded bg-teal-700 px-3 py-2 text-sm text-white disabled:opacity-50" onClick={()=>void review(r.id,"APPROVE")}>Setujui</button>
      <button disabled={busy} className="rounded border px-3 py-2 text-sm disabled:opacity-50" onClick={()=>void review(r.id,"REJECT")}>Tolak</button>
    </div>}
   </article>)}
   {!rows.length&&<p className="rounded border p-5 text-sm">Belum ada pengajuan pada status ini.</p>}
  </div>
 </main>;
}
