import "server-only";
import { AuditAction, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requestMetadata, type SessionUser } from "@/lib/auth-server";

function safeJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null || value === undefined) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item)) as Prisma.InputJsonValue;
}
export async function writeAudit(input:{actor:SessionUser|null;clientId?:string|null;action:AuditAction;entity:string;entityId?:string|null;oldValue?:unknown;newValue?:unknown}) {
  const meta=await requestMetadata();
  await db.auditLog.create({data:{actorId:input.actor?.id ?? null,clientId:input.clientId ?? input.actor?.clientId ?? null,action:input.action,entity:input.entity,entityId:input.entityId ?? null,oldValue:safeJson(input.oldValue),newValue:safeJson(input.newValue),ip:meta.ip,userAgent:meta.userAgent}});
}
