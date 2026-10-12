import ExcelJS from "exceljs";

const HEADERS = ["employee_code","name","email","project_id","base_salary_idr"];
const MAX_ROWS = 500;
function textCell(value: ExcelJS.CellValue, row: number, column: number): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0)
    return String(value);
  throw new Error(`Cell ${row}:${column} harus teks atau angka bulat; formula/date tidak didukung`);
}
function csvCell(value: string): string {
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(value)) throw new Error("Karakter kontrol CSV tidak diizinkan");
  return '"' + value.replace(/"/g,'""') + '"';
}
/** Converts a synthetic/HR-approved XLSX only. Then call normal CSV preview and signed commit. */
export async function excelEmployeeToCsv(bytes: Buffer): Promise<string> {
  if (bytes.length < 30 || bytes.length > 1024 * 1024) throw new Error("XLSX melebihi 1 MB atau kosong");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Spreadsheet kosong");
  if (sheet.actualRowCount < 2 || sheet.actualRowCount > MAX_ROWS + 1)
    throw new Error("Excel harus memuat 1–500 pegawai");
  for (let col = 1; col <= HEADERS.length; col++)
    if (textCell(sheet.getRow(1).getCell(col).value,1,col) !== HEADERS[col-1])
      throw new Error("Header Excel tidak cocok dengan template CSV");
  if (sheet.getRow(1).actualCellCount !== HEADERS.length)
    throw new Error("Header Excel memiliki kolom tambahan");
  const lines = [HEADERS.join(",")];
  for (let row = 2; row <= sheet.rowCount; row++) {
    const current = sheet.getRow(row);
    if (!current.hasValues) continue;
    if (current.actualCellCount > HEADERS.length) throw new Error("Kolom Excel tambahan tidak didukung");
    const cells = HEADERS.map((_,col)=>textCell(current.getCell(col+1).value,row,col+1));
    if (cells.some((value,col)=>col!==4 && /^[=+@-]/.test(value)))
      throw new Error("Nilai Excel menyerupai formula CSV; bersihkan terlebih dahulu");
    lines.push(cells.map(csvCell).join(","));
    if (lines.length - 1 > MAX_ROWS) throw new Error("Maksimal 500 pegawai");
  }
  if (lines.length === 1) throw new Error("Tidak ada pegawai");
  return lines.join("\n") + "\n";
}
