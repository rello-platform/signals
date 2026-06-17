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

import type { SignalCategory } from "./categories.js";
import type { SignalPriority } from "../signal-priority.js";

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
export type ExactCanonicalSignalType =
  // OHH
  | "open-house-hub.attendee_marked_for_pfp_preapproval"
  // HS
  | "home-scout.lead_magnet_submitted"
  // HH
  | "harvest-home.lead_intake"
  // Report Engine
  | "report-engine.report_ready"
  // PFP export family
  | "pathfinder-pro.export.queued"
  | "pathfinder-pro.export.in_flight"
  | "pathfinder-pro.export.success"
  | "pathfinder-pro.export.failed"
  | "pathfinder-pro.export.permanently_failed"
  // PFP compliance family
  | "pathfinder-pro.compliance.gate_blocked"
  | "pathfinder-pro.compliance.config_changed"
  // Rello nurture escalate family
  | "rello.nurture_escalate_injected"
  | "rello.nurture_escalate_deduped"
  | "rello.nurture_escalate_injection_failed"
  // Newsletter-Studio email lifecycle — non-goal-shift (Wave B; the live
  // `inferNurtureGoal` bug). NS emits these BARE (`src/lib/signals/emitter.ts`
  // @ 3714bfc); Rello `/api/signals/batch` receiver-prefixes to
  // `newsletter_studio.*`, normalized here to canonical hyphen. Registered
  // `goalShiftSemantics:false` so the registry-driven gate short-circuits them.
  | "newsletter-studio.email_complained"
  | "newsletter-studio.email_unsubscribed"
  | "newsletter-studio.email_bounced"

  // ── Full emitted canonical keyspace seed (v0.6.0; KEYSPACE-SEED-EMITTED-
  // CANONICAL-TYPES dispatch). Every type a spoke EMITS over /api/signals/batch
  // or receiveSignal, in canonical `<hyphen-slug>.<snake_verb>` form. Dual-keys
  // deduped (drumbeat.*+the-drumbeat.* → the-drumbeat.*; pfp.*+pathfinder-pro.* →
  // pathfinder-pro.*; homeready.* → home-ready.*). Metadata sourced from Rello
  // `constants.ts` (SIGNAL_WEIGHTS/SIGNAL_CATEGORIES/PRIORITY_OVERRIDES); emitted
  // types with no constants row seeded at the effective DEFAULT (weight 3 /
  // BEHAVIORAL) and flagged in the close companion for Wave-C reclassification.
  // Full enumeration table: BUILT/KEYSPACE-SEED-EMITTED-CANONICAL-TYPES-DONE.md.
  | "checkpoint.call_requested"
  | "checkpoint.responded"
  | "checkpoint.update_started"
  | "consent.email_granted"
  | "consent.email_revoked"
  | "consent.sms_granted"
  | "consent.sms_revoked"
  | "consent.updated"
  | "content-engine.article_clicked"
  | "content-engine.article_opened"
  | "content-engine.article_scroll_deep"
  | "content-engine.article_sent"
  | "content-engine.classification_abandoned"
  | "content-engine.content_stale"
  | "content-engine.generation_completed"
  | "drumbeat-video-engine.video_rendered"
  | "harvest-home.call_list_contact_initiated"
  | "harvest-home.call_list_snapshot_generated"
  | "harvest-home.data_enriched"
  | "harvest-home.data_pack_purchased"
  | "harvest-home.discovery_replacement_claim_filed"
  | "harvest-home.discovery_replacement_claim_resolved"
  | "harvest-home.discovery_search_saved"
  | "harvest-home.immediate_action"
  | "harvest-home.lead_acquisition_recorded"
  | "harvest-home.property_address_changed"
  | "harvest-home.property_equity_threshold_crossed"
  | "harvest-home.property_listing_detected"
  | "harvest-home.skip_trace_completed"
  | "home-ready.almost_home_login"
  | "home-ready.almost_home_session_duration"
  | "home-ready.assessment_completed"
  | "home-ready.assessment_started"
  | "home-ready.assessment_updated"
  | "home-ready.challenge_completed"
  | "home-ready.challenge_enrolled"
  | "home-ready.challenge_progress"
  | "home-ready.challenge_wizard_feedback"
  | "home-ready.closing_ready"
  | "home-ready.closing_retracted"
  | "home-ready.data_stale"
  | "home-ready.document_analyzed"
  | "home-ready.document_uploaded"
  | "home-ready.intent_target_crossed"
  | "home-ready.milo_chat_session"
  | "home-ready.milo_report_generated"
  | "home-ready.plaid_connected"
  | "home-ready.recommendation_acted_on"
  | "home-ready.recommendation_feedback"
  | "home-ready.recommendation_viewed"
  | "home-ready.score_calculated"
  | "home-ready.score_changed"
  | "home-ready.score_updated"
  | "home-ready.stall_detected"
  | "home-ready.survey_completed"
  | "home-scout.affordability_calculated"
  | "home-scout.buying_power_calculated"
  | "home-scout.call_booked"
  | "home-scout.cash_out_calculated"
  | "home-scout.cta_clicked.book_a_call"
  | "home-scout.cta_clicked.get_pre_approved"
  | "home-scout.cta_clicked.qualify"
  | "home-scout.cta_clicked.rate_quote"
  | "home-scout.cta_clicked.rate_watch"
  | "home-scout.cta_clicked.request_cma"
  | "home-scout.cta_clicked.whats_my_home_worth"
  | "home-scout.data_stale"
  | "home-scout.decision_stage_engagement"
  | "home-scout.dpa_search_completed"
  | "home-scout.embed_interaction"
  | "home-scout.embed_loaded"
  | "home-scout.equity_check_returned"
  | "home-scout.expired_analysis_requested"
  | "home-scout.form_submitted"
  | "home-scout.fsbo_net_sheet_requested"
  | "home-scout.home_value_requested"
  | "home-scout.homeowner_hub_viewed"
  | "home-scout.homeowner_magic_link_issued"
  | "home-scout.homeowner_magic_link_verified"
  | "home-scout.homeready_handoff_exhausted"
  | "home-scout.homeready_handoff_failed"
  | "home-scout.homeready_handoff_retry_success"
  | "home-scout.homeready_handoff_success"
  | "home-scout.injection_cta_clicked"
  | "home-scout.lead_captured"
  | "home-scout.lead_reengaged"
  | "home-scout.listing_saved"
  | "home-scout.listing_search_performed"
  | "home-scout.listing_unsaved"
  | "home-scout.net_sheet_calculated"
  | "home-scout.newsletter_signup"
  | "home-scout.preferred_option_selected"
  | "home-scout.qualification_estimated"
  | "home-scout.rate_alert_set"
  | "home-scout.rate_alert_triggered"
  | "home-scout.rate_shopping_signal"
  // SCOUT-RE-CROSS-SELL-HANDOFF (06142026-NURTURE-AUDIT) — a Home-Scout RE-hat
  // buyer (scout_buy_sell ∈ {buying, both}) who is NOT yet pre-approved
  // (scout_pre_approved === "no") is a high-intent "connect me to a lender"
  // readiness event → hand off to the agent's MLO partner for pre-approval.
  | "home-scout.re_buyer_needs_preapproval"
  | "home-scout.referral_submitted"
  | "home-scout.refi_consideration_signal"
  | "home-scout.reverse_mortgage_estimate_requested"
  | "home-scout.search_saved"
  | "home-scout.sell_intent_confirmed"
  | "home-scout.showing_requested"
  | "home-scout.survey_gate_answered"
  | "home-scout.survey_gate_question_answered"
  | "home-scout.tool_completed"
  | "home-scout.tool_started"
  // OHH-SHOWINGS-AND-TOURS P4 (v0.18.0) — buyer tour-stop rating, HS-LOCAL
  // write (DL4: no cross-app round-trip; OHH never called on rating writes).
  | "home-scout.tour_stop_rated"
  | "home-scout.unattached_lead_captured"
  | "home-scout.va_eligible_confirmed"
  | "home-stretch.activity_completed"
  | "home-stretch.anxiety_detected"
  | "home-stretch.article_read"
  | "home-stretch.badge_earned"
  | "home-stretch.chat_completed"
  | "home-stretch.chat_message"
  | "home-stretch.chat_session"
  | "home-stretch.chat_started"
  | "home-stretch.credit_analyzed"
  | "home-stretch.document_analyzed"
  | "home-stretch.document_uploaded"
  | "home-stretch.dream_profile_updated"
  | "home-stretch.financial_snapshot_updated"
  | "home-stretch.guest_mlo_eligibility_decision"
  | "home-stretch.guest_mlo_message_sent"
  | "home-stretch.guest_mlo_note_added"
  | "home-stretch.inactive"
  | "home-stretch.login_streak"
  | "home-stretch.milestone_reached"
  | "home-stretch.milo_report_generated"
  | "home-stretch.module_completed"
  | "home-stretch.module_stalled"
  | "home-stretch.module_started"
  | "home-stretch.onboarding_completed"
  | "home-stretch.pillar_completed"
  | "home-stretch.pillar_status_changed"
  | "home-stretch.points_earned"
  | "home-stretch.preapproval_approved"
  | "home-stretch.preapproval_started"
  | "home-stretch.prospect_invitation_sms_requested"
  | "home-stretch.prospect_invited"
  | "home-stretch.ready_to_buy"
  | "home-stretch.registered"
  | "home-stretch.savings_milestone"
  | "home-stretch.score_changed"
  | "home-stretch.stall_detected"
  | "home-stretch.track_selected"
  | "home-stretch.under_contract"
  | "market-intel.alert_triggered"
  | "market-intel.digest_clicked"
  | "market-intel.digest_generated"
  | "market-intel.digest_opened"
  | "market-intel.podcast_played"
  | "market-intel.report_generated"
  | "market-intel.snapshot_shared"
  | "market-intel.subscribed"
  | "newsletter-studio.content_feedback_negative"
  | "newsletter-studio.content_feedback_positive"
  | "newsletter-studio.content_preference_changed"
  | "newsletter-studio.email_checkpoint_responded"
  | "newsletter-studio.email_clicked"
  | "newsletter-studio.email_delivered"
  | "newsletter-studio.email_frequency_changed"
  | "newsletter-studio.email_opened"
  | "newsletter-studio.email_pause_expired"
  | "newsletter-studio.email_paused"
  | "newsletter-studio.email_replied"
  | "newsletter-studio.email_sent"
  | "newsletter-studio.flow_advanced"
  | "newsletter-studio.reply_received"
  | "newsletter-studio.scroll_depth"
  | "newsletter-studio.unsubscribe_reason"
  | "pathfinder-pro.agent_partner.captured"
  | "pathfinder-pro.attendee_reclassified"
  | "pathfinder-pro.bankstatement_lead_saved"
  | "pathfinder-pro.borrower_interest"
  | "pathfinder-pro.credit_pull.consent_captured"
  | "pathfinder-pro.credit_pull.failed"
  | "pathfinder-pro.credit_pull.hard_executed"
  | "pathfinder-pro.credit_pull.soft_executed"
  | "pathfinder-pro.dscr_lead_saved"
  | "pathfinder-pro.exported_to_los"
  | "pathfinder-pro.hecm_lead_saved"
  | "pathfinder-pro.hh_intake_sync"
  | "pathfinder-pro.intake_completed"
  | "pathfinder-pro.intake_started"
  | "pathfinder-pro.past_borrowers.queried"
  | "pathfinder-pro.prequal_verdict_received"
  | "pathfinder-pro.prequalified"
  | "pathfinder-pro.quick_estimate_completed"
  | "pathfinder-pro.realtor_prospect.intake_received"
  | "pathfinder-pro.scenario_converted"
  | "pathfinder-pro.scenario_created"
  | "pathfinder-pro.scenario_delivered"
  | "pathfinder-pro.scenario_viewed"
  // PreQual-Pro is intentionally NOT a Rello-platform app (L7 lock) — no APP_SLUGS
  // entry; this canonical signal-type string is a hand-authored registry key only.
  // Born canonical (hyphenated-slug form, matching home-ready.); no legacy fold.
  | "prequal-pro.document_uploaded"
  // PR-B-α forward-registered (emit deferred — PE MLS-sync emit lands on the
  // Spark API-key fix; lifecycle:"forensic" until then, see registry.ts).
  | "property-engine.listing_under_contract"
  | "property-engine.listing_went_live"
  | "property-engine.rate_sync_completed"
  // PR-B-α forward-registered (emit deferred — Rello anniversary cron emit-side
  // spec TBD; lifecycle:"forensic" until then, see registry.ts).
  | "rello.anniversary"
  | "rello.handoff_transition"
  | "rello.lead_created"
  | "rello.lead_data_sufficient"
  | "rello.lead_stage_changed"
  | "rello.local_conversion"
  | "rello.meeting_booked"
  | "rello.meeting_canceled"
  | "rello.meeting_completed"
  | "rello.meeting_no_show"
  | "rello.nurture_reply_detected"
  | "rello.nurture_reply_sent"
  | "report-engine.report_failed"
  | "score.crossed_60"
  | "score.crossed_80"
  | "signal.byol.leads_imported"
  | "signal.byol.leads_reactivated"
  | "signal.byol.monitoring_started"
  | "signal.byol.parked_lead_signal_detected"
  | "signal.byol.parked_leads_resurfaced"
  | "signal.byol.push_calls_completed"
  | "signal.byol.scoring_completed"
  | "signal.byol.upload_completed"
  | "signal.discovery.search"
  | "signal.discovery.unlock"
  | "signal.intake.lead_created"
  | "signal.intake.lead_enriched"
  | "signal.intake.lead_merged"
  | "signal.intake.lead_rescored"
  | "signal.lead.contacted"
  | "signal.lead.converted"
  | "signal.lead.delivered"
  | "signal.lead.enriched"
  | "signal.lead.purchased"
  | "signal.lead.scored"
  | "signal.pipeline.call_outcome"
  | "signal.pipeline.session_completed"
  | "signal.pipeline.session_started"
  | "system.checkpoint_external_change"
  | "system.periodic_checkpoint"
  | "the-drumbeat.ad_lead_captured"
  | "the-drumbeat.campaign_launched"
  | "the-drumbeat.content_broker_review_needed"
  | "the-drumbeat.content_compliance_blocked"
  | "the-drumbeat.content_draft_approved"
  | "the-drumbeat.content_draft_generated"
  | "the-drumbeat.content_draft_published"
  | "the-drumbeat.content_draft_rejected"
  | "the-drumbeat.direct_mail_sent"
  | "the-drumbeat.market_content_generated"
  | "the-drumbeat.market_content_published"
  | "the-drumbeat.market_report_generated"
  | "the-drumbeat.post_published"
  | "the-drumbeat.qr_code_scanned"
  | "the-drumbeat.rate_alert_triggered"
  | "the-drumbeat.review_received"
  | "the-drumbeat.stall_detected"
  | "the-drumbeat.video_message_sent"
  | "the-drumbeat.video_message_watched"
  | "the-drumbeat.video_published"
  | "the-drumbeat.video_recorded"
  | "the-drumbeat.video_started"
  | "the-drumbeat.video_view_aggregate"
  | "the-drumbeat.video_viewed"
  | "the-drumbeat.video_watched"
  | "the-oven.anniversary_reached"
  | "the-oven.equity_digest_sent"
  | "the-oven.handoff_completed"
  | "the-oven.handoff_initiated"
  | "the-oven.homeowner_hub_visit"
  | "the-oven.implicit_referral_detected"
  | "the-oven.nps_completed"
  | "the-oven.past_client_cold"
  | "the-oven.past_client_cooling"
  | "the-oven.past_client_reactivated"
  | "the-oven.post_close_engagement"
  | "the-oven.referral_confirmed"
  | "the-oven.referral_received"
  | "the-oven.referral_submitted"
  | "the-oven.review_completed"
  | "the-oven.review_requested"
  | "the-oven.revival_completed"
  | "the-oven.revival_dead"
  | "the-oven.revival_started"
  | "the-oven.temperature_changed"

  // ── PHASE-B1: build-guard violation-list types (the additive half of clearing
  // the Layer-2 79-violation shadow report). Buckets per Kelly's locked decisions
  // (2026-05-23); full table: BUILT/PHASE-B1-REGISTER-VIOLATION-TYPES-DONE.md.
  //
  // Bucket 3 — Rello-internal monitoring/observability (tier:"telemetry",
  // goalShiftSemantics:false, SYSTEM, weight floor 1; in-registry SOT, no
  // carve-out). Bare ops names canonicalize to `rello.<verb>`; already-namespaced
  // forms keep their namespace folded canonical.
  | "rello.cost_drift"
  | "rello.mrr_discrepancy"
  | "rello.nurture_missing_campaign"
  | "rello.nurture_preempt_rate_anomaly"
  | "rello.vault_failure_rate_high"
  | "rello.trigger_dev_poll_circuit_broken"
  | "rello.billing_upgrade_converted"
  | "rello.call_completed"
  | "rello.call_exhausted"
  | "rello.pe_enrichment"
  | "rello.agent_call_outcome"
  | "rello.hh_intake_retry_requested"
  | "daily_plan.item_injected"
  | "milo-engine.composition_pipeline_failed"
  | "consent.revoked"
  // Bucket 2 — genuinely-missing canonical types (register as active). Underscore-
  // slug "Upgrade 16" OHH forms (`open_house_hub.*`) fold to the hyphen-canonical
  // `open-house-hub.*` via normalizeSlug; we register the hyphen-canonical. No
  // constants.ts row for any of these → seeded at the effective DEFAULT (weight 3
  // / BEHAVIORAL), flagged for Wave-C reclassification (same convention as the
  // v0.6.0 keyspace seed).
  | "home-stretch.lead_inactive"
  | "open-house-hub.checkin_created"
  | "open-house-hub.attendee_signed_in"
  | "open-house-hub.attendee_assessment_completed"
  | "open-house-hub.lead_interested"
  | "open-house-hub.event_completed"
  | "open-house-hub.checkin"
  | "open-house-hub.enrichment_completed"
  | "open-house-hub.follow_up_created"
  // OHH-SHOWINGS-AND-TOURS (v0.16.0) — showing/tour lifecycle family. Explicit
  // curated weights (NOT the bucket-2 DEFAULT seed); hyphen-canonical slug per
  // the OHH convention above (underscore emits fold via normalizeSlug).
  | "open-house-hub.showing_requested"
  | "open-house-hub.showing_confirmed"
  | "open-house-hub.showing_canceled"
  | "open-house-hub.showing_completed"
  | "open-house-hub.showing_no_show"
  | "open-house-hub.showing_feedback"
  // OHH-SHOWINGS-AND-TOURS P4 (v0.18.0) — multi-stop tour lifecycle siblings
  // of the showing_* family above (CONTRACT-TOUR-COMPANION-PAYLOAD-260611).
  | "open-house-hub.tour_created"
  | "open-house-hub.tour_completed"
  | "newsletter-studio.email_forwarded"
  | "harvest-home.gateway_injection_failed"
  | "harvest-home.leads_imported"
  // Bucket 4 — production global-namespace forms (first-class, NOT the
  // admin/lab/.../simulate test-harness forms — those are Phase-B2 allowlisted).
  // `agent.`/`rate.`/`data.` are added to GLOBAL_PREFIXES (normalize.ts) since
  // they are not slug-foldable. No constants row → DEFAULT, flagged Wave-C.
  | "agent.action_completed"
  | "agent.action_skipped"
  | "rate.alert_triggered"
  // RATE-ENGINE — the canonical tenant-agnostic market-move broadcast
  // (Rate Engine sole emitter; AOM "Generic market-move rate.changed
  // broadcast" row, 2026-06-04). Global `rate.` prefix sibling to
  // `rate.alert_triggered`; ONE literal shared with the outbound webhook
  // event `rate.changed` in @rello-platform/webhook-events. Tenant-agnostic
  // infrastructure event (no lead/tenant scope) → SYSTEM/goalShift:false.
  | "rate.changed"
  | "signal.credits.purchased"
  | "data.stale"
  // PHASE-B1B (v0.7.1) — corrections to the B1 bucket-3/bucket-4 pass.
  // `email.received` is a real inbound-email LEAD-ENGAGEMENT signal (emitted
  // `Rello src/trigger/jobs/email-sync.ts:626,893` with category:"ENGAGEMENT",
  // weight:1.0). It is dotted-bare (`email.` is not a slug → normalizeSlug
  // returns null) so it MUST be a global first-class key (`email.` added to
  // GLOBAL_PREFIXES); the receiver does not namespace-prefix already-dotted
  // forms, so the live emit resolves with NO emit-flip owed.
  | "email.received"
  // `ticket_created` is a real Rello-internal BEHAVIORAL signal (emitted
  // `journeyStepStalled.ts:439` + `support/inbound-email.ts:185`, weight 5).
  // Emitted BARE/dotless → normalizeSignalType("ticket_created") returns null
  // (no slug to fold). Registered as the canonical `rello.ticket_created`; the
  // bare→`rello.ticket_created` emit-flip is a B2-style follow-on (owed).
  | "rello.ticket_created"

  // ── RELLO-LEAD-PHONE-DISCONNECTED (v0.15.0; CROSS-REPO-WALK Q2) ──
  // Rello emits on Twilio MessageStatus=failed + ErrorCode ∈ {30003, 30005,
  // 30006} (dead/disconnected lead phone) via the SMS delivery-status webhook;
  // MessageSid is the idempotency key. Consumed by Harvest-Home's
  // ReplacementClaim receiver (`auto-flag-watcher.ts` checkPhoneDisconnected).
  // Born canonical `<slug>.<snake_verb>` — registered HERE before the Rello
  // emit PR lands (the armed check:signal-types gate blocks unregistered emits).
  | "rello.lead_phone_disconnected"

  // ── HH-LEGACY-CANONICAL-ALIASES (v0.15.0; CROSS-REPO-WALK Q6 step 1) ──
  // Canonical `harvest-home.<snake_verb>` (single-dot) targets for HH's 24 LIVE
  // legacy `signal.*` emit types (per grep of Harvest-Home origin/main @
  // a40e4db — includes signal.byol.* / signal.intake.* the manifest never
  // declared; excludes manifest-only never-emitted types like
  // signal.lead.enriched). The legacy `signal.*` EXACT_REGISTRY rows are KEPT
  // as a read-bridge (classify historical SignalLog rows; Phase-3 retirement
  // per registry doc §9); `normalizeSignalType` now folds legacy → canonical
  // via LEGACY_SIGNALTYPE_EXACT_ALIASES (normalize.ts).
  | "harvest-home.byol_leads_imported"
  | "harvest-home.byol_leads_reactivated"
  | "harvest-home.byol_monitoring_started"
  | "harvest-home.byol_parked_lead_signal_detected"
  | "harvest-home.byol_parked_leads_resurfaced"
  | "harvest-home.byol_push_calls_completed"
  | "harvest-home.byol_scoring_completed"
  | "harvest-home.byol_upload_completed"
  | "harvest-home.credits_purchased"
  | "harvest-home.discovery_search"
  | "harvest-home.discovery_unlock"
  // `signal.hh.idg_retry_synced` — the `hh.` segment is HH's own slug
  // abbreviation (redundant under the harvest-home prefix), so the canonical
  // verb drops it: `idg_retry_synced` (mirrors the drumbeat→the-drumbeat
  // slug-fold convention; `hh` is the spoke itself, not a domain like
  // byol/intake/pipeline).
  | "harvest-home.idg_retry_synced"
  | "harvest-home.intake_lead_created"
  | "harvest-home.intake_lead_enriched"
  | "harvest-home.intake_lead_merged"
  | "harvest-home.intake_lead_rescored"
  | "harvest-home.lead_contacted"
  | "harvest-home.lead_converted"
  | "harvest-home.lead_delivered"
  | "harvest-home.lead_purchased"
  | "harvest-home.lead_scored"
  | "harvest-home.pipeline_call_outcome"
  | "harvest-home.pipeline_session_completed"
  | "harvest-home.pipeline_session_started"

  // ── HOMEOWNER-LIFECYCLE-REHOME P1 (v0.19.0; spec DL1) ──
  // Rello emits at the funded/recorded BUY-SIDE closing milestone, carrying
  // the NEW property identity (schema: relloHomePurchasedDataSchema, same
  // minor). The spec drafted "closing.home_purchased"; the registry owns
  // canonical form — `closing` is a Rello-internal domain, not a slug, so the
  // type registers under `rello.*` (the rello.meeting_* precedent).
  // Registered ahead of the Rello emit PR (the armed check:signal-types gate
  // blocks unregistered emits).
  | "rello.home_purchased"
  // ── OHH-SHOWINGS-AND-TOURS P5 (v0.19.0) — co-op agent showing invite ──
  // Rule-D trail payload: ids + hasEmail/hasPhone capability booleans ONLY,
  // NEVER the co-op agent's contact values (PII floor).
  | "open-house-hub.coop_invite_sent";

declare const FAMILY_BRAND: unique symbol;

/**
 * A canonical signal type that matched a registered `SignalTypeFamily` prefix
 * rather than an exact key (e.g. `home-scout.cta_clicked.book_a_call` matching
 * the `home-scout.cta_clicked.` family). Branded so the type system can
 * distinguish "registered via family" from an arbitrary string while still
 * carrying the underlying string value at runtime.
 */
export type FamilyCanonicalSignalType = string & {
  readonly [FAMILY_BRAND]: "family";
};

/**
 * The registry key type: a registered exact key OR a family-matched string.
 * Introduced in v0.4.0 as the canonical replacement for the deprecated
 * `SignalType` union (SPEC §8 decision 22). The `EXACT_REGISTRY` Record is
 * keyed by the exact-key component (`ExactCanonicalSignalType`) for strict
 * completeness; family keys resolve through `FAMILY_REGISTRY`.
 */
export type CanonicalSignalType =
  | ExactCanonicalSignalType
  | FamilyCanonicalSignalType;

/**
 * One canonical row per signal type. The single source of truth for a type's
 * classification axes + behavior flags.
 */
export interface SignalTypeEntry {
  /** Canonical key: `<canonical-hyphen-slug>.<snake_verb>` OR a global key. */
  readonly type: ExactCanonicalSignalType;

  // ── Declared classification axes (source of truth; not derivable) ──
  /** 1–10. */
  readonly weight: number;
  /** 8-value, package-owned (`categories.ts`). */
  readonly category: SignalCategory;
  /** Optional baseline; absent → weight-band derivation (SPEC §3, Q13). */
  readonly priority?: SignalPriority;

  // ── Declared behavior flags (absorb scattered consumer logic — Q6) ──
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

  // ── Derived-with-override (no free-floating boolean — Q6) ──
  /** Default DERIVED from `(category, weight)` via `isNarrativeMaterial()`. */
  readonly narrativeMaterialOverride?: boolean;
  /** Default DERIVED from `priority ∈ {CRITICAL,HIGH}` via `shouldAblyBroadcast()`. */
  readonly ablyBroadcastOverride?: boolean;

  // ── Lifecycle (Q19) ──
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
export interface SignalTypeFamily {
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
