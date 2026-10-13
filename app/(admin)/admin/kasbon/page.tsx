"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import { LoanAccrualReadiness } from "@/components/integration/LoanAccrualReadiness";
type Employee={id:string;code:string;name:string};
type Policy={id:string;pegawaiId:string|null;mode:string;percentBps:number|null;
  fixedAmountIdr:string|null;denominatorDays:number;effectiveAt:string};
type PolicyData={policyConfigurationEnabled:boolean;reason:string|null;notice:string;policies:Policy[]};
export default function AdminKasbonPolicyPage(){
  const [data,setData]=useState<PolicyData|null>(null);
  const [employees,setEmployees]=useState<Employee[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");const [message,setMessage]=useState("");
  const [scope,setScope]=useState<"TENANT_DEFAULT"|"EMPLOYEES">("TENANT_DEFAULT");
  const [chosen,setChosen]=useState<string[]>([]);
  const [mode,setMode]=useState<"FIXED_IDR"|"PERCENT_OF_PRE_KASBON_THP">("FIXED_IDR");
  const [fixedAmountIdr,setFixedAmountIdr]=useState("1000000");
  const [percentBps,setPercentBps]=useState("2500");
  const [denominatorDays,setDenominatorDays]=useState("22");
  const [effectiveDate,setEffectiveDate]=useState(()=>new Date().toISOString().slice(0,10));
  async function load(){
    setLoading(true);
    try{
      const [p,e]=await Promise.all([
        fetch("/api/admin/loan-policies",{cache:"no-store"}),
        fetch("/api/admin/employees?page=1",{cache:"no-store"}),
      ]);
      const [pol,staff]=await Promise.all([p.json(),e.json()]);
      if(!p.ok||!e.ok)throw new Error(pol.error||staff.error||"Data tidak tersedia");
      setData(pol);
      setEmployees((staff.employees||[]).filter((person:{active:boolean})=>person.active)
        .map((person:{id:string;code:string;name:string})=>({
          id:person.id,code:person.code,name:person.name,
        })));
    }catch(e){setError(e instanceof Error?e.message:"Gagal memuat data");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  async function save(event:React.FormEvent){
    event.preventDefault();if(busy||!data?.policyConfigurationEnabled)return;
    setBusy(true);setError("");setMessage("");
    try{
      const req={
        scope,pegawaiIds:scope==="TENANT_DEFAULT"?[]:chosen,mode,
        ...(mode==="FIXED_IDR"?{fixedAmountIdr}:{percentBps:Number(percentBps)}),
        denominatorDays:Number(denominatorDays),effectiveDate,
      };
      const res=await fetch("/api/admin/loan-policies",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(req),
      });
      const body=await res.json();if(!res.ok)throw new Error(body.error||"Gagal menyimpan kebijakan");
      setMessage(body.savedCount+" kebijakan disimpan di MySQL. Ini belum mengaktifkan transaksi Gajiku.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Penyimpanan gagal");}
    finally{setBusy(false);}
  }
  const money=(v:string)=>"Rp "+BigInt(v).toLocaleString("id-ID");
  return <main className="space-y-5 p-5">
    <h1 className="text-2xl font-bold">Kebijakan Plafon Kasbon — Elrise</h1>
    <Link href="/admin/kasbon/pengajuan" className="inline-block rounded border px-4 py-2 text-sm">Review Pengajuan Kasbon →</Link>
    <p className="rounded-lg border border-amber-600 p-3 text-sm">
      Hanya konfigurasi kebijakan. <b>Belum ada kasbon atau sinkronisasi ke Gajiku.</b>
      THP sebelum potongan kasbon, outstanding, reservation, dan saldo final belum dihitung oleh halaman ini.
    </p>
    {error&&<p role="alert" className="rounded border border-red-600 p-3 text-red-600">{error}</p>}
    {message&&<p role="status" className="text-sm">{message}</p>}
    {loading&&<p className="text-sm">Memuat konfigurasi...</p>}
    {data&&!data.policyConfigurationEnabled&&<p className="rounded border p-3 text-sm">
      <b>Konfigurasi belum dapat diaktifkan:</b> {data.reason} Gunakan staging Gajiku terlebih dahulu; koneksi draft DISABLED tidak cukup.
    </p>}
    <form onSubmit={save} className="space-y-4 rounded-xl border p-4">
      <h2 className="font-semibold">Kebijakan baru (append-only)</h2>
      <label className="block text-sm">Cakupan
        <select value={scope} onChange={e=>{setScope(e.target.value as typeof scope);setChosen([]);}}
          className="mt-1 block w-full rounded border p-2">
          <option value="TENANT_DEFAULT">Default seluruh PT</option>
          <option value="EMPLOYEES">Pegawai tertentu (massal)</option>
        </select>
      </label>
      {scope==="EMPLOYEES"&&<fieldset className="space-y-2 rounded border p-3">
        <legend className="text-sm font-semibold">Pilih pegawai ({chosen.length})</legend>
        {employees.map(e=><label key={e.id} className="flex gap-2 text-sm">
          <input type="checkbox" checked={chosen.includes(e.id)} onChange={event=>
            setChosen(old=>event.target.checked?[...old,e.id]:old.filter(x=>x!==e.id))}/>
          {e.name} ({e.code})
        </label>)}
        <p className="text-xs opacity-70">Menampilkan 50 pegawai pertama. Jangan gunakan opsi massal jika daftar belum mencakup semua pegawai yang dituju.</p>
      </fieldset>}
      <label className="block text-sm">Basis plafon
        <select className="mt-1 block w-full rounded border p-2" value={mode}
          onChange={e=>setMode(e.target.value as typeof mode)}>
          <option value="FIXED_IDR">Nominal tetap (Rp)</option>
          <option value="PERCENT_OF_PRE_KASBON_THP">Persentase THP sebelum potongan kasbon</option>
        </select>
      </label>
      {mode==="FIXED_IDR"?<label className="block text-sm">Batas nominal (Rp)
        <input inputMode="numeric" required pattern="(0|[1-9][0-9]*)" value={fixedAmountIdr}
          onChange={e=>setFixedAmountIdr(e.target.value)} className="mt-1 block w-full rounded border p-2"/>
      </label>:<label className="block text-sm">Persentase (basis points: 2500 = 25%)
        <input type="number" min={0} max={10000} step={1} required value={percentBps}
          onChange={e=>setPercentBps(e.target.value)} className="mt-1 block w-full rounded border p-2"/>
      </label>}
      <label className="block text-sm">Pembagi hari kerja (1–366)
        <input type="number" min={1} max={366} required value={denominatorDays}
          onChange={e=>setDenominatorDays(e.target.value)} className="mt-1 block w-full rounded border p-2"/>
      </label>
      <label className="block text-sm">Berlaku mulai (tidak boleh lampau)
        <input type="date" required value={effectiveDate} onChange={e=>setEffectiveDate(e.target.value)}
          className="mt-1 block w-full rounded border p-2"/>
      </label>
      <button type="submit" disabled={busy||loading||!data?.policyConfigurationEnabled||
        (scope==="EMPLOYEES"&&chosen.length===0)}
        className="rounded bg-teal-700 px-4 py-2 text-white disabled:opacity-40">
        {busy?"Menyimpan...":"Simpan kebijakan Elrise"}
      </button>
    </form>
    <LoanAccrualReadiness employees={employees}/>
    <section className="space-y-2 rounded-lg border p-4">
      <h2 className="font-semibold">Riwayat kebijakan PT ({data?.policies.length??0} ditampilkan)</h2>
      {data?.policies.map(p=><div key={p.id} className="border-b py-2 text-sm">
        <b>{p.pegawaiId?"Override pegawai":"Default tenant"}</b> · {p.mode==="FIXED_IDR"?
          money(p.fixedAmountIdr??"0"):(p.percentBps??0)/100+"% THP"}
        · {p.denominatorDays} hari · berlaku {p.effectiveAt.slice(0,10)}
      </div>)}
      {!data?.policies.length&&<p className="text-sm opacity-75">Belum ada kebijakan.</p>}
    </section>
  </main>;
}
