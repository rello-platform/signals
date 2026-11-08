// ─────────────────────────────────────────────────────────────────────────────
// REALTOR REFERRAL NURTURE P2 — `home-scout.realtor_prospect.intake_received` (v0.39.0).
//
// Home Scout's /realtors page posts its two forms to Rello as ONE signal with an
// `intent`: `updates_signup` (get updates) and `scenario_request` (ask a
// financing question). Rello writes a RealtorProspect, never a Lead.
//
// Pinned here: a valid payload of each intent passes; a missing email, an
// unknown intent, a forbidden identifying field and an SSN-shaped value in the
// question each fail with a NAMED error; a bad optional fact is dropped, never a
// reason to refuse the question; the consent is carried exactly as captured.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as pkg from "../dist/index.js";

const KEY = "home-scout.realtor_prospect.intake_received";
const schema = pkg.homeScoutRealtorProspectIntakeReceivedDataSchema;
const ERR = pkg.HOME_SCOUT_REALTOR_INTAKE_ERRORS;

const common = {
  mlo: { agentSlug: "kelly-sansom", relloAgentId: "agent_fixture_1" },
  idempotencyKey: "hs-rpi-fixture-1",
  sourcePage: "https://clearpathutah.thehomescout.app/realtors",
  submittedAt: "2026-11-07T20:00:00.000Z",
};

const updates = {
  ...common,
  intent: "updates_signup",
  firstName: "Avery",
  lastName: "Fixture",
  email: "avery.fixture@example.com",
  brokerage: "Fixture Realty",
  markets: ["Salt Lake County", "Utah County"],
  workFocus: "both",
  topics: ["financed_offers", "seller_concessions"],
  phone: null,
  consent: {
    emailUpdates: true,
    sms: false,
    textVersion: "hs-realtors-updates-v1",
    capturedAt: "2026-11-07T20:00:00.000Z",
  },
};

const scenario = {
  ...common,
  intent: "scenario_request",
  replyEmail: "avery.fixture@example.com",
  question: "Buyer has 5% down on a $600k condo. Can the seller credit cover closing costs?",
  facts: { loanPurpose: "purchase", purchasePrice: 600000, downPaymentPercent: 5, propertyType: "condo" },
};

/** The named errors on a failed parse. */
function names(result) {
  assert.equal(result.success, false, "expected a refusal");
  return result.error.issues.map((i) => i.message);
}

describe(`${KEY} (v0.39.0)`, () => {
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

  it("exports the signal-type constant and the two intents", () => {
    assert.equal(pkg.HOME_SCOUT_REALTOR_PROSPECT_INTAKE_SIGNAL_TYPE, KEY);
    assert.deepEqual([...pkg.HOME_SCOUT_REALTOR_INTAKE_INTENTS], ["updates_signup", "scenario_request"]);
  });

  // ── valid payloads ──

  it("accepts a valid updates_signup", () => {
    const r = schema.safeParse(updates);
    assert.equal(r.success, true, JSON.stringify(r.error?.issues));
  });

  it("accepts a valid scenario_request", () => {
    const r = schema.safeParse(scenario);
    assert.equal(r.success, true, JSON.stringify(r.error?.issues));
  });

  it("updates_signup carries both consents exactly as captured (SMS ticked → true)", () => {
    const r = schema.safeParse({ ...updates, phone: "+18015550100", consent: { ...updates.consent, sms: true } });
    assert.equal(r.success, true);
    assert.deepEqual(r.data.consent, {
      emailUpdates: true,
      sms: true,
      textVersion: "hs-realtors-updates-v1",
      capturedAt: "2026-11-07T20:00:00.000Z",
    });
  });

  it("updates_signup: an SMS box that was never ticked reads false (unchecked by default)", () => {
    const { sms: _omit, ...consent } = updates.consent;
    const r = schema.safeParse({ ...updates, consent });
    assert.equal(r.success, true);
    assert.equal(r.data.consent.sms, false);
  });

  it("updates_signup: brokerage, phone, markets and topics may be left out", () => {
    const { brokerage: _b, phone: _p, markets: _m, topics: _t, ...rest } = updates;
    const r = schema.safeParse(rest);
    assert.equal(r.success, true, JSON.stringify(r.error?.issues));
    assert.equal(r.data.brokerage, null);
    assert.equal(r.data.phone, null);
    assert.deepEqual(r.data.markets, []);
    assert.deepEqual(r.data.topics, []);
  });

  it("scenario_request carries no marketing consent of any kind", () => {
    const r = schema.safeParse({ ...scenario, consent: { emailUpdates: true, sms: true } });
    assert.equal(r.success, true);
    assert.equal("consent" in r.data, false, "a scenario_request must never carry a consent object");
  });

  it("scenario_request: facts are optional", () => {
    const { facts: _f, ...rest } = scenario;
    assert.equal(schema.safeParse(rest).success, true);
  });

  it("scenario_request: a bad optional fact is dropped, never a reason to refuse the question", () => {
    const r = schema.safeParse({ ...scenario, facts: { ...scenario.facts, propertyType: "castle", downPaymentPercent: 140 } });
    assert.equal(r.success, true, JSON.stringify(r.error?.issues));
    assert.equal(r.data.facts.propertyType, undefined);
    assert.equal(r.data.facts.downPaymentPercent, undefined);
    assert.equal(r.data.facts.purchasePrice, 600000);
  });

  it("scenario_request: an unknown free-text fact is dropped (only the question is free text)", () => {
    const r = schema.safeParse({ ...scenario, facts: { ...scenario.facts, notes: "anything" } });
    assert.equal(r.success, true);
    assert.equal("notes" in r.data.facts, false);
  });

  it("drops an unknown extra top-level field, including a tenant id (the tenant comes from the credential)", () => {
    const r = schema.safeParse({ ...updates, tenantId: "tenant_from_payload", somethingNew: "x" });
    assert.equal(r.success, true);
    assert.equal("tenantId" in r.data, false);
    assert.equal("somethingNew" in r.data, false);
  });

  it("the MLO's Rello agent id may be null (Rello creates the prospect unassigned)", () => {
    assert.equal(schema.safeParse({ ...updates, mlo: { agentSlug: "kelly-sansom", relloAgentId: null } }).success, true);
  });

  it("trims surrounding whitespace from the email instead of refusing it", () => {
    const r = schema.safeParse({ ...updates, email: "  Avery.Fixture@Example.com " });
    assert.equal(r.success, true);
    assert.equal(r.data.email, "Avery.Fixture@Example.com");
  });

  // ── refusals, each with a named error ──

  it("refuses an updates_signup with no email: EMAIL_REQUIRED", () => {
    const { email: _e, ...rest } = updates;
    assert.ok(names(schema.safeParse(rest)).includes(ERR.EMAIL_REQUIRED));
  });

  it("refuses a scenario_request with no reply email: EMAIL_REQUIRED", () => {
    const { replyEmail: _e, ...rest } = scenario;
    assert.ok(names(schema.safeParse(rest)).includes(ERR.EMAIL_REQUIRED));
  });

  it("refuses a malformed email: EMAIL_INVALID", () => {
    assert.ok(names(schema.safeParse({ ...updates, email: "not-an-email" })).includes(ERR.EMAIL_INVALID));
  });

  it("refuses an unknown intent: UNKNOWN_INTENT", () => {
    assert.ok(names(schema.safeParse({ ...updates, intent: "buyer_intro" })).includes(ERR.UNKNOWN_INTENT));
  });

  for (const field of [
    "clientName",
    "client_first_name",
    "borrowerName",
    "ssn",
    "SSN",
    "socialSecurityNumber",
    "dob",
    "dateOfBirth",
    "accountNumber",
    "routing_number",
    "documents",
    "attachments",
  ]) {
    it(`refuses a forbidden identifying field at the top level: ${field} → FORBIDDEN_IDENTIFYING_FIELD`, () => {
      assert.ok(names(schema.safeParse({ ...scenario, [field]: "x" })).includes(ERR.FORBIDDEN_IDENTIFYING_FIELD));
    });
  }

  it("refuses a forbidden identifying field nested in facts: FORBIDDEN_IDENTIFYING_FIELD", () => {
    const r = schema.safeParse({ ...scenario, facts: { ...scenario.facts, client_name: "Jane Doe" } });
    assert.ok(names(r).includes(ERR.FORBIDDEN_IDENTIFYING_FIELD));
  });

  it("refuses a forbidden identifying field on an updates_signup too", () => {
    assert.ok(names(schema.safeParse({ ...updates, dateOfBirth: "1980-01-01" })).includes(ERR.FORBIDDEN_IDENTIFYING_FIELD));
  });

  for (const ssn of ["123-45-6789", "123 45 6789", "123456789"]) {
    it(`refuses an SSN-shaped value in the question (${ssn}): SSN_IN_QUESTION`, () => {
      const r = schema.safeParse({ ...scenario, question: `Client SSN is ${ssn}, can they qualify?` });
      assert.ok(names(r).includes(ERR.SSN_IN_QUESTION));
    });
  }

  it("does not mistake a phone number or a price for an SSN", () => {
    const r = schema.safeParse({ ...scenario, question: "Call me at 801-555-1234 about the $450,000 offer, 1234567890 is my cell." });
    assert.equal(r.success, true, JSON.stringify(r.error?.issues));
  });

  it("refuses an empty question: QUESTION_REQUIRED", () => {
    assert.ok(names(schema.safeParse({ ...scenario, question: "   " })).includes(ERR.QUESTION_REQUIRED));
  });

  it("refuses an updates_signup without the consent as captured: CONSENT_REQUIRED", () => {
    const { consent: _c, ...rest } = updates;
    assert.ok(names(schema.safeParse(rest)).includes(ERR.CONSENT_REQUIRED));
  });

  it("refuses a payload with no MLO: MLO_REQUIRED", () => {
    const { mlo: _m, ...rest } = updates;
    assert.ok(names(schema.safeParse(rest)).includes(ERR.MLO_REQUIRED));
  });

  it("refuses a payload with no idempotency key: IDEMPOTENCY_KEY_REQUIRED", () => {
    const { idempotencyKey: _k, ...rest } = scenario;
    assert.ok(names(schema.safeParse(rest)).includes(ERR.IDEMPOTENCY_KEY_REQUIRED));
  });
});
