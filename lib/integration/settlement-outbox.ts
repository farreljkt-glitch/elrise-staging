/** Phase H: outbox writer to be invoked ONLY inside the same Prisma transaction
 * that authorizes and persists PayrollPeriod.status = PAID.
 * Not wired to the payment route until finance approval semantics are audited.
 */
import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";

export type PaidKasbonEvent = {
  eventId: string; clientId: string; externalTenantId: string;
  externalEmployeeId: string; gajikuTxId: string;
  payrollItemId: string; amount: string; paidAt: string;
  paymentProofReference: string;
};

export async function enqueuePaidKasbonSettlement(
  tx: Prisma.TransactionClient, event: PaidKasbonEvent
) {
  if (!event.paymentProofReference || !/^\d+$/.test(event.amount) || BigInt(event.amount) <= 0n) {
    throw new Error("Invalid payment proof or settlement amount");
  }
  const payload = JSON.stringify(event);
  const payloadHash = createHash("sha256").update(payload).digest("hex");
  return tx.integrationSettlementOutbox.create({
    data: {
      clientId: event.clientId, eventId: event.eventId,
      externalTenantId: event.externalTenantId,
      externalEmployeeId: event.externalEmployeeId,
      gajikuTxId: event.gajikuTxId,
      payrollItemId: event.payrollItemId,
      amount: BigInt(event.amount), payload: JSON.parse(payload),
      payloadHash, status: "PENDING",
    },
  });
}
