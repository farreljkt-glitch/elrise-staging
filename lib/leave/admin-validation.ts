export function parseCreateLeaveType(value:unknown){
 if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Invalid leave type");
 const input=value as Record<string,unknown>;
 if(Object.keys(input).some(k=>!["name","paid","annualQuota"].includes(k)))
   throw new Error("Unsupported leave type field");
 if(typeof input.name!=="string"||input.name.trim().length<3||input.name.trim().length>100)
   throw new Error("Invalid leave type name");
 if(typeof input.paid!=="boolean")throw new Error("Invalid paid flag");
 if(!Number.isInteger(input.annualQuota)||!(Number(input.annualQuota)>=0&&Number(input.annualQuota)<=365))
   throw new Error("Invalid annual quota");
 return {name:input.name.trim(),paid:input.paid,annualQuota:input.annualQuota as number};
}
export function parseGrantLeaveBalances(value:unknown){
 if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Invalid leave grant");
 const input=value as Record<string,unknown>;
 if(Object.keys(input).some(k=>!["leaveTypeId","year","quota","employeeIds"].includes(k)))
   throw new Error("Unsupported leave grant field");
 if(typeof input.leaveTypeId!=="string"||!input.leaveTypeId.trim()||input.leaveTypeId.length>191)
   throw new Error("Invalid leave type");
 if(!Number.isInteger(input.year)||Number(input.year)<2020||Number(input.year)>2100)
   throw new Error("Invalid balance year");
 if(!Number.isInteger(input.quota)||Number(input.quota)<0||Number(input.quota)>365)
   throw new Error("Invalid balance quota");
 if(!Array.isArray(input.employeeIds)||input.employeeIds.length<1||input.employeeIds.length>100||
    input.employeeIds.some(id=>typeof id!=="string"||!id.trim()||id.length>191)||
    new Set(input.employeeIds).size!==input.employeeIds.length)
   throw new Error("Invalid employee selection");
 return {leaveTypeId:input.leaveTypeId.trim(),year:input.year as number,
  quota:input.quota as number,employeeIds:input.employeeIds as string[]};
}
