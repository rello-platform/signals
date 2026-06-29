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
/**
 * `rello.home_sold` — emitted at the funded/recorded SELL-SIDE close, carrying
 * the SOLD property identity. The symmetric sibling of `rello.home_purchased`
 * (HOMEOWNER-LIFECYCLE-REHOME W1/U1, WALK-DECISIONS-260629 §2). Two emit lanes,
 * one canonical type: the Rello sell-side `ClosingMilestone` advance (U2) AND
 * the OHH manual `SellerListing→SOLD` PATCH completeness path (U4). Downstream
 * consumer (U3): Oven sets `HomeownerProfile.lifecycleStatus = BETWEEN_HOMES`,
 * archives the value/equity snapshot, and suppresses live value — idempotent on
 * `(closeDate + normalized soldAddress)` via `lastSoldKey` (mirrors the
 * `home_purchased` → `lastRehomeKey` idempotency).
 *
 * Discipline mirrors `relloHomePurchasedDataSchema` EXACTLY: every key is
 * ALWAYS PRESENT (the sell side has no nullable-optional analogue to
 * `home_purchased`'s `loanAmount` — a sale carries no loan figure, so the
 * symmetric 6-key shape from the spec is fully required). Money is WHOLE
 * DOLLARS (positive integer — never cents, never a float); zip is a string
 * (leading zeros are meaningful); closeDate pins the ISO-date prefix and
 * accepts both date-only and full-datetime serializations (the emitter is not
 * yet landed, same convention `home_purchased`/`tourDate` use).
 */
declare const relloHomeSoldDataSchema: z.ZodObject<{
    relloLeadId: z.ZodString;
    tenantId: z.ZodString;
    soldAddress: z.ZodString;
    soldZip: z.ZodString;
    salePrice: z.ZodNumber;
    closeDate: z.ZodString;
}, z.core.$strip>;
type RelloHomeSoldData = z.infer<typeof relloHomeSoldDataSchema>;

export { type RelloHomePurchasedData, type RelloHomeSoldData, relloHomePurchasedDataSchema, relloHomeSoldDataSchema };
