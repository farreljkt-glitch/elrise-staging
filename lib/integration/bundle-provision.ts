import "server-only";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-server";
/** Superadmin-only provisioning. Explicit verification required before bundle activation. */
export async function provisionElriseTenant(clientId: string, mode: "ELRISE_ONLY" | "BUNDLE", effectiveAt: Date) {
 const admin = await requireUser(["SUPERADMIN"]);
 if (!clientId || !Number.isFinite(effectiveAt.getTime())) throw new Error("Invalid provisioning request");
 return db.$transaction(async tx => {
   const client = await tx.client.findUnique({where:{id:clientId}});
   if (!client || client.status !== "AKTIF") throw new Error("Client unavailable");
   if (mode === "BUNDLE") {
     const connection = await tx.integrationConnection.findUnique({where:{clientId}});
     if (!connection || connection.state !== "ACTIVE" || !connection.verifiedAt || connection.payrollOwner !== "ELRISE")
       throw new Error("Verified ACTIVE Gajiku link and ELRISE payroll ownership required");
   }
   return tx.bundleSubscription.upsert({where:{clientId},create:{clientId,mode,effectiveAt,provisionedByUserId:admin.id,activatedAt:mode === "BUNDLE" ? new Date() : null},update:{mode,effectiveAt,provisionedByUserId:admin.id,activatedAt:mode === "BUNDLE" ? new Date() : null}});
 });
}
