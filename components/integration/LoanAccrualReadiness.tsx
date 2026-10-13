"use client";
import {useEffect,useState} from "react";
type Employee={id:string;code:string;name:string};
type Readiness={
 employee:{id:string;code:string;name:string;cycle:string};
 period:{code:string;start:string;end:string;asOf:string};
 validatedHadirDays:number;availableLoanIdr:null;readyForDisbursement:false;
 policy:{mode:string;percentBps:number|null;fixedAmountIdr:string|null;denominatorDays:number}|null;
 blockers:string[];notice:string;
};
export function LoanAccrualReadiness({employees}:{employees:Employee[]}){
 const [pegawaiId,setPegawaiId]=useState("");
 const [period,setPeriod]=useState(()=>new Date().toISOString().slice(0,7));
 const [data,setData]=useState<Readiness|null>(null);
 const [error,setError]=useState("");const [loading,setLoading]=useState(false);
 useEffect(()=>{setPegawaiId(old=>employees.some(e=>e.id===old)?old:employees[0]?.id||"");setData(null);},[employees]);
 async function load(event:React.FormEvent){
  event.preventDefault();setLoading(true);setData(null);setError("");
  try{
    const r=await fetch("/api/admin/loan-accrual?pegawaiId="+encodeURIComponent(pegawaiId)+
      "&period="+encodeURIComponent(period),{cache:"no-store"});
    const body=await r.json();if(!r.ok)throw new Error(body.error||"Rekap HADIR gagal");
    setData(body);
  }catch(e){setError(e instanceof Error?e.message:"Gagal membaca data");}
  finally{setLoading(false);}
 }
 return <section className="space-y-3 rounded-xl border p-4">
  <h2 className="font-semibold">Rekap HADIR tervalidasi (hanya data Elrise)</h2>
  <p className="text-sm opacity-75">Preview kesiapan, bukan limit kasbon. Tanggal mengikuti WIB. Hanya HADIR lengkap tanpa flag yang telah disetujui admin dihitung.</p>
  <form onSubmit={load} className="flex flex-wrap items-end gap-3">
    <label className="text-sm">Pegawai
      <select required value={pegawaiId} onChange={e=>setPegawaiId(e.target.value)}
       className="mt-1 block rounded border p-2">
       {employees.map(e=><option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}
      </select>
    </label>
    <label className="text-sm">Periode payroll
      <input type="month" value={period} onChange={e=>setPeriod(e.target.value)} required
       className="mt-1 block rounded border p-2"/>
    </label>
    <button type="submit" disabled={loading||!pegawaiId}
      className="rounded border px-4 py-2 text-sm disabled:opacity-40">
      {loading?"Memeriksa...":"Lihat kehadiran tervalidasi"}
    </button>
  </form>
  {error&&<p role="alert" className="text-red-600">{error}</p>}
  {data&&<div className="space-y-2 text-sm">
    <p><b>{data.employee.name}</b> · Siklus {data.employee.cycle} · {data.period.start} sampai {data.period.end}</p>
    <p className="font-semibold">HADIR sah: {data.validatedHadirDays} hari</p>
    <p>Kebijakan efektif pada awal periode: {data.policy?
      data.policy.mode==="FIXED_IDR"?"Nominal tetap":"Persentase THP":"Belum ada"}</p>
    <p className="rounded border border-amber-600 p-2">
      <b>Limit siap cair: BELUM TERSEDIA.</b> Perhitungan uang harus menunggu THP yang disetujui finance, outstanding dan reservation Gajiku yang direkonsiliasi.</p>
    {data.blockers.length>0&&<p className="opacity-70">Status prasyarat: {data.blockers.join("; ")}</p>}
  </div>}
 </section>;
}
