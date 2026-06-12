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
