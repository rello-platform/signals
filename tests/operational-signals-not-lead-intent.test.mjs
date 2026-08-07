// ─────────────────────────────────────────────────────────────────────────────
// OPERATIONAL SIGNALS MUST NOT CARRY A LEAD-INTENT CATEGORY (v0.28.0)
// Greppable token: operational-signals-not-lead-intent-260806
//
// WHY THIS EXISTS
//
// Rello's `readinessTrend` is the MEAN signal weight of a lead's recent week
// against their prior week, and it carries 0.18 in FEATURE_WEIGHTS — the
// second-heaviest of eight conversion features, flowing to ConversionScore and
// thence to Lead.engagementScore. Its query selects every signal on the lead
// with no signalType filter; the only thing keeping a row out is its CATEGORY.
// Rello's `buying_surge` pattern likewise admits by category allow-list
// (READINESS + BEHAVIORAL) at weight >= 7.
//
// So a category is not a label here. It is the access-control list for the
// scoring path.
//
// Four signals describing OUR plumbing were registered BEHAVIORAL:
//
//     rello.nurture_escalate_injection_failed   10
//     rello.nurture_escalate_injected            8
//     pathfinder-pro.export.permanently_failed   7
//     harvest-home.gateway_injection_failed      3
//
// The first three cleared buying_surge's minWeight. So an infrastructure
// failure raised a lead's conversion score for something the lead never did —
// and did it precisely on the leads Rello had just failed to surface, because
// those are the leads our injection failures fire on. Moved to SYSTEM, which
// Rello's NON_LEAD_INTENT_CATEGORIES already excludes.
//
// The guard below is deliberately a NAME-SHAPE guard rather than a list of the
// four. A list would pass forever while the next `*_injection_failed` lands
// BEHAVIORAL — which is exactly how these four got here. If a new operational
// signal legitimately needs a lead-intent category, add it to
// LEAD_ACTION_EXCEPTIONS with a reason, in this file, where the next person
// reviewing the scoring path will read it.
//
// See DISCOVERED-RELLO-INFRASTRUCTURE-FAILURES-INFLATE-LEAD-CONVERSION-SCORES-260805.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EXACT_REGISTRY, normalizeSignalType } from "../dist/index.js";

/** Categories Rello treats as lead intent (i.e. everything except SYSTEM). */
const LEAD_INTENT = (c) => c !== "SYSTEM";

/**
 * Name shapes that describe the platform's own machinery failing or acting,
 * not something a lead did.
 */
const OPERATIONAL_SHAPE =
  /(_injection_failed|_injected$|\.export\.permanently_failed|_handoff_failed|_handoff_exhausted|_dead_letter|_dlq_|retry_exhausted)/i;

/**
 * Signals whose NAME matches the operational shape but which genuinely record a
 * LEAD ACTION. Each needs a reason, because each is a hole in the guard.
 */
const LEAD_ACTION_EXCEPTIONS = new Map([
  [
    "home-scout.injection_cta_clicked",
    "The CTA is injected by us; the CLICK is the lead's. A real readiness " +
      "signal that happens to carry 'injection' in its name.",
  ],
]);

describe("operational signals are not lead-intent", () => {
  it("no operational-shaped signal carries a lead-intent category", () => {
    const offenders = Object.entries(EXACT_REGISTRY)
      .filter(([type]) => OPERATIONAL_SHAPE.test(type))
      .filter(([type]) => !LEAD_ACTION_EXCEPTIONS.has(type))
      .filter(([, def]) => LEAD_INTENT(def.category))
      .map(([type, def]) => `${type} (${def.category}, weight ${def.weight})`);

    assert.deepEqual(
      offenders,
      [],
      "Operational signals found in a lead-intent category. These enter " +
        "Rello's readinessTrend (0.18 of the conversion score) and, at " +
        "weight >= 7, buying_surge — inflating a lead's score for something " +
        "the lead never did:\n  " + offenders.join("\n  "),
    );
  });

  it("the four re-categorised signals resolve to SYSTEM", () => {
    for (const type of [
      "rello.nurture_escalate_injection_failed",
      "rello.nurture_escalate_injected",
      "pathfinder-pro.export.permanently_failed",
      "harvest-home.gateway_injection_failed",
    ]) {
      assert.equal(EXACT_REGISTRY[type].category, "SYSTEM", type);
    }
  });

  it("the underscore emit form still folds to the hyphen entry", () => {
    // Harvest Home emits `harvest_home.gateway_injection_failed`; the registry
    // holds the hyphen form. If this fold ever breaks, the signal stops
    // resolving and silently reverts to DEFAULT classification — which would
    // put it back into a lead-intent category by another route.
    const n = normalizeSignalType("harvest_home.gateway_injection_failed");
    assert.equal(n, "harvest-home.gateway_injection_failed");
    assert.equal(EXACT_REGISTRY[n].category, "SYSTEM");
  });

  it("every exception carries a stated reason", () => {
    for (const [type, reason] of LEAD_ACTION_EXCEPTIONS) {
      assert.ok(EXACT_REGISTRY[type], `${type} is not in the registry`);
      assert.ok(
        reason && reason.length > 30,
        `${type} needs a real reason, not a placeholder`,
      );
    }
  });
});
