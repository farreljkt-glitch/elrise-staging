"use client";
import {useEffect,useState} from "react";
type Project={id:string;code:string;name:string;isActive:boolean};
type Office={id:string;projectId:string|null;name:string;radiusM:number;isActive:boolean;lat:number;lng:number};
export function OfficeAttendanceSetup({projects}:{projects:Project[]}){
  const [projectId,setProjectId]=useState("");
  const [name,setName]=useState("Titik Kantor Project");
  const [lat,setLat]=useState("");const [lng,setLng]=useState("");
  const [radius,setRadius]=useState("100");
  const [offices,setOffices]=useState<Office[]>([]);
  const [enabled,setEnabled]=useState(false);
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("");
  useEffect(()=>{
    const active=projects.filter(p=>p.isActive);
    setProjectId(old=>active.some(p=>p.id===old)?old:active[0]?.id||"");
  },[projects]);
  async function reload(){
    const r=await fetch("/api/admin/attendance-setup",{cache:"no-store"});
    const d=await r.json();if(!r.ok)throw new Error(d.error||"Konfigurasi absensi tidak tersedia");
    setOffices(d.offices);setEnabled(Boolean(d.setting?.attendanceEnabled));
  }
  useEffect(()=>{void reload().catch(e=>setError(e instanceof Error?e.message:"Gagal memuat lokasi"));},[]);
  async function useLocation(){
    setError("");
    if(!navigator.geolocation){setError("Browser tidak menyediakan GPS.");return;}
    navigator.geolocation.getCurrentPosition(pos=>{
      setLat(pos.coords.latitude.toFixed(7));
      setLng(pos.coords.longitude.toFixed(7));
    },err=>setError("GPS tidak tersedia: "+err.message),{enableHighAccuracy:true,timeout:15000});
  }
  async function save(e:React.FormEvent){
    e.preventDefault();if(busy)return;setBusy(true);setError("");setMessage("");
    try{
      const res=await fetch("/api/admin/attendance-setup",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({projectId,name,lat:Number(lat),lng:Number(lng),radiusM:Number(radius)}),
      });
      const d=await res.json();if(!res.ok)throw new Error(d.error||"Gagal menyimpan titik kantor");
      setMessage("Lokasi kantor disimpan. Absensi GPS + selfie aktif untuk PT Anda.");
      await reload();
    }catch(e){setError(e instanceof Error?e.message:"Gagal menyimpan");}
    finally{setBusy(false);}
  }
  return <section className="space-y-3 rounded-xl border p-4">
    <h2 className="font-semibold">Aktivasi Absensi GPS untuk Project</h2>
    <p className="text-sm opacity-75">PT baru belum mengaktifkan absensi. Atur titik kantor supaya pegawai bisa check-in/out.
      GPS dan selfie tetap wajib; titik kantor sebaiknya sesuai lokasi pegawai.</p>
    <p className="text-sm">Absensi PT: <b>{enabled?"Aktif":"Belum aktif"}</b></p>
    {error&&<p role="alert" className="text-sm text-red-600">{error}</p>}
    {message&&<p role="status" className="text-sm">{message}</p>}
    <form onSubmit={save} className="space-y-3">
      <label className="block text-sm">Project
        <select required value={projectId} onChange={e=>setProjectId(e.target.value)}
          className="mt-1 block w-full rounded border p-2">
          {!projects.some(p=>p.isActive)&&<option value="">Buat project aktif dahulu</option>}
          {projects.filter(p=>p.isActive).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className="block text-sm">Nama lokasi kantor
        <input required minLength={2} maxLength={120} className="mt-1 block w-full rounded border p-2"
          value={name} onChange={e=>setName(e.target.value)}/>
      </label>
      <button type="button" className="rounded border px-3 py-2 text-sm" onClick={()=>void useLocation()}>
        Ambil koordinat lokasi saya
      </button>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">Latitude
          <input required type="number" step="any" min={-90} max={90} value={lat}
            onChange={e=>setLat(e.target.value)} className="mt-1 block w-full rounded border p-2"/>
        </label>
        <label className="text-sm">Longitude
          <input required type="number" step="any" min={-180} max={180} value={lng}
            onChange={e=>setLng(e.target.value)} className="mt-1 block w-full rounded border p-2"/>
        </label>
      </div>
      <label className="block text-sm">Radius kantor (20–1000 meter)
        <input required type="number" min={20} max={1000} step={1} value={radius}
          onChange={e=>setRadius(e.target.value)} className="mt-1 block w-full rounded border p-2"/>
      </label>
      <button disabled={busy||!projectId||!lat||!lng} className="rounded bg-teal-700 px-4 py-2 text-sm text-white disabled:opacity-50">
        {busy?"Menyimpan...":"Simpan titik kantor & aktifkan absensi"}
      </button>
    </form>
    <div className="space-y-1">
      {offices.map(o=><p key={o.id} className="text-sm">{o.name} · {projects.find(p=>p.id===o.projectId)?.name??"Project"} · radius {o.radiusM} m · {o.isActive?"Aktif":"Nonaktif"}</p>)}
    </div>
  </section>;
}
