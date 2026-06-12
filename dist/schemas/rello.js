// src/schemas/rello.ts
import { z } from "zod";
var relloHomePurchasedDataSchema = z.object({
  /** Rello Lead id of the buyer (the portal follows the person). */
  relloLeadId: z.string().min(1),
  /**
   * Owning tenant. DL3: tenant boundary is sacred — a purchase under a
   * different tenant is a NEW (tenantId, relloLeadId) relationship downstream,
   * never a cross-tenant repoint.
   */
  tenantId: z.string().min(1),
  /** Full street address of the NEW (purchased) property. */
  newPropertyAddress: z.string().min(1),
  /** ZIP of the NEW property (string — leading zeros are meaningful). */
  newPropertyZip: z.string().min(1),
  /**
   * Purchase price in WHOLE DOLLARS (positive integer — never cents, never a
   * float). Becomes the Oven value/equity rebaseline.
   */
  purchasePrice: z.number().int().positive(),
  /**
   * Loan amount in WHOLE DOLLARS (positive integer), or null when unknown /
   * not applicable (cash close). Nullable NOT optional — the key is always
   * present on the wire.
   */
  loanAmount: z.number().int().positive().nullable(),
  /**
   * ISO 8601 close (funding/recording) date — date-only or full-datetime
   * form. The emitter is not yet landed, so the schema pins the ISO-date
   * prefix (`YYYY-MM-DD…`) and accepts both serializations rather than
   * guessing which one Rello will emit (the v0.18.0 `tourDate` precedent).
   */
  closeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "ISO 8601 date expected")
});
export {
  relloHomePurchasedDataSchema
};
//# sourceMappingURL=rello.js.map