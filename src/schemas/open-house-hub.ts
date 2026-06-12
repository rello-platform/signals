import { z } from "zod";

/**
 * OHH attendeeData payload — 19 ohh_* namespaced keys per AOM line 582 + SPEC-OHH-CO-AGENT-CO-MLO-EVENTS B-04 lock 2026-05-13.
 * Pre-launch: every key optional except identity anchors (attendeeId + email). Tighten post-launch.
 */
export const ohhAttendeeDataSchema = z.object({
  ohh_attendee_id: z.string().cuid(),
  ohh_first_name: z.string().min(1),
  ohh_last_name: z.string().min(1),
  ohh_email: z.string().email(),
  ohh_phone: z.string().nullable().optional(),
  ohh_visitor_type: z.string().nullable().optional(),
  ohh_is_pre_approved: z.boolean().nullable().optional(),
  ohh_is_hot_lead: z.boolean().nullable().optional(),
  ohh_wants_cma: z.boolean().nullable().optional(),
  ohh_needs_agent: z.boolean().nullable().optional(),
  ohh_mini_hr_completed: z.boolean().nullable().optional(),
  ohh_mini_hr_score: z.number().nullable().optional(),
  ohh_buying_timeframe: z.string().nullable().optional(),
  ohh_budget_range: z.string().nullable().optional(),
  ohh_financing_status: z.string().nullable().optional(),
  ohh_property_type_preference: z.string().nullable().optional(),
  ohh_event_id: z.string().cuid(),
  ohh_event_host_tenant_id: z.string().cuid(),
  ohh_event_date: z.string().datetime().nullable().optional(),
});

/**
 * OHH `attendee_marked_for_pfp_preapproval` signal data shape — sender-side contract for
 * outbound POST to Rello /api/signals/batch envelope's `data` field.
 *
 * Per SPEC-OHH-CO-AGENT-CO-MLO-EVENTS B-05(a) lock 2026-05-13.
 */
export const ohhAttendeeMarkedForPfpPreapprovalDataSchema = z.object({
  attendeeData: ohhAttendeeDataSchema,
  ohhEventId: z.string().cuid(),
  mloTenantId: z.string(),
  ohhEventHostTenantId: z.string().cuid(),
  ohhAttendeeId: z.string().cuid(),
});

export type OhhAttendeeData = z.infer<typeof ohhAttendeeDataSchema>;
export type OhhAttendeeMarkedForPfpPreapprovalData = z.infer<typeof ohhAttendeeMarkedForPfpPreapprovalDataSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// OHH-SHOWINGS-AND-TOURS — showing/tour lifecycle + feedback payload schemas
// (v0.17.0). Registry rows landed in v0.16.0 ahead of the spoke emit PRs
// (OHH #27/#29); these schemas close the README BPB 9.1 gap (schema lands
// with the emit PR).
//
// Shapes are derived from the LIVE emit sites @ OHH origin/main af0b718:
//   - src/lib/showings/lifecycle.ts  (emitShowingLifecycleSignal — shared
//     data block for all 5 lifecycle types + per-type extraData spread)
//   - src/app/api/showings/route.ts:250        (showing_requested)
//   - src/lib/showings/confirm.ts:241          (showing_confirmed)
//   - src/app/api/showings/[id]/cancel/route.ts:149   (showing_canceled)
//   - src/app/api/showings/[id]/complete/route.ts:83  (showing_completed)
//   - src/app/api/showings/[id]/no-show/route.ts:84   (showing_no_show)
//   - src/lib/feedback/record.ts:87            (showing_feedback)
// ─────────────────────────────────────────────────────────────────────────────

/** Mirror of OHH's prisma `enum ShowingStatus` (openhousehub schema). */
export const ohhShowingStatusSchema = z.enum([
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELED",
  "NO_SHOW",
]);

/**
 * Shared lifecycle data block — every `open-house-hub.showing_*` lifecycle
 * signal carries these fields (lifecycle.ts builds them unconditionally; the
 * null-bearing fields are always PRESENT but may be null, so they are
 * `.nullable()` not `.optional()`).
 *
 * `action` + `actorUserId` are the Rule-D mutation trail (Pattern-C: OHH has
 * no local AuditLog table — audit routes to Rello via signal). `action` is
 * typed `string` at the emitter (observed literals: showing.create /
 * showing.confirm / showing.cancel / showing.complete / showing.no_show), so
 * the schema stays `z.string()` rather than pinning literals that would
 * break on a new emitter verb.
 */
export const ohhShowingLifecycleBaseDataSchema = z.object({
  showingId: z.string().min(1),
  propertyAddress: z.string(),
  /** `showing.scheduledAt?.toISOString() ?? null` — ISO datetime or null. */
  scheduledAt: z.string().datetime().nullable(),
  status: ohhShowingStatusSchema,
  agentId: z.string().min(1),
  relloMeetingId: z.string().nullable(),
  action: z.string().min(1),
  actorUserId: z.string().min(1),
});

/**
 * `open-house-hub.showing_requested` — POST /api/showings creates a
 * REQUESTED showing. extraData: `{ requestedSlots: requestedSlots ?? null }`
 * (route.ts:255; slots are zod `.datetime()`-validated ISO strings, max 20,
 * already filtered to future slots; null when none were proposed, e.g. the
 * direct-confirm slotStart path).
 */
export const ohhShowingRequestedDataSchema = ohhShowingLifecycleBaseDataSchema.extend({
  requestedSlots: z.array(z.string().datetime()).nullable(),
});

/**
 * `open-house-hub.showing_confirmed` — shared confirm core (confirm.ts:246)
 * after the Rello meeting books. extraData:
 * `{ slotStart: params.slotStart, videoMeetingUrl: booked.videoMeetingUrl ?? null }`.
 */
export const ohhShowingConfirmedDataSchema = ohhShowingLifecycleBaseDataSchema.extend({
  slotStart: z.string().datetime(),
  videoMeetingUrl: z.string().nullable(),
});

/**
 * `open-house-hub.showing_canceled` — POST /api/showings/[id]/cancel.
 * extraData: `{ reason: reason ?? null, priorStatus: showing.status }`
 * (cancel/route.ts:154 — priorStatus is the pre-cancel status snapshot;
 * the base `status` field is CANCELED on this signal).
 */
export const ohhShowingCanceledDataSchema = ohhShowingLifecycleBaseDataSchema.extend({
  reason: z.string().nullable(),
  priorStatus: ohhShowingStatusSchema,
});

/**
 * `open-house-hub.showing_completed` — POST /api/showings/[id]/complete.
 * No extraData; base block only (complete/route.ts:83).
 */
export const ohhShowingCompletedDataSchema = ohhShowingLifecycleBaseDataSchema;

/**
 * `open-house-hub.showing_no_show` — POST /api/showings/[id]/no-show.
 * No extraData; base block only (no-show/route.ts:84).
 */
export const ohhShowingNoShowDataSchema = ohhShowingLifecycleBaseDataSchema;

/**
 * Consumer feedback vocabulary — EXACT three-option lock from
 * OHH src/lib/feedback/constants.ts (`FEEDBACK_RESPONSES`).
 */
export const ohhShowingFeedbackResponseSchema = z.enum([
  "loved",
  "interested",
  "not_for_me",
]);

/**
 * `open-house-hub.showing_feedback` — record.ts:87, locked payload shape
 * `{ leadId, eventId, showingId, propertyAddress, response }`.
 *
 * The live emitter always includes every key (null when unresolved), but the
 * lock comment writes `eventId?` / `showingId?` as optional — so the two
 * conditionally-resolved ids accept BOTH absent and null. `leadId` is the
 * resolved relloLeadId and may be null for attendee-only tokens (the signal
 * envelope's own leadId falls back through attendee → agent → tenant).
 * `propertyAddress` may be "" when neither showing nor event resolves.
 *
 * P5 (v0.19.0, ADDITIVE): `submitterRole` — P5 lets the CO-OP AGENT leave
 * listing feedback through the same signal, so consumers can distinguish the
 * buyer's reaction from the co-op agent's. `.optional()` (not nullable) — the
 * pre-P5 live emitter omits the key entirely, and existing persisted payloads
 * must keep parsing (back-compat: absent ⇒ buyer-era payload).
 */
export const ohhFeedbackSubmitterRoleSchema = z.enum(["buyer", "coop_agent"]);

export const ohhShowingFeedbackDataSchema = z.object({
  leadId: z.string().nullable(),
  eventId: z.string().nullable().optional(),
  showingId: z.string().nullable().optional(),
  propertyAddress: z.string(),
  response: ohhShowingFeedbackResponseSchema,
  submitterRole: ohhFeedbackSubmitterRoleSchema.optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// OHH-SHOWINGS-AND-TOURS P5 (v0.19.0) — co-op agent showing invite.
// Registered in the SAME minor as the registry row (BPB 9.1); the OHH P5
// emitter lands AFTER this minor, so the shape follows the dispatch contract.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `open-house-hub.coop_invite_sent` — the listing agent invites a co-op
 * (buyer's) agent to a showing.
 *
 * PII FLOOR: the payload is the Rule-D mutation trail ONLY (Pattern-C: OHH
 * has no local AuditLog table — audit routes to Rello via signal). It carries
 * ids + channel-capability booleans (`hasEmail`/`hasPhone` — whether an
 * invite channel existed), NEVER the co-op agent's email/phone values.
 * `action` is typed `string` at the emitter (expected literal:
 * `showing.coop_invite`), so the schema stays `z.string()` rather than
 * pinning a literal that would break on a new emitter verb — same convention
 * as ohhShowingLifecycleBaseDataSchema.
 */
export const ohhCoopInviteSentDataSchema = z.object({
  showingId: z.string().min(1),
  /** ShowingParticipant row id for the invited co-op agent (NOT a contact value). */
  participantId: z.string().min(1),
  /** Whether the invite had an email channel — capability flag, never the address. */
  hasEmail: z.boolean(),
  /** Whether the invite had a phone channel — capability flag, never the number. */
  hasPhone: z.boolean(),
  action: z.string().min(1),
  actorUserId: z.string().min(1),
});

export type OhhFeedbackSubmitterRole = z.infer<typeof ohhFeedbackSubmitterRoleSchema>;
export type OhhCoopInviteSentData = z.infer<typeof ohhCoopInviteSentDataSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// OHH-SHOWINGS-AND-TOURS P4 (v0.18.0) — multi-stop tour lifecycle payload
// schemas. Registered in the SAME minor as the registry rows (BPB 9.1: schema
// lands with/before the emit PR — the OHH tour emitters are the P4 producer
// lane and land AFTER this minor, so shapes follow the LOCKED contract
// (CONTRACT-TOUR-COMPANION-PAYLOAD-260611) rather than live emit sites.
//
// `action` + `actorUserId` are the Rule-D mutation trail (Pattern-C: OHH has
// no local AuditLog table — audit routes to Rello via signal), mirroring
// ohhShowingLifecycleBaseDataSchema. `relloLeadId` is nullable NOT optional
// (always-present-may-be-null, same discipline as the showing base block).
// PRIVACY LOCK: no accessInstructions, no other-party personal names — the
// payload carries ids + counts + date only.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared tour lifecycle data block for `open-house-hub.tour_*`.
 *
 * `tourDate` is ISO 8601 "date of the tour day" (contract) — the emitter is
 * not yet landed, so the schema pins the ISO-date prefix (`YYYY-MM-DD…`) and
 * accepts both date-only and full-datetime serializations rather than
 * guessing which one OHH will emit.
 */
export const ohhTourLifecycleBaseDataSchema = z.object({
  tourId: z.string().min(1),
  /** Resolved Rello lead id of the buyer; null when unresolved. */
  relloLeadId: z.string().nullable(),
  /** Number of stops on the tour (TourStop rows). */
  stopCount: z.number().int().nonnegative(),
  /** ISO 8601 — date of the tour day (date-only or datetime form). */
  tourDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "ISO 8601 date expected"),
  action: z.string().min(1),
  actorUserId: z.string().min(1),
});

/** `open-house-hub.tour_created` — agent assembles a multi-stop tour. */
export const ohhTourCreatedDataSchema = ohhTourLifecycleBaseDataSchema;

/**
 * `open-house-hub.tour_completed` — tour day wraps. `completedStops` counts
 * stops whose Showing reached COMPLETED (≤ stopCount; NO_SHOW/CANCELED stops
 * don't count).
 */
export const ohhTourCompletedDataSchema = ohhTourLifecycleBaseDataSchema.extend({
  completedStops: z.number().int().nonnegative(),
});

export type OhhTourLifecycleBaseData = z.infer<typeof ohhTourLifecycleBaseDataSchema>;
export type OhhTourCreatedData = z.infer<typeof ohhTourCreatedDataSchema>;
export type OhhTourCompletedData = z.infer<typeof ohhTourCompletedDataSchema>;

export type OhhShowingStatus = z.infer<typeof ohhShowingStatusSchema>;
export type OhhShowingLifecycleBaseData = z.infer<typeof ohhShowingLifecycleBaseDataSchema>;
export type OhhShowingRequestedData = z.infer<typeof ohhShowingRequestedDataSchema>;
export type OhhShowingConfirmedData = z.infer<typeof ohhShowingConfirmedDataSchema>;
export type OhhShowingCanceledData = z.infer<typeof ohhShowingCanceledDataSchema>;
export type OhhShowingCompletedData = z.infer<typeof ohhShowingCompletedDataSchema>;
export type OhhShowingNoShowData = z.infer<typeof ohhShowingNoShowDataSchema>;
export type OhhShowingFeedbackResponse = z.infer<typeof ohhShowingFeedbackResponseSchema>;
export type OhhShowingFeedbackData = z.infer<typeof ohhShowingFeedbackDataSchema>;
