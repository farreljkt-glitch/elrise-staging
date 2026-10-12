/** Pure allowlist validation. Avoid mass-assigning client or project DB fields. */
export function parseNewClient(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid client");
  const obj = input as Record<string, unknown>;
  if (Object.keys(obj).some(key => !["code","name"].includes(key))) throw new Error("Unsupported client field");
  if (typeof obj.code !== "string" || !/^[A-Za-z0-9_-]{2,40}$/.test(obj.code.trim()))
    throw new Error("Invalid client code");
  if (typeof obj.name !== "string" || obj.name.trim().length < 2 || obj.name.trim().length > 180)
    throw new Error("Invalid client name");
  return { code:obj.code.trim().toUpperCase(), name:obj.name.trim() };
}
export function parseNewProject(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid project");
  const obj = input as Record<string, unknown>;
  if (Object.keys(obj).some(key=>!["clientId","code","name"].includes(key))) throw new Error("Unsupported project field");
  if (typeof obj.clientId !== "string" || !obj.clientId.trim() || obj.clientId.length > 191)
    throw new Error("Invalid tenant");
  if (typeof obj.code !== "string" || !/^[A-Za-z0-9_-]{2,50}$/.test(obj.code.trim()))
    throw new Error("Invalid project code");
  if (typeof obj.name !== "string" || obj.name.trim().length < 2 || obj.name.trim().length > 180)
    throw new Error("Invalid project name");
  return { clientId:obj.clientId.trim(), code:obj.code.trim().toUpperCase(), name:obj.name.trim() };
}
