export type InviteAdminInput = {
  clientId: string;
  name: string;
  email: string;
  role: "ADMIN" | "ADMIN_PROJECT";
  projectId: string | null;
};
export function parseInviteAdmin(value:unknown):InviteAdminInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid invite");
  const raw=value as Record<string,unknown>;
  if (Object.keys(raw).some(k=>!["clientId","name","email","role","projectId"].includes(k)))
    throw new Error("Unsupported invite field");
  const clientId=typeof raw.clientId==="string"?raw.clientId.trim():"";
  const name=typeof raw.name==="string"?raw.name.trim():"";
  const email=typeof raw.email==="string"?raw.email.trim().toLowerCase():"";
  const role=raw.role;
  const projectId=typeof raw.projectId==="string"?raw.projectId.trim():null;
  if(!clientId || clientId.length>191) throw new Error("Invalid client");
  if(name.length<2 || name.length>180) throw new Error("Invalid name");
  if(email.length>191 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Invalid email");
  if(role!=="ADMIN" && role!=="ADMIN_PROJECT") throw new Error("Invalid role");
  if(role==="ADMIN_PROJECT" && (!projectId || projectId.length>191))
    throw new Error("Project assignment required");
  if(role==="ADMIN" && projectId!==null) throw new Error("Admin PT cannot be project-scoped");
  return {clientId,name,email,role,projectId};
}
