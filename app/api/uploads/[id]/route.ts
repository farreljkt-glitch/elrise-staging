import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-server";
import { canReadAttendanceSelfie } from "@/lib/attendance/selfie-scope";
export const runtime="nodejs";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 const session=await getSession(); if(!session) return NextResponse.json({message:"Silakan masuk."},{status:401});
 if(session.mustChangePassword) return NextResponse.json({message:"Ganti kata sandi sebelum mengakses foto absensi."},{status:403});
 const {id}=await params;
 const attendance=await db.attendance.findUnique({where:{id},include:{pegawai:true}});
 if(!attendance||!attendance.selfiePath) return NextResponse.json({message:"Foto tidak ditemukan."},{status:404});
 if(!canReadAttendanceSelfie(session,attendance)) return NextResponse.json({message:"Akses ditolak."},{status:403});
 const root=process.env.UPLOAD_DIR; if(!root||!path.isAbsolute(root)) return NextResponse.json({message:"Penyimpanan upload belum dikonfigurasi."},{status:503});
 const resolved=path.resolve(attendance.selfiePath); if(!resolved.startsWith(path.resolve(root)+path.sep)) return NextResponse.json({message:"Path file tidak valid."},{status:500});
 try {const bytes=await readFile(resolved);return new NextResponse(bytes,{headers:{"Content-Type":"image/jpeg","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});}catch{return NextResponse.json({message:"File foto tidak tersedia."},{status:404});}
}
