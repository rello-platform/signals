import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EXACT_REGISTRY,
  FAMILY_REGISTRY,
  SIGNAL_CATEGORIES,
  isSignalCategory,
  normalizeSignalType,
  DEPRECATED_SIGNALTYPE_PREFIX_ALIASES,
  isGoalShiftSignal,
  listActiveSignalTypes,
  isNarrativeMaterial,
  shouldAblyBroadcast,
} from "../dist/index.js";

// ── (a) per-entry completeness — EXACT_REGISTRY ─────────────────────────────
describe("EXACT_REGISTRY — per-entry completeness", () => {
  it("holds the seed canonical types (14 — the full src/signal-type.ts union; docs label '13', a known miscount)", () => {
    assert.equal(Object.keys(EXACT_REGISTRY).length, 14);
  });

  it("every entry declares weight(1-10) + category + goalShiftSemantics + lifecycle, and key matches .type", () => {
    for (const [key, entry] of Object.entries(EXACT_REGISTRY)) {
      assert.equal(entry.type, key, `${key}: entry.type must equal its key`);
      assert.equal(
        typeof entry.weight,
        "number",
        `${key}: weight must be a number`,
      );
      assert.ok(
        entry.weight >= 1 && entry.weight <= 10,
        `${key}: weight ${entry.weight} out of 1-10`,
      );
      assert.ok(
        SIGNAL_CATEGORIES.includes(entry.category),
        `${key}: category ${entry.category} not canonical`,
      );
      assert.equal(
        typeof entry.goalShiftSemantics,
        "boolean",
        `${key}: goalShiftSemantics must be boolean`,
      );
      assert.ok(
        entry.lifecycle === "active" || entry.lifecycle === "forensic",
        `${key}: lifecycle ${entry.lifecycle} invalid`,
      );
    }
  });

  it("seeds the known forensic entry (home-scout.lead_magnet_submitted)", () => {
    assert.equal(
      EXACT_REGISTRY["home-scout.lead_magnet_submitted"].lifecycle,
      "forensic",
    );
  });
});

// ── (b) per-entry completeness — FAMILY_REGISTRY ────────────────────────────
describe("FAMILY_REGISTRY — per-entry completeness", () => {
  it("every family has a prefix ending in '.' + weight + category + goalShiftSemantics + lifecycle", () => {
    assert.ok(FAMILY_REGISTRY.length >= 3, "expected the seed families");
    for (const family of FAMILY_REGISTRY) {
      assert.ok(
        family.prefix.endsWith("."),
        `family prefix "${family.prefix}" must end with '.'`,
      );
      assert.equal(typeof family.weight, "number");
      assert.ok(SIGNAL_CATEGORIES.includes(family.category));
      assert.equal(typeof family.goalShiftSemantics, "boolean");
      assert.ok(
        family.lifecycle === "active" || family.lifecycle === "forensic",
      );
    }
  });

  it("registers the canonical-fold scout CTA family + upsell + audit families", () => {
    const prefixes = FAMILY_REGISTRY.map((f) => f.prefix);
    // canonical, NOT legacy `scout.cta_clicked.` (normalizeSlug folds scout→home-scout)
    assert.ok(prefixes.includes("home-scout.cta_clicked."));
    assert.ok(prefixes.includes("the-drumbeat.upsell."));
    assert.ok(prefixes.includes("harvest-home.audit."));
    assert.ok(prefixes.includes("pathfinder-pro.audit."));
  });
});

// ── SignalCategory promotion + drift ────────────────────────────────────────
describe("SignalCategory — promoted 8-value vocabulary", () => {
  it("exports exactly the 8 canonical categories", () => {
    assert.deepEqual(
      [...SIGNAL_CATEGORIES],
      [
        "ENGAGEMENT",
        "READINESS",
        "ANXIETY",
        "FINANCIAL",
        "BEHAVIORAL",
        "NEGATIVE",
        "SYSTEM",
        "ESCALATION",
      ],
    );
  });
  it("isSignalCategory accepts canonical, rejects lowercase + unknown + non-string", () => {
    assert.equal(isSignalCategory("ENGAGEMENT"), true);
    assert.equal(isSignalCategory("engagement"), false);
    assert.equal(isSignalCategory("URGENT"), false);
    assert.equal(isSignalCategory(3), false);
    assert.equal(isSignalCategory(null), false);
  });
});

// ── (c) normalizeSignalType round-trips (seeded → canonical, non-null) ───────
describe("normalizeSignalType — seeded forms fold to canonical (non-null)", () => {
  it("form 1 canonical identity", () => {
    assert.equal(
      normalizeSignalType("report-engine.report_ready"),
      "report-engine.report_ready",
    );
  });
  it("form 2 legacy underscore → hyphen slug", () => {
    assert.equal(
      normalizeSignalType("harvest_home.lead_intake"),
      "harvest-home.lead_intake",
    );
  });
  it("form 3 concat → hyphen slug", () => {
    assert.equal(
      normalizeSignalType("openhousehub.attendee_marked_for_pfp_preapproval"),
      "open-house-hub.attendee_marked_for_pfp_preapproval",
    );
    assert.equal(
      normalizeSignalType("homescout.lead_magnet_submitted"),
      "home-scout.lead_magnet_submitted",
    );
  });
  it("§2.1 pfp. alias → pathfinder-pro. (seeded target)", () => {
    assert.equal(
      normalizeSignalType("pfp.export.queued"),
      "pathfinder-pro.export.queued",
    );
    assert.equal(
      normalizeSignalType("pfp.compliance.gate_blocked"),
      "pathfinder-pro.compliance.gate_blocked",
    );
  });
  it("family fold: scout→home-scout slug + hyphen→underscore verb (cta_clicked family)", () => {
    assert.equal(
      normalizeSignalType("scout.cta_clicked.book-a-call"),
      "home-scout.cta_clicked.book_a_call",
    );
  });
  it("family fold: audit family (underscore-form slug → canonical)", () => {
    assert.equal(
      normalizeSignalType("harvest_home.audit.intake.created"),
      "harvest-home.audit.intake.created",
    );
  });
  it("family fold: the-drumbeat.upsell family with hyphen-seam verb", () => {
    assert.equal(
      normalizeSignalType("the-drumbeat.upsell.pages-create-custom.clicked"),
      "the-drumbeat.upsell.pages_create_custom.clicked",
    );
  });
});

// ── (c cont.) documented Wave-A null behavior for not-yet-seeded forms ───────
// The SPEC §2.2 table's remaining illustrative forms target keys that are NOT
// in the Wave-A 13-exact + 3-family seed. They correctly resolve to null in
// Wave A (dispatch §2: "expect null + a warn; that's correct for Wave A"). Their
// canonical targets land with the Wave C keyspace / Wave D emit canonicalization.
describe("normalizeSignalType — not-yet-seeded forms → null (Wave A boundary)", () => {
  it("home-ready concat (Wave C keyspace)", () => {
    assert.equal(normalizeSignalType("homeready.assessment_completed"), null);
  });
  it("global namespace (Wave C keyspace — no global keys seeded in A)", () => {
    assert.equal(normalizeSignalType("score.crossed_60"), null);
  });
  it("content-engine hyphen-verb (Wave C)", () => {
    assert.equal(normalizeSignalType("content-engine.article-opened"), null);
  });
  it("§2.1 mlo. alias substitutes but the-drumbeat.mlo.* family is Wave D → null", () => {
    assert.equal(normalizeSignalType("mlo.rate_lock_celebrated"), null);
  });
  it("pfp.scenario_created → pathfinder-pro.scenario_created not in 13 seed → null", () => {
    assert.equal(normalizeSignalType("pfp.scenario_created"), null);
  });
  it("harvest_home.email_complained not seeded (arrives Wave B) → null", () => {
    assert.equal(normalizeSignalType("harvest_home.email_complained"), null);
  });
});

// ── (e) malformed / unrecognized inputs ─────────────────────────────────────
describe("normalizeSignalType — guards", () => {
  it("null / undefined / empty → null (no throw)", () => {
    assert.equal(normalizeSignalType(null), null);
    assert.equal(normalizeSignalType(undefined), null);
    assert.equal(normalizeSignalType(""), null);
    assert.equal(normalizeSignalType("   "), null);
  });
  it("unrecognized slug → null", () => {
    assert.equal(normalizeSignalType("not-a-real-app.foo_happened"), null);
  });
  it("bare name (no namespace) → null (receiver supplies slug in Wave D)", () => {
    assert.equal(normalizeSignalType("email_opened"), null);
  });
});

// ── §2.1 deprecated prefix-alias map ────────────────────────────────────────
describe("DEPRECATED_SIGNALTYPE_PREFIX_ALIASES", () => {
  it("maps pfp. → pathfinder-pro. (deprecated)", () => {
    assert.equal(DEPRECATED_SIGNALTYPE_PREFIX_ALIASES["pfp."].to, "pathfinder-pro.");
    assert.equal(DEPRECATED_SIGNALTYPE_PREFIX_ALIASES["pfp."].deprecated, true);
  });
  it("maps mlo. → the-drumbeat.mlo. (deprecated; Q-mlo / decision 24)", () => {
    assert.equal(
      DEPRECATED_SIGNALTYPE_PREFIX_ALIASES["mlo."].to,
      "the-drumbeat.mlo.",
    );
    assert.equal(DEPRECATED_SIGNALTYPE_PREFIX_ALIASES["mlo."].deprecated, true);
  });
});

// ── isGoalShiftSignal (Wave-B fix primitive) ────────────────────────────────
describe("isGoalShiftSignal", () => {
  it("returns false only for registered + goalShiftSemantics:false (compliance)", () => {
    assert.equal(isGoalShiftSignal("pathfinder-pro.compliance.gate_blocked"), false);
    assert.equal(isGoalShiftSignal("pfp.compliance.config_changed"), false); // alias-folded
  });
  it("returns true for registered goal-shifting types", () => {
    assert.equal(isGoalShiftSignal("report-engine.report_ready"), true);
    assert.equal(isGoalShiftSignal("harvest_home.lead_intake"), true);
  });
  it("fails open (true) for unregistered / unknown types", () => {
    assert.equal(isGoalShiftSignal("harvest_home.email_complained"), true);
    assert.equal(isGoalShiftSignal("totally-unknown.thing"), true);
    assert.equal(isGoalShiftSignal(null), true);
  });
});

// ── (d) listActiveSignalTypes — admin SOT denominator ───────────────────────
describe("listActiveSignalTypes", () => {
  it("returns exactly the active exact seed set (forensic excluded)", () => {
    const expected = Object.entries(EXACT_REGISTRY)
      .filter(([, e]) => e.lifecycle === "active")
      .map(([k]) => k)
      .sort();
    assert.deepEqual([...listActiveSignalTypes()].sort(), expected);
  });
  it("excludes the forensic home-scout.lead_magnet_submitted", () => {
    assert.ok(!listActiveSignalTypes().includes("home-scout.lead_magnet_submitted"));
  });
  it("active count = 13 (14 seed − 1 forensic)", () => {
    assert.equal(listActiveSignalTypes().length, 13);
  });
});

// ── derived-default helpers (mirror classifier.ts:75 / ably-publisher.ts:24) ─
describe("isNarrativeMaterial", () => {
  it("ANXIETY / NEGATIVE / ESCALATION always material (any weight)", () => {
    assert.equal(isNarrativeMaterial("ANXIETY", 1), true);
    assert.equal(isNarrativeMaterial("NEGATIVE", 1), true);
    assert.equal(isNarrativeMaterial("ESCALATION", 1), true);
  });
  it("FINANCIAL / READINESS / BEHAVIORAL material iff weight >= 5", () => {
    assert.equal(isNarrativeMaterial("BEHAVIORAL", 5), true);
    assert.equal(isNarrativeMaterial("BEHAVIORAL", 4), false);
    assert.equal(isNarrativeMaterial("READINESS", 5), true);
    assert.equal(isNarrativeMaterial("FINANCIAL", 4), false);
  });
  it("ENGAGEMENT never material", () => {
    assert.equal(isNarrativeMaterial("ENGAGEMENT", 10), false);
  });
});

describe("shouldAblyBroadcast", () => {
  it("only CRITICAL + HIGH broadcast", () => {
    assert.equal(shouldAblyBroadcast("CRITICAL"), true);
    assert.equal(shouldAblyBroadcast("HIGH"), true);
    assert.equal(shouldAblyBroadcast("MEDIUM"), false);
    assert.equal(shouldAblyBroadcast("LOW"), false);
  });
});
