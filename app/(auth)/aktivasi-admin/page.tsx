"use client";
import { useSearchParams } from "next/navigation";
import { Suspense,useState } from "react";
import Link from "next/link";
function Form(){
  const token=useSearchParams().get("token")||"";
  const [password,setPassword]=useState("");const [repeat,setRepeat]=useState("");
  const [error,setError]=useState("");const [busy,setBusy]=useState(false);const [done,setDone]=useState(false);
  async function submit(e:React.FormEvent){
    e.preventDefault();if(password.length<12 || password!==repeat){setError("Password minimal 12 karakter, kedua isian harus sama.");return;}
    setBusy(true);setError("");
    try{
      const r=await fetch("/api/auth/admin-invitation",{method:"POST",
        headers:{"Content-Type":"application/json"},body:JSON.stringify({token,password}),
      });const d=await r.json();if(!r.ok)throw new Error(d.error||"Aktivasi gagal");
      setDone(true);setPassword("");setRepeat("");
    }catch(err){setError(err instanceof Error?err.message:"Gagal");}finally{setBusy(false);}
  }
  return <main className="mx-auto mt-16 max-w-md space-y-5 rounded-xl border p-6">
    <h1 className="text-2xl font-bold">Aktivasi Admin Elrise</h1>
    <p className="text-sm opacity-70">Tautan berlaku satu kali selama 24 jam. Gunakan password baru untuk akun Admin PT atau Admin Project.</p>
    {!token&&<p>Tautan undangan tidak lengkap.</p>}
    {token&&!done&&<form onSubmit={submit} className="space-y-3">
      <label className="block text-sm">Password baru<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded border p-2"/></label>
      <label className="block text-sm">Konfirmasi password<input type="password" autoComplete="new-password" minLength={12} required value={repeat} onChange={e=>setRepeat(e.target.value)} className="mt-1 w-full rounded border p-2"/></label>
      <button disabled={busy} className="rounded bg-teal-700 px-4 py-2 text-white">{busy?"Mengaktifkan...":"Aktivasi akun"}</button>
    </form>}
    {error&&<p role="alert" className="text-red-600">{error}</p>}
    {done&&<p>Berhasil aktif. <Link href="/login" className="underline">Login sekarang</Link></p>}
  </main>;
}
export default function AktivasiAdminPage(){return <Suspense fallback={<p>Memuat...</p>}><Form/></Suspense>}
