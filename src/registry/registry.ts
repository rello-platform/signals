/**
 * The canonical signal-type registry — seed (Wave A).
 *
 * `EXACT_REGISTRY` holds the 14 hand-curated canonical types shipped through
 * v0.3.0 (`src/signal-type.ts`) as full `SignalTypeEntry` rows (the SPEC/
 * surface-map label this "13" — a known pre-existing miscount; the actual
 * union has 14 distinct members). `FAMILY_REGISTRY` holds the known dynamic
 * prefix-families.
 *
 * KEYSPACE SEED (v0.6.0, KEYSPACE-SEED-EMITTED-CANONICAL-TYPES dispatch): the
 * full emitted canonical keyspace is now seeded (the Wave-A 14 + Wave-B 3 + ~250
 * emitted types), so `normalizeSignalType` resolves every emitted form and the
 * build-guard checks against a complete keyset. The classifier-READ swap (pointing
 * `classifier.ts` at the registry + retiring the `constants.ts` maps) remains a
 * separate follow-on (Wave C2); `constants.ts` stays the metadata SOURCE for now.
 *
 * Value provenance (verified against Rello `constants.ts @ origin/main`
 * `2a94659f` family, and `src/lib/nurture/escalate.ts` for the nurture-escalate
 * caller-hints):
 *   - weight  ← `SIGNAL_WEIGHTS`        (`constants.ts:8–349`)
 *   - category← `SIGNAL_CATEGORIES`     (`constants.ts:352–660`)
 *   - priority← `PRIORITY_OVERRIDES`    (`constants.ts:663–821`); omitted →
 *               weight-band derivation at classify time
 * Two entries have NO `constants.ts` row and are sourced/noted in the Wave A
 * close companion: `harvest-home.lead_intake` (effective silent-DEFAULT today)
 * and the three `rello.nurture_escalate_*` (weight+priority from the emit-site
 * caller-hints; category falls to the current DEFAULT `BEHAVIORAL`).
 */

import { APP_SLUGS } from "@rello-platform/slugs";
import type {
  ExactCanonicalSignalType,
  SignalTypeEntry,
  SignalTypeFamily,
} from "./types.js";

/**
 * Exact canonical signal-type keys → declarative entry. Keyed by the literal
 * union for `tsc`-time per-key completeness: a missing or stray key is a
 * compile error.
 */
export const EXACT_REGISTRY: Record<ExactCanonicalSignalType, SignalTypeEntry> =
  {
    // ── Open House Hub ──
    "open-house-hub.attendee_marked_for_pfp_preapproval": {
      type: "open-house-hub.attendee_marked_for_pfp_preapproval",
      weight: 6, // constants.ts:250
      category: "BEHAVIORAL", // constants.ts:571
      priority: "HIGH", // constants.ts:785
      goalShiftSemantics: true,
      lifecycle: "active",
    },

    // ── Home Scout ──
    "home-scout.lead_magnet_submitted": {
      type: "home-scout.lead_magnet_submitted",
      weight: 6, // constants.ts:267
      category: "BEHAVIORAL", // constants.ts:574
      priority: "HIGH", // constants.ts:789
      goalShiftSemantics: true,
      // RELLO-FIX-D2 forensic-preserve: registry entry KEPT with no live
      // emitter (constants.ts:255–267). lifecycle:"forensic" per SPEC §6 / Q19
      // — excluded from the emit-site requirement + admin coverage denominator.
      lifecycle: "forensic",
    },

    // ── Harvest Home ──
    "harvest-home.lead_intake": {
      type: "harvest-home.lead_intake",
      // NO constants.ts row → currently resolves to the silent DEFAULT
      // (DEFAULT_WEIGHT=3 / DEFAULT_CATEGORY="BEHAVIORAL", constants.ts:839–840).
      // Seeded at that effective production value (not invented); flagged in the
      // close companion for explicit reclassification in Wave C. HH is the
      // canonical lead-intake home (AOM); this is the universal intake gateway
      // signal (see src/schemas/harvest-home.ts).
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },

    // ── Report Engine ──
    "report-engine.report_ready": {
      type: "report-engine.report_ready",
      weight: 5, // constants.ts:107
      category: "BEHAVIORAL", // constants.ts:429
      // no PRIORITY_OVERRIDES row → weight-band (5 → MEDIUM) at classify time
      goalShiftSemantics: true,
      lifecycle: "active",
    },

    // ── Pathfinder Pro — export family ──
    "pathfinder-pro.export.queued": {
      type: "pathfinder-pro.export.queued",
      weight: 1, // constants.ts:223
      category: "ENGAGEMENT", // constants.ts:545
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.export.in_flight": {
      type: "pathfinder-pro.export.in_flight",
      weight: 1, // constants.ts:224
      category: "ENGAGEMENT", // constants.ts:546
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.export.success": {
      type: "pathfinder-pro.export.success",
      weight: 3, // constants.ts:225
      category: "ENGAGEMENT", // constants.ts:547
      priority: "MEDIUM", // constants.ts:766
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.export.failed": {
      type: "pathfinder-pro.export.failed",
      weight: 5, // constants.ts:226
      category: "BEHAVIORAL", // constants.ts:548
      priority: "HIGH", // constants.ts:767
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.export.permanently_failed": {
      type: "pathfinder-pro.export.permanently_failed",
      weight: 7, // constants.ts:227
      category: "BEHAVIORAL", // constants.ts:549
      priority: "CRITICAL", // constants.ts:768
      goalShiftSemantics: true,
      lifecycle: "active",
    },

    // ── Pathfinder Pro — compliance family ──
    "pathfinder-pro.compliance.gate_blocked": {
      type: "pathfinder-pro.compliance.gate_blocked",
      weight: 5, // constants.ts:240
      category: "BEHAVIORAL", // constants.ts:562
      priority: "HIGH", // constants.ts:780
      // compliance.* is a NON_GOAL_SHIFT prefix in nurture-goals
      // (`infer.ts:96`) — honest goalShiftSemantics:false. Wave B wires
      // isGoalShiftSignal() into inferNurtureGoal.
      goalShiftSemantics: false,
      lifecycle: "active",
    },
    "pathfinder-pro.compliance.config_changed": {
      type: "pathfinder-pro.compliance.config_changed",
      weight: 2, // constants.ts:241
      category: "ENGAGEMENT", // constants.ts:563
      goalShiftSemantics: false, // NON_GOAL_SHIFT compliance.* (infer.ts:96)
      lifecycle: "active",
    },

    // ── Rello — nurture escalate family ──
    // weight + priority from the emit-site caller-hints
    // (`src/lib/nurture/escalate.ts`); these types have NO constants.ts row so
    // category falls to the current DEFAULT "BEHAVIORAL" (flagged in the close
    // companion; Wave C may reclassify to ESCALATION). goalShiftSemantics:false
    // — system audit emissions about the nurture pipeline, not lead-goal shifts.
    "rello.nurture_escalate_injected": {
      type: "rello.nurture_escalate_injected",
      weight: 8, // escalate.ts:~304 caller-hint
      category: "BEHAVIORAL",
      priority: "HIGH", // escalate.ts:~303 caller-hint
      goalShiftSemantics: false,
      lifecycle: "active",
    },
    "rello.nurture_escalate_deduped": {
      type: "rello.nurture_escalate_deduped",
      weight: 4, // escalate.ts:~135 caller-hint
      category: "BEHAVIORAL",
      priority: "MEDIUM", // escalate.ts:~134 caller-hint
      goalShiftSemantics: false,
      lifecycle: "active",
    },
    "rello.nurture_escalate_injection_failed": {
      type: "rello.nurture_escalate_injection_failed",
      weight: 10, // escalate.ts:~321 caller-hint
      category: "BEHAVIORAL",
      priority: "CRITICAL", // escalate.ts:~320 caller-hint
      goalShiftSemantics: false,
      lifecycle: "active",
    },

    // ── Newsletter-Studio — email lifecycle (Wave B) ──
    // The live `inferNurtureGoal` bug: NS emits these BARE
    // (`Newsletter-Studio/src/lib/signals/emitter.ts:16-18 @ 3714bfc`); Rello's
    // `/api/signals/batch` receiver namespace-prefixes the bare form with the
    // underscore source-app (`batch/route.ts` `appSource.replace(/-/g,"_")`),
    // persisting `newsletter_studio.email_complained` — which the pre-Wave-B
    // `inferNurtureGoal` bare-name exclusion set never matched, so the signal
    // fell through to HOME_PURCHASE and wrote a spurious
    // `blocked_no_matching_campaign` audit row (DISCOVERED-NURTURE-GOAL-INFER-
    // IGNORES-SPOKE-PREFIXED-SIGNAL-TYPES-260521). Registered here
    // `goalShiftSemantics:false` so `isGoalShiftSignal(normalizeSignalType(x))`
    // short-circuits the prefixed form. NS is the SOLE emitter of these three
    // (verified P-4: no HH/other-spoke emitter), so the canonical form is the
    // `newsletter-studio.*` hyphen-slug; the bug-doc's illustrative
    // `harvest_home.email_complained` is NOT a real emit.
    "newsletter-studio.email_complained": {
      type: "newsletter-studio.email_complained",
      weight: 9, // Rello constants.ts:36/37 (bare + newsletter_studio.* prefixed)
      category: "NEGATIVE", // constants.ts:384/385 — spam complaint, relationship damage
      priority: "HIGH", // constants.ts:674/675 — agent must know immediately
      goalShiftSemantics: false,
      lifecycle: "active",
    },
    "newsletter-studio.email_unsubscribed": {
      type: "newsletter-studio.email_unsubscribed",
      // NO Rello constants.ts row (falls to silent DEFAULT_WEIGHT=3 /
      // DEFAULT_CATEGORY="BEHAVIORAL" today). Seeded at a sensible NEGATIVE
      // value (opt-out = relationship withdrawal); flagged for Wave C explicit
      // classification in the close companion. goalShiftSemantics:false is the
      // load-bearing axis for Wave B.
      weight: 6,
      category: "NEGATIVE",
      goalShiftSemantics: false,
      lifecycle: "active",
    },
    "newsletter-studio.email_bounced": {
      type: "newsletter-studio.email_bounced",
      // NO Rello constants.ts row (falls to silent DEFAULT today). Seeded as
      // low-weight ENGAGEMENT (deliverability telemetry, not lead intent);
      // flagged for Wave C in the close companion. goalShiftSemantics:false is
      // the load-bearing axis for Wave B.
      weight: 3,
      category: "ENGAGEMENT",
      goalShiftSemantics: false,
      lifecycle: "active",
    },

    // ────────────────────────────────────────────────────────────────────
    // Full emitted canonical keyspace seed (v0.6.0; KEYSPACE-SEED dispatch).
    // Sorted by canonical key (= slug-grouped). `// DEFAULT` = emitted type
    // with no Rello `constants.ts` row → seeded at effective DEFAULT (weight 3 /
    // BEHAVIORAL), flagged in the close companion for Wave-C reclassification.
    // `// constants w0` = constants weight 0 mapped to the registry floor
    // (weight 1 + `tier:"telemetry"`). goalShiftSemantics defaults true; SYSTEM
    // category → false (operational/observability, never a lead-goal shift).
    // ────────────────────────────────────────────────────────────────────
    "checkpoint.call_requested": {
      type: "checkpoint.call_requested",
      weight: 10,
      category: "READINESS",
      priority: "CRITICAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "checkpoint.responded": {
      type: "checkpoint.responded",
      weight: 8,
      category: "ENGAGEMENT",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "checkpoint.update_started": {
      type: "checkpoint.update_started",
      weight: 8,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "consent.email_granted": {
      type: "consent.email_granted",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "consent.email_revoked": {
      type: "consent.email_revoked",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "consent.sms_granted": {
      type: "consent.sms_granted",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "consent.sms_revoked": {
      type: "consent.sms_revoked",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "consent.updated": {
      type: "consent.updated",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "content-engine.article_clicked": {
      type: "content-engine.article_clicked",
      weight: 6,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "content-engine.article_opened": {
      type: "content-engine.article_opened",
      weight: 3,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "content-engine.article_scroll_deep": {
      type: "content-engine.article_scroll_deep",
      weight: 4,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "content-engine.article_sent": {
      type: "content-engine.article_sent",
      weight: 3,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "content-engine.classification_abandoned": {
      type: "content-engine.classification_abandoned",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    }, // constants w0 → telemetry tier (floor 1)
    "content-engine.content_stale": {
      type: "content-engine.content_stale",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    }, // constants w0 → telemetry tier (floor 1)
    "content-engine.generation_completed": {
      type: "content-engine.generation_completed",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    }, // constants w0 → telemetry tier (floor 1)
    "drumbeat-video-engine.video_rendered": {
      type: "drumbeat-video-engine.video_rendered",
      weight: 5,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "forensic",
    },
    "harvest-home.call_list_contact_initiated": {
      type: "harvest-home.call_list_contact_initiated",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "harvest-home.call_list_snapshot_generated": {
      type: "harvest-home.call_list_snapshot_generated",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "harvest-home.data_enriched": {
      type: "harvest-home.data_enriched",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "harvest-home.data_pack_purchased": {
      type: "harvest-home.data_pack_purchased",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "harvest-home.discovery_replacement_claim_filed": {
      type: "harvest-home.discovery_replacement_claim_filed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "harvest-home.discovery_replacement_claim_resolved": {
      type: "harvest-home.discovery_replacement_claim_resolved",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "harvest-home.discovery_search_saved": {
      type: "harvest-home.discovery_search_saved",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "harvest-home.immediate_action": {
      type: "harvest-home.immediate_action",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "harvest-home.lead_acquisition_recorded": {
      type: "harvest-home.lead_acquisition_recorded",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "harvest-home.property_address_changed": {
      type: "harvest-home.property_address_changed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "harvest-home.property_equity_threshold_crossed": {
      type: "harvest-home.property_equity_threshold_crossed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "harvest-home.property_listing_detected": {
      type: "harvest-home.property_listing_detected",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "harvest-home.skip_trace_completed": {
      type: "harvest-home.skip_trace_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.almost_home_login": {
      type: "home-ready.almost_home_login",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.almost_home_session_duration": {
      type: "home-ready.almost_home_session_duration",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.assessment_completed": {
      type: "home-ready.assessment_completed",
      weight: 7,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-ready.assessment_started": {
      type: "home-ready.assessment_started",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.assessment_updated": {
      type: "home-ready.assessment_updated",
      weight: 6,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-ready.challenge_completed": {
      type: "home-ready.challenge_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.challenge_enrolled": {
      type: "home-ready.challenge_enrolled",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.challenge_progress": {
      type: "home-ready.challenge_progress",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.challenge_wizard_feedback": {
      type: "home-ready.challenge_wizard_feedback",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.closing_ready": {
      type: "home-ready.closing_ready",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.closing_retracted": {
      type: "home-ready.closing_retracted",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.data_stale": {
      type: "home-ready.data_stale",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.document_analyzed": {
      type: "home-ready.document_analyzed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.document_uploaded": {
      type: "home-ready.document_uploaded",
      weight: 8,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    // ── HOME-READY-INTENT-TARGET-CROSSED (v0.13.0) ──
    // HomeReady emits when the borrower's home-readiness metric crosses the
    // "ready" threshold UPWARD (move-up-buy intent). Live emitter: HomeReady
    // @ b0e4269 (source: home-ready, priority HIGH). Consumed Rello-side by the
    // today-intent classifier (`src/lib/daily-plan/lead-today-intent-classifier.ts`
    // → "MOVE_UP_BUY"). READINESS / weight 8 / HIGH — a threshold-cross is a
    // strong, narrative-material intent shift (mirrors the sibling HR READINESS
    // milestones home-ready.document_uploaded:8 / assessment_completed:7). No
    // Rello `constants.ts` row (newer than the v0.6.0 keyspace seed); seeded at
    // the HR-confirmed semantic value, not the silent DEFAULT. Payload schema:
    // src/schemas/home-ready.ts (homeReadyIntentTargetCrossedDataSchema).
    "home-ready.intent_target_crossed": {
      type: "home-ready.intent_target_crossed",
      weight: 8,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-ready.milo_chat_session": {
      type: "home-ready.milo_chat_session",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.milo_report_generated": {
      type: "home-ready.milo_report_generated",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "forensic",
    }, // DEFAULT (no constants row)
    "home-ready.plaid_connected": {
      type: "home-ready.plaid_connected",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.recommendation_acted_on": {
      type: "home-ready.recommendation_acted_on",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.recommendation_feedback": {
      type: "home-ready.recommendation_feedback",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.recommendation_viewed": {
      type: "home-ready.recommendation_viewed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.score_calculated": {
      type: "home-ready.score_calculated",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "forensic",
    }, // DEFAULT (no constants row)
    "home-ready.score_changed": {
      type: "home-ready.score_changed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "forensic",
    }, // DEFAULT (no constants row)
    "home-ready.score_updated": {
      type: "home-ready.score_updated",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-ready.stall_detected": {
      type: "home-ready.stall_detected",
      weight: 7,
      category: "ESCALATION",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-ready.survey_completed": {
      type: "home-ready.survey_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-scout.affordability_calculated": {
      type: "home-scout.affordability_calculated",
      weight: 5,
      category: "READINESS",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.buying_power_calculated": {
      type: "home-scout.buying_power_calculated",
      weight: 6,
      category: "FINANCIAL",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.call_booked": {
      type: "home-scout.call_booked",
      weight: 9,
      category: "READINESS",
      priority: "CRITICAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.cash_out_calculated": {
      type: "home-scout.cash_out_calculated",
      weight: 6,
      category: "FINANCIAL",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.cta_clicked.book_a_call": {
      type: "home-scout.cta_clicked.book_a_call",
      weight: 8,
      category: "READINESS",
      priority: "CRITICAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.cta_clicked.get_pre_approved": {
      type: "home-scout.cta_clicked.get_pre_approved",
      weight: 7,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.cta_clicked.qualify": {
      type: "home-scout.cta_clicked.qualify",
      weight: 7,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.cta_clicked.rate_quote": {
      type: "home-scout.cta_clicked.rate_quote",
      weight: 6,
      category: "READINESS",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.cta_clicked.rate_watch": {
      type: "home-scout.cta_clicked.rate_watch",
      weight: 5,
      category: "ENGAGEMENT",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.cta_clicked.request_cma": {
      type: "home-scout.cta_clicked.request_cma",
      weight: 6,
      category: "READINESS",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.cta_clicked.whats_my_home_worth": {
      type: "home-scout.cta_clicked.whats_my_home_worth",
      weight: 6,
      category: "READINESS",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.data_stale": {
      type: "home-scout.data_stale",
      weight: 1,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.decision_stage_engagement": {
      type: "home-scout.decision_stage_engagement",
      weight: 8,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.dpa_search_completed": {
      type: "home-scout.dpa_search_completed",
      weight: 5,
      category: "FINANCIAL",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.embed_interaction": {
      type: "home-scout.embed_interaction",
      weight: 2,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.embed_loaded": {
      type: "home-scout.embed_loaded",
      weight: 2,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.equity_check_returned": {
      type: "home-scout.equity_check_returned",
      weight: 6,
      category: "READINESS",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.expired_analysis_requested": {
      type: "home-scout.expired_analysis_requested",
      weight: 6,
      category: "READINESS",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.form_submitted": {
      type: "home-scout.form_submitted",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.fsbo_net_sheet_requested": {
      type: "home-scout.fsbo_net_sheet_requested",
      weight: 6,
      category: "READINESS",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.home_value_requested": {
      type: "home-scout.home_value_requested",
      weight: 5,
      category: "BEHAVIORAL",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.homeowner_hub_viewed": {
      type: "home-scout.homeowner_hub_viewed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-scout.homeowner_magic_link_issued": {
      type: "home-scout.homeowner_magic_link_issued",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-scout.homeowner_magic_link_verified": {
      type: "home-scout.homeowner_magic_link_verified",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-scout.homeready_handoff_exhausted": {
      type: "home-scout.homeready_handoff_exhausted",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.homeready_handoff_failed": {
      type: "home-scout.homeready_handoff_failed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.homeready_handoff_retry_success": {
      type: "home-scout.homeready_handoff_retry_success",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.homeready_handoff_success": {
      type: "home-scout.homeready_handoff_success",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.injection_cta_clicked": {
      type: "home-scout.injection_cta_clicked",
      weight: 8,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.lead_captured": {
      type: "home-scout.lead_captured",
      weight: 8,
      category: "ENGAGEMENT",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.lead_reengaged": {
      type: "home-scout.lead_reengaged",
      weight: 7,
      category: "ENGAGEMENT",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.listing_saved": {
      type: "home-scout.listing_saved",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.listing_search_performed": {
      type: "home-scout.listing_search_performed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.listing_unsaved": {
      type: "home-scout.listing_unsaved",
      weight: 2,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.net_sheet_calculated": {
      type: "home-scout.net_sheet_calculated",
      weight: 6,
      category: "READINESS",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.newsletter_signup": {
      type: "home-scout.newsletter_signup",
      weight: 4,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.preferred_option_selected": {
      type: "home-scout.preferred_option_selected",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.qualification_estimated": {
      type: "home-scout.qualification_estimated",
      weight: 6,
      category: "FINANCIAL",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.rate_alert_set": {
      type: "home-scout.rate_alert_set",
      weight: 5,
      category: "ENGAGEMENT",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.rate_alert_triggered": {
      type: "home-scout.rate_alert_triggered",
      weight: 6,
      category: "READINESS",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.rate_shopping_signal": {
      type: "home-scout.rate_shopping_signal",
      weight: 7,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.referral_submitted": {
      type: "home-scout.referral_submitted",
      weight: 7,
      category: "ENGAGEMENT",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.refi_consideration_signal": {
      type: "home-scout.refi_consideration_signal",
      weight: 8,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.reverse_mortgage_estimate_requested": {
      type: "home-scout.reverse_mortgage_estimate_requested",
      weight: 6,
      category: "READINESS",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.search_saved": {
      type: "home-scout.search_saved",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.sell_intent_confirmed": {
      type: "home-scout.sell_intent_confirmed",
      weight: 9,
      category: "READINESS",
      priority: "CRITICAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.showing_requested": {
      type: "home-scout.showing_requested",
      weight: 9,
      category: "READINESS",
      priority: "CRITICAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.survey_gate_answered": {
      type: "home-scout.survey_gate_answered",
      weight: 6,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.survey_gate_question_answered": {
      type: "home-scout.survey_gate_question_answered",
      weight: 6,
      category: "READINESS",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.tool_completed": {
      type: "home-scout.tool_completed",
      weight: 5,
      category: "ENGAGEMENT",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.tool_started": {
      type: "home-scout.tool_started",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    // OHH-SHOWINGS-AND-TOURS P4 (v0.18.0) — buyer rates a tour stop in the HS
    // companion (HS-LOCAL write per DL4; OHH never called on rating writes).
    // BEHAVIORAL per the tour-family contract lock — consistent with the
    // home-scout BEHAVIORAL neighbors (search_saved/survey_gate_answered/
    // tool_started), which carry no `priority` (weight-band derivation), so
    // none here either. goalShiftSemantics:true — a rating redirects buyer
    // preference (contract §Signals).
    "home-scout.tour_stop_rated": {
      type: "home-scout.tour_stop_rated",
      weight: 8,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.unattached_lead_captured": {
      type: "home-scout.unattached_lead_captured",
      weight: 6,
      category: "ENGAGEMENT",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-scout.va_eligible_confirmed": {
      type: "home-scout.va_eligible_confirmed",
      weight: 7,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-stretch.activity_completed": {
      type: "home-stretch.activity_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-stretch.anxiety_detected": {
      type: "home-stretch.anxiety_detected",
      weight: 8,
      category: "ANXIETY",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-stretch.article_read": {
      type: "home-stretch.article_read",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-stretch.badge_earned": {
      type: "home-stretch.badge_earned",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-stretch.chat_message": {
      type: "home-stretch.chat_message",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-stretch.chat_started": {
      type: "home-stretch.chat_started",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-stretch.document_analyzed": {
      type: "home-stretch.document_analyzed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-stretch.document_uploaded": {
      type: "home-stretch.document_uploaded",
      weight: 8,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-stretch.financial_snapshot_updated": {
      type: "home-stretch.financial_snapshot_updated",
      weight: 5,
      category: "FINANCIAL",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "home-stretch.milo_report_generated": {
      type: "home-stretch.milo_report_generated",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-stretch.module_completed": {
      type: "home-stretch.module_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-stretch.module_started": {
      type: "home-stretch.module_started",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-stretch.onboarding_completed": {
      type: "home-stretch.onboarding_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-stretch.pillar_completed": {
      type: "home-stretch.pillar_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-stretch.score_changed": {
      type: "home-stretch.score_changed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "home-stretch.stall_detected": {
      type: "home-stretch.stall_detected",
      weight: 7,
      category: "ESCALATION",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    // ── SIGNALS-ADD-HS-22-VERBS (v0.8.0): the 22 emitted HS verbs the v0.6.0
    // keyspace seed missed — HS emits 39 canonical `home-stretch.<verb>` across
    // SIGNAL_TYPES (src/lib/signals/types.ts) + HOMESTRETCH_EVENTS
    // (src/lib/rello/events.ts) + 5 inline route literals, but the seed only
    // captured the 17 surfaced in SIGNAL_TYPES. These 22 were HELD as concat in
    // the SPOKE-FLIP-HS flip (`// HOLD:`, PR #7) until registered here. NONE has
    // a Rello `constants.ts` row → all seeded at the effective DEFAULT (weight 3 /
    // BEHAVIORAL / goalShiftSemantics:true, matching the sibling home-stretch
    // DEFAULT rows above), flagged for Wave-C reclassification. Provenance:
    // DISCOVERED-RELLO-HS-EMITTED-VERBS-UNREGISTERED-IN-SIGNALS-260524.
    "home-stretch.chat_completed": {
      type: "home-stretch.chat_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.chat_session": {
      type: "home-stretch.chat_session",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.credit_analyzed": {
      type: "home-stretch.credit_analyzed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.dream_profile_updated": {
      type: "home-stretch.dream_profile_updated",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.guest_mlo_eligibility_decision": {
      type: "home-stretch.guest_mlo_eligibility_decision",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.guest_mlo_message_sent": {
      type: "home-stretch.guest_mlo_message_sent",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.guest_mlo_note_added": {
      type: "home-stretch.guest_mlo_note_added",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.inactive": {
      type: "home-stretch.inactive",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.login_streak": {
      type: "home-stretch.login_streak",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.milestone_reached": {
      type: "home-stretch.milestone_reached",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.module_stalled": {
      type: "home-stretch.module_stalled",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.pillar_status_changed": {
      type: "home-stretch.pillar_status_changed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.points_earned": {
      type: "home-stretch.points_earned",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.preapproval_approved": {
      type: "home-stretch.preapproval_approved",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.preapproval_started": {
      type: "home-stretch.preapproval_started",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.prospect_invitation_sms_requested": {
      type: "home-stretch.prospect_invitation_sms_requested",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.prospect_invited": {
      type: "home-stretch.prospect_invited",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.ready_to_buy": {
      type: "home-stretch.ready_to_buy",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.registered": {
      type: "home-stretch.registered",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.savings_milestone": {
      type: "home-stretch.savings_milestone",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.track_selected": {
      type: "home-stretch.track_selected",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "home-stretch.under_contract": {
      type: "home-stretch.under_contract",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "market-intel.alert_triggered": {
      type: "market-intel.alert_triggered",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      routing: "rate-alert-dispatch",
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "market-intel.digest_clicked": {
      type: "market-intel.digest_clicked",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "market-intel.digest_generated": {
      type: "market-intel.digest_generated",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "market-intel.digest_opened": {
      type: "market-intel.digest_opened",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "market-intel.podcast_played": {
      type: "market-intel.podcast_played",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "market-intel.report_generated": {
      type: "market-intel.report_generated",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "market-intel.snapshot_shared": {
      type: "market-intel.snapshot_shared",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "market-intel.subscribed": {
      type: "market-intel.subscribed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "newsletter-studio.content_feedback_negative": {
      type: "newsletter-studio.content_feedback_negative",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "newsletter-studio.content_feedback_positive": {
      type: "newsletter-studio.content_feedback_positive",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "newsletter-studio.content_preference_changed": {
      type: "newsletter-studio.content_preference_changed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "newsletter-studio.email_checkpoint_responded": {
      type: "newsletter-studio.email_checkpoint_responded",
      weight: 8,
      category: "ENGAGEMENT",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "newsletter-studio.email_clicked": {
      type: "newsletter-studio.email_clicked",
      weight: 5,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "newsletter-studio.email_delivered": {
      type: "newsletter-studio.email_delivered",
      weight: 2,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "newsletter-studio.email_frequency_changed": {
      type: "newsletter-studio.email_frequency_changed",
      weight: 4,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "newsletter-studio.email_opened": {
      type: "newsletter-studio.email_opened",
      weight: 3,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "newsletter-studio.email_pause_expired": {
      type: "newsletter-studio.email_pause_expired",
      weight: 5,
      category: "ENGAGEMENT",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "newsletter-studio.email_paused": {
      type: "newsletter-studio.email_paused",
      weight: 6,
      category: "ENGAGEMENT",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "newsletter-studio.email_replied": {
      type: "newsletter-studio.email_replied",
      weight: 7,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "newsletter-studio.email_sent": {
      type: "newsletter-studio.email_sent",
      weight: 1,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "newsletter-studio.flow_advanced": {
      type: "newsletter-studio.flow_advanced",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "newsletter-studio.reply_received": {
      type: "newsletter-studio.reply_received",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "newsletter-studio.scroll_depth": {
      type: "newsletter-studio.scroll_depth",
      weight: 4,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "newsletter-studio.unsubscribe_reason": {
      type: "newsletter-studio.unsubscribe_reason",
      weight: 2,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.agent_partner.captured": {
      type: "pathfinder-pro.agent_partner.captured",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "pathfinder-pro.attendee_reclassified": {
      type: "pathfinder-pro.attendee_reclassified",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "pathfinder-pro.borrower_interest": {
      type: "pathfinder-pro.borrower_interest",
      weight: 7,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.credit_pull.consent_captured": {
      type: "pathfinder-pro.credit_pull.consent_captured",
      weight: 1,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.credit_pull.failed": {
      type: "pathfinder-pro.credit_pull.failed",
      weight: 5,
      category: "NEGATIVE",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.credit_pull.hard_executed": {
      type: "pathfinder-pro.credit_pull.hard_executed",
      weight: 7,
      category: "BEHAVIORAL",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.credit_pull.soft_executed": {
      type: "pathfinder-pro.credit_pull.soft_executed",
      weight: 4,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.exported_to_los": {
      type: "pathfinder-pro.exported_to_los",
      weight: 9,
      category: "READINESS",
      priority: "CRITICAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.hh_intake_sync": {
      type: "pathfinder-pro.hh_intake_sync",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "pathfinder-pro.intake_completed": {
      type: "pathfinder-pro.intake_completed",
      weight: 5,
      category: "READINESS",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.intake_started": {
      type: "pathfinder-pro.intake_started",
      weight: 2,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.past_borrowers.queried": {
      type: "pathfinder-pro.past_borrowers.queried",
      weight: 1,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.prequalified": {
      type: "pathfinder-pro.prequalified",
      weight: 8,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.realtor_prospect.intake_received": {
      type: "pathfinder-pro.realtor_prospect.intake_received",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "pathfinder-pro.scenario_converted": {
      type: "pathfinder-pro.scenario_converted",
      weight: 7,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.scenario_created": {
      type: "pathfinder-pro.scenario_created",
      weight: 5,
      category: "READINESS",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.scenario_delivered": {
      type: "pathfinder-pro.scenario_delivered",
      weight: 6,
      category: "READINESS",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.scenario_viewed": {
      type: "pathfinder-pro.scenario_viewed",
      weight: 4,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    // PreQual-Pro borrower document upload — readiness-advancing, identical in
    // weight/semantics to the home-ready./home-stretch.document_uploaded precedent
    // (weight 8 / READINESS / HIGH / goalShift). PQP is NOT a Rello-platform app
    // (L7 lock) — this is a hand-authored canonical registry key, no APP_SLUGS entry.
    "prequal-pro.document_uploaded": {
      type: "prequal-pro.document_uploaded",
      weight: 8,
      category: "READINESS",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    // PR-B-α canonical registrations (Kelly directive 2026-05-29). MLS-listing
    // events emit from Property Engine MLS-sync (AOM Property column). Emit is
    // DEFERRED — PE Spark MLS cron is disabled pending the SPARK_* API-key fix
    // ([[reference-pe-no-geo-no-sold-data-spark-mls-401-failing]]), so there is
    // no live emitter today → lifecycle:"forensic" (registered, no live emitter;
    // excluded from the emit-site requirement + admin coverage denominator per
    // Q19, same gate as home-scout.lead_magnet_submitted). No constants row →
    // seeded at the effective DEFAULT (weight 3 / BEHAVIORAL); goalShiftSemantics
    // kept TRUE to preserve the classifier's current unregistered fail-open
    // behavior. Flip lifecycle→"active" + reclassify when the emitter lands.
    "property-engine.listing_under_contract": {
      type: "property-engine.listing_under_contract",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "forensic",
    }, // DEFAULT (no constants row) · emit deferred (PE Spark key)
    "property-engine.listing_went_live": {
      type: "property-engine.listing_went_live",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "forensic",
    }, // DEFAULT (no constants row) · emit deferred (PE Spark key)
    "property-engine.rate_sync_completed": {
      type: "property-engine.rate_sync_completed",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    }, // constants w0 → telemetry tier (floor 1)
    // PR-B-α canonical registration (Kelly directive 2026-05-29). Rello-internal
    // anniversary cron concept → `rello.*` namespace (AOM; anniversary is not a
    // spoke event). Emit is DEFERRED — the anniversary cron emit-side spec (which
    // meaningful date, cadence) is TBD → no live emitter today, lifecycle:
    // "forensic" (excluded from the emit-site requirement + coverage denominator
    // per Q19). No constants row → DEFAULT (weight 3 / BEHAVIORAL); goalShift
    // kept TRUE to preserve the classifier's current unregistered fail-open
    // behavior (the consumer maps it to the ANNIVERSARY intent). Flip lifecycle→
    // "active" + reclassify when the emit-side spec lands.
    "rello.anniversary": {
      type: "rello.anniversary",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "forensic",
    }, // DEFAULT (no constants row) · emit deferred (anniversary cron spec TBD)
    "rello.handoff_transition": {
      type: "rello.handoff_transition",
      weight: 7,
      category: "BEHAVIORAL",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "rello.lead_created": {
      type: "rello.lead_created",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "rello.lead_data_sufficient": {
      type: "rello.lead_data_sufficient",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "rello.lead_stage_changed": {
      type: "rello.lead_stage_changed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "rello.local_conversion": {
      type: "rello.local_conversion",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "rello.meeting_booked": {
      type: "rello.meeting_booked",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "rello.meeting_canceled": {
      type: "rello.meeting_canceled",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "rello.meeting_completed": {
      type: "rello.meeting_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "rello.meeting_no_show": {
      type: "rello.meeting_no_show",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "rello.nurture_reply_detected": {
      type: "rello.nurture_reply_detected",
      weight: 10,
      category: "ENGAGEMENT",
      priority: "CRITICAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "rello.nurture_reply_sent": {
      type: "rello.nurture_reply_sent",
      weight: 5,
      category: "BEHAVIORAL",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "report-engine.report_failed": {
      type: "report-engine.report_failed",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    }, // constants w0 → telemetry tier (floor 1)
    "score.crossed_60": {
      type: "score.crossed_60",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "score.crossed_80": {
      type: "score.crossed_80",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.byol.leads_imported": {
      type: "signal.byol.leads_imported",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.byol.leads_reactivated": {
      type: "signal.byol.leads_reactivated",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.byol.monitoring_started": {
      type: "signal.byol.monitoring_started",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.byol.parked_lead_signal_detected": {
      type: "signal.byol.parked_lead_signal_detected",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.byol.parked_leads_resurfaced": {
      type: "signal.byol.parked_leads_resurfaced",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.byol.push_calls_completed": {
      type: "signal.byol.push_calls_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.byol.scoring_completed": {
      type: "signal.byol.scoring_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.byol.upload_completed": {
      type: "signal.byol.upload_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.discovery.search": {
      type: "signal.discovery.search",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.discovery.unlock": {
      type: "signal.discovery.unlock",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.intake.lead_created": {
      type: "signal.intake.lead_created",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.intake.lead_enriched": {
      type: "signal.intake.lead_enriched",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.intake.lead_merged": {
      type: "signal.intake.lead_merged",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.intake.lead_rescored": {
      type: "signal.intake.lead_rescored",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.lead.contacted": {
      type: "signal.lead.contacted",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.lead.converted": {
      type: "signal.lead.converted",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.lead.delivered": {
      type: "signal.lead.delivered",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.lead.enriched": {
      type: "signal.lead.enriched",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.lead.purchased": {
      type: "signal.lead.purchased",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.lead.scored": {
      type: "signal.lead.scored",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.pipeline.call_outcome": {
      type: "signal.pipeline.call_outcome",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.pipeline.session_completed": {
      type: "signal.pipeline.session_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "signal.pipeline.session_started": {
      type: "signal.pipeline.session_started",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row)
    "system.checkpoint_external_change": {
      type: "system.checkpoint_external_change",
      weight: 8,
      category: "FINANCIAL",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "system.periodic_checkpoint": {
      type: "system.periodic_checkpoint",
      weight: 5,
      category: "BEHAVIORAL",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.ad_lead_captured": {
      type: "the-drumbeat.ad_lead_captured",
      weight: 8,
      category: "ENGAGEMENT",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.campaign_launched": {
      type: "the-drumbeat.campaign_launched",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.content_broker_review_needed": {
      type: "the-drumbeat.content_broker_review_needed",
      weight: 5,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.content_compliance_blocked": {
      type: "the-drumbeat.content_compliance_blocked",
      weight: 6,
      category: "BEHAVIORAL",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.content_draft_approved": {
      type: "the-drumbeat.content_draft_approved",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.content_draft_generated": {
      type: "the-drumbeat.content_draft_generated",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      lifecycle: "active",
    },
    "the-drumbeat.content_draft_published": {
      type: "the-drumbeat.content_draft_published",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.content_draft_rejected": {
      type: "the-drumbeat.content_draft_rejected",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      lifecycle: "active",
    },
    "the-drumbeat.direct_mail_sent": {
      type: "the-drumbeat.direct_mail_sent",
      weight: 2,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.market_content_generated": {
      type: "the-drumbeat.market_content_generated",
      weight: 2,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.market_content_published": {
      type: "the-drumbeat.market_content_published",
      weight: 2,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.market_report_generated": {
      type: "the-drumbeat.market_report_generated",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.post_published": {
      type: "the-drumbeat.post_published",
      weight: 2,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.qr_code_scanned": {
      type: "the-drumbeat.qr_code_scanned",
      weight: 5,
      category: "BEHAVIORAL",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.rate_alert_triggered": {
      type: "the-drumbeat.rate_alert_triggered",
      weight: 5,
      category: "BEHAVIORAL",
      priority: "HIGH",
      goalShiftSemantics: true,
      routing: "rate-alert-dispatch",
      lifecycle: "active",
    },
    "the-drumbeat.review_received": {
      type: "the-drumbeat.review_received",
      weight: 4,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.stall_detected": {
      type: "the-drumbeat.stall_detected",
      weight: 7,
      category: "ESCALATION",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.video_message_sent": {
      type: "the-drumbeat.video_message_sent",
      weight: 6,
      category: "BEHAVIORAL",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.video_message_watched": {
      type: "the-drumbeat.video_message_watched",
      weight: 6,
      category: "ENGAGEMENT",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.video_published": {
      type: "the-drumbeat.video_published",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.video_recorded": {
      type: "the-drumbeat.video_recorded",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.video_started": {
      type: "the-drumbeat.video_started",
      weight: 3,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.video_view_aggregate": {
      type: "the-drumbeat.video_view_aggregate",
      weight: 2,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.video_viewed": {
      type: "the-drumbeat.video_viewed",
      weight: 4,
      category: "ENGAGEMENT",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-drumbeat.video_watched": {
      type: "the-drumbeat.video_watched",
      weight: 7,
      category: "ENGAGEMENT",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.anniversary_reached": {
      type: "the-oven.anniversary_reached",
      weight: 2,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.equity_digest_sent": {
      type: "the-oven.equity_digest_sent",
      weight: 1,
      category: "SYSTEM",
      priority: "MEDIUM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    }, // constants w0 → telemetry tier (floor 1)
    "the-oven.handoff_completed": {
      type: "the-oven.handoff_completed",
      weight: 1,
      category: "SYSTEM",
      priority: "MEDIUM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    }, // constants w0 → telemetry tier (floor 1)
    "the-oven.handoff_initiated": {
      type: "the-oven.handoff_initiated",
      weight: 1,
      category: "SYSTEM",
      priority: "MEDIUM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    }, // constants w0 → telemetry tier (floor 1)
    "the-oven.homeowner_hub_visit": {
      type: "the-oven.homeowner_hub_visit",
      weight: 1,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.implicit_referral_detected": {
      type: "the-oven.implicit_referral_detected",
      weight: 5,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.nps_completed": {
      type: "the-oven.nps_completed",
      weight: 7,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.past_client_cold": {
      type: "the-oven.past_client_cold",
      weight: 6,
      category: "NEGATIVE",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.past_client_cooling": {
      type: "the-oven.past_client_cooling",
      weight: 4,
      category: "ENGAGEMENT",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.past_client_reactivated": {
      type: "the-oven.past_client_reactivated",
      weight: 8,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.post_close_engagement": {
      type: "the-oven.post_close_engagement",
      weight: 5,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.referral_confirmed": {
      type: "the-oven.referral_confirmed",
      weight: 10,
      category: "FINANCIAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.referral_received": {
      type: "the-oven.referral_received",
      weight: 9,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.referral_submitted": {
      type: "the-oven.referral_submitted",
      weight: 7,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.review_completed": {
      type: "the-oven.review_completed",
      weight: 8,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.review_requested": {
      type: "the-oven.review_requested",
      weight: 2,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.revival_completed": {
      type: "the-oven.revival_completed",
      weight: 7,
      category: "ENGAGEMENT",
      priority: "HIGH",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.revival_dead": {
      type: "the-oven.revival_dead",
      weight: 1,
      category: "NEGATIVE",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.revival_started": {
      type: "the-oven.revival_started",
      weight: 3,
      category: "BEHAVIORAL",
      priority: "MEDIUM",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "the-oven.temperature_changed": {
      type: "the-oven.temperature_changed",
      weight: 5,
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },

    // ══ PHASE-B1: build-guard violation-list types ═══════════════════════════
    // Additive half of clearing the Layer-2 79-violation shadow report
    // (BUILT/LAYER-2-BUILD-GUARD-SHADOW-DONE.md). Buckets per Kelly's locked
    // decisions (2026-05-23). The seed-rule retires + guard allowlist are the
    // sibling Phase B2 (Rello-side). Companion: BUILT/PHASE-B1-REGISTER-
    // VIOLATION-TYPES-DONE.md.

    // ── Bucket 3 · Rello-internal monitoring/observability ──
    // tier:"telemetry" (explicit low-value, in-registry SOT — NOT a silent
    // DEFAULT, NOT a carve-out), goalShiftSemantics:false, SYSTEM, weight floor
    // 1. No constants.ts row for any (operational signals never classified for
    // nurture). Bare ops names canonicalize to `rello.<verb>`; already-namespaced
    // forms keep their namespace folded canonical (Kelly).
    "rello.cost_drift": {
      type: "rello.cost_drift",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    },
    "rello.mrr_discrepancy": {
      type: "rello.mrr_discrepancy",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    },
    "rello.nurture_missing_campaign": {
      type: "rello.nurture_missing_campaign",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    },
    "rello.nurture_preempt_rate_anomaly": {
      type: "rello.nurture_preempt_rate_anomaly",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    },
    "rello.vault_failure_rate_high": {
      type: "rello.vault_failure_rate_high",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    },
    "rello.trigger_dev_poll_circuit_broken": {
      type: "rello.trigger_dev_poll_circuit_broken",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    },
    "rello.billing_upgrade_converted": {
      type: "rello.billing_upgrade_converted",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    },
    // PHASE-B1B reclassification: B1's premise (these are platform ops monitors
    // DISTINCT from a Layer-3 lead-engagement `call_completed`) was WRONG. The
    // only emit sites are lead-engagement signals — `calls.ts:505`
    // ("…for cross-app consumption (Milo, Newsletter Studio)") and
    // `retry-engine.ts:239`, both `source:"voice"` with a `leadId`. Rello's
    // local classifier corroborates: `constants.ts:39` `call_completed:7` +
    // `constants.ts:387` `call_completed:"ENGAGEMENT"`. So these are weight-7
    // ENGAGEMENT, NOT telemetry — leaving them at the SYSTEM/w1 floor demotes a
    // real engagement signal (breaks call-completion nurture weighting +
    // scoring + the Milo/NS cross-app consumption). `call_*` is not in the
    // NON_GOAL_SHIFT set (`compliance.` only) → goalShiftSemantics:true.
    // `call_exhausted` has no constants row; classed ENGAGEMENT/w7 per the
    // DISCOVERED recommended fix (it is the lead-domain inverse of
    // `call_completed`, same urgency band). The bare→`rello.call_*` emit-flip +
    // constants re-key is the held B2 follow-on (now unblocked).
    // Resolves DISCOVERED-B1-RELLO-CALL-SIGNALS-MISCLASSIFIED-TELEMETRY-VS-
    // ENGAGEMENT-260524.
    "rello.call_completed": {
      type: "rello.call_completed",
      weight: 7, // constants.ts:39
      category: "ENGAGEMENT", // constants.ts:387
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "rello.call_exhausted": {
      type: "rello.call_exhausted",
      weight: 7, // no constants row; ENGAGEMENT/w7 per DISCOVERED (lead-domain inverse of call_completed)
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "rello.pe_enrichment": {
      type: "rello.pe_enrichment",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    },
    "rello.agent_call_outcome": {
      type: "rello.agent_call_outcome",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    },
    "rello.hh_intake_retry_requested": {
      type: "rello.hh_intake_retry_requested",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    },
    // ── PHASE-B1B corrections (v0.7.1) ──
    // Real inbound-email LEAD-ENGAGEMENT signal, emitted BARE-DOTTED
    // `email.received` (`Rello src/trigger/jobs/email-sync.ts:626,893`,
    // category:"ENGAGEMENT" weight:1.0). `email.` is not a slug, so this is a
    // global first-class key (`email.` added to GLOBAL_PREFIXES). The receiver
    // does NOT namespace-prefix already-dotted forms → the live emit resolves
    // with NO emit-flip owed. weight/category mirror the emit-site caller-hints
    // (no Rello constants.ts row). goalShiftSemantics:true — an inbound email is
    // genuine lead engagement; `email.` is not in the NON_GOAL_SHIFT set.
    "email.received": {
      type: "email.received",
      weight: 1, // email-sync.ts:626/893 caller-hint
      category: "ENGAGEMENT",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    // Real Rello-internal BEHAVIORAL signal, emitted BARE/dotless
    // `ticket_created` (`journeyStepStalled.ts:439` + `support/
    // inbound-email.ts:185`, category:"BEHAVIORAL" weight:5). Dotless →
    // normalizeSignalType returns null (no slug to fold), so the bare key can
    // never resolve. Registered as the canonical `rello.ticket_created`; the
    // bare→`rello.ticket_created` emit-flip is a B2-style follow-on (OWED — both
    // emit sites + any consumers flip in lockstep, like the 7 ops flips in B2).
    "rello.ticket_created": {
      type: "rello.ticket_created",
      weight: 5, // journeyStepStalled.ts:439 / inbound-email.ts:185 caller-hint
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "daily_plan.item_injected": {
      type: "daily_plan.item_injected",
      // `daily_plan.` global namespace (GLOBAL_PREFIXES) — Kelly: already-
      // namespaced ops forms keep their namespace folded canonical.
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    },
    "milo-engine.composition_pipeline_failed": {
      type: "milo-engine.composition_pipeline_failed",
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    },
    "consent.revoked": {
      type: "consent.revoked",
      // `consent.` global namespace (already in GLOBAL_PREFIXES). Distinct from
      // the BEHAVIORAL `consent.email_revoked`/`consent.sms_revoked` lifecycle
      // events — this generic compliance-monitor form is bucket-3 telemetry per
      // Kelly (emitted src/lib/conversations/compliance.ts:249).
      weight: 1,
      category: "SYSTEM",
      goalShiftSemantics: false,
      tier: "telemetry",
      lifecycle: "active",
    },

    // ── Bucket 2 · genuinely-missing canonical types (register as active) ──
    // No constants.ts row → seeded at the effective DEFAULT (DEFAULT_WEIGHT=3 /
    // DEFAULT_CATEGORY="BEHAVIORAL", constants.ts:836–837), flagged for Wave-C
    // reclassification (same convention as the v0.6.0 keyspace seed).
    // goalShiftSemantics:true (real lead signals; non-SYSTEM).
    "home-stretch.lead_inactive": {
      type: "home-stretch.lead_inactive",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "open-house-hub.checkin_created": {
      type: "open-house-hub.checkin_created",
      weight: 8,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // weight set to 8 to match OHH SIGNAL_CONFIG + Rello constants.ts (PR #217)
    "open-house-hub.attendee_signed_in": {
      type: "open-house-hub.attendee_signed_in",
      weight: 9,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "open-house-hub.attendee_assessment_completed": {
      type: "open-house-hub.attendee_assessment_completed",
      weight: 7,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "open-house-hub.lead_interested": {
      type: "open-house-hub.lead_interested",
      weight: 9,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "open-house-hub.event_completed": {
      type: "open-house-hub.event_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "open-house-hub.checkin": {
      type: "open-house-hub.checkin",
      // underscore-slug emit `open_house_hub.checkin` folds here via normalizeSlug
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "open-house-hub.enrichment_completed": {
      type: "open-house-hub.enrichment_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "open-house-hub.follow_up_created": {
      type: "open-house-hub.follow_up_created",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    // ── OHH-SHOWINGS-AND-TOURS (v0.16.0) — showing/tour lifecycle family ──
    // Explicit curated weights from the workstream dispatch (NOT bucket-2
    // DEFAULT seeds). All BEHAVIORAL: the family is high-intent lead behavior
    // (mirrors the OHH attendee tuple above + rello.meeting_canceled/no_show,
    // both BEHAVIORAL); NEGATIVE stays reserved for relationship-damage signals
    // (complaints/unsubscribes). goalShiftSemantics:true across the family
    // (real lead signals, non-SYSTEM — same convention as every OHH neighbor);
    // showing_feedback explicitly goal-shifting per dispatch (feedback
    // redirects nurture). No `priority` — weight-band derivation applies,
    // mirroring attendee_signed_in/lead_interested.
    "open-house-hub.showing_requested": {
      type: "open-house-hub.showing_requested",
      weight: 8, // high-intent behavioral per dispatch
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "open-house-hub.showing_confirmed": {
      type: "open-house-hub.showing_confirmed",
      weight: 9,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "open-house-hub.showing_canceled": {
      type: "open-house-hub.showing_canceled",
      weight: 4,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "open-house-hub.showing_completed": {
      type: "open-house-hub.showing_completed",
      weight: 7,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "open-house-hub.showing_no_show": {
      type: "open-house-hub.showing_no_show",
      weight: 5,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "open-house-hub.showing_feedback": {
      type: "open-house-hub.showing_feedback",
      weight: 9,
      category: "BEHAVIORAL",
      goalShiftSemantics: true, // feedback redirects nurture (dispatch)
      lifecycle: "active",
    },
    // ── OHH-SHOWINGS-AND-TOURS P4 (v0.18.0) — multi-stop tour lifecycle ──
    // Siblings of the showing_* family above; same conventions (explicit
    // curated weights per CONTRACT-TOUR-COMPANION-PAYLOAD-260611 §Signals,
    // BEHAVIORAL, goalShift:true, no `priority` — weight-band derivation).
    "open-house-hub.tour_created": {
      type: "open-house-hub.tour_created",
      weight: 6,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "open-house-hub.tour_completed": {
      type: "open-house-hub.tour_completed",
      weight: 7,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "newsletter-studio.email_forwarded": {
      type: "newsletter-studio.email_forwarded",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "harvest-home.gateway_injection_failed": {
      type: "harvest-home.gateway_injection_failed",
      // underscore-slug emit `harvest_home.gateway_injection_failed` folds here
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "harvest-home.leads_imported": {
      type: "harvest-home.leads_imported",
      // concat-slug emit `harvesthome.leads_imported` folds here
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass

    // ── Bucket 4 · production global-namespace forms (first-class) ──
    // NOT the admin/lab/.../simulate test-harness forms (email.*/sms.replied —
    // Phase-B2 allowlisted). `agent.`/`rate.`/`data.` added to GLOBAL_PREFIXES.
    // No constants row → DEFAULT, flagged Wave-C. goalShiftSemantics:true.
    "agent.action_completed": {
      type: "agent.action_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "agent.action_skipped": {
      type: "agent.action_skipped",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "rate.alert_triggered": {
      type: "rate.alert_triggered",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    // RATE-ENGINE — the canonical tenant-agnostic market-move broadcast
    // (Rate Engine sole emitter; AOM "Generic market-move rate.changed
    // broadcast" row, 2026-06-04). Global `rate.` prefix sibling to
    // `rate.alert_triggered`; internal-signal axis of the dual registration,
    // and the SAME literal as the outbound webhook event `rate.changed` in
    // @rello-platform/webhook-events. Tenant-agnostic infrastructure event
    // (no lead/tenant scope) → SYSTEM/goalShift:false; never feeds nurture
    // goal-shift. Emitted on SIGNIFICANT/CRITICAL detection from
    // src/trigger/jobs/rate-data.ts.
    "rate.changed": {
      type: "rate.changed",
      weight: 1,
      category: "SYSTEM",
      priority: "HIGH",
      goalShiftSemantics: false,
      lifecycle: "active",
    },
    "signal.credits.purchased": {
      type: "signal.credits.purchased",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass
    "data.stale": {
      type: "data.stale",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // DEFAULT (no constants row) — Wave-C reclass

    // ────────────────────────────────────────────────────────────────────
    // RELLO-LEAD-PHONE-DISCONNECTED (v0.15.0; CROSS-REPO-WALK-DECISIONS-260609
    // Q2). Rello emits on Twilio MessageStatus=failed + ErrorCode ∈ {30003,
    // 30005, 30006} via the SMS delivery-status webhook (MessageSid =
    // idempotency key; outbox-backed per SIGNAL-AND-WEBHOOK-PATTERNS §6).
    // Consumed by HH's ReplacementClaim receiver (checkPhoneDisconnected,
    // auto-flag-watcher.ts:182-212). Registered BEFORE the Rello emit PR — the
    // armed check:signal-types pre-push gate blocks unregistered emits.
    // Metadata mirrors the closest negative-lead-contactability sibling,
    // `newsletter-studio.email_complained` (NEGATIVE / HIGH / goalShift:false /
    // active): a disconnected phone is a hard, permanent channel-dead event the
    // agent must know about immediately (it triggers lead replacement), but it
    // is contactability data, not a lead-goal shift. Weight 7 (vs complained's
    // 9): channel loss, not active relationship damage by the lead.
    // lifecycle:"active" (not forensic) — the emitter ships as the immediate
    // next step of the same locked Q2 sequence, mirroring the v0.13.0
    // home-ready.intent_target_crossed registration pattern.
    // ────────────────────────────────────────────────────────────────────
    "rello.lead_phone_disconnected": {
      type: "rello.lead_phone_disconnected",
      weight: 7,
      category: "NEGATIVE",
      priority: "HIGH",
      goalShiftSemantics: false,
      lifecycle: "active",
    },

    // ────────────────────────────────────────────────────────────────────
    // HH-LEGACY-CANONICAL-ALIASES (v0.15.0; CROSS-REPO-WALK-DECISIONS-260609
    // Q6 step 1). Canonical `harvest-home.<snake_verb>` (single-dot, registry
    // doc §2) targets for HH's 24 LIVE legacy `signal.*` emit types (grep of
    // Harvest-Home origin/main @ a40e4db). Metadata CARRIED OVER from the
    // legacy `signal.*` EXACT_REGISTRY rows above — all 23 carried rows are at
    // the effective DEFAULT (weight 3 / BEHAVIORAL / goalShiftSemantics:true /
    // active, no priority), still flagged for Wave-C reclassification. The one
    // type with NO legacy row (`signal.hh.idg_retry_synced` — live direct
    // /signals/batch POST, never registered) is derived sensibly below. The
    // legacy rows are KEPT as a read-bridge (historical SignalLog
    // classification; Phase-3 retirement per registry doc §9);
    // `normalizeSignalType` folds legacy → canonical via
    // LEGACY_SIGNALTYPE_EXACT_ALIASES (normalize.ts).
    // ────────────────────────────────────────────────────────────────────
    "harvest-home.byol_leads_imported": {
      type: "harvest-home.byol_leads_imported",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.byol.leads_imported (DEFAULT) — Wave-C reclass
    "harvest-home.byol_leads_reactivated": {
      type: "harvest-home.byol_leads_reactivated",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.byol.leads_reactivated (DEFAULT) — Wave-C reclass
    "harvest-home.byol_monitoring_started": {
      type: "harvest-home.byol_monitoring_started",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.byol.monitoring_started (DEFAULT) — Wave-C reclass
    "harvest-home.byol_parked_lead_signal_detected": {
      type: "harvest-home.byol_parked_lead_signal_detected",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.byol.parked_lead_signal_detected (DEFAULT) — Wave-C reclass
    "harvest-home.byol_parked_leads_resurfaced": {
      type: "harvest-home.byol_parked_leads_resurfaced",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.byol.parked_leads_resurfaced (DEFAULT) — Wave-C reclass
    "harvest-home.byol_push_calls_completed": {
      type: "harvest-home.byol_push_calls_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.byol.push_calls_completed (DEFAULT) — Wave-C reclass
    "harvest-home.byol_scoring_completed": {
      type: "harvest-home.byol_scoring_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.byol.scoring_completed (DEFAULT) — Wave-C reclass
    "harvest-home.byol_upload_completed": {
      type: "harvest-home.byol_upload_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.byol.upload_completed (DEFAULT) — Wave-C reclass
    "harvest-home.credits_purchased": {
      type: "harvest-home.credits_purchased",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.credits.purchased (DEFAULT) — Wave-C reclass
    "harvest-home.discovery_search": {
      type: "harvest-home.discovery_search",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.discovery.search (DEFAULT) — Wave-C reclass
    "harvest-home.discovery_unlock": {
      type: "harvest-home.discovery_unlock",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.discovery.unlock (DEFAULT) — Wave-C reclass
    // `signal.hh.idg_retry_synced` had NO legacy registry row (live direct
    // /signals/batch POST, HH src/trigger/rello-sync-retry.ts:451 — emitted
    // when an IDG-origin HOT lead's delayed Rello sync finally lands, so Rello
    // knows the hot lead was delayed but is now synced). Derived: DEFAULT
    // weight 3 / BEHAVIORAL / goalShiftSemantics:true (sibling HH convention) +
    // priority HIGH from the emit-site caller-hint (`priority: "high"`).
    // Canonical verb drops the redundant `hh` slug segment (the spoke itself,
    // not a domain).
    "harvest-home.idg_retry_synced": {
      type: "harvest-home.idg_retry_synced",
      weight: 3,
      category: "BEHAVIORAL",
      priority: "HIGH", // rello-sync-retry.ts:452 caller-hint
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // derived (no legacy row) — Wave-C reclass
    "harvest-home.intake_lead_created": {
      type: "harvest-home.intake_lead_created",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.intake.lead_created (DEFAULT) — Wave-C reclass
    "harvest-home.intake_lead_enriched": {
      type: "harvest-home.intake_lead_enriched",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.intake.lead_enriched (DEFAULT) — Wave-C reclass
    "harvest-home.intake_lead_merged": {
      type: "harvest-home.intake_lead_merged",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.intake.lead_merged (DEFAULT) — Wave-C reclass
    "harvest-home.intake_lead_rescored": {
      type: "harvest-home.intake_lead_rescored",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.intake.lead_rescored (DEFAULT) — Wave-C reclass
    "harvest-home.lead_contacted": {
      type: "harvest-home.lead_contacted",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.lead.contacted (DEFAULT) — Wave-C reclass
    "harvest-home.lead_converted": {
      type: "harvest-home.lead_converted",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.lead.converted (DEFAULT) — Wave-C reclass
    "harvest-home.lead_delivered": {
      type: "harvest-home.lead_delivered",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.lead.delivered (DEFAULT) — Wave-C reclass
    "harvest-home.lead_purchased": {
      type: "harvest-home.lead_purchased",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.lead.purchased (DEFAULT) — Wave-C reclass
    "harvest-home.lead_scored": {
      type: "harvest-home.lead_scored",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.lead.scored (DEFAULT) — Wave-C reclass
    "harvest-home.pipeline_call_outcome": {
      type: "harvest-home.pipeline_call_outcome",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.pipeline.call_outcome (DEFAULT) — Wave-C reclass
    "harvest-home.pipeline_session_completed": {
      type: "harvest-home.pipeline_session_completed",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.pipeline.session_completed (DEFAULT) — Wave-C reclass
    "harvest-home.pipeline_session_started": {
      type: "harvest-home.pipeline_session_started",
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    }, // carried from signal.pipeline.session_started (DEFAULT) — Wave-C reclass

    // ────────────────────────────────────────────────────────────────────
    // HOMEOWNER-LIFECYCLE-REHOME P1 (v0.19.0; spec DL1). Rello emits at the
    // funded/recorded BUY-SIDE ClosingMilestone advance (Rello
    // closing/milestones.ts:464 / closing/index.ts:298), carrying the NEW
    // property identity {relloLeadId, tenantId, newPropertyAddress,
    // newPropertyZip, purchasePrice, loanAmount, closeDate} — see
    // relloHomePurchasedDataSchema (schemas/rello.ts, same minor per BPB 9.1).
    // NAMING: the spec drafted "closing.home_purchased", but the registry owns
    // canonical form. `closing` is a Rello-internal domain concept, NOT a
    // @rello-platform/slugs slug (it could never slug-fold), and per §2.1 a
    // bare domain prefix is never first-class — Rello-internal concepts
    // register under `rello.*` (the rello.meeting_* / rello.anniversary
    // precedent). Emitters MUST use the literal "rello.home_purchased"; no
    // `closing.` alias is registered (there is no live legacy emitter — the
    // Rello P1 emit lane lands AFTER this minor and emits canonical from
    // birth).
    // Weight 9 / goalShiftSemantics:true — a purchase close is the strongest
    // lifecycle pivot (buyer journey ends, homeowner journey begins; Oven
    // profile repoint + OHH listing close + HH state advance all key off it).
    // BEHAVIORAL per the family neighbors (rello.meeting_* /
    // rello.handoff_transition — real lead lifecycle events, non-SYSTEM;
    // FINANCIAL stays reserved for finance-readiness signals). No `priority`
    // — weight-band derivation (mirrors every rello.meeting_* sibling).
    // lifecycle:"active" — the Rello emitter ships as the immediate next step
    // of the same locked spec sequence (the v0.15.0
    // rello.lead_phone_disconnected registration pattern).
    // ────────────────────────────────────────────────────────────────────
    "rello.home_purchased": {
      type: "rello.home_purchased",
      weight: 9,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },

    // ────────────────────────────────────────────────────────────────────
    // OHH-SHOWINGS-AND-TOURS P5 (v0.19.0) — co-op agent invited to a showing.
    // Sibling of the showing_* lifecycle family above (same conventions:
    // BEHAVIORAL, goalShift:true, lifecycle:"active", explicit curated
    // weight, no `priority` — weight-band derivation). Weight 4 (coordination
    // step, same band as showing_canceled — not a lead-intent spike).
    // Payload is the Rule-D mutation trail ONLY (Pattern-C: OHH has no local
    // AuditLog table — audit routes to Rello via signal): ids + capability
    // booleans (hasEmail/hasPhone), NEVER the co-op agent's contact values
    // (PII floor) — see ohhCoopInviteSentDataSchema (schemas/open-house-hub.ts).
    // ────────────────────────────────────────────────────────────────────
    "open-house-hub.coop_invite_sent": {
      type: "open-house-hub.coop_invite_sent",
      weight: 4,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },
  };

/**
 * Audit-family prefixes — one canonical `<slug>.audit.` per canonical app slug,
 * generated from `APP_SLUGS`. Mirrors the shipped `isAuditSignal` matcher
 * (`Rello/src/lib/signals/handlers/auditSignal.ts`), which membership-checks
 * `parts[0]` against the `APP_SLUGS` catalog. `normalizeSlug` folds any legacy
 * slug form (underscore/concat) to canonical hyphen before family resolution,
 * so only the canonical-hyphen prefix needs registering.
 *
 * Audit signals are operational/observability rows (routed to `AuditLog`), not
 * lead-nurture signals: weight 1, SYSTEM, non-goal-shift.
 */
const AUDIT_FAMILIES: readonly SignalTypeFamily[] = APP_SLUGS.map((slug) => ({
  prefix: `${slug}.audit.` as `${string}.`,
  weight: 1,
  category: "SYSTEM" as const,
  goalShiftSemantics: false,
  lifecycle: "active" as const,
}));

/**
 * Dynamic prefix-families. Completeness = "every emitted literal is an exact
 * registered key OR matches a registered family prefix" (SPEC §1).
 */
export const FAMILY_REGISTRY: readonly SignalTypeFamily[] = [
  // Home Scout dynamic CTA variants (45+). Canonical prefix is
  // `home-scout.cta_clicked.` — `normalizeSlug` folds the legacy `scout`
  // prefix (`classifier.ts:36` `scout.cta_clicked.`) to `home-scout`.
  // weight 4 BEHAVIORAL baseline per classifier.ts:36 (high-intent variants
  // like book-a-call are individually registered in Wave C).
  {
    prefix: "home-scout.cta_clicked.",
    weight: 4,
    category: "BEHAVIORAL",
    goalShiftSemantics: true,
    lifecycle: "active",
  },
  // The-Drumbeat upsell-nudge clicks: `the-drumbeat.upsell.<seam>.clicked`
  // (the-drumbeat `src/app/api/upsell/track-click/route.ts:58`, emitted "low"
  // priority). MLO-facing product telemetry, not lead-nurture.
  {
    prefix: "the-drumbeat.upsell.",
    weight: 2,
    category: "ENGAGEMENT",
    priority: "LOW",
    goalShiftSemantics: false,
    lifecycle: "active",
  },
  // Home-Scout tool-engagement global namespace: `signal.tool.<slug>.<action>`
  // (Q-NEW-3 canonical; ~22 per-tool variants, SURFACE-MAP §1.3). Lead-tool
  // engagement → goal-shift; DEFAULT-tier weight pending Wave-C per-tool review.
  {
    prefix: "signal.tool.",
    weight: 3,
    category: "BEHAVIORAL",
    goalShiftSemantics: true,
    lifecycle: "active",
  },
  // Content-Engine audit family: `content-engine.audit.<entity>.<action>`
  // (SURFACE-MAP §1.9). content-engine is an ENGINE slug, NOT in APP_SLUGS, so
  // AUDIT_FAMILIES (APP_SLUGS-derived) does not cover it — registered explicitly.
  {
    prefix: "content-engine.audit.",
    weight: 1,
    category: "SYSTEM",
    goalShiftSemantics: false,
    lifecycle: "active",
  },
  // The-Drumbeat MLO/engine-domain events: `the-drumbeat.mlo.<verb>` (SPEC
  // decision 24 / DISCOVERED-DRUMBEAT-MLO-PREFIX-SIGNALS-UNREGISTERED-260522).
  // The `mlo.` bare emit folds here via DEPRECATED_SIGNALTYPE_PREFIX_ALIASES
  // (`mlo.` → `the-drumbeat.mlo.`); 4 verbs (rate_lock_celebrated,
  // rate_sheet_published, refi_candidates_found, refi_outreach_completed).
  {
    prefix: "the-drumbeat.mlo.",
    weight: 3,
    category: "BEHAVIORAL",
    goalShiftSemantics: true,
    lifecycle: "active",
  },
  // PHASE-B1 bucket 5 · score-threshold family: `score.crossed_<threshold>`
  // (`Rello src/trigger/jobs/conversion-score.ts:165` emits
  // `score.crossed_${threshold}`). The seeded exacts `score.crossed_60` /
  // `score.crossed_80` resolve via EXACT_REGISTRY; this family covers the
  // dynamic builder + any future threshold (e.g. `score.crossed_90`) so the
  // build-guard's template-literal check passes on the `score.crossed_` static
  // prefix. Underscore-terminated (the threshold is appended in-segment, not a
  // new dotted segment) — see SignalTypeFamily.prefix. Metadata mirrors the
  // seeded score.crossed_60/_80 exacts (weight 3 / BEHAVIORAL / goal-shift).
  {
    prefix: "score.crossed_",
    weight: 3,
    category: "BEHAVIORAL",
    goalShiftSemantics: true,
    lifecycle: "active",
  },
  // Cross-app audit families (`<slug>.audit.<entity>.<action>`).
  ...AUDIT_FAMILIES,
];

/**
 * Look up an exact registry entry by canonical key. Returns `undefined` for
 * unregistered keys (the index type widens to `string` so the absence is
 * surfaced honestly rather than masked by the `Record` value type).
 */
export function lookupExact(type: string): SignalTypeEntry | undefined {
  return (EXACT_REGISTRY as Record<string, SignalTypeEntry | undefined>)[type];
}

/** Look up the first family whose prefix the canonical key starts with. */
export function lookupFamily(type: string): SignalTypeFamily | undefined {
  return FAMILY_REGISTRY.find((family) => type.startsWith(family.prefix));
}
