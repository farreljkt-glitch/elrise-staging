"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
type Project = {id:string;name:string;code:string};
export default function TambahPegawaiPage() {
  const router = useRouter();
  const [projects,setProjects] = useState<Project[]>([]);
  const [loadingProjects,setLoadingProjects] = useState(true);
  const [projectId,setProjectId] = useState("");
  const [employeeCode,setEmployeeCode] = useState("");
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [salary,setSalary] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/projects",{cache:"no-store"}).then(async response=>{
      if(!response.ok) throw new Error("Project tidak dapat dimuat. Periksa izin Admin PT.");
      return response.json();
    }).then(data=>{if(mounted){setProjects(data.projects);setProjectId(data.projects[0]?.id||"");}})
      .catch(err=>{if(mounted)setError(err instanceof Error?err.message:"Project gagal dimuat");})
      .finally(()=>{if(mounted)setLoadingProjects(false);});
    return ()=>{mounted=false;};
  },[]);
  async function save(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(busy || !projectId) return;
    setBusy(true);setError("");
    try {
      const res=await fetch("/api/admin/employees",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({employeeCode,name,email,projectId,baseSalaryIdr:salary}),
      });
      const body=await res.json();
      if(!res.ok) throw new Error(body.error||"Gagal menyimpan pegawai");
      router.push("/admin/pegawai/"+encodeURIComponent(body.employee.id));
      router.refresh();
    }catch(err){setError(err instanceof Error?err.message:"Gagal menyimpan");}
    finally{setBusy(false);}
  }
  return <main className="mx-auto max-w-3xl space-y-5 p-5">
    <PageHeader title="Tambah Pegawai" description="Data disimpan ke MySQL PT Anda; akun login dibuat melalui undangan aktivasi." breadcrumbs={[{label:"Admin"},{label:"Pegawai",href:"/admin/pegawai"},{label:"Tambah"}]}/>
    <Card title="Data Pegawai" description="Hanya data yang benar-benar didukung backend ditampilkan. Komponen payroll tambahan akan tersedia setelah modul payroll siap.">
      <form className="space-y-4" onSubmit={save}>
        {error && <p role="alert" className="rounded-lg border border-red-500 p-3 text-sm text-red-600">{error}</p>}
        <Input label="Kode Pegawai" required maxLength={80} value={employeeCode} onChange={e=>setEmployeeCode(e.target.value.toUpperCase())} placeholder="EMP-001"/>
        <Input label="Nama Lengkap" required maxLength={180} value={name} onChange={e=>setName(e.target.value)}/>
        <Input label="Email" type="email" required maxLength={191} value={email} onChange={e=>setEmail(e.target.value)}/>
        <div className="space-y-1">
          <label htmlFor="project-id" className="text-xs font-semibold">Project aktif</label>
          <select id="project-id" className="h-10 w-full rounded-lg border bg-[var(--surface-2)] px-3" required disabled={loadingProjects || projects.length===0} value={projectId} onChange={e=>setProjectId(e.target.value)}>
            {projects.length===0 && <option value="">Tidak ada project aktif</option>}
            {projects.map(p=><option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </select>
        </div>
        <Input label="Gaji Pokok (Rp)" required type="text" inputMode="numeric" pattern="(0|[1-9][0-9]*)" value={salary} onChange={e=>setSalary(e.target.value)} placeholder="5000000"/>
        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/pegawai" className="text-sm underline">Batal</Link>
          <Button type="submit" isLoading={busy} disabled={!projectId||loadingProjects}>Simpan ke Database</Button>
        </div>
      </form>
    </Card>
  </main>;
}
