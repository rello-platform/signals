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
  LEGACY_SIGNALTYPE_EXACT_ALIASES,
  isGoalShiftSignal,
  listActiveSignalTypes,
  isNarrativeMaterial,
  shouldAblyBroadcast,
} from "../dist/index.js";

// ── (a) per-entry completeness — EXACT_REGISTRY ─────────────────────────────
describe("EXACT_REGISTRY — per-entry completeness", () => {
  it("holds the seed (14) + Wave-B NS email (3) + v0.6.0 keyspace (250) + PHASE-B1 violation types (29) + PHASE-B1B corrections (2) + HS-22-VERBS (22) + PR-B-α canonical (3) + PQP doc-mirror (1) = 327 canonical types (+3 OHH attendee tuples: attendee_signed_in/attendee_assessment_completed/lead_interested)", () => {
    // v0.6.0 KEYSPACE-SEED: 17 (Wave A/B) + 250 emitted canonical types.
    // PHASE-B1 (v0.7.0): +29 build-guard violation-list types
    // (bucket 3 = 15 tier:telemetry, bucket 2 = 9 active, bucket 4 = 5 global).
    // PHASE-B1B (v0.7.1): +2 — `email.received` (global) + `rello.ticket_created`.
    // (Also reclassifies rello.call_completed/exhausted telemetry→ENGAGEMENT,
    // so bucket-3 telemetry drops 15→13; no count change.)
    // SIGNALS-ADD-HS-22-VERBS (v0.8.0): +22 emitted HS verbs the keyspace seed
    // missed (all DEFAULT, no constants row, Wave-C reclass) — unblocks the
    // SPOKE-FLIP-HS held-flip (PR #7 `// HOLD:`).
    // PR-B-α (v0.9.0): +3 canonical types consumed by the today-intent classifier
    // (rello.anniversary + property-engine.listing_under_contract +
    // property-engine.listing_went_live). All lifecycle:"forensic" — registered
    // ahead of their emitters (emit deferred: PE Spark MLS key / anniversary cron
    // spec TBD), so they DON'T enter the active-coverage denominator.
    // PQP doc-mirror (v0.11.0): +1 — `prequal-pro.document_uploaded` (RELLO-PQP
    // document-mirror workstream; lifecycle:"active", weight 8 / READINESS / HIGH,
    // mirrors home-ready./home-stretch.document_uploaded). PQP is intentionally
    // NOT a platform app (L7 lock) — hand-authored canonical registry key.
    // RATE-ENGINE (v0.12.0): +1 — `rate.changed` (Rate Engine canonical
    // tenant-agnostic market-move broadcast; internal-signal axis paired with
    // the `rate.changed` webhook event; SYSTEM / weight 1 / HIGH / goalShift:false).
    // HOME-READY-INTENT-TARGET-CROSSED (v0.13.0): +1 —
    // `home-ready.intent_target_crossed` (HomeReady emits when the readiness
    // metric crosses the "ready" threshold upward = move-up-buy intent; live
    // emitter HomeReady @ b0e4269; READINESS / weight 8 / HIGH / goalShift:true;
    // lifecycle:"active" — consumed by Rello's today-intent classifier).
    // v0.15.0 (CROSS-REPO-WALK-DECISIONS-260609 Q2 + Q6 step 1): +25 —
    // `rello.lead_phone_disconnected` (Q2; Twilio delivery-failure detection,
    // registered ahead of the Rello emit PR) + 24 canonical `harvest-home.*`
    // targets for HH's live legacy `signal.*` emit set (Q6; legacy rows kept
    // as read-bridge, so total grows by the full 24).
    // OHH-SHOWINGS-AND-TOURS (v0.16.0): +6 — `open-house-hub.showing_*`
    // (requested/confirmed/canceled/completed/no_show/feedback) lifecycle
    // family, all BEHAVIORAL / goalShift:true / lifecycle:"active" with
    // explicit curated weights (8/9/4/7/5/9), so 354→360.
    assert.equal(Object.keys(EXACT_REGISTRY).length, 360);
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
      // Families end on a segment delimiter — `.` (the common case) or `_`
      // (threshold/suffix families like PHASE-B1 `score.crossed_`, whose
      // variable tail is appended in-segment). See SignalTypeFamily.prefix.
      assert.ok(
        family.prefix.endsWith(".") || family.prefix.endsWith("_"),
        `family prefix "${family.prefix}" must end with '.' or '_'`,
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

// ── PHASE-B1 (v0.7.0): build-guard violation-list types now resolve ──────────
// The additive half of clearing the Layer-2 79-violation shadow report. These
// forms were VIOLATIONS (normalizeSignalType → null) before v0.7.0; registering
// them un-violates the additive cases. Bare-legacy seed-rule retires + the
// test-harness/internal-monitoring allowlists are the sibling Phase B2.
describe("normalizeSignalType — PHASE-B1 violation types now resolve", () => {
  it("bucket 3: bare ops names canonicalize to rello.<verb> (identity at canonical)", () => {
    assert.equal(normalizeSignalType("rello.cost_drift"), "rello.cost_drift");
    assert.equal(
      normalizeSignalType("rello.trigger_dev_poll_circuit_broken"),
      "rello.trigger_dev_poll_circuit_broken",
    );
  });
  it("bucket 3: already-namespaced ops forms keep their namespace", () => {
    assert.equal(
      normalizeSignalType("daily_plan.item_injected"),
      "daily_plan.item_injected", // daily_plan. global prefix
    );
    assert.equal(normalizeSignalType("consent.revoked"), "consent.revoked");
    assert.equal(
      normalizeSignalType("milo-engine.composition_pipeline_failed"),
      "milo-engine.composition_pipeline_failed",
    );
    assert.equal(
      normalizeSignalType("rello.pe_enrichment"),
      "rello.pe_enrichment",
    );
  });
  it("bucket 3 types are tier:'telemetry' + goalShiftSemantics:false (SYSTEM)", () => {
    const entry = EXACT_REGISTRY["rello.cost_drift"];
    assert.equal(entry.tier, "telemetry");
    assert.equal(entry.goalShiftSemantics, false);
    assert.equal(entry.category, "SYSTEM");
    assert.equal(entry.weight, 1);
    // telemetry monitoring must NOT shift nurture goals
    assert.equal(isGoalShiftSignal("rello.cost_drift"), false);
    assert.equal(isGoalShiftSignal("consent.revoked"), false);
  });
  it("bucket 2: underscore/concat slug forms fold to hyphen-canonical", () => {
    assert.equal(
      normalizeSignalType("open_house_hub.checkin"),
      "open-house-hub.checkin",
    );
    assert.equal(
      normalizeSignalType("open-house-hub.checkin_created"),
      "open-house-hub.checkin_created",
    );
    assert.equal(
      normalizeSignalType("harvest_home.gateway_injection_failed"),
      "harvest-home.gateway_injection_failed",
    );
    assert.equal(
      normalizeSignalType("harvesthome.leads_imported"),
      "harvest-home.leads_imported",
    );
    assert.equal(
      normalizeSignalType("home-stretch.lead_inactive"),
      "home-stretch.lead_inactive",
    );
    assert.equal(
      normalizeSignalType("newsletter-studio.email_forwarded"),
      "newsletter-studio.email_forwarded",
    );
  });
  it("bucket 4: global first-class forms resolve (agent./rate./data./signal.)", () => {
    assert.equal(
      normalizeSignalType("agent.action_completed"),
      "agent.action_completed",
    );
    assert.equal(
      normalizeSignalType("agent.action_skipped"),
      "agent.action_skipped",
    );
    assert.equal(
      normalizeSignalType("rate.alert_triggered"),
      "rate.alert_triggered",
    );
    assert.equal(normalizeSignalType("data.stale"), "data.stale");
    // v0.15.0 (Q6): `signal.credits.purchased` is a LIVE HH emit
    // (webhooks/rello/route.ts:122) so it now folds to its canonical
    // `harvest-home.*` target via LEGACY_SIGNALTYPE_EXACT_ALIASES instead of
    // resolving to its kept-as-read-bridge legacy registry row.
    assert.equal(
      normalizeSignalType("signal.credits.purchased"),
      "harvest-home.credits_purchased",
    );
  });
  it("bucket 5: score.crossed_<threshold> family covers seeded 60/80 + future", () => {
    // seeded exacts still resolve by identity (EXACT_REGISTRY)
    assert.equal(normalizeSignalType("score.crossed_60"), "score.crossed_60");
    assert.equal(normalizeSignalType("score.crossed_80"), "score.crossed_80");
    // future threshold resolves via the score.crossed_ family (was null pre-B1)
    assert.equal(normalizeSignalType("score.crossed_90"), "score.crossed_90");
    assert.equal(normalizeSignalType("score.crossed_75"), "score.crossed_75");
  });
});

// ── PHASE-B1B (v0.7.1): call_* reclassify + email.received/ticket_created ─────
// B1 mis-bucketed rello.call_completed/exhausted as telemetry; they are real
// lead-ENGAGEMENT signals (constants.ts call_completed:7/ENGAGEMENT). This block
// is the regression proof for the reclassification + the two new real types.
describe("normalizeSignalType — PHASE-B1B corrections", () => {
  it("rello.call_completed reclassified telemetry→ENGAGEMENT/w7 (no telemetry tier)", () => {
    const entry = EXACT_REGISTRY["rello.call_completed"];
    assert.equal(entry.category, "ENGAGEMENT");
    assert.equal(entry.weight, 7); // constants.ts:39/387
    assert.equal(entry.tier, undefined); // tier:"telemetry" removed
    assert.equal(entry.goalShiftSemantics, true);
    assert.equal(entry.lifecycle, "active");
    // resolves by identity (dotted) with the engagement classification
    assert.equal(
      normalizeSignalType("rello.call_completed"),
      "rello.call_completed",
    );
    assert.equal(isGoalShiftSignal("rello.call_completed"), true);
  });
  it("rello.call_exhausted reclassified telemetry→ENGAGEMENT/w7 (no telemetry tier)", () => {
    const entry = EXACT_REGISTRY["rello.call_exhausted"];
    assert.equal(entry.category, "ENGAGEMENT");
    assert.equal(entry.weight, 7);
    assert.equal(entry.tier, undefined);
    assert.equal(entry.goalShiftSemantics, true);
    assert.equal(entry.lifecycle, "active");
  });
  it("email.received resolves as a global first-class ENGAGEMENT key", () => {
    // `email.` is a GLOBAL_PREFIX (not a slug); the live bare-dotted emit
    // resolves with no emit-flip owed.
    assert.equal(normalizeSignalType("email.received"), "email.received");
    const entry = EXACT_REGISTRY["email.received"];
    assert.equal(entry.category, "ENGAGEMENT");
    assert.equal(entry.weight, 1);
    assert.equal(entry.tier, undefined);
  });
  it("rello.ticket_created resolves (BEHAVIORAL/w5); bare ticket_created stays null (emit-flip owed)", () => {
    assert.equal(
      normalizeSignalType("rello.ticket_created"),
      "rello.ticket_created",
    );
    const entry = EXACT_REGISTRY["rello.ticket_created"];
    assert.equal(entry.category, "BEHAVIORAL");
    assert.equal(entry.weight, 5);
    // dotless bare form cannot fold (no slug) — the B2-style emit-flip is owed
    assert.equal(normalizeSignalType("ticket_created"), null);
  });
});

// ── SIGNALS-ADD-HS-22-VERBS (v0.8.0): the 22 emitted HS verbs now resolve ─────
// HS emits 39 canonical `home-stretch.<verb>`; the v0.6.0 keyspace seed only
// captured 17. These 22 (5 SIGNAL_TYPES + 12 HOMESTRETCH_EVENTS + 5 inline route
// literals) resolved to `null` before v0.8.0 — the SPOKE-FLIP-HS flip HELD them
// as concat (`// HOLD:`, PR #7). This block is the regression proof: flip a key
// back out of EXACT_REGISTRY and the held HS flip loses its registry foundation.
describe("normalizeSignalType — SIGNALS-ADD-HS-22-VERBS resolutions", () => {
  const HS_22 = [
    "home-stretch.chat_session",
    "home-stretch.chat_completed",
    "home-stretch.dream_profile_updated",
    "home-stretch.pillar_status_changed",
    "home-stretch.track_selected",
    "home-stretch.registered",
    "home-stretch.module_stalled",
    "home-stretch.milestone_reached",
    "home-stretch.points_earned",
    "home-stretch.login_streak",
    "home-stretch.credit_analyzed",
    "home-stretch.savings_milestone",
    "home-stretch.preapproval_started",
    "home-stretch.preapproval_approved",
    "home-stretch.inactive",
    "home-stretch.ready_to_buy",
    "home-stretch.under_contract",
    "home-stretch.guest_mlo_message_sent",
    "home-stretch.guest_mlo_note_added",
    "home-stretch.guest_mlo_eligibility_decision",
    "home-stretch.prospect_invited",
    "home-stretch.prospect_invitation_sms_requested",
  ];

  it("registers exactly 22 verbs", () => {
    assert.equal(HS_22.length, 22);
  });

  it("all 22 resolve by identity (were null pre-v0.8.0)", () => {
    for (const t of HS_22) {
      assert.equal(normalizeSignalType(t), t, `${t} must resolve to itself`);
    }
  });

  it("all 22 carry the DEFAULT metadata (weight 3 / BEHAVIORAL / goalShift / active)", () => {
    for (const t of HS_22) {
      const entry = EXACT_REGISTRY[t];
      assert.ok(entry, `${t} missing from EXACT_REGISTRY`);
      assert.equal(entry.weight, 3, `${t} weight`);
      assert.equal(entry.category, "BEHAVIORAL", `${t} category`);
      assert.equal(entry.goalShiftSemantics, true, `${t} goalShiftSemantics`);
      assert.equal(entry.lifecycle, "active", `${t} lifecycle`);
      assert.equal(entry.tier, undefined, `${t} should carry no tier`);
    }
  });

  it("isGoalShiftSignal is true for all 22 (non-SYSTEM behavioral)", () => {
    for (const t of HS_22) {
      assert.equal(isGoalShiftSignal(t), true, `${t} should goal-shift`);
    }
  });
});

// ── HOME-READY-INTENT-TARGET-CROSSED (v0.13.0) ──────────────────────────────
// HomeReady emits `home-ready.intent_target_crossed` (live @ b0e4269) when the
// readiness metric crosses the "ready" threshold upward (move-up-buy intent).
// Rello's today-intent classifier maps it to "MOVE_UP_BUY". Registering it
// makes the type first-class at the /api/signals/batch receiver (no longer
// dropped downstream as unregistered).
describe("normalizeSignalType — home-ready.intent_target_crossed (v0.13.0)", () => {
  it("resolves by identity (canonical)", () => {
    assert.equal(
      normalizeSignalType("home-ready.intent_target_crossed"),
      "home-ready.intent_target_crossed",
    );
  });
  it("homeready concat slug folds to canonical hyphen slug", () => {
    assert.equal(
      normalizeSignalType("homeready.intent_target_crossed"),
      "home-ready.intent_target_crossed",
    );
  });
  it("carries READINESS / weight 8 / HIGH / goalShift:true / active", () => {
    const entry = EXACT_REGISTRY["home-ready.intent_target_crossed"];
    assert.equal(entry.category, "READINESS");
    assert.equal(entry.weight, 8);
    assert.equal(entry.priority, "HIGH");
    assert.equal(entry.goalShiftSemantics, true);
    assert.equal(entry.lifecycle, "active");
    assert.equal(entry.tier, undefined);
    // a READINESS weight-8 intent cross is narrative-material + Ably-broadcast
    assert.equal(isNarrativeMaterial(entry.category, entry.weight), true);
    assert.equal(shouldAblyBroadcast(entry.priority), true);
    assert.equal(isGoalShiftSignal("home-ready.intent_target_crossed"), true);
  });
});

// ── RELLO-LEAD-PHONE-DISCONNECTED (v0.15.0; CROSS-REPO-WALK Q2) ─────────────
// Rello emits on Twilio MessageStatus=failed + ErrorCode ∈ {30003,30005,30006}
// via the SMS delivery-status webhook (MessageSid idempotency key). HH's
// ReplacementClaim receiver consumes it (checkPhoneDisconnected). Registered
// BEFORE the Rello emit PR — the armed check:signal-types gate blocks
// unregistered emits. Metadata mirrors the closest negative-lead-contactability
// sibling (newsletter-studio.email_complained: NEGATIVE / HIGH / goalShift:false).
describe("rello.lead_phone_disconnected (v0.15.0, Q2)", () => {
  it("resolves by identity (canonical)", () => {
    assert.equal(
      normalizeSignalType("rello.lead_phone_disconnected"),
      "rello.lead_phone_disconnected",
    );
  });
  it("carries NEGATIVE / weight 7 / HIGH / goalShift:false / active", () => {
    const entry = EXACT_REGISTRY["rello.lead_phone_disconnected"];
    assert.equal(entry.category, "NEGATIVE");
    assert.equal(entry.weight, 7);
    assert.equal(entry.priority, "HIGH");
    assert.equal(entry.goalShiftSemantics, false);
    assert.equal(entry.lifecycle, "active");
    assert.equal(entry.tier, undefined);
    // NEGATIVE is always narrative-material; HIGH broadcasts; contactability
    // loss must NOT shift the nurture goal.
    assert.equal(isNarrativeMaterial(entry.category, entry.weight), true);
    assert.equal(shouldAblyBroadcast(entry.priority), true);
    assert.equal(isGoalShiftSignal("rello.lead_phone_disconnected"), false);
  });
  it("enters the active keyset (the armed check:signal-types gate input)", () => {
    assert.ok(
      listActiveSignalTypes().includes("rello.lead_phone_disconnected"),
    );
  });
});

// ── OHH-SHOWINGS-AND-TOURS (v0.16.0) ─────────────────────────────────────────
// OHH showing/tour lifecycle family — 6 hyphen-canonical types with explicit
// curated weights (NOT bucket-2 DEFAULT seeds). All BEHAVIORAL (high-intent
// lead behavior; mirrors the OHH attendee tuple + rello.meeting_canceled/
// no_show) / goalShift:true (real lead signals; showing_feedback explicitly
// redirects nurture per dispatch) / lifecycle:"active". No `priority` —
// weight-band derivation applies (mirrors attendee_signed_in).
describe("open-house-hub.showing_* family (v0.16.0, OHH-SHOWINGS-AND-TOURS)", () => {
  const expected = {
    "open-house-hub.showing_requested": 8,
    "open-house-hub.showing_confirmed": 9,
    "open-house-hub.showing_canceled": 4,
    "open-house-hub.showing_completed": 7,
    "open-house-hub.showing_no_show": 5,
    "open-house-hub.showing_feedback": 9,
  };
  it("all 6 resolve by identity (canonical hyphen slug)", () => {
    for (const t of Object.keys(expected)) {
      assert.equal(normalizeSignalType(t), t);
    }
  });
  it("underscore-slug emits fold to the hyphen canonical", () => {
    assert.equal(
      normalizeSignalType("open_house_hub.showing_requested"),
      "open-house-hub.showing_requested",
    );
  });
  it("all 6 carry BEHAVIORAL / curated weight / goalShift:true / active, no priority", () => {
    for (const [t, weight] of Object.entries(expected)) {
      const entry = EXACT_REGISTRY[t];
      assert.equal(entry.category, "BEHAVIORAL", `${t} category`);
      assert.equal(entry.weight, weight, `${t} weight`);
      assert.equal(entry.goalShiftSemantics, true, `${t} goalShift`);
      assert.equal(entry.lifecycle, "active", `${t} lifecycle`);
      assert.equal(entry.priority, undefined, `${t} priority (weight-band derived)`);
      assert.equal(entry.tier, undefined, `${t} tier`);
      assert.equal(isGoalShiftSignal(t), true, `${t} isGoalShiftSignal`);
    }
  });
  it("BEHAVIORAL narrative-material derivation: weight>=5 material, canceled (4) not", () => {
    assert.equal(isNarrativeMaterial("BEHAVIORAL", expected["open-house-hub.showing_requested"]), true);
    assert.equal(isNarrativeMaterial("BEHAVIORAL", expected["open-house-hub.showing_canceled"]), false);
  });
  it("all 6 enter the active keyset (the armed check:signal-types gate input)", () => {
    const active = listActiveSignalTypes();
    for (const t of Object.keys(expected)) {
      assert.ok(active.includes(t), `active keyset missing ${t}`);
    }
  });
});

// ── HH-LEGACY-CANONICAL-ALIASES (v0.15.0; CROSS-REPO-WALK Q6 step 1) ─────────
// HH's 24 LIVE legacy `signal.*` emit types (grep of Harvest-Home origin/main
// @ a40e4db) fold to canonical `harvest-home.<snake_verb>` single-dot form via
// LEGACY_SIGNALTYPE_EXACT_ALIASES. Legacy registry rows are KEPT (read-bridge
// for historical SignalLog rows; Phase-3 retirement per registry doc §9).
// Manifest-only never-emitted types (e.g. signal.lead.enriched) are NOT
// aliased; the dynamic signal.tool.* family is untouched.
describe("normalizeSignalType — HH legacy signal.* → harvest-home.* (v0.15.0, Q6)", () => {
  const HH_LEGACY_TO_CANONICAL = {
    "signal.byol.leads_imported": "harvest-home.byol_leads_imported",
    "signal.byol.leads_reactivated": "harvest-home.byol_leads_reactivated",
    "signal.byol.monitoring_started": "harvest-home.byol_monitoring_started",
    "signal.byol.parked_lead_signal_detected":
      "harvest-home.byol_parked_lead_signal_detected",
    "signal.byol.parked_leads_resurfaced":
      "harvest-home.byol_parked_leads_resurfaced",
    "signal.byol.push_calls_completed":
      "harvest-home.byol_push_calls_completed",
    "signal.byol.scoring_completed": "harvest-home.byol_scoring_completed",
    "signal.byol.upload_completed": "harvest-home.byol_upload_completed",
    "signal.credits.purchased": "harvest-home.credits_purchased",
    "signal.discovery.search": "harvest-home.discovery_search",
    "signal.discovery.unlock": "harvest-home.discovery_unlock",
    "signal.hh.idg_retry_synced": "harvest-home.idg_retry_synced",
    "signal.intake.lead_created": "harvest-home.intake_lead_created",
    "signal.intake.lead_enriched": "harvest-home.intake_lead_enriched",
    "signal.intake.lead_merged": "harvest-home.intake_lead_merged",
    "signal.intake.lead_rescored": "harvest-home.intake_lead_rescored",
    "signal.lead.contacted": "harvest-home.lead_contacted",
    "signal.lead.converted": "harvest-home.lead_converted",
    "signal.lead.delivered": "harvest-home.lead_delivered",
    "signal.lead.purchased": "harvest-home.lead_purchased",
    "signal.lead.scored": "harvest-home.lead_scored",
    "signal.pipeline.call_outcome": "harvest-home.pipeline_call_outcome",
    "signal.pipeline.session_completed":
      "harvest-home.pipeline_session_completed",
    "signal.pipeline.session_started":
      "harvest-home.pipeline_session_started",
  };

  it("the alias map export carries exactly the 24 live legacy types", () => {
    assert.deepEqual(
      Object.entries(LEGACY_SIGNALTYPE_EXACT_ALIASES).sort(),
      Object.entries(HH_LEGACY_TO_CANONICAL).sort(),
    );
  });

  it("every live legacy form folds to its canonical harvest-home.* key", () => {
    for (const [legacy, canonical] of Object.entries(HH_LEGACY_TO_CANONICAL)) {
      assert.equal(
        normalizeSignalType(legacy),
        canonical,
        `${legacy} must fold to ${canonical}`,
      );
    }
  });

  it("canonical forms resolve by identity (registered exact keys)", () => {
    for (const canonical of Object.values(HH_LEGACY_TO_CANONICAL)) {
      assert.equal(
        normalizeSignalType(canonical),
        canonical,
        `${canonical} must resolve to itself`,
      );
    }
  });

  it("alias lookup is case-insensitive on the raw form", () => {
    assert.equal(
      normalizeSignalType("Signal.Lead.Purchased"),
      "harvest-home.lead_purchased",
    );
  });

  it("23 carried canonical entries keep the legacy DEFAULT metadata (weight 3 / BEHAVIORAL / goalShift:true / active)", () => {
    for (const [legacy, canonical] of Object.entries(HH_LEGACY_TO_CANONICAL)) {
      if (legacy === "signal.hh.idg_retry_synced") continue; // derived below
      const legacyEntry = EXACT_REGISTRY[legacy];
      const canonicalEntry = EXACT_REGISTRY[canonical];
      assert.ok(canonicalEntry, `${canonical} missing from EXACT_REGISTRY`);
      assert.ok(legacyEntry, `${legacy} legacy read-bridge row missing`);
      assert.equal(canonicalEntry.weight, legacyEntry.weight, `${canonical} weight`);
      assert.equal(
        canonicalEntry.category,
        legacyEntry.category,
        `${canonical} category`,
      );
      assert.equal(
        canonicalEntry.goalShiftSemantics,
        legacyEntry.goalShiftSemantics,
        `${canonical} goalShiftSemantics`,
      );
      assert.equal(canonicalEntry.lifecycle, "active", `${canonical} lifecycle`);
    }
  });

  it("harvest-home.idg_retry_synced derived (no legacy row): weight 3 / BEHAVIORAL / HIGH / goalShift:true / active", () => {
    assert.equal(EXACT_REGISTRY["signal.hh.idg_retry_synced"], undefined);
    const entry = EXACT_REGISTRY["harvest-home.idg_retry_synced"];
    assert.equal(entry.weight, 3);
    assert.equal(entry.category, "BEHAVIORAL");
    assert.equal(entry.priority, "HIGH"); // emit-site caller-hint (rello-sync-retry.ts)
    assert.equal(entry.goalShiftSemantics, true);
    assert.equal(entry.lifecycle, "active");
  });

  it("legacy signal.* registry rows are KEPT as a read-bridge (lookupExact still resolves them)", () => {
    for (const legacy of Object.keys(HH_LEGACY_TO_CANONICAL)) {
      if (legacy === "signal.hh.idg_retry_synced") continue; // never had a row
      assert.ok(
        EXACT_REGISTRY[legacy],
        `${legacy} legacy read-bridge row must remain registered`,
      );
    }
  });

  it("manifest-only never-emitted legacy types are NOT aliased (signal.lead.enriched resolves to its legacy row)", () => {
    assert.equal(
      LEGACY_SIGNALTYPE_EXACT_ALIASES["signal.lead.enriched"],
      undefined,
    );
    assert.equal(
      normalizeSignalType("signal.lead.enriched"),
      "signal.lead.enriched",
    );
  });

  it("the dynamic signal.tool.* family is untouched by the exact aliases", () => {
    assert.equal(
      normalizeSignalType("signal.tool.get-pre-approved.requested"),
      "signal.tool.get-pre-approved.requested",
    );
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
  it("active count = 320 (328 total − 8 forensic)", () => {
    // 5 forensic through v0.8.0 (no live emitter): home-scout.lead_magnet_submitted
    // (Wave A), drumbeat-video-engine.video_rendered (repo absent / pre-registered),
    // home-ready.score_calculated + home-ready.score_changed (declared in the
    // emit union but the live emit is home-ready.score_updated — rename drift),
    // home-ready.milo_report_generated (audit §4 DEAD — zero HR refs).
    // All 29 PHASE-B1 violation types are lifecycle:"active".
    // PHASE-B1B (+2): email.received + rello.ticket_created, both active.
    // SIGNALS-ADD-HS-22-VERBS (+22): all lifecycle:"active".
    // PR-B-α (v0.9.0, +3): rello.anniversary + property-engine.listing_under_contract
    // + property-engine.listing_went_live — all forensic (registered ahead of
    // their emitters), so forensic 5→8 and the active count is UNCHANGED at 315.
    // PQP doc-mirror (v0.11.0, +1): prequal-pro.document_uploaded — lifecycle:"active"
    // (live emitter ships in the same workstream), so active 315→316.
    // RATE-ENGINE (v0.12.0, +1): rate.changed — lifecycle:"active", so 319→320.
    // HOME-READY-INTENT-TARGET-CROSSED (v0.13.0, +1): home-ready.intent_target_crossed
    // — lifecycle:"active", so 320→321.
    // v0.15.0 (Q2 + Q6, +25): rello.lead_phone_disconnected + 24 canonical
    // harvest-home.* alias targets — all lifecycle:"active", so 321→346.
    // OHH-SHOWINGS-AND-TOURS (v0.16.0, +6): open-house-hub.showing_* family —
    // all lifecycle:"active", so 346→352.
    assert.equal(listActiveSignalTypes().length, 352);
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

  it("exactKeys count == active exact registry entries (352)", () => {
    assert.equal(keyset.exactKeys.length, 352);
    assert.equal(keyset.exactKeys.length, listActiveSignalTypes().length);
  });

  it("familyPrefixes count == 18 (6 explicit + 12 APP_SLUGS audit families)", () => {
    // +1 vs v0.6.0: PHASE-B1 `score.crossed_` threshold family.
    assert.equal(keyset.familyPrefixes.length, 18);
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

  it("version stamp is current (0.16.0)", () => {
    assert.equal(keyset.version, "0.16.0");
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
    assert.equal(mod.default.version, "0.16.0");
    assert.ok(Array.isArray(mod.default.exactKeys));
  });
});
