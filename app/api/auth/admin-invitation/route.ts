import { NextResponse } from "next/server";
import { z } from "zod";
import { acceptAdminInvitation } from "@/lib/superadmin/admin-invitation";
export const runtime="nodejs";
const schema=z.object({token:z.string().min(40).max(80),password:z.string().min(12).max(200)}).strict();
export async function POST(req:Request){
  if(!(req.headers.get("content-type")??"").includes("application/json"))
    return NextResponse.json({error:"JSON diperlukan"},{status:415});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Undangan tidak valid"},{status:400});
  try{
    await acceptAdminInvitation(parsed.data.token,parsed.data.password);
    return NextResponse.json({ok:true,message:"Akun admin aktif, silakan login."},{headers:{"Cache-Control":"no-store"}});
  }catch{
    return NextResponse.json({error:"Undangan tidak valid, kedaluwarsa, atau telah digunakan."},{status:400});
  }
}
