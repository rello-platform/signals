export { OhhAttendeeData, OhhAttendeeMarkedForPfpPreapprovalData, ohhAttendeeDataSchema, ohhAttendeeMarkedForPfpPreapprovalDataSchema } from './schemas/open-house-hub.js';
export { HsLeadMagnetSubmittedData, hsLeadMagnetSubmittedDataSchema } from './schemas/home-scout.js';
export { HhLeadIntakeData, hhLeadIntakeDataSchema } from './schemas/harvest-home.js';
export { ReportEngineReportReadyData, reportEngineReportReadyDataSchema } from './schemas/report-engine.js';
export { PfpComplianceConfigChangedData, PfpComplianceGateBlockedData, PfpExportFailedData, PfpExportInFlightData, PfpExportPermanentlyFailedData, PfpExportQueuedData, PfpExportSuccessData, pfpComplianceConfigChangedDataSchema, pfpComplianceGateBlockedDataSchema, pfpExportFailedDataSchema, pfpExportInFlightDataSchema, pfpExportPermanentlyFailedDataSchema, pfpExportQueuedDataSchema, pfpExportSuccessDataSchema } from './schemas/pathfinder-pro.js';
import 'zod';

/**
 * Canonical `SignalCategory` namespace for the Rello platform.
 *
 * 8-value union. Promoted into `@rello-platform/signals` v0.4.0 (Wave A of the
 * Signal-Type Registry workstream) because the registry types its own
 * `category` field (`SignalTypeEntry.category`) — the package can no longer
 * defer the vocabulary to a Rello-private declaration (SPEC §1.2 / §8
 * decision 10). `SignalPriority` already lives here (`signal-priority.ts`).
 *
 * Rello keeps a guarded local alias (`src/lib/signals/types.ts:7`) with a
 * mirror `_AssertSignalCategoryMatch` structural-equivalence drift-guard,
 * identical to the shipped `_AssertSignalPriorityMatch` at
 * `Rello/src/lib/signals/types.ts:11-25`. That Rello-side cross-package guard
 * is wired in Wave C; this file ships the canonical declaration plus a
 * package-internal self-consistency guard (below) so the literal union and the
 * runtime tuple can never silently diverge.
 */
/** Canonical 8-value signal category union. */
type SignalCategory = "ENGAGEMENT" | "READINESS" | "ANXIETY" | "FINANCIAL" | "BEHAVIORAL" | "NEGATIVE" | "SYSTEM" | "ESCALATION";
/**
 * Runtime tuple of every canonical `SignalCategory`. Useful for runtime
 * validation at trust-boundaries (spoke webhook decoders, admin form parsers)
 * and as the iteration source for completeness checks.
 *
 * Declared independently of the `SignalCategory` union (NOT derived from it) so
 * the drift-guard below is meaningful: editing one without the other is a
 * compile error.
 */
declare const SIGNAL_CATEGORIES: readonly ["ENGAGEMENT", "READINESS", "ANXIETY", "FINANCIAL", "BEHAVIORAL", "NEGATIVE", "SYSTEM", "ESCALATION"];
/** Type guard — narrows `unknown` to `SignalCategory`. */
declare function isSignalCategory(value: unknown): value is SignalCategory;

/**
 * Canonical SignalPriority namespace for the Rello platform.
 *
 * 4-value union, Signal-namespace, classifier-canonical. Matches what
 * `~/Rello/src/lib/signals/classifier.ts:42` emits, what
 * `~/Rello/src/lib/signals/ably-publisher.ts:23-25` consumes, and what every
 * spoke-boundary normalizer (`/api/signals/batch`, `/api/signals/openhousehub`)
 * outputs.
 *
 * Consumed by:
 * - `@rello-platform/precedence-authority` v0.1.0+ — `evaluatePrecedence()`
 *   compares signal priority against per-tenant `policy.minPreemptPriority`.
 * - Rello core — `SignalLog.priority` column + signal classifier + Ably
 *   downstream publisher.
 *
 * NOT this namespace:
 * - `'URGENT'` — Task-namespace (`~/Rello/src/app/api/admin/support/route.ts:13`
 *   + `milo/task-suggestions/route.ts:17` + `dashboard/tickets/route.ts:88`).
 *   Task.priority is a separate vocabulary; use a translator at the boundary.
 * - `'NORMAL'` — spoke-boundary form normalized to `'MEDIUM'` at
 *   `/api/signals/batch:43-54` before reaching the connector.
 * - lowercase 3-value — Milo framework-tones output namespace at
 *   `~/Milo-Engine/src/lib/blueprint-assembler.ts:76-90`.
 *
 * Promoted from Rello-private (`~/Rello/src/lib/signals/types.ts`) to shared
 * v0.2.0 per NURTURE-PRECEDENCE-AUTHORITY-SPEC-260520 Q7 lock + Vocabulary
 * Drift Resolution section (spec lines 700-733). Rello-side adds a
 * structural-equivalence drift guard mirroring `@rello-platform/enrollments`
 * Revision-C extraction precedent.
 */
type SignalPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
/**
 * Ordinal rank for SignalPriority comparison. Higher = more important.
 * Used by `meetsMinPriority()` for threshold checks.
 */
declare const SIGNAL_PRIORITY_RANK: Readonly<Record<SignalPriority, number>>;
/**
 * Returns true when `signalPriority` meets or exceeds the `minPolicy`
 * threshold per ordinal rank. Used by per-tenant precedence-authority
 * policy gates: `policy.minPreemptPriority='HIGH'` accepts HIGH + CRITICAL
 * signals; LOW/MEDIUM signals are blocked at the priority gate.
 *
 * @example
 *   meetsMinPriority('CRITICAL', 'HIGH') === true
 *   meetsMinPriority('MEDIUM', 'HIGH')   === false
 *   meetsMinPriority('HIGH', 'HIGH')     === true
 */
declare function meetsMinPriority(signalPriority: SignalPriority, minPolicy: SignalPriority): boolean;
/**
 * Set of canonical SignalPriority values. Useful for runtime validation at
 * trust-boundaries (spoke webhook decoders, admin form input parsers).
 */
declare const SIGNAL_PRIORITIES: readonly ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
/** Type guard — narrows unknown to SignalPriority. */
declare function isSignalPriority(value: unknown): value is SignalPriority;

/**
 * Canonical signal-type registry schema — the per-type declarative entry.
 *
 * One canonical row per signal type. Collapses the three parallel
 * `Record<string, …>` maps that live in Rello today
 * (`SIGNAL_WEIGHTS`/`SIGNAL_CATEGORIES`/`PRIORITY_OVERRIDES`,
 * `constants.ts:8/352/663`) into a single row, making a weighted-but-
 * uncategorized type structurally unrepresentable (SPEC §1, Q12).
 *
 * Wave A shipped the schema + a 14-type seed; Wave B added the 3 NS email
 * lifecycle entries. The KEYSPACE-SEED dispatch (v0.6.0) absorbs the full emitted
 * canonical keyspace (~250 additional exact keys + new prefix-families), so
 * `normalizeSignalType` resolves every emitted form and the build-guard has a
 * complete keyset to check against.
 */

/**
 * The exact canonical signal-type keys that have a registered `EXACT_REGISTRY`
 * row. Declared as an explicit literal union (NOT derived from the registry
 * object) so `EXACT_REGISTRY: Record<ExactCanonicalSignalType, SignalTypeEntry>`
 * enforces per-key completeness at `tsc` time: a missing key or a stray
 * non-canonical key is a compile error.
 *
 * Seed = the 14 hand-curated canonical types shipped through v0.3.0
 * (`src/signal-type.ts` — the SPEC/surface-map label this "13", a known
 * pre-existing miscount; the actual union has 14 distinct members). The full
 * keyspace migrates in Wave C; this union grows additively as the registry
 * absorbs it.
 *
 * Canonical key form: `<canonical-hyphen-slug>.<snake_verb>` OR a registered
 * global-namespace key (`signal.*`/`score.*`/`system.*`/`consent.*`/
 * `checkpoint.*`). No global keys are seeded in Wave A (they arrive with the
 * Wave C keyspace absorption).
 */
type ExactCanonicalSignalType = "open-house-hub.attendee_marked_for_pfp_preapproval" | "home-scout.lead_magnet_submitted" | "harvest-home.lead_intake" | "report-engine.report_ready" | "pathfinder-pro.export.queued" | "pathfinder-pro.export.in_flight" | "pathfinder-pro.export.success" | "pathfinder-pro.export.failed" | "pathfinder-pro.export.permanently_failed" | "pathfinder-pro.compliance.gate_blocked" | "pathfinder-pro.compliance.config_changed" | "rello.nurture_escalate_injected" | "rello.nurture_escalate_deduped" | "rello.nurture_escalate_injection_failed" | "newsletter-studio.email_complained" | "newsletter-studio.email_unsubscribed" | "newsletter-studio.email_bounced" | "checkpoint.call_requested" | "checkpoint.responded" | "checkpoint.update_started" | "consent.email_granted" | "consent.email_revoked" | "consent.sms_granted" | "consent.sms_revoked" | "consent.updated" | "content-engine.article_clicked" | "content-engine.article_opened" | "content-engine.article_scroll_deep" | "content-engine.article_sent" | "content-engine.classification_abandoned" | "content-engine.content_stale" | "content-engine.generation_completed" | "drumbeat-video-engine.video_rendered" | "harvest-home.call_list_contact_initiated" | "harvest-home.call_list_snapshot_generated" | "harvest-home.data_enriched" | "harvest-home.data_pack_purchased" | "harvest-home.discovery_replacement_claim_filed" | "harvest-home.discovery_replacement_claim_resolved" | "harvest-home.discovery_search_saved" | "harvest-home.immediate_action" | "harvest-home.lead_acquisition_recorded" | "harvest-home.property_address_changed" | "harvest-home.property_equity_threshold_crossed" | "harvest-home.property_listing_detected" | "harvest-home.skip_trace_completed" | "home-ready.almost_home_login" | "home-ready.almost_home_session_duration" | "home-ready.assessment_completed" | "home-ready.assessment_started" | "home-ready.assessment_updated" | "home-ready.challenge_completed" | "home-ready.challenge_enrolled" | "home-ready.challenge_progress" | "home-ready.challenge_wizard_feedback" | "home-ready.closing_ready" | "home-ready.closing_retracted" | "home-ready.data_stale" | "home-ready.document_analyzed" | "home-ready.document_uploaded" | "home-ready.milo_chat_session" | "home-ready.milo_report_generated" | "home-ready.plaid_connected" | "home-ready.recommendation_acted_on" | "home-ready.recommendation_feedback" | "home-ready.recommendation_viewed" | "home-ready.score_calculated" | "home-ready.score_changed" | "home-ready.score_updated" | "home-ready.stall_detected" | "home-ready.survey_completed" | "home-scout.affordability_calculated" | "home-scout.buying_power_calculated" | "home-scout.call_booked" | "home-scout.cash_out_calculated" | "home-scout.cta_clicked.book_a_call" | "home-scout.cta_clicked.get_pre_approved" | "home-scout.cta_clicked.qualify" | "home-scout.cta_clicked.rate_quote" | "home-scout.cta_clicked.rate_watch" | "home-scout.cta_clicked.request_cma" | "home-scout.cta_clicked.whats_my_home_worth" | "home-scout.data_stale" | "home-scout.decision_stage_engagement" | "home-scout.dpa_search_completed" | "home-scout.embed_interaction" | "home-scout.embed_loaded" | "home-scout.equity_check_returned" | "home-scout.expired_analysis_requested" | "home-scout.form_submitted" | "home-scout.fsbo_net_sheet_requested" | "home-scout.home_value_requested" | "home-scout.homeowner_hub_viewed" | "home-scout.homeowner_magic_link_issued" | "home-scout.homeowner_magic_link_verified" | "home-scout.homeready_handoff_exhausted" | "home-scout.homeready_handoff_failed" | "home-scout.homeready_handoff_retry_success" | "home-scout.homeready_handoff_success" | "home-scout.injection_cta_clicked" | "home-scout.lead_captured" | "home-scout.lead_reengaged" | "home-scout.listing_saved" | "home-scout.listing_search_performed" | "home-scout.listing_unsaved" | "home-scout.net_sheet_calculated" | "home-scout.newsletter_signup" | "home-scout.preferred_option_selected" | "home-scout.qualification_estimated" | "home-scout.rate_alert_set" | "home-scout.rate_alert_triggered" | "home-scout.rate_shopping_signal" | "home-scout.referral_submitted" | "home-scout.refi_consideration_signal" | "home-scout.reverse_mortgage_estimate_requested" | "home-scout.search_saved" | "home-scout.sell_intent_confirmed" | "home-scout.showing_requested" | "home-scout.survey_gate_answered" | "home-scout.survey_gate_question_answered" | "home-scout.tool_completed" | "home-scout.tool_started" | "home-scout.unattached_lead_captured" | "home-scout.va_eligible_confirmed" | "home-stretch.activity_completed" | "home-stretch.anxiety_detected" | "home-stretch.article_read" | "home-stretch.badge_earned" | "home-stretch.chat_completed" | "home-stretch.chat_message" | "home-stretch.chat_session" | "home-stretch.chat_started" | "home-stretch.credit_analyzed" | "home-stretch.document_analyzed" | "home-stretch.document_uploaded" | "home-stretch.dream_profile_updated" | "home-stretch.financial_snapshot_updated" | "home-stretch.guest_mlo_eligibility_decision" | "home-stretch.guest_mlo_message_sent" | "home-stretch.guest_mlo_note_added" | "home-stretch.inactive" | "home-stretch.login_streak" | "home-stretch.milestone_reached" | "home-stretch.milo_report_generated" | "home-stretch.module_completed" | "home-stretch.module_stalled" | "home-stretch.module_started" | "home-stretch.onboarding_completed" | "home-stretch.pillar_completed" | "home-stretch.pillar_status_changed" | "home-stretch.points_earned" | "home-stretch.preapproval_approved" | "home-stretch.preapproval_started" | "home-stretch.prospect_invitation_sms_requested" | "home-stretch.prospect_invited" | "home-stretch.ready_to_buy" | "home-stretch.registered" | "home-stretch.savings_milestone" | "home-stretch.score_changed" | "home-stretch.stall_detected" | "home-stretch.track_selected" | "home-stretch.under_contract" | "market-intel.alert_triggered" | "market-intel.digest_clicked" | "market-intel.digest_generated" | "market-intel.digest_opened" | "market-intel.podcast_played" | "market-intel.report_generated" | "market-intel.snapshot_shared" | "market-intel.subscribed" | "newsletter-studio.content_feedback_negative" | "newsletter-studio.content_feedback_positive" | "newsletter-studio.content_preference_changed" | "newsletter-studio.email_checkpoint_responded" | "newsletter-studio.email_clicked" | "newsletter-studio.email_delivered" | "newsletter-studio.email_frequency_changed" | "newsletter-studio.email_opened" | "newsletter-studio.email_pause_expired" | "newsletter-studio.email_paused" | "newsletter-studio.email_replied" | "newsletter-studio.email_sent" | "newsletter-studio.flow_advanced" | "newsletter-studio.reply_received" | "newsletter-studio.scroll_depth" | "newsletter-studio.unsubscribe_reason" | "pathfinder-pro.agent_partner.captured" | "pathfinder-pro.attendee_reclassified" | "pathfinder-pro.borrower_interest" | "pathfinder-pro.credit_pull.consent_captured" | "pathfinder-pro.credit_pull.failed" | "pathfinder-pro.credit_pull.hard_executed" | "pathfinder-pro.credit_pull.soft_executed" | "pathfinder-pro.exported_to_los" | "pathfinder-pro.hh_intake_sync" | "pathfinder-pro.intake_completed" | "pathfinder-pro.intake_started" | "pathfinder-pro.past_borrowers.queried" | "pathfinder-pro.prequalified" | "pathfinder-pro.realtor_prospect.intake_received" | "pathfinder-pro.scenario_converted" | "pathfinder-pro.scenario_created" | "pathfinder-pro.scenario_delivered" | "pathfinder-pro.scenario_viewed" | "prequal-pro.document_uploaded" | "property-engine.listing_under_contract" | "property-engine.listing_went_live" | "property-engine.rate_sync_completed" | "rello.anniversary" | "rello.handoff_transition" | "rello.lead_created" | "rello.lead_data_sufficient" | "rello.lead_stage_changed" | "rello.local_conversion" | "rello.meeting_booked" | "rello.meeting_canceled" | "rello.meeting_completed" | "rello.meeting_no_show" | "rello.nurture_reply_detected" | "rello.nurture_reply_sent" | "report-engine.report_failed" | "score.crossed_60" | "score.crossed_80" | "signal.byol.leads_imported" | "signal.byol.leads_reactivated" | "signal.byol.monitoring_started" | "signal.byol.parked_lead_signal_detected" | "signal.byol.parked_leads_resurfaced" | "signal.byol.push_calls_completed" | "signal.byol.scoring_completed" | "signal.byol.upload_completed" | "signal.discovery.search" | "signal.discovery.unlock" | "signal.intake.lead_created" | "signal.intake.lead_enriched" | "signal.intake.lead_merged" | "signal.intake.lead_rescored" | "signal.lead.contacted" | "signal.lead.converted" | "signal.lead.delivered" | "signal.lead.enriched" | "signal.lead.purchased" | "signal.lead.scored" | "signal.pipeline.call_outcome" | "signal.pipeline.session_completed" | "signal.pipeline.session_started" | "system.checkpoint_external_change" | "system.periodic_checkpoint" | "the-drumbeat.ad_lead_captured" | "the-drumbeat.campaign_launched" | "the-drumbeat.content_broker_review_needed" | "the-drumbeat.content_compliance_blocked" | "the-drumbeat.content_draft_approved" | "the-drumbeat.content_draft_generated" | "the-drumbeat.content_draft_published" | "the-drumbeat.content_draft_rejected" | "the-drumbeat.direct_mail_sent" | "the-drumbeat.market_content_generated" | "the-drumbeat.market_content_published" | "the-drumbeat.market_report_generated" | "the-drumbeat.post_published" | "the-drumbeat.qr_code_scanned" | "the-drumbeat.rate_alert_triggered" | "the-drumbeat.review_received" | "the-drumbeat.stall_detected" | "the-drumbeat.video_message_sent" | "the-drumbeat.video_message_watched" | "the-drumbeat.video_published" | "the-drumbeat.video_recorded" | "the-drumbeat.video_started" | "the-drumbeat.video_view_aggregate" | "the-drumbeat.video_viewed" | "the-drumbeat.video_watched" | "the-oven.anniversary_reached" | "the-oven.equity_digest_sent" | "the-oven.handoff_completed" | "the-oven.handoff_initiated" | "the-oven.homeowner_hub_visit" | "the-oven.implicit_referral_detected" | "the-oven.nps_completed" | "the-oven.past_client_cold" | "the-oven.past_client_cooling" | "the-oven.past_client_reactivated" | "the-oven.post_close_engagement" | "the-oven.referral_confirmed" | "the-oven.referral_received" | "the-oven.referral_submitted" | "the-oven.review_completed" | "the-oven.review_requested" | "the-oven.revival_completed" | "the-oven.revival_dead" | "the-oven.revival_started" | "the-oven.temperature_changed" | "rello.cost_drift" | "rello.mrr_discrepancy" | "rello.nurture_missing_campaign" | "rello.nurture_preempt_rate_anomaly" | "rello.vault_failure_rate_high" | "rello.trigger_dev_poll_circuit_broken" | "rello.billing_upgrade_converted" | "rello.call_completed" | "rello.call_exhausted" | "rello.pe_enrichment" | "rello.agent_call_outcome" | "rello.hh_intake_retry_requested" | "daily_plan.item_injected" | "milo-engine.composition_pipeline_failed" | "consent.revoked" | "home-stretch.lead_inactive" | "open-house-hub.checkin_created" | "open-house-hub.attendee_signed_in" | "open-house-hub.attendee_assessment_completed" | "open-house-hub.lead_interested" | "open-house-hub.event_completed" | "open-house-hub.checkin" | "open-house-hub.enrichment_completed" | "open-house-hub.follow_up_created" | "newsletter-studio.email_forwarded" | "harvest-home.gateway_injection_failed" | "harvest-home.leads_imported" | "agent.action_completed" | "agent.action_skipped" | "rate.alert_triggered" | "signal.credits.purchased" | "data.stale" | "email.received" | "rello.ticket_created";
declare const FAMILY_BRAND: unique symbol;
/**
 * A canonical signal type that matched a registered `SignalTypeFamily` prefix
 * rather than an exact key (e.g. `home-scout.cta_clicked.book_a_call` matching
 * the `home-scout.cta_clicked.` family). Branded so the type system can
 * distinguish "registered via family" from an arbitrary string while still
 * carrying the underlying string value at runtime.
 */
type FamilyCanonicalSignalType = string & {
    readonly [FAMILY_BRAND]: "family";
};
/**
 * The registry key type: a registered exact key OR a family-matched string.
 * Introduced in v0.4.0 as the canonical replacement for the deprecated
 * `SignalType` union (SPEC §8 decision 22). The `EXACT_REGISTRY` Record is
 * keyed by the exact-key component (`ExactCanonicalSignalType`) for strict
 * completeness; family keys resolve through `FAMILY_REGISTRY`.
 */
type CanonicalSignalType = ExactCanonicalSignalType | FamilyCanonicalSignalType;
/**
 * One canonical row per signal type. The single source of truth for a type's
 * classification axes + behavior flags.
 */
interface SignalTypeEntry {
    /** Canonical key: `<canonical-hyphen-slug>.<snake_verb>` OR a global key. */
    readonly type: ExactCanonicalSignalType;
    /** 1–10. */
    readonly weight: number;
    /** 8-value, package-owned (`categories.ts`). */
    readonly category: SignalCategory;
    /** Optional baseline; absent → weight-band derivation (SPEC §3, Q13). */
    readonly priority?: SignalPriority;
    /** Absorbs nurture-goals `NON_GOAL_SHIFT` set (`infer.ts:84`). Wave B reads this. */
    readonly goalShiftSemantics: boolean;
    /** Absorbs `NURTURE_EXCLUDE_SIGNAL_PREFIXES` (`exclude-registry.ts:33`). Wave C. */
    readonly auditTrailOnly?: boolean;
    /** Forces `narrativeMaterial=false` upstream of nurture re-eval. Wave C. */
    readonly nurtureExclude?: boolean;
    /** Rule-engine task-creation default. Wave C. */
    readonly taskCreationDefault?: boolean;
    /** Explicit low-value marker (NOT a silent default — Q11). */
    readonly tier?: "telemetry";
    /** Declarative special routing (Q18). */
    readonly routing?: "rate-alert-dispatch";
    /** Default DERIVED from `(category, weight)` via `isNarrativeMaterial()`. */
    readonly narrativeMaterialOverride?: boolean;
    /** Default DERIVED from `priority ∈ {CRITICAL,HIGH}` via `shouldAblyBroadcast()`. */
    readonly ablyBroadcastOverride?: boolean;
    /** `forensic` = registered, no live emitter (kept to classify historical rows). */
    readonly lifecycle: "active" | "forensic";
}
/**
 * A typed dynamic prefix-family — for helper-built types that cannot be static
 * literals (Oven/PFP/Scout dynamic types, audit families, upsell families).
 * Mirrors the existing `scout.cta_clicked.` prefix-match (`classifier.ts:36`).
 *
 * `prefix` is the **canonical** prefix (post-slug-fold), always ending in `.`
 * — e.g. `home-scout.cta_clicked.` (NOT the legacy `scout.cta_clicked.`, which
 * `normalizeSlug` folds `scout`→`home-scout` before family resolution).
 */
interface SignalTypeFamily {
    /**
     * The canonical prefix (post-slug-fold). Ends on a segment delimiter so a
     * family only ever matches whole segments, never a partial token. Two
     * delimiters are legitimate:
     *   - `.` — the common case (`home-scout.cta_clicked.`, `content-engine.audit.`),
     *     where the variable tail is its own dotted segment.
     *   - `_` — threshold/suffix families whose variable tail is appended after an
     *     underscore in the SAME verb segment (`score.crossed_` → `score.crossed_90`,
     *     PHASE-B1 bucket 5). The emit convention is `score.crossed_${threshold}`,
     *     so a dot-terminated prefix could never match; the underscore boundary is
     *     the real segment edge here.
     */
    readonly prefix: `${string}.` | `${string}_`;
    readonly weight: number;
    readonly category: SignalCategory;
    readonly priority?: SignalPriority;
    readonly goalShiftSemantics: boolean;
    readonly lifecycle: "active" | "forensic";
}

/**
 * Canonical signalType brand per BPB §SLUG-AUTH §1 namespace #3:
 * `<canonical-platform-slug>.<event_verb>` — lowercase-hyphen slug, single dot, snake_case verb.
 *
 * Examples:
 * - `open-house-hub.attendee_marked_for_pfp_preapproval` ✅
 * - `pathfinder-pro.export.queued` ✅ (two-segment verb after the dot is acceptable)
 * - `home_scout.lead_intake` ❌ (underscore-form slug — legacy drift class)
 * - `home-scout.lead-magnet.submitted` ❌ (kebab in verb segment — forbidden)
 *
 * @deprecated since v0.4.0 — use {@link CanonicalSignalType} from the registry
 * (`./registry/types.ts`). Retained UNCHANGED (NOT widened) for back-compat per
 * SPEC §8 decision 22: this alias still resolves to exactly the 13-key union it
 * always did (the registry's `ExactCanonicalSignalType`). `CanonicalSignalType`
 * additionally admits family-matched keys. Deleted no earlier than the second
 * coordinated breaking bump (Wave E).
 */
type SignalType = ExactCanonicalSignalType;

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

/**
 * Exact canonical signal-type keys → declarative entry. Keyed by the literal
 * union for `tsc`-time per-key completeness: a missing or stray key is a
 * compile error.
 */
declare const EXACT_REGISTRY: Record<ExactCanonicalSignalType, SignalTypeEntry>;
/**
 * Dynamic prefix-families. Completeness = "every emitted literal is an exact
 * registered key OR matches a registered family prefix" (SPEC §1).
 */
declare const FAMILY_REGISTRY: readonly SignalTypeFamily[];
/**
 * Look up an exact registry entry by canonical key. Returns `undefined` for
 * unregistered keys (the index type widens to `string` so the absence is
 * surfaced honestly rather than masked by the `Record` value type).
 */
declare function lookupExact(type: string): SignalTypeEntry | undefined;
/** Look up the first family whose prefix the canonical key starts with. */
declare function lookupFamily(type: string): SignalTypeFamily | undefined;

/**
 * `normalizeSignalType()` — fold any legacy signal-type form to its canonical
 * key, gated on registry membership.
 *
 * Mirrors the shipped `normalizeSlug()` pattern (`@rello-platform/slugs`
 * `src/index.ts:167`: trim → lower → canonical-set → legacy-alias → warn/null)
 * and reuses `normalizeSlug` for the slug segment. Replaces the receiver's
 * manufacture line (`Rello batch/route.ts:337,350`) in Wave D (SPEC §2, Q2).
 *
 * Wave A note: the registry holds only the 14 seed exact keys + 3 prefix-family
 * groups. A well-formed type whose canonical key is NOT yet seeded resolves to
 * `null` (+ a warn) — this is the documented, correct Wave-A behavior (SPEC §2
 * step 7; dispatch §2). The full keyspace migrates in Wave C, after which the
 * receiver (Wave D) routes through this function and every emitted type
 * resolves.
 */

/**
 * Signal-type-namespace-only short/domain prefixes that `normalizeSlug` cannot
 * fold (SPEC §2.1). `deprecated:true` read-bridge ONLY — recognized solely to
 * classify historical rows; retired in Wave E, after which the completeness
 * test forbids them.
 *
 * - `pfp.` is NOT a `@rello-platform/slugs` alias (only
 *   `pathfinder`/`pathfinder_pro`/`pathfinderpro`) and was never a real
 *   `sourceApp` — it exists only as a signalType prefix in `constants.ts`, so
 *   it lives here, not in the slugs package (Q4).
 * - `mlo.` is a Drumbeat engine/domain prefix; the slug position held a domain,
 *   not a slug. Canonicalizes to `the-drumbeat.mlo.<verb>` (slug-owns-prefix,
 *   domain as sub-segment — the shipped `pathfinder-pro.export.*`/`compliance.*`
 *   precedent). Q-mlo / decision 24.
 *
 * Ordered longest-prefix-first is unnecessary here (prefixes are disjoint), but
 * matching is first-hit.
 */
declare const DEPRECATED_SIGNALTYPE_PREFIX_ALIASES: Readonly<Record<string, {
    readonly to: string;
    readonly deprecated: true;
}>>;
/**
 * Normalize any raw signal-type string to its canonical registered key, or
 * `null` if it is empty, malformed, or not (yet) registered.
 *
 * Algorithm (SPEC §2):
 *   1. null/empty → null
 *   2. §2.1 deprecated prefix-alias substitution (pfp./mlo.)
 *   3. global-namespace bypass (signal./score./system./consent./checkpoint.)
 *   4. split on the FIRST dot → [slugPart, verbPart]
 *   5. canonicalSlug = normalizeSlug(slugPart)  (reuses shipped slug machinery)
 *   6. canonicalVerb = verbPart with hyphens → underscores (verb segment only)
 *   7. recompose + resolve against EXACT then FAMILY; warn + null on miss
 */
declare function normalizeSignalType(raw: string | null | undefined): CanonicalSignalType | null;

/**
 * Registry-derived helper primitives.
 *
 * - `isGoalShiftSignal` — the Wave-B fix primitive (SPEC §8 decision 9). Wave B
 *   wires `inferNurtureGoal` to consult `isGoalShiftSignal(type)` so the
 *   prefixed-form bug (`harvest_home.email_complained` slipping past the bare
 *   `email_complained` exclusion) is closed at the source.
 * - `listActiveSignalTypes` — the admin source-of-truth coverage primitive
 *   (SPEC §8 decision 23). Returns the `lifecycle:"active"` exact keys; the
 *   Platform-Admin workstream builds the coverage UI on top of it.
 * - `isNarrativeMaterial` / `shouldAblyBroadcast` — the derived-default helpers
 *   that consumers (Wave C) use to compute `narrativeMaterial` / `ablyBroadcast`
 *   when no explicit override is declared. Mirror `classifier.ts:75-97` and
 *   `ably-publisher.ts:24`.
 */

/**
 * Does this signal type shift the lead's nurture goal?
 *
 * Returns `false` ONLY when the (normalized) type is registered AND its
 * `goalShiftSemantics` is `false`. Unregistered or unrecognized types
 * **fail open** (return `true`) — preserving the current fall-through-to-
 * inference behavior and ensuring the Wave-B gate never silently suppresses an
 * unknown signal (SPEC §8 decision 9).
 *
 * Accepts any raw form; normalizes internally so callers do not have to.
 */
declare function isGoalShiftSignal(rawType: string | null | undefined): boolean;
/**
 * The canonical coverage denominator: every `lifecycle:"active"` exact key.
 * Forensic entries (registered, no live emitter) are excluded per Q19.
 * Family prefixes are NOT enumerable types and are excluded here; the
 * cross-language keyset artifact (`dist/signal-registry-keyset.json`) carries
 * both active exact keys and family prefixes for the Report-Engine net.
 */
declare function listActiveSignalTypes(): ExactCanonicalSignalType[];
/**
 * Derived default for `narrativeMaterial` — does this signal change the lead's
 * story enough to warrant a Context Cache rebuild? Mirrors
 * `Rello/src/lib/signals/classifier.ts:75-97` exactly:
 *   - ANXIETY / NEGATIVE / ESCALATION → always material
 *   - FINANCIAL / READINESS / BEHAVIORAL → material iff weight ≥ 5
 *   - ENGAGEMENT / anything else → never material
 *
 * Consumers (Wave C) use the `narrativeMaterialOverride` entry field to escape
 * this default; there is no free-floating boolean (Q6).
 */
declare function isNarrativeMaterial(category: SignalCategory, weight: number): boolean;
/**
 * Derived default for `ablyBroadcast` — only CRITICAL/HIGH priority signals are
 * pushed to Ably. Mirrors `Rello/src/lib/signals/ably-publisher.ts:24`.
 * Consumers (Wave C) use `ablyBroadcastOverride` to escape this default (Q6).
 */
declare function shouldAblyBroadcast(priority: SignalPriority): boolean;

export { type CanonicalSignalType, DEPRECATED_SIGNALTYPE_PREFIX_ALIASES, EXACT_REGISTRY, type ExactCanonicalSignalType, FAMILY_REGISTRY, type FamilyCanonicalSignalType, SIGNAL_CATEGORIES, SIGNAL_PRIORITIES, SIGNAL_PRIORITY_RANK, type SignalCategory, type SignalPriority, type SignalType, type SignalTypeEntry, type SignalTypeFamily, isGoalShiftSignal, isNarrativeMaterial, isSignalCategory, isSignalPriority, listActiveSignalTypes, lookupExact, lookupFamily, meetsMinPriority, normalizeSignalType, shouldAblyBroadcast };
