import { NextResponse } from "next/server";
import { AttendanceNetworkRule, AttendanceStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import sharp from "sharp";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { getSession, requestMetadata } from "@/lib/auth-server";
import { validateGpsAttendance } from "@/lib/geo";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const locationSchema = z.object({ action:z.enum(["CHECK_IN","CHECK_OUT"]), lat:z.coerce.number().min(-90).max(90), lng:z.coerce.number().min(-180).max(180), accuracyM:z.coerce.number().positive().max(10000) });
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
function localDateOnly(now:Date) { return new Date(Date.UTC(Number(new Intl.DateTimeFormat("en",{timeZone:"Asia/Jakarta",year:"numeric"}).format(now)), Number(new Intl.DateTimeFormat("en",{timeZone:"Asia/Jakarta",month:"2-digit"}).format(now))-1, Number(new Intl.DateTimeFormat("en",{timeZone:"Asia/Jakarta",day:"2-digit"}).format(now)))); }
function getClientIp(req:Request) {
  // TRUSTED_PROXY_IPS adalah deployment gate/dokumentasi; aplikasi tetap harus
  // dibatasi firewall agar hanya reverse proxy yang dapat mencapai port Next.js.
  // Reverse proxy wajib menghapus header masuk lalu menulis ulang X-Real-IP.
  const trustedProxies=(process.env.TRUSTED_PROXY_IPS??"").split(",").map(v=>v.trim()).filter(Boolean);
  if(trustedProxies.length===0) return null;
  return req.headers.get("x-real-ip")?.trim() || null;
}
export async function GET() {
  const session=await getSession();
  if(!session) return NextResponse.json({message:"Silakan masuk kembali."},{status:401});
  if(session.mustChangePassword) return NextResponse.json({message:"Ganti kata sandi sebelum menggunakan absensi."},{status:403});
  if(session.role!=="PEGAWAI"||!session.pegawaiId||!session.clientId) return NextResponse.json({message:"Akses ditolak."},{status:403});
  try {
    const now=new Date();
    const today=localDateOnly(now);
    const attendance=await db.attendance.findUnique({where:{pegawaiId_tanggal:{pegawaiId:session.pegawaiId,tanggal:today}},select:{id:true,checkInAt:true,checkOutAt:true,status:true}});
    return NextResponse.json({attendance});
  } catch(error) {
    console.error("Gagal membaca absensi hari ini:",error instanceof Error?error.message:"unknown");
    return NextResponse.json({message:"Data absensi tidak tersedia."},{status:503});
  }
}
export async function POST(req:Request) {
  const session=await getSession();
  if(!session) return NextResponse.json({message:"Silakan masuk kembali."},{status:401});
  if(session.mustChangePassword) return NextResponse.json({message:"Ganti kata sandi sebelum menggunakan absensi."},{status:403});
  if(session.role!=="PEGAWAI" || !session.pegawaiId || !session.clientId) return NextResponse.json({message:"Hanya akun pegawai yang dapat melakukan absensi."},{status:403});
  let selfiePathForCleanup:string|null=null;
  try {
    const form=await req.formData();
    const parsed=locationSchema.safeParse({action:form.get("action"),lat:form.get("lat"),lng:form.get("lng"),accuracyM:form.get("accuracyM")});
    if(!parsed.success) return NextResponse.json({message:"Data lokasi atau jenis absensi tidak valid."},{status:400});
    const attendanceData = parsed.data;
    const client=await db.client.findUnique({where:{id:session.clientId},include:{setting:true,officeIps:{where:{isActive:true}}}});
    const employee=await db.pegawai.findFirst({where:{id:session.pegawaiId,clientId:session.clientId,isActive:true},include:{project:true}});
    if(!client||client.status!=="AKTIF"||!employee||!client.setting?.attendanceEnabled) return NextResponse.json({message:"Klien, pegawai, atau modul absensi tidak aktif."},{status:403});
    const activeEmployee = employee;
    const setting=client.setting;
    const clientId=session.clientId;
    // Cek konflik lebih awal agar request duplikat tidak menulis file selfie yatim.
    const today=localDateOnly(new Date());
    const existing=await db.attendance.findUnique({where:{pegawaiId_tanggal:{pegawaiId:employee.id,tanggal:today}}});
    if(parsed.data.action==="CHECK_IN"&&existing?.checkInAt) return NextResponse.json({message:"Check-in hari ini sudah tercatat."},{status:409});
    
    const blockedStatuses: AttendanceStatus[] = [
      AttendanceStatus.CUTI,
      AttendanceStatus.IZIN,
      AttendanceStatus.LIBUR,
      AttendanceStatus.DINAS,
      AttendanceStatus.ALPHA,
    ];

    if (
      parsed.data.action === "CHECK_IN" &&
      existing &&
      blockedStatuses.includes(existing.status)
    ) {
      return NextResponse.json(
        {
          message:
            "Absensi tidak dapat dimulai karena hari ini sudah tercatat sebagai cuti, izin, atau libur.",
        },
        { status: 409 }
      );
    }

    if(parsed.data.action==="CHECK_OUT"&&(!existing?.checkInAt||existing.checkOutAt)) return NextResponse.json({message:"Check-out tidak valid. Pastikan check-in sudah tercatat dan belum check-out."},{status:409});
    const ip=getClientIp(req);
    const ipValid=!!ip&&client.officeIps.some(x=>x.ipAddress===ip);
    const rule=setting.attendanceNetworkRule;
    if (!Object.values(AttendanceNetworkRule).includes(rule)) {
      console.error("Aturan jaringan absensi tidak valid untuk client", client.id);
      return NextResponse.json({message:"Konfigurasi aturan jaringan absensi tidak valid. Hubungi admin."},{status:503});
    }
    const needsGps=rule===AttendanceNetworkRule.GPS||rule===AttendanceNetworkRule.GPS_DAN_IP;
    const needsIp=rule===AttendanceNetworkRule.IP||rule===AttendanceNetworkRule.GPS_DAN_IP;
    async function validateLocation() {
    const office =
      (await db.officeLocation.findFirst({
        where: {
          clientId: clientId!,
          projectId: activeEmployee.projectId,
          isActive: true,
        },
      })) ??
      (await db.officeLocation.findFirst({
        where: {
          clientId: clientId!,
          projectId: null,
          isActive: true,
        },
      }));

    if (!office) {
      throw new Error("Titik kantor belum dikonfigurasi oleh admin.");
    }

    const result = validateGpsAttendance({
      employeeLocation: {
        latitude: attendanceData.lat,
        longitude: attendanceData.lng,
      },
      officeLocation: {
        latitude: Number(office.lat),
        longitude: Number(office.lng),
      },
      accuracyMeters: attendanceData.accuracyM,
      maxRadiusMeters: Math.min(
        office.radiusM,
        setting.gpsRadiusMeters
      ),
      maxAccuracyToleranceMeters: setting.maxGpsAccuracyMeters,
    });

    if (!result.isValid) {
      throw new Error(
        `Absensi ditolak: ${
          result.suspiciousFlags || "lokasi di luar ketentuan"
        }.`
      );
    }

    return true;
  }
    if (needsIp && !ipValid) return NextResponse.json({message:"IP jaringan ini tidak terdaftar sebagai jaringan kantor."},{status:403});
    let unverifiedIpFallback=false;
    if(rule===AttendanceNetworkRule.GPS_ATAU_IP){
      let gpsOk=false; try{gpsOk=await validateLocation();}catch{gpsOk=false;}
      if(!gpsOk&&!ipValid) return NextResponse.json({message:"Absensi ditolak: lokasi GPS dan IP kantor tidak memenuhi aturan."},{status:403});
      unverifiedIpFallback=!gpsOk&&ipValid;
    } else if(needsGps) { try{await validateLocation();}catch(e){return NextResponse.json({message:e instanceof Error?e.message:"Validasi lokasi gagal."},{status:403});} }
    let selfiePath:string|null=null;
    if(setting.requireSelfie){
      const selfie=form.get("selfie");
      if(!(selfie instanceof File)) return NextResponse.json({message:"Selfie langsung dari kamera wajib disertakan."},{status:400});
      if(selfie.size<16||selfie.size>MAX_IMAGE_BYTES) return NextResponse.json({message:"Ukuran selfie maksimal 2 MB."},{status:413});
      const bytes=Buffer.from(await selfie.arrayBuffer());
      // Validasi magic bytes JPEG/PNG; output selalu dinormalisasi ke JPEG.
      const isJpeg=bytes.length>3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
      const isPng=bytes.length>8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
      if(!isJpeg&&!isPng) return NextResponse.json({message:"Format foto tidak valid. Gunakan hasil tangkapan kamera JPEG/PNG."},{status:415});
      const now=new Date(); const stamp=now.toLocaleString("id-ID",{timeZone:"Asia/Jakarta",dateStyle:"medium",timeStyle:"medium"});
      const base=await sharp(bytes,{limitInputPixels:20_000_000}).rotate().resize({width:1280,height:1280,fit:"inside",withoutEnlargement:true}).toBuffer();
      const dimensions=await sharp(base).metadata();
      const imageWidth=dimensions.width??720;
      const imageHeight=dimensions.height??1280;
      const overlayHeight=Math.min(120,imageHeight);
      const escapeXml=(value:string)=>value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&apos;");
      const watermark=`<svg width="${imageWidth}" height="${overlayHeight}" viewBox="0 0 ${imageWidth} ${overlayHeight}"><rect width="100%" height="100%" fill="#06111f" fill-opacity="0.78"/><text x="${Math.max(8,imageWidth*0.025)}" y="${Math.max(25,overlayHeight*0.35)}" fill="#ffffff" font-size="${Math.min(25,imageWidth*0.035)}">${escapeXml(employee.nama)}</text><text x="${Math.max(8,imageWidth*0.025)}" y="${Math.max(52,overlayHeight*0.75)}" fill="#2ed3c0" font-size="${Math.min(21,imageWidth*0.029)}">${escapeXml(`${stamp} WIB | ${parsed.data.lat.toFixed(6)}, ${parsed.data.lng.toFixed(6)}`)}</text></svg>`;
      const output=await sharp(base).composite([{input:Buffer.from(watermark),left:0,top:Math.max(0,imageHeight-overlayHeight)}]).jpeg({quality:78,mozjpeg:true}).toBuffer();
      const dir=process.env.UPLOAD_DIR;
      if(!dir||!path.isAbsolute(dir)) return NextResponse.json({message:"UPLOAD_DIR wajib berupa path absolut di luar public/."},{status:503});
      await mkdir(dir,{recursive:true,mode:0o750}); selfiePath=path.join(dir,`${randomUUID()}.jpg`); await writeFile(selfiePath,output,{mode:0o640,flag:"wx"}); selfiePathForCleanup=selfiePath;
    }
    const now=new Date();
    const time=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Jakarta",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(now);
    const lateMinutes=Math.max(0,(Number(time.slice(0,2))*60+Number(time.slice(3))-Number(setting.workStart.slice(0,2))*60-Number(setting.workStart.slice(3))-setting.lateToleranceMinutes));
    const status:AttendanceStatus=parsed.data.action==="CHECK_IN"&&lateMinutes>0?"TELAT":"HADIR";
    const result=await db.$transaction(async tx=>{
      if(parsed.data.action==="CHECK_IN") {
        // A valid GPS/IP check does not constitute attendance approval:
        // only an authorized, completed review can populate validatedAt.
        const data={
          clientId:client.id,projectId:employee.projectId,pegawaiId:employee.id,
          tanggal:today,checkInAt:now,status,selfiePath,
          lat:new Prisma.Decimal(parsed.data.lat),lng:new Prisma.Decimal(parsed.data.lng),
          accuracyM:new Prisma.Decimal(parsed.data.accuracyM),ip,
          suspiciousFlags:unverifiedIpFallback?["GPS_UNVERIFIED_IP_FALLBACK"]:Prisma.JsonNull,
          validatedAt:null,
        };
        if(existing){
          const changed=await tx.attendance.updateMany({
            where:{id:existing.id,clientId:client.id,pegawaiId:employee.id,
              checkInAt:null,status:{in:[AttendanceStatus.HADIR,AttendanceStatus.TELAT]}},
            data,
          });
          if(changed.count!==1)throw new Error("Check-in conflict");
          return tx.attendance.findUniqueOrThrow({where:{id:existing.id}});
        }
        return tx.attendance.create({data});
      }
      const changed=await tx.attendance.updateMany({
        where:{id:existing!.id,clientId:client.id,pegawaiId:employee.id,
          checkInAt:{not:null},checkOutAt:null},
        data:{
          checkOutAt:now,
          ...(selfiePath?{selfiePath}:{}),
          ...(unverifiedIpFallback?{suspiciousFlags:["GPS_UNVERIFIED_IP_FALLBACK"]}:{}),
        },
      });
      if(changed.count!==1)throw new Error("Check-out conflict");
      return tx.attendance.findUniqueOrThrow({where:{id:existing!.id}});
    });
    await writeAudit({actor:session,clientId:client.id,action:"CREATE",entity:"Attendance",entityId:result.id,newValue:{action:parsed.data.action,status,ip}}).catch(error=>console.error("Audit log absensi gagal:",error instanceof Error?error.message:"unknown"));
    selfiePathForCleanup=null;
    return NextResponse.json({ok:true,message:parsed.data.action==="CHECK_IN"?"Check-in berhasil dicatat oleh server.":"Check-out berhasil dicatat oleh server.",attendanceId:result.id,serverTime:now.toISOString()},{status:201});
  } catch(error) {
    console.error("Absensi gagal:",error instanceof Error?error.message:"unknown");
    // Bersihkan file bila proses DB/audit gagal setelah selfie dibuat.
    // ENOENT aman diabaikan; file tidak pernah disajikan sebagai public asset.
    if(selfiePathForCleanup) await unlink(selfiePathForCleanup).catch(()=>{});
    return NextResponse.json({message:"Absensi gagal diproses. Periksa data dan coba kembali."},{status:400});
  }
}
