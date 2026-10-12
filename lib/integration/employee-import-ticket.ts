import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Stateless approval ticket: binds previewed bytes to the admin account and tenant.
// Does not replace server-side validation or database uniqueness constraints.
const ttlMs = 10 * 60 * 1000;
function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || Buffer.byteLength(value) < 32) throw new Error("AUTH_SECRET is not configured");
  return value;
}
export function importDigest(csv: string): string {
  return createHash("sha256").update(csv, "utf8").digest("hex");
}
export function createImportTicket(csv: string, actorId: string, clientId: string, now = Date.now()): string {
  const payload = JSON.stringify({ hash: importDigest(csv), actorId, clientId, exp: now + ttlMs });
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = createHmac("sha256", secret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}
export function verifyImportTicket(ticket: string, csv: string, actorId: string, clientId: string, now = Date.now()): boolean {
  if (ticket.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(ticket)) return false;
  const [encoded, signature] = ticket.split(".");
  const expected = createHmac("sha256", secret()).update(encoded).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const value = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return value.actorId === actorId && value.clientId === clientId &&
      value.hash === importDigest(csv) && Number.isSafeInteger(value.exp) &&
      value.exp > now && value.exp <= now + ttlMs;
  } catch { return false; }
}
