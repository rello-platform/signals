// ─────────────────────────────────────────────────────────────────────────────
// C-23 (a) — `home-scout.pfp_intake_dead` (v0.32.0).
//
// Home Scout emits it ONCE, LEADLESS, when a Home Scout → PathfinderPro
// loan-application handoff exhausts its retries (FailedPfpIntake.dead = true).
// C-22: two such rows sat dead for twelve weeks and nothing told anyone.
//
// It is our plumbing failing, not something the lead did, so it must be SYSTEM
// (out of Rello's readinessTrend / buying_surge scoring path — see
// operational-signals-not-lead-intent.test.mjs). Its payload is identifiers and
// failure evidence only: the schema is strict, so no borrower PII can ride it.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as pkg from "../dist/index.js";

const KEY = "home-scout.pfp_intake_dead";
const schema = pkg.hsPfpIntakeDeadDataSchema;

const valid = {
  failedPfpIntakeId: "cfpi_fixture_0001",
  sendIdempotencyKey: "hecm:cint_fixture_0001",
  tenantId: "tenant_fixture_1",
  lastHttpStatus: 400,
  lastError: "non_2xx_response",
  attempt: 5,
};

describe(`${KEY} (v0.32.0)`, () => {
  it("is registered SYSTEM, non-goal-shifting and active", () => {
    const entry = pkg.EXACT_REGISTRY[KEY];
    assert.ok(entry, `${KEY} is not in EXACT_REGISTRY`);
    assert.equal(entry.category, "SYSTEM");
    assert.equal(entry.goalShiftSemantics, false);
    assert.equal(entry.lifecycle, "active");
    assert.ok(pkg.listActiveSignalTypes().includes(KEY));
  });

  it("the payload schema is exported and accepts the contract shape", () => {
    assert.ok(schema, "hsPfpIntakeDeadDataSchema is not exported");
    assert.ok(schema.safeParse(valid).success);
  });

  it("accepts an unowned row (tenantId null) and an attempt PFP never answered (lastHttpStatus null)", () => {
    assert.ok(schema, "hsPfpIntakeDeadDataSchema is not exported");
    assert.ok(schema.safeParse({ ...valid, tenantId: null, lastHttpStatus: null }).success);
  });

  it("refuses any field outside the contract — borrower PII can never ride this signal", () => {
    assert.ok(schema, "hsPfpIntakeDeadDataSchema is not exported");
    for (const extra of [
      { email: "pat@example.test" },
      { phone: "8015550100" },
      { firstName: "Pat" },
      { payload: { email: "pat@example.test" } },
    ]) {
      assert.equal(schema.safeParse({ ...valid, ...extra }).success, false, `accepted ${JSON.stringify(extra)}`);
    }
  });

  it("refuses malformed evidence", () => {
    assert.ok(schema, "hsPfpIntakeDeadDataSchema is not exported");
    for (const bad of [
      { attempt: -1 },
      { attempt: 1.5 },
      { lastHttpStatus: 42 },
      { lastHttpStatus: 600 },
      { lastError: "x".repeat(501) },
      { failedPfpIntakeId: "" },
      { sendIdempotencyKey: "" },
      { sendIdempotencyKey: "k".repeat(65) },
    ]) {
      assert.equal(schema.safeParse({ ...valid, ...bad }).success, false, `accepted ${JSON.stringify(bad)}`);
    }
    for (const field of Object.keys(valid)) {
      const { [field]: _omitted, ...rest } = valid;
      assert.equal(schema.safeParse(rest).success, false, `accepted a payload missing ${field}`);
    }
  });
});
