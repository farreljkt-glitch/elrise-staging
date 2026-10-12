import { NextResponse } from "next/server";
import { z } from "zod";
import { acceptEmployeeInvitation } from "@/lib/integration/employee-invitation";
export const runtime="nodejs";
const schema=z.object({token:z.string().min(40).max(80),password:z.string().min(12).max(200)});
export async function POST(req:Request) {
  if(!(req.headers.get("content-type")??"").includes("application/json"))
    return NextResponse.json({error:"JSON diperlukan"},{status:415});
  const data=schema.safeParse(await req.json().catch(()=>null));
  if(!data.success) return NextResponse.json({error:"Data undangan tidak valid"},{status:400});
  try {
    await acceptEmployeeInvitation(data.data.token,data.data.password);
    return NextResponse.json({ok:true,message:"Akun aktif. Silakan login."});
  } catch {
    return NextResponse.json({error:"Undangan tidak valid, kedaluwarsa, atau telah digunakan."},{status:400});
  }
}
