import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-server';
import { commitEmployeeCsv } from '@/lib/integration/employee-import-commit';
import { verifyImportTicket } from '@/lib/integration/employee-import-ticket';

/** POST text/csv with a server-signed approval ticket for the identical bytes. */
export async function POST(request: Request) {
  let actor;
  try { actor = await requireUser(['ADMIN']); }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); }
  if (!actor.clientId) return NextResponse.json({ error: 'Missing tenant' }, { status: 403 });
  if (!(request.headers.get('content-type') || '').includes('text/csv'))
    return NextResponse.json({ error: 'Expected text/csv' }, { status: 415 });
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 1024 * 1024) return NextResponse.json({ error: 'CSV too large' }, { status: 413 });
  try {
    const csv = await request.text();
    if (Buffer.byteLength(csv, 'utf8') > 1024 * 1024)
      return NextResponse.json({ error: 'CSV too large' }, { status: 413 });
    const ticket = request.headers.get('x-import-approval') || '';
    if (!verifyImportTicket(ticket, csv, actor.id, actor.clientId))
      return NextResponse.json({error:'Preview ulang diperlukan sebelum menyimpan CSV'},{status:409});
    const result = await commitEmployeeCsv(actor.clientId, csv, request.headers.get('x-import-sha256') || '');
    return NextResponse.json({ mode: 'COMMITTED_EMPLOYEES_ONLY', ...result }, { status: 201 });
  } catch (error) {
    // Do not reveal which employee/email exists across tenants.
    const message = error instanceof Error ? error.message : 'Import failed';
    return NextResponse.json({ error: /registered|Unique constraint|Transaction failed/i.test(message) ? 'Import conflict; refresh preview' : message }, { status: 400 });
  }
}
