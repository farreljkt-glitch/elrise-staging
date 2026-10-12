"use client";
import { useState } from "react";
type Preview={previewOnly:boolean;period:string;cycle:string;periodStart:string;periodEnd:string;
  notice:string;totalEmployees:number;totalBaseSalary:string;rows:{
    id:string;code:string;name:string;baseSalary:string;validatedPresentDays:number;
  }[]};
const rupiah=(v:string)=>"Rp "+BigInt(v).toLocaleString("id-ID");
export default function AdminPayrollPage(){
  const [period,setPeriod]=useState(()=>new Date().toISOString().slice(0,7));
  const [cycle,setCycle]=useState("A");const [data,setData]=useState<Preview|null>(null);
  const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  async function load(event:React.FormEvent){
    event.preventDefault();setBusy(true);setError("");setData(null);
    try{
      const res=await fetch("/api/admin/payroll/preview?period="+encodeURIComponent(period)+"&cycle="+encodeURIComponent(cycle),{cache:"no-store"});
      const d=await res.json();if(!res.ok)throw new Error(d.error||"Preview gagal");setData(d);
    }catch(e){setError(e instanceof Error?e.message:"Preview gagal");}
    finally{setBusy(false);}
  }
  return <main className="space-y-5 p-5">
    <h1 className="text-2xl font-bold">Payroll — Preview Data</h1>
    <p className="rounded-lg border border-amber-500 p-3 text-sm text-amber-700">Perhitungan ini belum digunakan untuk membayar gaji. Fitur DRAFT, REVIEW, LOCKED, PAID, PPh21, BPJS dan kasbon belum aktif.</p>
    <form onSubmit={load} className="flex flex-wrap items-end gap-3">
      <label className="space-y-1 text-sm">Bulan periode<input type="month" required value={period} onChange={e=>setPeriod(e.target.value)} className="block rounded border p-2"/></label>
      <label className="space-y-1 text-sm">Siklus<select className="block rounded border p-2" value={cycle} onChange={e=>setCycle(e.target.value)}>
        {["A","B","C","D"].map(x=><option key={x} value={x}>Siklus {x}</option>)}
      </select></label>
      <button type="submit" disabled={busy} className="rounded-lg bg-teal-700 px-4 py-2 text-sm text-white disabled:opacity-50">{busy?"Memuat...":"Lihat Preview MySQL"}</button>
    </form>
    {error&&<p role="alert" className="text-red-600">{error}</p>}
    {data&&<section className="space-y-3">
      <p className="text-sm">{data.periodStart} sampai {data.periodEnd} · {data.totalEmployees} pegawai · total gaji pokok {rupiah(data.totalBaseSalary)}</p>
      <p className="text-xs opacity-75">{data.notice}</p>
      <div className="overflow-auto rounded-xl border"><table className="w-full text-sm">
        <thead><tr className="border-b"><th className="p-3 text-left">Pegawai</th><th className="p-3">Hadir tervalidasi</th><th className="p-3 text-right">Gaji pokok (belum THP)</th></tr></thead>
        <tbody>{data.rows.map(r=><tr key={r.id} className="border-b"><td className="p-3">{r.name} · {r.code}</td>
          <td className="p-3 text-center">{r.validatedPresentDays}</td>
          <td className="p-3 text-right">{rupiah(r.baseSalary)}</td></tr>)}</tbody>
      </table></div>
    </section>}
  </main>;
}
