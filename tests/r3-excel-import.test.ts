import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { excelEmployeeToCsv } from "../lib/integration/employee-excel";
async function workbookWith(row: (string | number)[]) {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Pegawai");
  sheet.addRow(["employee_code","name","email","project_id","base_salary_idr"]);
  sheet.addRow(row);
  return Buffer.from(await wb.xlsx.writeBuffer());
}
describe("Excel import conversion",()=>{
  it("produces CSV suitable for signed preview flow",async()=>{
    const csv=await excelEmployeeToCsv(await workbookWith(["EMP-01","Pegawai Contoh","contoh@example.test","project-a",5000000]));
    expect(csv).toContain('"EMP-01","Pegawai Contoh","contoh@example.test","project-a","5000000"');
  });
  it("rejects formula-like content",async()=>{
    await expect(excelEmployeeToCsv(await workbookWith(["EMP-02","=1+1","b@example.test","project-a",5000000])))
      .rejects.toThrow(/formula/);
  });
  it("rejects empty or invalid zip payloads",async()=>{
    await expect(excelEmployeeToCsv(Buffer.from("invalid"))).rejects.toThrow();
  });
});
