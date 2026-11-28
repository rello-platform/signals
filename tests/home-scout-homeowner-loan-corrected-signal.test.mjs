// `home-scout.homeowner_loan_corrected` — Home Insight HI-02 (v0.43.0).
//
// A homeowner on their Home Insight page answers "Loan info not correct?" with
// their own balance, rate, payment or lender, or says they refinanced
// elsewhere. Rello records the correction (Rello POST
// /api/homeowner/loan-corrections, HI-30) and emits this one signal with
// `{ fields[], refinancedElsewhere }` (spec RELLO-HOME-INSIGHT §6 X-10). It is
// narrative-material: Rello rebuilds the Lead Story, and `refinancedElsewhere`
// gives the "refinanced elsewhere" reason (HI-58).
//
// ONE loan signal (spec H-2): part A's `home-scout.loan_info_updated` is NOT
// registered, so a stray emit of that name fails Rello's check:signal-types.
//
// Narrative-material is DERIVED in Rello (src/lib/signals/classifier.ts
// isNarrativeMaterial): BEHAVIORAL is material only at weight >= 5, and Rello
// reads no per-entry override. So the registry's weight is what makes it so.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EXACT_REGISTRY,
  isGoalShiftSignal,
  isNarrativeMaterial,
  listActiveSignalTypes,
  normalizeSignalType,
} from "../dist/index.js";

const KEY = "home-scout.homeowner_loan_corrected";

describe("home-scout.homeowner_loan_corrected · registered, narrative-material, BEHAVIORAL", () => {
  it("🔴 is an exact registered key that normalizes to itself", () => {
    assert.ok(EXACT_REGISTRY[KEY], `${KEY} is not in EXACT_REGISTRY`);
    assert.equal(EXACT_REGISTRY[KEY].type, KEY);
    assert.equal(normalizeSignalType(KEY), KEY);
  });

  it("🔴 BEHAVIORAL, weight 5, MEDIUM, goal-shifting, active", () => {
    const entry = EXACT_REGISTRY[KEY];
    assert.ok(entry);
    assert.equal(entry.category, "BEHAVIORAL");
    assert.equal(entry.weight, 5);
    assert.equal(entry.priority, "MEDIUM");
    assert.equal(entry.goalShiftSemantics, true);
    assert.equal(entry.lifecycle, "active");
    assert.equal(entry.narrativeMaterialOverride, undefined, "Rello reads no override; the weight must carry it");
    assert.equal(isGoalShiftSignal(KEY), true);
  });

  it("🔴 is narrative-material by Rello's derived rule (category, weight)", () => {
    const entry = EXACT_REGISTRY[KEY];
    assert.ok(entry);
    assert.equal(isNarrativeMaterial(entry.category, entry.weight), true);
  });

  it("🔴 is an active key and in the dist keyset (the cross-language net)", () => {
    assert.ok(listActiveSignalTypes().includes(KEY));
    const keyset = JSON.parse(
      readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "signal-registry-keyset.json"),
        "utf8",
      ),
    );
    assert.ok(keyset.exactKeys.includes(KEY), `keyset missing ${KEY}`);
  });

  it("the legacy `scout.` slug spelling folds to the same key, as for every home-scout key", () => {
    assert.equal(normalizeSignalType("scout.homeowner_loan_corrected"), KEY);
  });
});

describe("one loan signal (spec H-2): part A's name stays unregistered", () => {
  for (const raw of ["home-scout.loan_info_updated", "scout.loan_info_updated"]) {
    it(`${raw} → null`, () => {
      assert.equal(normalizeSignalType(raw), null);
    });
  }
});

// ── Payload schema (KA ruling on a4-013; spec §6 X-10) ───────────────────────
// `{ fields, refinancedElsewhere }`, strict. `fields` = the correction fields the
// homeowner submitted: non-empty, no duplicates, each one of X-10's correctable
// fields. No loan VALUES ride the signal (L-5: they live in PE's lien overrides).
import * as pkg from "../dist/index.js";

const FIELDS = ["balance", "rate", "monthlyPayment", "lender", "newLender", "newRate", "refinancedMonth"];

describe("home-scout.homeowner_loan_corrected · payload schema (strict)", () => {
  const schema = () => {
    assert.ok(pkg.homeScoutHomeownerLoanCorrectedDataSchema, "schema not exported");
    return pkg.homeScoutHomeownerLoanCorrectedDataSchema;
  };

  it("🔴 exports the type constant and the field enum, exactly X-10's correctable fields", () => {
    assert.equal(pkg.HOME_SCOUT_HOMEOWNER_LOAN_CORRECTED_SIGNAL_TYPE, KEY);
    assert.deepEqual([...pkg.HOME_SCOUT_HOMEOWNER_LOAN_CORRECTION_FIELDS], FIELDS);
  });

  it("🔴 a valid payload parses and the parsed value equals the input", () => {
    for (const p of [
      { fields: ["balance"], refinancedElsewhere: false },
      { fields: ["rate", "monthlyPayment"], refinancedElsewhere: false },
      { fields: ["newLender", "newRate", "refinancedMonth"], refinancedElsewhere: true },
      { fields: [...FIELDS], refinancedElsewhere: true },
    ]) {
      assert.deepEqual(schema().parse(p), p);
    }
  });

  it("🔴 an unknown key is refused (strict), including any loan value", () => {
    for (const extra of [{ balance: 250000 }, { leadId: "l1" }, { tenantId: "t1" }, { x: 1 }]) {
      assert.equal(schema().safeParse({ fields: ["balance"], refinancedElsewhere: false, ...extra }).success, false, JSON.stringify(extra));
    }
  });

  it("🔴 an empty fields array is refused", () => {
    assert.equal(schema().safeParse({ fields: [], refinancedElsewhere: true }).success, false);
  });

  it("🔴 a duplicate field name is refused", () => {
    assert.equal(schema().safeParse({ fields: ["rate", "rate"], refinancedElsewhere: false }).success, false);
  });

  it("🔴 a field name outside the enum is refused", () => {
    for (const f of ["originationMonth", "refinancedFrom", "Balance", "interestRate", "", "taxes"]) {
      assert.equal(schema().safeParse({ fields: [f], refinancedElsewhere: false }).success, false, f);
    }
  });

  it("🔴 both keys are required; refinancedElsewhere must be a boolean", () => {
    assert.equal(schema().safeParse({ fields: ["rate"] }).success, false);
    assert.equal(schema().safeParse({ refinancedElsewhere: false }).success, false);
    assert.equal(schema().safeParse({ fields: ["rate"], refinancedElsewhere: "false" }).success, false);
    assert.equal(schema().safeParse({ fields: "rate", refinancedElsewhere: false }).success, false);
    assert.equal(schema().safeParse(null).success, false);
  });
});
