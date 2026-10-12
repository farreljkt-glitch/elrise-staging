import { describe, expect, it, vi } from "vitest";
import { enqueuePaidKasbonSettlement, type PaidKasbonEvent } from "../lib/integration/settlement-outbox";
import type { Prisma } from "@prisma/client";

const event: PaidKasbonEvent = {
  eventId: "paid-1", clientId: "tenant-a", externalTenantId: "gajiku-a",
  externalEmployeeId: "employee-1", gajikuTxId: "tx-1", payrollItemId: "item-1",
  amount: "125000", paidAt: "2026-10-12T10:00:00.000Z", paymentProofReference: "proof-1",
};

function fakeTx() {
  const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => data);
  const tx = { integrationSettlementOutbox: { create } } as unknown as Prisma.TransactionClient;
  return { tx, create };
}

describe("Q10 settlement outbox enqueue", () => {
  it("writes a PENDING event with bigint amount and stable SHA256 payload hash", async () => {
    const { tx, create } = fakeTx();
    await enqueuePaidKasbonSettlement(tx, event);
    expect(create).toHaveBeenCalledTimes(1);
    const data = create.mock.calls[0][0].data;
    expect(data.status).toBe("PENDING");
    expect(data.amount).toBe(125000n);
    expect(data.payloadHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it.each([
    { eventId: "" }, { clientId: " " }, { externalTenantId: "" },
    { externalEmployeeId: "" }, { gajikuTxId: "" }, { payrollItemId: "" },
    { amount: "0" }, { amount: "-1" }, { amount: "1.5" },
    { paidAt: "invalid" }, { paymentProofReference: " " },
  ])("rejects invalid settlement payload before DB writes: %j", async patch => {
    const { tx, create } = fakeTx();
    await expect(enqueuePaidKasbonSettlement(tx, { ...event, ...patch })).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });

  it("does not swallow unique-key database errors for repeated event or transaction", async () => {
    const create = vi.fn().mockRejectedValue(new Error("Unique constraint failed"));
    const tx = { integrationSettlementOutbox: { create } } as unknown as Prisma.TransactionClient;
    await expect(enqueuePaidKasbonSettlement(tx, event)).rejects.toThrow(/Unique constraint/);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
