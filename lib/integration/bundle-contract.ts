/**
 * Fail-closed checks for the Elrise-owned bundled loan contract.
 * No Gajiku table names or credentials are assumed here.
 */
export type BundleContract = {
  clientId: string;
  employeeClientId: string;
  connectionClientId: string;
  payrollOwner: string;
  connectionState: string;
  employeeActive: boolean;
  mappingVerified: boolean;
  connectionVerified: boolean;
  externalTenantId: string;
  mappedExternalTenantId: string;
  externalEmployeeId: string;
  transactionExternalTenantId: string;
  transactionExternalEmployeeId: string;
};

export function assertBundleContract(input: BundleContract): void {
  if (!input.clientId || !input.externalTenantId || !input.externalEmployeeId)
    throw new Error("Missing bundle identity");
  if (input.clientId !== input.employeeClientId || input.clientId !== input.connectionClientId)
    throw new Error("Cross-tenant bundle access denied");
  if (input.payrollOwner !== "ELRISE" || input.connectionState !== "ACTIVE")
    throw new Error("Bundle connection disabled");
  if (!input.employeeActive || !input.mappingVerified || !input.connectionVerified)
    throw new Error("Unverified employee or connection");
  if (input.externalTenantId !== input.mappedExternalTenantId ||
      input.externalTenantId !== input.transactionExternalTenantId ||
      input.externalEmployeeId !== input.transactionExternalEmployeeId)
    throw new Error("External identity mismatch");
}
