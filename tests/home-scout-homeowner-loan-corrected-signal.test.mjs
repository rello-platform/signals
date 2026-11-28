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
