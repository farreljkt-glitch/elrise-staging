import "server-only";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { InviteAdminInput } from "@/lib/superadmin/admin-invitation-validation";

export const hashAdminInvite=(token:string)=>createHash("sha256").update(token).digest("hex");

export async function issueAdminInvitation(actorId:string,input:InviteAdminInput){
  const token=randomBytes(32).toString("base64url");
  const tokenHash=hashAdminInvite(token);
  const placeholderPasswordHash=await bcrypt.hash(randomBytes(32).toString("hex"),12);
  const expiresAt=new Date(Date.now()+24*60*60*1000);
  const result=await db.$transaction(async tx=>{
    const client=await tx.client.findUnique({where:{id:input.clientId},select:{status:true}});
    if(client?.status!=="AKTIF") throw new Error("Tenant inactive");
    if(input.role==="ADMIN_PROJECT"){
      const project=await tx.project.findFirst({
        where:{id:input.projectId!,clientId:input.clientId,isActive:true},select:{id:true},
      });
      if(!project)throw new Error("Foreign or inactive project");
    }
    const existing=await tx.user.findUnique({where:{email:input.email},select:{id:true}});
    if(existing)throw new Error("Account email already used");
    const user=await tx.user.create({data:{
      email:input.email,name:input.name,passwordHash:placeholderPasswordHash,
      role:input.role,clientId:input.clientId,managedProjectId:input.projectId,
      isActive:false,mustChangePassword:true,
    },select:{id:true,email:true}});
    await tx.adminInvitation.create({data:{
      userId:user.id,clientId:input.clientId,tokenHash,expiresAt,
    }});
    await tx.auditLog.create({data:{
      actorId,clientId:input.clientId,action:"CREATE",entity:"AdminInvitation",
      entityId:user.id,newValue:{role:input.role,projectId:input.projectId},
    }});
    return {email:user.email,expiresAt};
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  return {...result,token};
}

export async function acceptAdminInvitation(token:string,password:string){
  if(!/^[A-Za-z0-9_-]{40,80}$/.test(token))throw new Error("Invalid invitation token");
  if(password.length<12 || password.length>200)throw new Error("Invalid password length");
  const passwordHash=await bcrypt.hash(password,12);
  const now=new Date();
  await db.$transaction(async tx=>{
    const invitation=await tx.adminInvitation.findUnique({where:{tokenHash:hashAdminInvite(token)}});
    if(!invitation || invitation.usedAt || invitation.expiresAt<=now)
      throw new Error("Invalid, used or expired invitation");
    const consumed=await tx.adminInvitation.updateMany({
      where:{id:invitation.id,usedAt:null,expiresAt:{gt:now}},data:{usedAt:now},
    });
    if(consumed.count!==1)throw new Error("Invitation already consumed");
    const user=await tx.user.findUnique({
      where:{id:invitation.userId},
      include:{client:true,managedProject:true},
    });
    if(!user || user.clientId!==invitation.clientId || user.client?.status!=="AKTIF" ||
       user.isActive || !user.mustChangePassword ||
       (user.role!=="ADMIN" && user.role!=="ADMIN_PROJECT"))
       throw new Error("Admin invitation identity mismatch");
    if(user.role==="ADMIN_PROJECT" && (!user.managedProject ||
       user.managedProject.clientId!==user.clientId || !user.managedProject.isActive))
       throw new Error("Invalid assigned project");
    if(user.role==="ADMIN" && user.managedProjectId!==null)
       throw new Error("Invalid Admin PT scope");
    await tx.user.update({where:{id:user.id},data:{
      passwordHash,isActive:true,mustChangePassword:false,
      tokenVersion:{increment:1},failedLoginCount:0,lockedUntil:null,
    }});
    await tx.auditLog.create({data:{
      clientId:invitation.clientId,actorId:user.id,
      action:"UPDATE",entity:"User",entityId:user.id,newValue:{activatedViaAdminInvitation:true},
    }});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  return {activated:true};
}
