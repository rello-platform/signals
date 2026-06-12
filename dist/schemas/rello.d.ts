import { z } from 'zod';

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
declare const relloHomePurchasedDataSchema: z.ZodObject<{
    relloLeadId: z.ZodString;
    tenantId: z.ZodString;
    newPropertyAddress: z.ZodString;
    newPropertyZip: z.ZodString;
    purchasePrice: z.ZodNumber;
    loanAmount: z.ZodNullable<z.ZodNumber>;
    closeDate: z.ZodString;
}, z.core.$strip>;
type RelloHomePurchasedData = z.infer<typeof relloHomePurchasedDataSchema>;

export { type RelloHomePurchasedData, relloHomePurchasedDataSchema };
