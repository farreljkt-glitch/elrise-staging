import { parseNewProject } from "../superadmin/validation";
import { parseInviteAdmin } from "../superadmin/admin-invitation-validation";

/** Never accept clientId, role, passwordHash or activation fields from Admin PT. */
export function parseAdminPtProject(body:unknown,clientId:string){
  if(!body||typeof body!=="object"||Array.isArray(body))throw new Error("Invalid project");
  const raw=body as Record<string,unknown>;
  if(Object.keys(raw).some(key=>!["code","name"].includes(key)))throw new Error("Unsupported project field");
  return parseNewProject({clientId,code:raw.code,name:raw.name});
}
export function parseAdminPtProjectInvite(body:unknown,clientId:string){
  if(!body||typeof body!=="object"||Array.isArray(body))throw new Error("Invalid invite");
  const raw=body as Record<string,unknown>;
  if(Object.keys(raw).some(key=>!["projectId","name","email"].includes(key)))
    throw new Error("Unsupported invite field");
  return parseInviteAdmin({clientId,role:"ADMIN_PROJECT",projectId:raw.projectId,
    name:raw.name,email:raw.email});
}
