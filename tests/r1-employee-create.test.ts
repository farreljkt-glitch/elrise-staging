import { describe, expect, it } from "vitest";
import { parseEmployeeCreate } from "../lib/employees/create-validation";

const valid = {
  employeeCode: "EMP-001", name: "Pegawai Contoh", email: "  TEST@EXAMPLE.COM ",
  projectId: "project-a", baseSalaryIdr: "5000000",
};

describe("Phase R employee create validation", () => {
  it("normalizes email and preserves integer rupiah as string", () => {
    expect(parseEmployeeCreate(valid)).toEqual({ ...valid, email: "test@example.com" });
  });
  it.each([
    { employeeCode: "../bad" }, { employeeCode: "" },
    { name: "A" }, { email: "bad-email" },
    { projectId: "" }, { baseSalaryIdr: "-100" },
    { baseSalaryIdr: "10.5" }, { baseSalaryIdr: "9999999999999999" },
  ])("rejects invalid input %j", patch => {
    expect(() => parseEmployeeCreate({ ...valid, ...patch })).toThrow();
  });
  it("rejects malformed request bodies", () => {
    expect(() => parseEmployeeCreate(null)).toThrow();
    expect(() => parseEmployeeCreate([])).toThrow();
  });
});
