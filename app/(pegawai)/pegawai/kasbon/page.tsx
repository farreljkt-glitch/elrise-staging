"use client";
import {useCallback,useEffect,useRef,useState} from "react";
type Item={id:string;amountIdr:string;periodCode:string;cycle:string;purpose:string;
 status:"PENDING_REVIEW"|"REVIEWED_HOLD"|"REJECTED";createdAt:string;reviewReason:string|null};
const rupiah=(value:string)=>"Rp "+BigInt(value).toLocaleString("id-ID");
export default function EmployeeKasbonPage(){
 const [rows,setRows]=useState<Item[]>([]);
 const [amount,setAmount]=useState("250000");
 const [purpose,setPurpose]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");const [message,setMessage]=useState("");
 const keyRef=useRef<string|null>(null);
 const load=useCallback(async()=>{
   const res=await fetch("/api/kasbon-requests",{cache:"no-store"});
   const data=await res.json();
   if(!res.ok)throw new Error(data.error||"Gagal memuat riwayat");
   setRows(data.requests);
 },[]);
 useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:"Gagal memuat"));},[load]);
 async function submit(e:React.FormEvent){
  e.preventDefault();if(busy)return;
  setBusy(true);setError("");setMessage("");
  if(!keyRef.current)keyRef.current=crypto.randomUUID();
  try{
    const res=await fetch("/api/kasbon-requests",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({amountIdr:amount,purpose,requestKey:keyRef.current}),
    });
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||"Pengajuan tidak dapat disimpan");
    setMessage(data.replayed?"Pengajuan yang sama sudah tersimpan.": "Pengajuan tercatat di Elrise dan menunggu review Admin PT.");
    keyRef.current=null;setPurpose("");await load();
  }catch(e){setError(e instanceof Error?e.message:"Gagal mengajukan");}
  finally{setBusy(false);}
 }
 const changeAmount=(v:string)=>{setAmount(v);keyRef.current=null;};
 const changePurpose=(v:string)=>{setPurpose(v);keyRef.current=null;};
 return <main className="space-y-5">
  <h1 className="text-2xl font-bold">Pengajuan Kasbon</h1>
  <p className="rounded-xl border border-amber-600 p-3 text-sm">
   Pengajuan ini baru masuk antrean review <b>Elrise</b>. Tidak menjanjikan dana tersedia,
   tidak memesan plafon, dan belum dikirim ke Gajiku. Nominal final menunggu
   verifikasi THP, HADIR tervalidasi, dan outstanding Gajiku.
  </p>
  {error&&<p role="alert" className="rounded border border-red-600 p-3 text-red-600">{error}</p>}
  {message&&<p role="status" className="rounded border p-3 text-sm">{message}</p>}
  <form onSubmit={submit} className="space-y-3 rounded-xl border p-4">
   <h2 className="font-semibold">Pengajuan baru</h2>
   <label className="block text-sm">Nominal permohonan (rupiah, bulat)
    <input required inputMode="numeric" pattern="[1-9][0-9]*" maxLength={13}
     value={amount} onChange={e=>changeAmount(e.target.value)}
     className="mt-1 block w-full rounded border p-2"/>
   </label>
   <label className="block text-sm">Keperluan (10–500 karakter)
    <textarea required minLength={10} maxLength={500} rows={3} value={purpose}
     onChange={e=>changePurpose(e.target.value)}
     className="mt-1 block w-full rounded border p-2"/>
   </label>
   <p className="text-xs opacity-75">Periode kasbon ditentukan otomatis oleh server berdasarkan siklus payroll dan tanggal WIB.</p>
   <button type="submit" disabled={busy}
    className="rounded bg-teal-700 px-4 py-2 text-sm text-white disabled:opacity-50">
    {busy?"Menyimpan...":"Kirim untuk review"}
   </button>
  </form>
  <section className="space-y-3">
   <h2 className="font-semibold">Riwayat Pengajuan Elrise</h2>
   {rows.map(item=><article key={item.id} className="space-y-1 rounded-xl border p-4 text-sm">
    <p className="font-semibold">{rupiah(item.amountIdr)} · {item.periodCode} ({item.cycle})</p>
    <p>{item.purpose}</p>
    <p>Status: <b>{item.status==="PENDING_REVIEW"?"Menunggu review":
      item.status==="REVIEWED_HOLD"?"Direview — tertahan verifikasi dana":"Ditolak"}</b></p>
    {item.reviewReason&&<p className="text-red-600">Catatan Admin PT: {item.reviewReason}</p>}
    <p className="text-xs opacity-70">Diajukan {new Date(item.createdAt).toLocaleString("id-ID")}</p>
   </article>)}
   {!rows.length&&<p className="rounded border p-4 text-sm">Belum ada pengajuan.</p>}
  </section>
 </main>;
}
