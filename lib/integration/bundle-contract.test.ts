import { describe, expect, it } from "vitest";
import { assertBundleContract, type BundleContract } from "./bundle-contract";

const valid: BundleContract = {
  clientId: "tenant-A", employeeClientId: "tenant-A", connectionClientId: "tenant-A",
  payrollOwner: "ELRISE", connectionState: "ACTIVE",
  employeeActive: true, mappingVerified: true, connectionVerified: true,
  externalTenantId: "gajiku-A", mappedExternalTenantId: "gajiku-A",
  transactionExternalTenantId: "gajiku-A",
  externalEmployeeId: "employee-1", transactionExternalEmployeeId: "employee-1",
};

describe("bundle identity contract", () => {
  it("accepts a verified, active, tenant-scoped connection", () => {
    expect(() => assertBundleContract(valid)).not.toThrow();
  });

  it.each(["employeeClientId", "connectionClientId"] as const)(
    "denies cross-tenant %s", (key) => {
      expect(() => assertBundleContract({ ...valid, [key]: "tenant-B" })).toThrow();
    },
  );

  it.each(["mappedExternalTenantId", "transactionExternalTenantId"] as const)(
    "rejects mismatched external tenant in %s", (key) => {
      expect(() => assertBundleContract({ ...valid, [key]: "gajiku-B" })).toThrow();
    },
  );

  it("rejects a transaction for another employee even if email would match", () => {
    expect(() => assertBundleContract({
      ...valid, transactionExternalEmployeeId: "employee-2",
    })).toThrow();
  });

  it("rejects disabled connections and non-Elrise payroll ownership", () => {
    expect(() => assertBundleContract({ ...valid, connectionState: "DISABLED" })).toThrow();
    expect(() => assertBundleContract({ ...valid, payrollOwner: "GAJIKU" })).toThrow();
  });

  it.each(["employeeActive", "mappingVerified", "connectionVerified"] as const)(
    "rejects missing verification: %s", (key) => {
      expect(() => assertBundleContract({ ...valid, [key]: false })).toThrow();
    },
  );

  it("rejects blank external identifiers", () => {
    expect(() => assertBundleContract({ ...valid, externalTenantId: "" })).toThrow();
    expect(() => assertBundleContract({ ...valid, externalEmployeeId: "" })).toThrow();
  });
});
