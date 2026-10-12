import {describe,it,expect} from "vitest";
import {parseEmployeeSearch} from "../lib/employees/search-validation";
describe("employee pagination contract",()=>{
 it("uses safe defaults",()=>expect(parseEmployeeSearch("https://example.test/api/admin/employees")).toEqual({page:1,q:"",pageSize:50}));
 it("parses bounded search",()=>expect(parseEmployeeSearch("https://example.test/api/admin/employees?page=3&q=contoh").page).toBe(3));
 it.each(["page=0","page=-2","page=1.5","page=9999999","q="+ "x".repeat(81)])("rejects invalid search",arg=>{
   expect(()=>parseEmployeeSearch("https://example.test/api/admin/employees?"+arg)).toThrow();
 });
});
