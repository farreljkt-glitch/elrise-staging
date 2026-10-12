/** Employee update deliberately leaves email and globally unique employee code immutable. */
export type EmployeeEdit = { name?: string; position?: string; projectId?: string; baseSalaryIdr?: string; active?: boolean };
export function parseEmployeeEdit(input: unknown): EmployeeEdit {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid employee update");
  const source = input as Record<string, unknown>;
  const allowed = ["name", "position", "projectId", "baseSalaryIdr", "active"];
  if (Object.keys(source).length === 0 || Object.keys(source).some(k => !allowed.includes(k)))
    throw new Error("Unsupported employee field");
  const out: EmployeeEdit = {};
  if ("name" in source) {
    if (typeof source.name !== "string" || source.name.trim().length < 2 || source.name.trim().length > 180)
      throw new Error("Invalid name");
    out.name = source.name.trim();
  }
  if ("position" in source) {
    if (typeof source.position !== "string" || source.position.trim().length > 120)
      throw new Error("Invalid position");
    out.position = source.position.trim();
  }
  if ("projectId" in source) {
    if (typeof source.projectId !== "string" || !source.projectId.trim() || source.projectId.length > 191)
      throw new Error("Invalid project");
    out.projectId = source.projectId.trim();
  }
  if ("baseSalaryIdr" in source) {
    if (typeof source.baseSalaryIdr !== "string" || !/^(0|[1-9]\d{0,14})$/.test(source.baseSalaryIdr))
      throw new Error("Invalid salary");
    out.baseSalaryIdr = source.baseSalaryIdr;
  }
  if ("active" in source) {
    if (typeof source.active !== "boolean") throw new Error("Invalid active");
    out.active = source.active;
  }
  return out;
}
