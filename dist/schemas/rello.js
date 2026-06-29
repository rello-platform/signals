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
var relloHomeSoldDataSchema = z.object({
  /** Rello Lead id of the seller (the portal follows the person). */
  relloLeadId: z.string().min(1),
  /**
   * Owning tenant. The tenant boundary is sacred — a sale under a different
   * tenant is a NEW (tenantId, relloLeadId) relationship downstream, never a
   * cross-tenant repoint (mirrors `home_purchased` DL3).
   */
  tenantId: z.string().min(1),
  /** Full street address of the SOLD property (the archive/suppress target). */
  soldAddress: z.string().min(1),
  /** ZIP of the SOLD property (string — leading zeros are meaningful). */
  soldZip: z.string().min(1),
  /**
   * Sale price in WHOLE DOLLARS (positive integer — never cents, never a
   * float). The realized-history figure shown on the between-homes hub card.
   */
  salePrice: z.number().int().positive(),
  /**
   * ISO 8601 close (funding/recording) date — date-only or full-datetime
   * form. Pins the ISO-date prefix (`YYYY-MM-DD…`) and accepts both
   * serializations (the emitter is not yet landed — mirrors `home_purchased`).
   * Half of the consumer idempotency key (closeDate + normalized soldAddress).
   */
  closeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "ISO 8601 date expected")
});
export {
  relloHomePurchasedDataSchema,
  relloHomeSoldDataSchema
};
//# sourceMappingURL=rello.js.map