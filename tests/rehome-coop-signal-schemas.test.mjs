// ─────────────────────────────────────────────────────────────────────────────
// v0.19.0 payload schemas — regression block.
//
//   1. HOMEOWNER-LIFECYCLE-REHOME P1 — `rello.home_purchased`
//      (relloHomePurchasedDataSchema, schemas/rello.ts). The Rello emitter is
//      NOT yet landed (BPB 9.1: this minor ships with/before the emit PR), so
//      fixtures mirror the LOCKED spec contract (_SPEC-FEATURE.md DL1).
//   2. OHH-SHOWINGS-AND-TOURS P5 — `open-house-hub.coop_invite_sent`
//      (ohhCoopInviteSentDataSchema). PII-FLOOR assertions: the payload carries
//      hasEmail/hasPhone capability booleans, NEVER contact values.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  relloHomePurchasedDataSchema,
  relloHomeSoldDataSchema,
  ohhCoopInviteSentDataSchema,
} from "../dist/index.js";

// Spec-contract fixture: every key ALWAYS present (loanAmount nullable, never
// omitted); purchasePrice/loanAmount in WHOLE DOLLARS (positive int).
const homePurchasedBase = {
  relloLeadId: "lead_0001",
  tenantId: "tenant_1773865296594_ukwq2w",
  newPropertyAddress: "456 Aspen Grove Ln, Lehi, UT",
  newPropertyZip: "84043",
  purchasePrice: 585000,
  loanAmount: 468000,
  closeDate: "2026-06-30",
};

describe("rello.home_purchased schema (v0.19.0, HOMEOWNER-LIFECYCLE-REHOME P1)", () => {
  it("accepts the spec-contract shape (financed close)", () => {
    assert.ok(relloHomePurchasedDataSchema.safeParse(homePurchasedBase).success);
  });

  it("loanAmount is nullable-NOT-omitted: explicit null parses (cash close), absent key rejects", () => {
    assert.ok(
      relloHomePurchasedDataSchema.safeParse({
        ...homePurchasedBase,
        loanAmount: null,
      }).success,
    );
    const { loanAmount: _omit, ...noLoanKey } = homePurchasedBase;
    assert.equal(relloHomePurchasedDataSchema.safeParse(noLoanKey).success, false);
  });

  it("closeDate accepts both ISO date-only and full-datetime forms, rejects non-ISO", () => {
    assert.ok(
      relloHomePurchasedDataSchema.safeParse({
        ...homePurchasedBase,
        closeDate: "2026-06-30T21:30:00.000Z",
      }).success,
    );
    assert.equal(
      relloHomePurchasedDataSchema.safeParse({
        ...homePurchasedBase,
        closeDate: "June 30, 2026",
      }).success,
      false,
    );
  });

  it("purchasePrice is WHOLE DOLLARS — rejects floats (cents), zero, and negatives", () => {
    for (const bad of [585000.5, 0, -1]) {
      assert.equal(
        relloHomePurchasedDataSchema.safeParse({
          ...homePurchasedBase,
          purchasePrice: bad,
        }).success,
        false,
        `purchasePrice ${bad} must reject`,
      );
    }
  });

  it("rejects a missing tenant boundary (DL3: tenantId required, never inferred)", () => {
    const { tenantId: _omit, ...noTenant } = homePurchasedBase;
    assert.equal(relloHomePurchasedDataSchema.safeParse(noTenant).success, false);
    assert.equal(
      relloHomePurchasedDataSchema.safeParse({
        ...homePurchasedBase,
        tenantId: "",
      }).success,
      false,
    );
  });

  it("rejects empty new-property identity (address/zip are the repoint target)", () => {
    assert.equal(
      relloHomePurchasedDataSchema.safeParse({
        ...homePurchasedBase,
        newPropertyAddress: "",
      }).success,
      false,
    );
    assert.equal(
      relloHomePurchasedDataSchema.safeParse({
        ...homePurchasedBase,
        newPropertyZip: "",
      }).success,
      false,
    );
  });
});

// HOMEOWNER-LIFECYCLE-REHOME W1/U1 (v0.27.0) — sell-side close, symmetric to
// home_purchased. 6-key shape, every key ALWAYS present (no nullable analogue
// to home_purchased's loanAmount — a sale carries no loan figure). salePrice in
// WHOLE DOLLARS (positive int); soldZip is a string; closeDate ISO-prefixed.
const homeSoldBase = {
  relloLeadId: "lead_0002",
  tenantId: "tenant_1773865296594_ukwq2w",
  soldAddress: "1043 W Mapleview Dr, Lehi, UT",
  soldZip: "84043",
  salePrice: 612000,
  closeDate: "2026-06-12",
};

describe("rello.home_sold schema (v0.27.0, HOMEOWNER-LIFECYCLE-REHOME W1/U1)", () => {
  it("accepts the spec-contract shape (symmetric to home_purchased)", () => {
    assert.ok(relloHomeSoldDataSchema.safeParse(homeSoldBase).success);
  });

  it("declares EXACTLY the 6 symmetric sell-side keys (no loanAmount analogue)", () => {
    const keys = Object.keys(relloHomeSoldDataSchema.shape).sort();
    assert.deepEqual(keys, [
      "closeDate",
      "relloLeadId",
      "salePrice",
      "soldAddress",
      "soldZip",
      "tenantId",
    ]);
  });

  it("closeDate accepts both ISO date-only and full-datetime forms, rejects non-ISO", () => {
    assert.ok(
      relloHomeSoldDataSchema.safeParse({
        ...homeSoldBase,
        closeDate: "2026-06-12T18:00:00.000Z",
      }).success,
    );
    assert.equal(
      relloHomeSoldDataSchema.safeParse({
        ...homeSoldBase,
        closeDate: "June 12, 2026",
      }).success,
      false,
    );
  });

  it("salePrice is WHOLE DOLLARS — rejects floats (cents), zero, negatives, and NaN", () => {
    for (const bad of [612000.5, 0, -1, NaN]) {
      assert.equal(
        relloHomeSoldDataSchema.safeParse({
          ...homeSoldBase,
          salePrice: bad,
        }).success,
        false,
        `salePrice ${bad} must reject`,
      );
    }
  });

  it("rejects a missing tenant boundary (tenantId required, never inferred)", () => {
    const { tenantId: _omit, ...noTenant } = homeSoldBase;
    assert.equal(relloHomeSoldDataSchema.safeParse(noTenant).success, false);
    assert.equal(
      relloHomeSoldDataSchema.safeParse({ ...homeSoldBase, tenantId: "" }).success,
      false,
    );
  });

  it("rejects empty relloLeadId (the portal-follow key)", () => {
    assert.equal(
      relloHomeSoldDataSchema.safeParse({ ...homeSoldBase, relloLeadId: "" }).success,
      false,
    );
  });

  it("rejects empty sold-property identity (address/zip are the archive/suppress target)", () => {
    assert.equal(
      relloHomeSoldDataSchema.safeParse({ ...homeSoldBase, soldAddress: "" }).success,
      false,
    );
    assert.equal(
      relloHomeSoldDataSchema.safeParse({ ...homeSoldBase, soldZip: "" }).success,
      false,
    );
  });

  it("rejects a wrong-type salePrice (string) — runtime type guard, not just TS", () => {
    assert.equal(
      relloHomeSoldDataSchema.safeParse({ ...homeSoldBase, salePrice: "612000" })
        .success,
      false,
    );
  });
});

const coopInviteBase = {
  showingId: "cshw_0001",
  participantId: "cprt_0001",
  hasEmail: true,
  hasPhone: false,
  action: "showing.coop_invite",
  actorUserId: "cusr_0001",
};

describe("open-house-hub.coop_invite_sent schema (v0.19.0, OHH P5)", () => {
  it("accepts the Rule-D trail shape", () => {
    assert.ok(ohhCoopInviteSentDataSchema.safeParse(coopInviteBase).success);
  });

  it("PII floor: hasEmail/hasPhone are booleans — contact VALUES reject", () => {
    assert.equal(
      ohhCoopInviteSentDataSchema.safeParse({
        ...coopInviteBase,
        hasEmail: "coop@example.com",
      }).success,
      false,
    );
    assert.equal(
      ohhCoopInviteSentDataSchema.safeParse({
        ...coopInviteBase,
        hasPhone: "8015551234",
      }).success,
      false,
    );
  });

  it("PII floor: the schema declares NO email/phone/name value fields", () => {
    const keys = Object.keys(ohhCoopInviteSentDataSchema.shape);
    assert.deepEqual(keys.sort(), [
      "action",
      "actorUserId",
      "hasEmail",
      "hasPhone",
      "participantId",
      "showingId",
    ]);
  });

  it("rejects a missing audit-trail field (Rule-D mutation trail)", () => {
    const { actorUserId: _omit, ...noActor } = coopInviteBase;
    assert.equal(ohhCoopInviteSentDataSchema.safeParse(noActor).success, false);
    const { action: _omit2, ...noAction } = coopInviteBase;
    assert.equal(ohhCoopInviteSentDataSchema.safeParse(noAction).success, false);
  });
});
