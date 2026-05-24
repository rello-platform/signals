import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
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
  it("holds the seed (14) + Wave-B NS email lifecycle (3) + the full emitted keyspace (250) = 267 canonical types", () => {
    // v0.6.0 KEYSPACE-SEED: 17 (Wave A/B) + 250 emitted canonical types.
    assert.equal(Object.keys(EXACT_REGISTRY).length, 267);
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
  it("Wave-B: newsletter_studio.email_* (receiver-prefixed underscore) → canonical hyphen slug", () => {
    assert.equal(
      normalizeSignalType("newsletter_studio.email_complained"),
      "newsletter-studio.email_complained",
    );
    assert.equal(
      normalizeSignalType("newsletter_studio.email_unsubscribed"),
      "newsletter-studio.email_unsubscribed",
    );
    assert.equal(
      normalizeSignalType("newsletter_studio.email_bounced"),
      "newsletter-studio.email_bounced",
    );
  });
  it("§2.1 bare compliance. alias → pathfinder-pro.compliance. (PFP bare domain emit)", () => {
    assert.equal(
      normalizeSignalType("compliance.config_changed"),
      "pathfinder-pro.compliance.config_changed",
    );
    assert.equal(
      normalizeSignalType("compliance.gate_blocked"),
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

// ── (c cont.) KEYSPACE-SEED (v0.6.0): forms that were null in Wave A now RESOLVE ─
// These are the exact forms the BPB doc §4 / dispatch §2 called out as inert at
// v0.5.1 (registry held only ~17). The full-keyspace seed un-inerts the
// normalizer: legacy forms now fold to their seeded canonical key. This block is
// the regression proof — flip back to null and the build-guard loses its keyset.
describe("normalizeSignalType — KEYSPACE-SEED un-inerts the normalizer (were null pre-v0.6.0)", () => {
  it("home-ready concat → home-ready.assessment_completed", () => {
    assert.equal(
      normalizeSignalType("homeready.assessment_completed"),
      "home-ready.assessment_completed",
    );
  });
  it("home-ready concat → home-ready.data_stale (33/30d prod silent-kill form)", () => {
    assert.equal(normalizeSignalType("homeready.data_stale"), "home-ready.data_stale");
  });
  it("global namespace score.crossed_60 → identity (seeded)", () => {
    assert.equal(normalizeSignalType("score.crossed_60"), "score.crossed_60");
  });
  it("content-engine hyphen-verb → snake-verb canonical", () => {
    assert.equal(
      normalizeSignalType("content-engine.article-opened"),
      "content-engine.article_opened",
    );
  });
  it("§2.1 mlo. alias → the-drumbeat.mlo.* family", () => {
    assert.equal(
      normalizeSignalType("mlo.rate_lock_celebrated"),
      "the-drumbeat.mlo.rate_lock_celebrated",
    );
  });
  it("pfp.scenario_created → pathfinder-pro.scenario_created (dual-key collapse)", () => {
    assert.equal(
      normalizeSignalType("pfp.scenario_created"),
      "pathfinder-pro.scenario_created",
    );
  });
  it("drumbeat.video_recorded → the-drumbeat.video_recorded (dual-key collapse)", () => {
    assert.equal(
      normalizeSignalType("drumbeat.video_recorded"),
      "the-drumbeat.video_recorded",
    );
  });
  it("bare NS email_opened → newsletter-studio.* via receiver-prefix underscore form", () => {
    assert.equal(
      normalizeSignalType("newsletter_studio.email_opened"),
      "newsletter-studio.email_opened",
    );
  });
  it("signal.tool.* family resolves (Home-Scout global tool namespace)", () => {
    assert.equal(
      normalizeSignalType("signal.tool.get-pre-approved.requested"),
      "signal.tool.get-pre-approved.requested",
    );
  });
  it("harvest_home.email_complained → still null (HH does not emit email_*; not seeded)", () => {
    assert.equal(normalizeSignalType("harvest_home.email_complained"), null);
  });
  it("bare name (no slug) → still null (receiver supplies slug in Wave D)", () => {
    assert.equal(normalizeSignalType("email_opened"), null);
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
  it("maps bare compliance. → pathfinder-pro.compliance. (Wave B; PFP bare domain emit, no-regression read-bridge)", () => {
    assert.equal(
      DEPRECATED_SIGNALTYPE_PREFIX_ALIASES["compliance."].to,
      "pathfinder-pro.compliance.",
    );
    assert.equal(
      DEPRECATED_SIGNALTYPE_PREFIX_ALIASES["compliance."].deprecated,
      true,
    );
  });
});

// ── isGoalShiftSignal (Wave-B fix primitive) ────────────────────────────────
describe("isGoalShiftSignal", () => {
  it("returns false only for registered + goalShiftSemantics:false (compliance)", () => {
    assert.equal(isGoalShiftSignal("pathfinder-pro.compliance.gate_blocked"), false);
    assert.equal(isGoalShiftSignal("pfp.compliance.config_changed"), false); // pfp. alias-folded
    assert.equal(isGoalShiftSignal("compliance.config_changed"), false); // bare compliance. alias-folded (Wave B)
  });
  it("Wave-B FIX: receiver-prefixed newsletter_studio.email_* → false (the live bug form)", () => {
    // Pre-Wave-B these fell through `inferNurtureGoal`'s bare-name set to
    // HOME_PURCHASE → spurious blocked_no_matching_campaign rows (DISCOVERED-
    // NURTURE-GOAL-INFER-IGNORES-SPOKE-PREFIXED-SIGNAL-TYPES-260521). Now
    // normalize→registered→goalShiftSemantics:false short-circuits them.
    assert.equal(isGoalShiftSignal("newsletter_studio.email_complained"), false);
    assert.equal(isGoalShiftSignal("newsletter_studio.email_unsubscribed"), false);
    assert.equal(isGoalShiftSignal("newsletter_studio.email_bounced"), false);
    // canonical hyphen form resolves identically
    assert.equal(isGoalShiftSignal("newsletter-studio.email_complained"), false);
  });
  it("returns true for registered goal-shifting types", () => {
    assert.equal(isGoalShiftSignal("report-engine.report_ready"), true);
    assert.equal(isGoalShiftSignal("harvest_home.lead_intake"), true);
  });
  it("fails open (true) for unregistered / unknown types + the __milo_compose__ sentinel", () => {
    // HH does not emit email_* — this illustrative form is unregistered, so it
    // fail-opens true (correct: nothing emits it into the gate).
    assert.equal(isGoalShiftSignal("harvest_home.email_complained"), true);
    assert.equal(isGoalShiftSignal("totally-unknown.thing"), true);
    assert.equal(isGoalShiftSignal(null), true);
    // The Milo compose-time sentinel MUST fail open so resolveNurtureGoal still
    // runs lead-state inference (byte-identical to today). SPEC §8 decision 9.
    assert.equal(isGoalShiftSignal("__milo_compose__"), true);
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
  it("active count = 262 (267 total − 5 forensic)", () => {
    // 5 forensic (no live emitter): home-scout.lead_magnet_submitted (Wave A),
    // drumbeat-video-engine.video_rendered (repo absent / pre-registered),
    // home-ready.score_calculated + home-ready.score_changed (declared in the
    // emit union but the live emit is home-ready.score_updated — rename drift),
    // home-ready.milo_report_generated (audit §4 DEAD — zero HR refs).
    assert.equal(listActiveSignalTypes().length, 262);
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

// ── (f) dist keyset artifact reflects the seeded keyspace (cross-language net) ─
// The build-guard (Layer 2) + Report-Engine (Python) check emit literals against
// dist/signal-registry-keyset.json. It MUST carry the full active keyspace.
describe("dist/signal-registry-keyset.json — full emitted keyspace", () => {
  const keyset = JSON.parse(
    readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "signal-registry-keyset.json"),
      "utf8",
    ),
  );

  it("exactKeys count == active exact registry entries (262)", () => {
    assert.equal(keyset.exactKeys.length, 262);
    assert.equal(keyset.exactKeys.length, listActiveSignalTypes().length);
  });

  it("familyPrefixes count == 17 (5 explicit + 12 APP_SLUGS audit families)", () => {
    assert.equal(keyset.familyPrefixes.length, 17);
  });

  it("carries the prod silent-kill forms (canonical) that drove this workstream", () => {
    for (const k of [
      "home-ready.data_stale",
      "the-drumbeat.video_message_watched",
      "pathfinder-pro.scenario_created",
      "newsletter-studio.email_opened",
      "newsletter-studio.email_delivered",
    ]) {
      assert.ok(keyset.exactKeys.includes(k), `keyset missing ${k}`);
    }
  });

  it("version stamp is current (0.6.1)", () => {
    assert.equal(keyset.version, "0.6.1");
  });

  // v0.6.1 export-fix: Report-Engine (Python) + CJS consumers (Milo) resolve the
  // keyset via the `./signal-registry-keyset.json` subpath. Before v0.6.1 this
  // threw ERR_PACKAGE_PATH_NOT_EXPORTED (file built but absent from `exports`).
  it("is resolvable via the package subpath export (no ERR_PACKAGE_PATH_NOT_EXPORTED)", async () => {
    const resolved = import.meta.resolve(
      "@rello-platform/signals/signal-registry-keyset.json",
    );
    assert.ok(
      resolved.endsWith("/dist/signal-registry-keyset.json"),
      `unexpected resolution: ${resolved}`,
    );
    const mod = await import(resolved, { with: { type: "json" } });
    assert.equal(mod.default.version, "0.6.1");
    assert.ok(Array.isArray(mod.default.exactKeys));
  });
});
