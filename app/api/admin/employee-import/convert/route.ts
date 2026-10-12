import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-server";
import { excelEmployeeToCsv } from "@/lib/integration/employee-excel";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const actor = await requireUser(["ADMIN"]);
    if (!actor.clientId) return NextResponse.json({error:"Tenant wajib"},{status:403});
  } catch {return NextResponse.json({error:"Tidak diizinkan"},{status:403});}
  if (!(request.headers.get("content-type")||"").includes("multipart/form-data"))
    return NextResponse.json({error:"Upload XLSX diperlukan"},{status:415});
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !/\.xlsx$/i.test(file.name) || file.size > 1024 * 1024)
      return NextResponse.json({error:"Unggah XLSX maksimal 1 MB"},{status:400});
    const csv=await excelEmployeeToCsv(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({csv},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Excel tidak valid"},{status:400});
  }
}
