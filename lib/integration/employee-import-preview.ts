/** Pure CSV preview: no database writes and no employee accounts created. */
export type ImportRow = { row: number; employeeCode: string; name: string; email: string; projectId: string; baseSalaryIdr: string; errors: string[] };
const HEADERS = ['employee_code','name','email','project_id','base_salary_idr'];
export function parseEmployeeCsv(csv: string): ImportRow[] {
  if (Buffer.byteLength(csv,'utf8') > 1024*1024) throw new Error('CSV exceeds 1 MB');
  const lines: string[][] = []; let cells: string[]=[]; let field=''; let quoted=false;
  csv=csv.replace(/^\uFEFF/,'');
  for (let i=0;i<csv.length;i++) {
    const c=csv[i];
    if (quoted) { if(c==='"' && csv[i+1]==='"'){field+='"';i++;} else if(c==='"') quoted=false; else field+=c; }
    else if(c==='"') {if(field.trim()) throw new Error('Invalid CSV quote'); quoted=true;}
    else if(c===','){cells.push(field);field='';}
    else if(c==='\n'){cells.push(field);lines.push(cells);cells=[];field='';}
    else if(c!=='\r') field+=c;
  }
  if(quoted) throw new Error('Unclosed quote');
  if(cells.length||field){cells.push(field);lines.push(cells);}
  if(!lines.length||lines[0].length!==HEADERS.length||HEADERS.some((h,i)=>lines[0][i]?.trim()!==h)) throw new Error('Invalid CSV headers');
  if(lines.length-1>500) throw new Error('Maximum 500 employees');
  const codes=new Set<string>(), emails=new Set<string>();
  return lines.slice(1).filter(c=>c.some(x=>x.trim())).map((cells,i)=>{
    const [employeeCode='',name='',rawEmail='',projectId='',baseSalaryIdr='']=cells.map(x=>x.trim());
    const email=rawEmail.toLowerCase(), errors:string[]=[];
    if(cells.length!==5) errors.push('Invalid column count');
    if(!/^[a-zA-Z0-9_-]{1,80}$/.test(employeeCode)) errors.push('Invalid employee code');
    if(!name||name.length>180) errors.push('Invalid name');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>191) errors.push('Invalid email');
    if(!projectId||projectId.length>191) errors.push('Invalid project');
    if(!/^(0|[1-9]\d{0,14})$/.test(baseSalaryIdr)) errors.push('Invalid integer salary');
    if(codes.has(employeeCode)) errors.push('Duplicate employee code in file');
    if(emails.has(email)) errors.push('Duplicate email in file');
    codes.add(employeeCode);emails.add(email);
    return {row:i+2,employeeCode,name,email,projectId,baseSalaryIdr,errors};
  });
}
