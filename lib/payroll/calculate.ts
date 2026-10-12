export type PayrollInput={gajiPokok:bigint;tunjanganTetap?:bigint;tunjanganMakanPerHari?:bigint;tunjanganTransportPerHari?:bigint;hariHadir:number;lembur?:bigint;hariAlpha?:number;potonganAlphaPerHari?:bigint;potonganLain?:bigint;kasbon:bigint};
export type PayrollResult={bruto:bigint;totalPotongan:bigint;neto:bigint;tunjanganMakan:bigint;tunjanganTransport:bigint;potonganAlpha:bigint};
export function calculatePayroll(input:PayrollInput):PayrollResult{
 for(const [key,value] of Object.entries(input)){if(typeof value==="bigint"&&value<0n)throw new Error(`${key} tidak boleh negatif.`);if(typeof value==="number"&&(!Number.isInteger(value)||value<0))throw new Error(`${key} harus bilangan bulat non-negatif.`);}
 const meal=(input.tunjanganMakanPerHari??0n)*BigInt(input.hariHadir), transport=(input.tunjanganTransportPerHari??0n)*BigInt(input.hariHadir);
 const alpha=(input.potonganAlphaPerHari??0n)*BigInt(input.hariAlpha??0);
 const bruto=input.gajiPokok+(input.tunjanganTetap??0n)+meal+transport+(input.lembur??0n);
 const totalPotongan=alpha+(input.potonganLain??0n)+input.kasbon;
 if(totalPotongan>bruto) throw new Error("Total potongan melebihi gaji bruto; perlu pemeriksaan admin.");
 return {bruto,totalPotongan,neto:bruto-totalPotongan,tunjanganMakan:meal,tunjanganTransport:transport,potonganAlpha:alpha};
}
