import { describe, it, expect } from "vitest";
import { parseEmployeeEdit } from "../lib/employees/edit-validation";
describe("Employee edit whitelist",()=>{
  it("accepts bounded changes",()=>expect(parseEmployeeEdit({
    name:" Nama Contoh ",position:"Manager",projectId:"project-a",baseSalaryIdr:"5000000",active:false,
  })).toEqual({name:"Nama Contoh",position:"Manager",projectId:"project-a",baseSalaryIdr:"5000000",active:false}));
  it.each([{email:"hacker@invalid.test"},{clientId:"other"},{idPegawai:"B"},{gajiPokok:1000},{baseSalaryIdr:"-1"},{baseSalaryIdr:1000},{active:"false"},{}])("rejects mass assignment/invalid values",x=>expect(()=>parseEmployeeEdit(x)).toThrow());
});
