"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
type Item={id:string;amountIdr:string;periodCode:string;cycle:string;purpose:string;
 status:"PENDING_REVIEW"|"REVIEWED_HOLD"|"REJECTED";createdAt:string;
 reviewReason:string|null;employee?:{name:string;code:string}};
const money=(value:string)=>"Rp "+BigInt(value).toLocaleString("id-ID");
export default function AdminKasbonQueue(){
 const [rows,setRows]=useState<Item[]>([]);
 const [loading,setLoading]=useState(true);const [busy,setBusy]=useState<string|null>(null);
 const [error,setError]=useState("");const [message,setMessage]=useState("");
 const load=useCallback(async()=>{
  setLoading(true);
  try{
    const res=await fetch("/api/kasbon-requests",{cache:"no-store"});
    const d=await res.json();if(!res.ok)throw new Error(d.error||"Antrean tidak tersedia");
    setRows(d.requests);
  }finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Gagal memuat"));},[load]);
 async function decide(item:Item,decision:"REVIEW_HOLD"|"REJECT"){
  if(busy)return;
  const reason=decision==="REJECT"
    ?window.prompt("Alasan penolakan (minimal 10 karakter):")
    :window.prompt("Catatan review (opsional). Ini BUKAN persetujuan pencairan:","") ;
  if(reason===null)return;
  if(decision==="REJECT"&&reason.trim().length<10){setError("Penolakan wajib disertai alasan 10 karakter.");return;}
  if(decision==="REVIEW_HOLD"&&!window.confirm("Tandai sudah direview dan TAHAN hingga verifikasi keuangan? Belum ada pencairan Gajiku."))return;
  setBusy(item.id);setError("");setMessage("");
  try{
    const res=await fetch("/api/admin/kasbon-requests/"+encodeURIComponent(item.id),{
      method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({decision,reason}),
    });
    const d=await res.json();if(!res.ok)throw new Error(d.error||"Review ditolak");
    setMessage(decision==="REVIEW_HOLD"?"Direview, masih menunggu verifikasi dana.":"Pengajuan ditolak.");
    await load();
  }catch(e){setError(e instanceof Error?e.message:"Review gagal");}
  finally{setBusy(null);}
 }
 return <main className="space-y-5">
  <Link href="/admin/kasbon" className="text-sm underline">← Kebijakan Kasbon</Link>
  <h1 className="text-2xl font-bold">Review Pengajuan Kasbon — Admin PT</h1>
  <p className="rounded-xl border border-amber-600 p-3 text-sm">
   Status <b>Direview — HOLD</b> hanya keputusan administratif awal. Tidak berarti plafon cukup,
   tidak membuat transaksi di Gajiku, dan tidak boleh dianggap sebagai pembayaran.
  </p>
  {error&&<p role="alert" className="rounded border border-red-600 p-3 text-red-600">{error}</p>}
  {message&&<p role="status" className="text-sm">{message}</p>}
  {loading&&<p className="text-sm">Memuat...</p>}
  <div className="space-y-3">
   {rows.map(item=><article key={item.id} className="space-y-2 rounded-xl border p-4 text-sm">
    <h2 className="font-semibold">{item.employee?.name??"Pegawai"} ({item.employee?.code??"—"})</h2>
    <p>{money(item.amountIdr)} · periode {item.periodCode} · {item.status}</p>
    <p>Keperluan: {item.purpose}</p>
    {item.reviewReason&&<p>Catatan: {item.reviewReason}</p>}
    {item.status==="PENDING_REVIEW"&&<div className="flex flex-wrap gap-2">
     <button disabled={busy!==null} onClick={()=>void decide(item,"REVIEW_HOLD")}
      className="rounded bg-teal-700 px-3 py-2 text-white disabled:opacity-50">Review & tahan</button>
     <button disabled={busy!==null} onClick={()=>void decide(item,"REJECT")}
      className="rounded border border-red-600 px-3 py-2 text-red-600 disabled:opacity-50">Tolak</button>
    </div>}
   </article>)}
   {!loading&&!rows.length&&<p className="rounded border p-4 text-sm">Belum ada pengajuan pada PT Anda.</p>}
  </div>
 </main>;
}
