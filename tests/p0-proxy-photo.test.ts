import { describe,it,expect } from "vitest";
import { getVerifiedClientIp } from "../lib/auth/verified-proxy-ip";
import { canReadAttendanceSelfie } from "../lib/attendance/selfie-scope";
const secret="synthetic-secret-at-least-32-byte-abcdef";
describe("P0 trusted proxy evidence",()=>{
 it("rejects spoofed X-Real-IP without trusted reverse proxy credential",()=>{
   expect(getVerifiedClientIp(new Headers({"x-real-ip":"203.0.113.7"}),secret)).toBeNull();
   expect(getVerifiedClientIp(new Headers({"x-real-ip":"203.0.113.7","x-elrise-proxy-secret":"invalid"}),secret)).toBeNull();
 });
 it("accepts only authenticated valid IPv4 or IPv6",()=>{
   expect(getVerifiedClientIp(new Headers({"x-real-ip":"203.0.113.7","x-elrise-proxy-secret":secret}),secret)).toBe("203.0.113.7");
   expect(getVerifiedClientIp(new Headers({"x-real-ip":"2001:db8::1","x-elrise-proxy-secret":secret}),secret)).toBe("2001:db8::1");
   expect(getVerifiedClientIp(new Headers({"x-real-ip":"203.0.113.7, 8.8.8.8","x-elrise-proxy-secret":secret}),secret)).toBeNull();
   expect(getVerifiedClientIp(new Headers({"x-real-ip":"203.0.113.7","x-elrise-proxy-secret":secret}),"too-short")).toBeNull();
 });
});
describe("P0 private selfie project isolation",()=>{
 const a={clientId:"a",projectId:"a-p1",pegawaiId:"a-user"};
 it("permits only assigned Admin Project",()=>{
   expect(canReadAttendanceSelfie({role:"ADMIN_PROJECT",clientId:"a",pegawaiId:null,managedProjectId:"a-p1"},a)).toBe(true);
   expect(canReadAttendanceSelfie({role:"ADMIN_PROJECT",clientId:"a",pegawaiId:null,managedProjectId:"a-p2"},a)).toBe(false);
   expect(canReadAttendanceSelfie({role:"ADMIN_PROJECT",clientId:"b",pegawaiId:null,managedProjectId:"a-p1"},a)).toBe(false);
   expect(canReadAttendanceSelfie({role:"ADMIN_PROJECT",clientId:"a",pegawaiId:null,managedProjectId:null},a)).toBe(false);
 });
 it("permits same-tenant Admin PT, owner employee and Superadmin only",()=>{
   expect(canReadAttendanceSelfie({role:"ADMIN",clientId:"a",pegawaiId:null},a)).toBe(true);
   expect(canReadAttendanceSelfie({role:"PEGAWAI",clientId:"a",pegawaiId:"a-user"},a)).toBe(true);
   expect(canReadAttendanceSelfie({role:"PEGAWAI",clientId:"a",pegawaiId:"other"},a)).toBe(false);
   expect(canReadAttendanceSelfie({role:"SUPERADMIN",clientId:null,pegawaiId:null},a)).toBe(true);
   expect(canReadAttendanceSelfie({role:"UNKNOWN",clientId:"a",pegawaiId:null},a)).toBe(false);
 });
});
