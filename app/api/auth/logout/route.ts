import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth-server";
import { writeAudit } from "@/lib/audit";
export const runtime="nodejs";
export async function POST(){ const user=await getSession(); if(user) await writeAudit({actor:user,action:"LOGOUT",entity:"User",entityId:user.id}).catch(()=>{}); await clearSession(); return NextResponse.json({ok:true}); }
