import 'server-only';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { parseEmployeeCsv } from '@/lib/integration/employee-import-preview';

export const employeeImportDigest = (csv: string) => createHash('sha256').update(csv, 'utf8').digest('hex');

/** Import employee records only. Never creates login credentials or Gajiku identities. */
export async function commitEmployeeCsv(clientId: string, csv: string, expectedSha256: string) {
  if (!/^[a-f0-9]{64}$/.test(expectedSha256) || employeeImportDigest(csv) !== expectedSha256)
    throw new Error('CSV does not match approved preview');
  const rows = parseEmployeeCsv(csv);
  if (!rows.length || rows.some(row => row.errors.length)) throw new Error('Invalid CSV rows');
  return db.$transaction(async tx => {
    const client = await tx.client.findUnique({ where: { id: clientId }, select: { status: true } });
    if (client?.status !== 'AKTIF') throw new Error('Inactive tenant');
    const projects = await tx.project.findMany({
      where: { clientId, isActive: true, id: { in: [...new Set(rows.map(row => row.projectId))] } },
      select: { id: true }
    });
    if (projects.length !== new Set(rows.map(row => row.projectId)).size)
      throw new Error('Project missing, inactive or outside tenant');
    const codes = rows.map(row => row.employeeCode);
    const emails = rows.map(row => row.email);
    const [existingEmployees, existingUsers] = await Promise.all([
      tx.pegawai.findMany({
        where: { clientId, OR: [{ idPegawai: { in: codes } }, { email: { in: emails } }] },
        select: { id: true }
      }),
      tx.user.findMany({ where: { email: { in: emails } }, select: { id: true } })
    ]);
    if (existingEmployees.length || existingUsers.length)
      throw new Error('Employee code or email already registered');
    const result = await tx.pegawai.createMany({
      data: rows.map(row => ({
        idPegawai: row.employeeCode, clientId, projectId: row.projectId,
        nama: row.name, email: row.email, gajiPokok: BigInt(row.baseSalaryIdr)
      }))
    });
    return { imported: result.count, accountStatus: 'NOT_PROVISIONED' as const };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
}
