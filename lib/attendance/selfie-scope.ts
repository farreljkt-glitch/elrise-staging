type SelfieActor = {
  role:string;clientId:string|null;pegawaiId:string|null;managedProjectId?:string|null;
};
type SelfieAttendance = {clientId:string;projectId:string;pegawaiId:string};
export function canReadAttendanceSelfie(actor:SelfieActor,attendance:SelfieAttendance):boolean{
  if(actor.role==="SUPERADMIN")return true;
  if(!actor.clientId || actor.clientId!==attendance.clientId)return false;
  if(actor.role==="ADMIN")return true;
  if(actor.role==="PEGAWAI")return Boolean(actor.pegawaiId && actor.pegawaiId===attendance.pegawaiId);
  if(actor.role==="ADMIN_PROJECT")
    return Boolean(actor.managedProjectId && actor.managedProjectId===attendance.projectId);
  return false;
}
