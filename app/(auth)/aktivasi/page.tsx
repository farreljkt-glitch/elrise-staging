"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
function ActivationForm() {
  const params=useSearchParams();
  const token=params.get("token") || "";
  const [password,setPassword]=useState("");
  const [repeat,setRepeat]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(false);
  async function submit(e:React.FormEvent) {
    e.preventDefault();
    if(password.length<12 || password!==repeat) {setMessage("Password minimal 12 karakter dan harus cocok.");return;}
    setBusy(true); setMessage("");
    try {
      const res=await fetch("/api/auth/employee-invitation",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token,password})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error || "Aktivasi gagal");
      setDone(true); setPassword("");setRepeat("");setMessage("Akun berhasil diaktivasi. Silakan login.");
    } catch(e) {setMessage(e instanceof Error?e.message:"Aktivasi gagal");}
    finally {setBusy(false);}
  }
  return <main className="mx-auto mt-16 max-w-md space-y-5 rounded-xl border p-6"><h1 className="text-2xl font-semibold">Aktivasi Akun Elrise</h1>
    {!token && <p>Tautan undangan tidak lengkap. Minta Admin PT mengirim ulang.</p>}
    {token && !done && <form onSubmit={e=>void submit(e)} className="space-y-3"><p className="text-sm opacity-75">Buat password untuk login menggunakan email yang didaftarkan Admin PT.</p><label className="block text-sm">Password baru<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded border p-2"/></label><label className="block text-sm">Ulangi password<input type="password" autoComplete="new-password" minLength={12} required value={repeat} onChange={e=>setRepeat(e.target.value)} className="mt-1 w-full rounded border p-2"/></label><button disabled={busy} className="rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-50">Aktivasi akun</button></form>}
    {message && <p role="status" className="text-sm">{message}</p>}
    {done && <Link href="/login" className="underline">Ke halaman login</Link>}
  </main>;
}
export default function AktivasiPage(){return <Suspense fallback={<p>Memuat…</p>}><ActivationForm/></Suspense>}
