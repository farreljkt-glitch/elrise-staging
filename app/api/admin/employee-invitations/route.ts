import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { issueEmployeeInvitation } from "@/lib/integration/employee-invitation";
export const runtime = "nodejs";
const schema=z.object({pegawaiId:z.string().min(1).max(191)});
export async function POST(req:Request) {
  try {
    const actor=await requireUser(["ADMIN"]);
    if(!actor.clientId) return NextResponse.json({error:"Tenant wajib"},{status:403});
    const data=schema.safeParse(await req.json().catch(()=>null));
    if(!data.success) return NextResponse.json({error:"pegawaiId tidak valid"},{status:400});
    const result=await issueEmployeeInvitation(actor.clientId,data.data.pegawaiId);
    // Admin must deliver this secret through a secure channel. Never log or store plaintext.
    return NextResponse.json({email:result.email,token:result.token,expiresAt:result.expiresAt.toISOString()});
  } catch(e) {
    console.error("Invite issue failed",e instanceof Error?e.message:"unknown");
    return NextResponse.json({error:"Undangan tidak dapat dibuat. Periksa status akun dan karyawan."},{status:400});
  }
}
