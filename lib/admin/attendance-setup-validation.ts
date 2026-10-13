/** Minimum Admin PT-owned GPS office setup for a brand-new tenant's demo flow.
 * No automatic enabling on tenant creation and no client-supplied clientId.
 */
export function parseAdminPtOffice(value:unknown){
  if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Invalid office");
  const raw=value as Record<string,unknown>;
  if(Object.keys(raw).some(k=>!["projectId","name","lat","lng","radiusM"].includes(k)))
    throw new Error("Unsupported office field");
  const projectId=typeof raw.projectId==="string"?raw.projectId.trim():"";
  const name=typeof raw.name==="string"?raw.name.trim():"";
  if(!projectId||projectId.length>191)throw new Error("Invalid project");
  if(name.length<2||name.length>120)throw new Error("Invalid office name");
  if(typeof raw.lat!=="number"||!Number.isFinite(raw.lat)||raw.lat< -90||raw.lat>90)
    throw new Error("Invalid latitude");
  if(typeof raw.lng!=="number"||!Number.isFinite(raw.lng)||raw.lng< -180||raw.lng>180)
    throw new Error("Invalid longitude");
  if(!Number.isInteger(raw.radiusM)||(raw.radiusM as number)<20||(raw.radiusM as number)>1000)
    throw new Error("Invalid radius");
  return {projectId,name,lat:raw.lat,lng:raw.lng,radiusM:raw.radiusM as number};
}
