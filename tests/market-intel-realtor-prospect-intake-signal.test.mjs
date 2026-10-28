// ─────────────────────────────────────────────────────────────────────────────
// MARKET INTEL INGEST R-1 — `market-intel.realtor_prospect.intake_received` (v0.38.0).
//
// MarketIntel emits it for an agent who signs up (public /subscribe,
// resubscribe, /request-access, admin invite). Rello processes it in-request at
// /api/signals/batch and writes a RealtorProspect (never a Lead). Registered
// here so both sides read one payload contract, and so Rello's signal-type
// gate sees a canonical key.
//
// Missing optional data is null, never a refusal: the cases below pin that a
// signup with no brokerage / publication / MLO is accepted.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as pkg from "../dist/index.js";

const KEY = "market-intel.realtor_prospect.intake_received";
const schema = pkg.marketIntelRealtorProspectIntakeReceivedDataSchema;

const valid = {
  subscriberId: "sub_fixture_1",
  firstName: "Avery",
  lastName: "Fixture",
  email: "avery.fixture@example.com",
  brokerage: "Fixture Realty",
  publicationId: "pub_fixture_1",
  publicationName: "Fixture Market Digest",
  intakeAction: "public_signup",
  consentBasis: "form_submitted",
  submittedAt: "2026-10-27T20:00:00.000Z",
  assignedMloAgentId: null,
};

describe(`${KEY} (v0.38.0)`, () => {
  it("is a registered, active, exact canonical key that normalizes to itself", () => {
    const entry = pkg.EXACT_REGISTRY[KEY];
    assert.ok(entry, `${KEY} is not in EXACT_REGISTRY`);
    assert.equal(entry.type, KEY);
    assert.equal(entry.lifecycle, "active");
    assert.equal(pkg.normalizeSignalType(KEY), KEY);
    assert.ok(pkg.listActiveSignalTypes().includes(KEY));
  });

  it("is not a lead nurture-goal event (consumed in-request, writes a prospect)", () => {
    assert.equal(pkg.EXACT_REGISTRY[KEY].goalShiftSemantics, false);
  });

  it("exports the signal-type constant", () => {
    assert.equal(pkg.MARKET_INTEL_REALTOR_PROSPECT_INTAKE_SIGNAL_TYPE, KEY);
  });

  it("accepts the R-1 payload", () => {
    assert.equal(schema.safeParse(valid).success, true);
  });

  it("accepts every optional field as null (no field is a reason to refuse a signup)", () => {
    const r = schema.safeParse({
      ...valid,
      brokerage: null,
      publicationId: null,
      publicationName: null,
      assignedMloAgentId: null,
    });
    assert.equal(r.success, true);
  });

  it("trims surrounding whitespace from the email instead of refusing it", () => {
    const r = schema.safeParse({ ...valid, email: "  Avery.Fixture@Example.com " });
    assert.equal(r.success, true);
    assert.equal(r.data.email, "Avery.Fixture@Example.com");
  });

  it("drops an unknown extra field instead of refusing", () => {
    const r = schema.safeParse({ ...valid, somethingNew: "x" });
    assert.equal(r.success, true);
    assert.equal("somethingNew" in r.data, false);
  });

  for (const intakeAction of ["public_signup", "resubscribe", "access_request", "admin_invite"]) {
    it(`accepts intakeAction=${intakeAction}`, () => {
      assert.equal(schema.safeParse({ ...valid, intakeAction }).success, true);
    });
  }
  for (const consentBasis of ["form_submitted", "admin_invited", "access_requested"]) {
    it(`accepts consentBasis=${consentBasis}`, () => {
      assert.equal(schema.safeParse({ ...valid, consentBasis }).success, true);
    });
  }

  const refusals = [
    ["missing subscriberId", { subscriberId: undefined }],
    ["missing email", { email: undefined }],
    ["malformed email", { email: "not-an-email" }],
    ["unknown intakeAction", { intakeAction: "ghl_webhook" }],
    ["unknown consentBasis", { consentBasis: "implied" }],
    ["non-ISO submittedAt", { submittedAt: "yesterday" }],
    ["brokerage omitted (nullable means present)", { brokerage: undefined }],
  ];
  for (const [label, patch] of refusals) {
    it(`refuses: ${label}`, () => {
      const p = { ...valid, ...patch };
      for (const k of Object.keys(patch)) if (patch[k] === undefined) delete p[k];
      assert.equal(schema.safeParse(p).success, false);
    });
  }

  it("lists the three per-item outcomes Rello returns", () => {
    assert.deepEqual([...pkg.REALTOR_PROSPECT_INTAKE_OUTCOMES], ["created", "repeat", "rejected"]);
  });
});
