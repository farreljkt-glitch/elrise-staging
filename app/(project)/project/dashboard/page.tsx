"use client";
import { useEffect,useState } from "react";
type Employee={id:string;idPegawai:string;nama:string;jabatan:string|null;isActive:boolean};
type Row={id:string;name:string;code:string;status:string;checkedInAt:string|null;checkedOutAt:string|null;validated:boolean;suspicious:boolean};
export default function ProjectDashboard(){
  const [team,setTeam]=useState<Employee[]>([]);const [rows,setRows]=useState<Row[]>([]);
  const [project,setProject]=useState("");const [error,setError]=useState("");
  const [date,setDate]=useState(()=>new Date().toISOString().slice(0,10));
  const [refresh,setRefresh]=useState(0);const [busyId,setBusyId]=useState<string|null>(null);
  useEffect(()=>{fetch("/api/project/team",{cache:"no-store"}).then(async r=>{
    const d=await r.json();if(!r.ok)throw new Error(d.error||"Akses tidak tersedia");return d;
  }).then(d=>{setProject(d.project);setTeam(d.employees);}).catch(e=>setError(e instanceof Error?e.message:"Gagal"));},[]);
  useEffect(()=>{fetch("/api/project/attendance?date="+encodeURIComponent(date),{cache:"no-store"}).then(async r=>{
    const d=await r.json();if(!r.ok)throw new Error(d.error||"Absensi gagal");return d;
  }).then(d=>setRows(d.rows)).catch(e=>setError(e instanceof Error?e.message:"Gagal"));},[date,refresh]);
  async function approve(id:string){
    if(busyId||!window.confirm("Setujui kehadiran lengkap ini?"))return;
    setBusyId(id);setError("");
    try{
      const r=await fetch("/api/attendance/review/"+encodeURIComponent(id),{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({decision:"APPROVE"}),
      });
      const data=await r.json();if(!r.ok)throw new Error(data.error||"Persetujuan ditolak");
      setRefresh(n=>n+1);
    }catch(e){setError(e instanceof Error?e.message:"Gagal");}
    finally{setBusyId(null);}
  }
  return <main className="space-y-5"><h1 className="text-2xl font-bold">Admin Project {project}</h1>
    <p className="text-sm opacity-75">Akses hanya ke anggota dan absensi project yang ditugaskan. Gaji, rekening dan payroll tidak ditampilkan.</p>
    {error&&<p role="alert" className="text-red-600">{error}</p>}
    <section className="rounded-lg border p-4"><h2 className="mb-2 font-semibold">Tim ({team.length})</h2>
      {team.map(e=><p key={e.id} className="border-b py-2 text-sm">{e.idPegawai} — {e.nama} · {e.jabatan||"-"} · {e.isActive?"Aktif":"Nonaktif"}</p>)}
      {!team.length&&<p className="text-sm">Belum ada pegawai.</p>}
    </section>
    <section className="rounded-lg border p-4"><h2 className="mb-3 font-semibold">Absensi</h2>
      <input type="date" className="mb-3 rounded border p-2" value={date} onChange={e=>setDate(e.target.value)}/>
      {rows.map(r=><p key={r.id} className="border-b py-2 text-sm">{r.code} — {r.name} · {r.status} · {r.validated?"Valid":"Belum tervalidasi"}{r.suspicious?" · Butuh pemeriksaan anomali":""}
        {!r.validated&&!r.suspicious&&r.checkedOutAt&&["HADIR","TELAT"].includes(r.status) &&
          <button disabled={busyId!==null} onClick={()=>void approve(r.id)} className="ml-3 rounded border px-2 py-1 text-xs disabled:opacity-50">Validasi</button>}
      </p>)}
      {!rows.length&&<p className="text-sm">Belum ada absensi.</p>}
    </section>
  </main>;
}
