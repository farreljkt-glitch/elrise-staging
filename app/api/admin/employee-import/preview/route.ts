import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { parseEmployeeCsv } from '@/lib/integration/employee-import-preview';
import { createImportTicket } from '@/lib/integration/employee-import-ticket';

/** POST text/csv: validate tenant-owned employee import, without mutating data. */
export async function POST(request: Request) {
  let actor;
  try { actor=await requireUser(['ADMIN']); }
  catch { return NextResponse.json({error:'Forbidden'}, {status:403}); }
  if(!actor.clientId) return NextResponse.json({error:'Missing tenant'}, {status:403});
  try {
    const contentLength=Number(request.headers.get('content-length')||0);
    if(contentLength>1024*1024) return NextResponse.json({error:'File too large'},{status:413});
    const csv=await request.text();
    const rows=parseEmployeeCsv(csv);
    const projects=await db.project.findMany({where:{clientId:actor.clientId,isActive:true,id:{in:[...new Set(rows.map(r=>r.projectId))]}},select:{id:true}});
    const existing=await db.pegawai.findMany({where:{clientId:actor.clientId,OR:[{idPegawai:{in:rows.map(r=>r.employeeCode)}},{email:{in:rows.map(r=>r.email)}}]},select:{idPegawai:true,email:true,clientId:true}});
    const existingUsers=await db.user.findMany({where:{email:{in:rows.map(r=>r.email)}},select:{email:true}});
    const registeredEmails=new Set(existingUsers.map(u=>u.email.toLowerCase()));
    const projectIds=new Set(projects.map(p=>p.id));
    const codes=new Set(existing.map(p=>p.idPegawai));
    const emails=new Set(existing.filter(p=>p.clientId===actor.clientId).map(p=>p.email.toLowerCase()));
    for(const row of rows){
      if(!projectIds.has(row.projectId)) row.errors.push('Project outside tenant or missing');
      if(codes.has(row.employeeCode)) row.errors.push('Employee code already exists');
      if(emails.has(row.email)||registeredEmails.has(row.email)) row.errors.push('Email already registered');
    }
    return NextResponse.json({mode:'PREVIEW_ONLY',total:rows.length,valid:rows.filter(r=>!r.errors.length).length,rows,approvalTicket: rows.length>0 && rows.every(r=>!r.errors.length) ? createImportTicket(csv,actor.id,actor.clientId) : null}, {headers:{'Cache-Control':'no-store'}});
  } catch(error) {return NextResponse.json({error:error instanceof Error?error.message:'Invalid CSV'}, {status:400});}
}
