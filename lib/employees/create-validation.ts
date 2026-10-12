/** Strict server-side validation for Admin PT employee creation. */
export type EmployeeCreateInput = {
  employeeCode: string; name: string; email: string; projectId: string; baseSalaryIdr: string;
};

export function parseEmployeeCreate(value: unknown): EmployeeCreateInput {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid employee payload");
  const raw = value as Record<string, unknown>;
  const get = (key: string) => {
    if (typeof raw[key] !== "string") throw new Error("Invalid " + key);
    return (raw[key] as string).trim();
  };
  const employeeCode = get("employeeCode");
  const name = get("name");
  const email = get("email").toLowerCase();
  const projectId = get("projectId");
  const baseSalaryIdr = get("baseSalaryIdr");
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(employeeCode)) throw new Error("Invalid employee code");
  if (name.length < 2 || name.length > 180) throw new Error("Invalid employee name");
  if (email.length > 191 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid employee email");
  if (!projectId || projectId.length > 191) throw new Error("Invalid project");
  if (!/^(0|[1-9]\d{0,14})$/.test(baseSalaryIdr)) throw new Error("Invalid base salary");
  return { employeeCode, name, email, projectId, baseSalaryIdr };
}
