import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { calculatePayrollPeriodRange } from "@/lib/integration/period-mapping";
import type { PayrollCycle } from "@prisma/client";
export const runtime = "nodejs";
/** Read-only planning view. This is NOT an approved tax/payroll/slip calculation. */
export async function GET(request: Request) {
  const actor = await getSession();
  if (!actor || actor.role !== "ADMIN" || !actor.clientId || actor.mustChangePassword)
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "";
  const cycle = url.searchParams.get("cycle") || "";
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(period) || !["A","B","C","D"].includes(cycle))
    return NextResponse.json({ error: "Periode atau siklus tidak valid" }, { status: 400 });
  const [year, month] = period.split("-").map(Number);
  const range = calculatePayrollPeriodRange(cycle as PayrollCycle, year, month);
  try {
    const setting = await db.client.findUnique({where:{id:actor.clientId},
      select:{status:true,setting:{select:{payrollEnabled:true}}}});
    if (setting?.status !== "AKTIF" || !setting.setting?.payrollEnabled)
      return NextResponse.json({error:"Payroll nonaktif untuk tenant ini"},{status:403});
    const employees = await db.pegawai.findMany({
      where: { clientId: actor.clientId, isActive: true, siklusGaji: cycle as PayrollCycle },
      select: { id: true, idPegawai: true, nama: true, gajiPokok: true }, take: 501,
      orderBy: [{ nama: "asc" }, { id: "asc" }],
    });
    if (employees.length > 500)
      return NextResponse.json({ error: "Preview dibatasi 500 pegawai agar total tidak salah. Gunakan proses batch setelah siap." }, { status: 409 });
    const records = await db.attendance.findMany({
      where: {
        clientId: actor.clientId, pegawaiId: { in: employees.map(e=>e.id) },
        tanggal: { gte: range.startDate, lte: range.endDate },
        status: { in: ["HADIR","TELAT"] }, validatedAt: { not: null },
      },
      select: { pegawaiId: true },
    });
    const days = new Map<string,number>();
    for (const attendance of records) days.set(attendance.pegawaiId,(days.get(attendance.pegawaiId)||0)+1);
    const totalBaseSalary = employees.reduce((sum,e)=>sum+e.gajiPokok,0n);
    return NextResponse.json({
      previewOnly:true,period,cycle,periodStart:range.startDate.toISOString().slice(0,10),
      periodEnd:range.endDate.toISOString().slice(0,10),
      notice:"HANYA REFERENSI gaji pokok dan jumlah hadir tervalidasi. BUKAN THP/PAID. Belum menghitung PPh21, BPJS, THR, tunjangan, lembur, potongan kasbon atau pajak.",
      totalEmployees:employees.length,totalBaseSalary:totalBaseSalary.toString(),
      rows:employees.map(e=>({
        id:e.id,code:e.idPegawai,name:e.nama,baseSalary:e.gajiPokok.toString(),
        validatedPresentDays:days.get(e.id)||0,
      })),
    },{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    console.error("Payroll planning preview failed",error instanceof Error?error.name:"unknown");
    return NextResponse.json({error:"Preview payroll tidak tersedia"},{status:503});
  }
}
