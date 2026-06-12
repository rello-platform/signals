import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Rello hub-emitted signal payload schemas.
//
// HOMEOWNER-LIFECYCLE-REHOME P1 (v0.19.0) — `rello.home_purchased`. Schema
// lands in the SAME minor as the registry row (BPB 9.1: schema lands
// with/before the emit PR). The Rello emitter is the P1 producer lane and
// lands AFTER this minor, so the shape follows the LOCKED spec contract
// (HOMEOWNER-LIFECYCLE-REHOME _SPEC-FEATURE.md DL1) rather than a live emit
// site.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `rello.home_purchased` — emitted by Rello at the funded/recorded BUY-SIDE
 * `ClosingMilestone` advance (Rello `closing/milestones.ts:464` /
 * `closing/index.ts:298`), carrying the NEW property identity. Downstream
 * consumers: Oven `HomeownerProfile` repoint + value rebaseline (upsert on
 * `tenantId_relloLeadId`), OHH old-`SellerListing` close, Harvest-Home
 * `hh_market_status` advance (spec DL1–DL3).
 *
 * Discipline: every key is ALWAYS PRESENT (`.nullable()` where noted, never
 * `.optional()`) — `loanAmount` is nullable-not-omitted (the spec's
 * `loanAmount?` draft is serialized as an explicit `null` when unknown, e.g.
 * a cash purchase or a transaction missing loan data).
 *
 * Consumer idempotency is keyed on (closeDate + normalized newPropertyAddress)
 * per spec DL2 — replays must never double-rebaseline.
 */
export const relloHomePurchasedDataSchema = z.object({
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
  closeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "ISO 8601 date expected"),
});

export type RelloHomePurchasedData = z.infer<typeof relloHomePurchasedDataSchema>;
