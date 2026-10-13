import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { parseInviteAdmin } from "@/lib/superadmin/admin-invitation-validation";
import { issueAdminInvitation } from "@/lib/superadmin/admin-invitation";
export const runtime="nodejs";

export async function POST(req:Request){
  const actor=await getSession();
  if(!actor || actor.role!=="SUPERADMIN" || actor.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  if(!(req.headers.get("content-type")??"").includes("application/json"))
    return NextResponse.json({error:"JSON diperlukan"},{status:415});
  let input:ReturnType<typeof parseInviteAdmin>;
  try{input=parseInviteAdmin(await req.json());}
  catch{return NextResponse.json({error:"Data undangan tidak valid"},{status:400});}
  try{
    const result=await issueAdminInvitation(actor.id,input);
    return NextResponse.json({
      email:result.email,token:result.token,expiresAt:result.expiresAt.toISOString(),
    },{status:201,headers:{"Cache-Control":"no-store"}});
  }catch(e){
    if(e instanceof Error && /email already used|Unique constraint|P2002/.test(e.message))
      return NextResponse.json({error:"Email akun sudah digunakan"},{status:409});
    if(e instanceof Error && /Tenant inactive|Foreign or inactive project/.test(e.message))
      return NextResponse.json({error:"Tenant atau project tidak aktif/tidak sesuai"},{status:403});
    console.error("Admin invitation issuance failed",e instanceof Error?e.name:"unknown");
    return NextResponse.json({error:"Tidak dapat membuat undangan admin"},{status:503});
  }
}
