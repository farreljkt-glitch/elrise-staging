import {describe,it,expect} from "vitest";
import {calculatePayroll} from "../lib/payroll/calculate";
import {selectUnsettledKasbon,assertKasbonConfigConsistent} from "../lib/payroll/settlement";
import {calculatePayrollPeriodRange,mapWeeklyPeriod,validateMonthlyKasbonWindow} from "../lib/integration/period-mapping";
describe("Payroll rupiah integer",()=>{it("menghitung bruto, tunjangan hadir, potongan dan neto",()=>{expect(calculatePayroll({gajiPokok:3000000n,tunjanganTetap:200000n,tunjanganMakanPerHari:15000n,tunjanganTransportPerHari:10000n,hariHadir:20,kasbon:250000n,hariAlpha:1,potonganAlphaPerHari:100000n})).toEqual({bruto:3700000n,totalPotongan:350000n,neto:3350000n,tunjanganMakan:300000n,tunjanganTransport:200000n,potonganAlpha:100000n});});it("menolak potongan lebih besar daripada bruto",()=>expect(()=>calculatePayroll({gajiPokok:100n,kasbon:200n,hariHadir:0})).toThrow(/melebihi/));it("menolak jumlah hari pecahan",()=>expect(()=>calculatePayroll({gajiPokok:100n,kasbon:0n,hariHadir:1.5})).toThrow(/bilangan bulat/));});
describe("Settlement kasbon",()=>{it("mengabaikan transaksi yang sudah settle",()=>{const rows=[{gajikuTxId:"1",nominal:100n,adminFee:5n,periode:"2026-10"},{gajikuTxId:"2",nominal:200n,adminFee:5n,periode:"2026-10"}];expect(selectUnsettledKasbon(rows,new Set(["1"]),"2026-10","2026-10").map(x=>x.gajikuTxId)).toEqual(["2"]);});it("menolak ID transaksi duplikat",()=>expect(()=>selectUnsettledKasbon([{gajikuTxId:"1",nominal:1n,adminFee:0n,periode:"2026-10"},{gajikuTxId:"1",nominal:2n,adminFee:0n,periode:"2026-10"}],new Set(),"2026-10","2026-10")).toThrow(/duplikat/));});
describe("Pemetaan periode",()=>{it("A dimulai tanggal 1",()=>{const r=calculatePayrollPeriodRange("A",2026,10);expect(r.startDate.toISOString().slice(0,10)).toBe("2026-10-01");expect(r.endDate.toISOString().slice(0,10)).toBe("2026-10-31");expect(r.gajikuPeriodKey).toBe("2026-10");});it("B/C/D berjalan sampai sehari sebelum siklus berikutnya",()=>{const b=calculatePayrollPeriodRange("B",2026,10);const c=calculatePayrollPeriodRange("C",2026,10);const d=calculatePayrollPeriodRange("D",2026,10);expect(b.startDate.toISOString().slice(0,10)).toBe("2026-10-16");expect(b.endDate.toISOString().slice(0,10)).toBe("2026-11-15");expect(c.startDate.toISOString().slice(0,10)).toBe("2026-10-21");expect(c.endDate.toISOString().slice(0,10)).toBe("2026-11-20");expect(d.startDate.toISOString().slice(0,10)).toBe("2026-10-26");expect(d.endDate.toISOString().slice(0,10)).toBe("2026-11-25");});it("mingguan membutuhkan tanggal eksplisit",()=>expect(mapWeeklyPeriod("2026-10-05").gajikuPeriodKey).toBe("W:2026-10-05"));it("menangani Februari tahun kabisat untuk siklus D",()=>{const r=calculatePayrollPeriodRange("D",2028,2);expect(r.startDate.toISOString().slice(0,10)).toBe("2028-02-26");expect(r.endDate.toISOString().slice(0,10)).toBe("2028-03-25");});it("menolak bulan di luar rentang",()=>expect(()=>calculatePayrollPeriodRange("A",2026,13)).toThrow(/tidak valid/));});

describe("Batas go-live kasbon",()=>{
 it("tidak mengambil kasbon historis sebelum start period walau belum ada settlement HRIS",()=>{
  const rows=[{gajikuTxId:"old",nominal:100n,adminFee:0n,periode:"2026-01"},{gajikuTxId:"go-live",nominal:200n,adminFee:10n,periode:"2026-10"},{gajikuTxId:"future",nominal:300n,adminFee:0n,periode:"2026-11"}];
  expect(selectUnsettledKasbon(rows,new Set(),"2026-10","2026-10").map(r=>r.gajikuTxId)).toEqual(["go-live"]);
 });
 it("menolak periode mingguan sampai dukungan cutoff tersedia",()=>expect(()=>validateMonthlyKasbonWindow("2026-01","W:2026-10-05")).toThrow(/mingguan belum didukung/));
 it("mewajibkan start period go-live",()=>expect(()=>validateMonthlyKasbonWindow(null,"2026-10")).toThrow(/kasbonStartPeriod/));
});

describe("Konsistensi konfigurasi kasbon (kasbon milik Gajiku, HRIS hanya membaca)",()=>{
 it("menolak payroll jika modul nonaktif tetapi ada kasbon sukses di periode",()=>expect(()=>assertKasbonConfigConsistent({enabled:false,hasConfiguredSetting:true,successRowsInPeriod:2})).toThrow(/belum diaktifkan/));
 it("mengizinkan modul nonaktif jika tidak ada kasbon sukses",()=>expect(()=>assertKasbonConfigConsistent({enabled:false,hasConfiguredSetting:true,successRowsInPeriod:0})).not.toThrow());
 it("menolak jika ClientSetting belum ada",()=>expect(()=>assertKasbonConfigConsistent({enabled:false,hasConfiguredSetting:false,successRowsInPeriod:0})).toThrow(/Pengaturan klien/));
 it("batas awal dan akhir diterapkan juga oleh selectUnsettledKasbon",()=>{
  const rows=[{gajikuTxId:"a",nominal:1n,adminFee:0n,periode:"2026-09"},{gajikuTxId:"b",nominal:1n,adminFee:0n,periode:"2026-10"},{gajikuTxId:"c",nominal:1n,adminFee:0n,periode:"2026-12"}];
  expect(selectUnsettledKasbon(rows,new Set(["b"]),"2026-10","2026-11").map(r=>r.gajikuTxId)).toEqual([]);
  expect(selectUnsettledKasbon(rows,new Set(),"2026-10","2026-11").map(r=>r.gajikuTxId)).toEqual(["b"]);
 });
});
