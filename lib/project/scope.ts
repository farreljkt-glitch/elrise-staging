export type ProjectActor={role:string;clientId:string|null;managedProjectId:string|null};
export function assertProjectActor(actor:ProjectActor|null):{clientId:string;projectId:string}{
  if (!actor || actor.role !== "ADMIN_PROJECT" || !actor.clientId || !actor.managedProjectId)
    throw new Error("Admin Project authorization required");
  return {clientId:actor.clientId,projectId:actor.managedProjectId};
}
export function assertProjectResource(scope:{clientId:string;projectId:string},resource:{clientId:string;projectId:string}){
  if(scope.clientId!==resource.clientId || scope.projectId!==resource.projectId)
    throw new Error("Cross-project access denied");
}
