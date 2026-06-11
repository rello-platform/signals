import { z } from 'zod';

/**
 * OHH attendeeData payload — 19 ohh_* namespaced keys per AOM line 582 + SPEC-OHH-CO-AGENT-CO-MLO-EVENTS B-04 lock 2026-05-13.
 * Pre-launch: every key optional except identity anchors (attendeeId + email). Tighten post-launch.
 */
declare const ohhAttendeeDataSchema: z.ZodObject<{
    ohh_attendee_id: z.ZodString;
    ohh_first_name: z.ZodString;
    ohh_last_name: z.ZodString;
    ohh_email: z.ZodString;
    ohh_phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ohh_visitor_type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ohh_is_pre_approved: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    ohh_is_hot_lead: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    ohh_wants_cma: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    ohh_needs_agent: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    ohh_mini_hr_completed: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    ohh_mini_hr_score: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    ohh_buying_timeframe: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ohh_budget_range: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ohh_financing_status: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ohh_property_type_preference: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ohh_event_id: z.ZodString;
    ohh_event_host_tenant_id: z.ZodString;
    ohh_event_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
/**
 * OHH `attendee_marked_for_pfp_preapproval` signal data shape — sender-side contract for
 * outbound POST to Rello /api/signals/batch envelope's `data` field.
 *
 * Per SPEC-OHH-CO-AGENT-CO-MLO-EVENTS B-05(a) lock 2026-05-13.
 */
declare const ohhAttendeeMarkedForPfpPreapprovalDataSchema: z.ZodObject<{
    attendeeData: z.ZodObject<{
        ohh_attendee_id: z.ZodString;
        ohh_first_name: z.ZodString;
        ohh_last_name: z.ZodString;
        ohh_email: z.ZodString;
        ohh_phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ohh_visitor_type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ohh_is_pre_approved: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        ohh_is_hot_lead: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        ohh_wants_cma: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        ohh_needs_agent: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        ohh_mini_hr_completed: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        ohh_mini_hr_score: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        ohh_buying_timeframe: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ohh_budget_range: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ohh_financing_status: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ohh_property_type_preference: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ohh_event_id: z.ZodString;
        ohh_event_host_tenant_id: z.ZodString;
        ohh_event_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
    ohhEventId: z.ZodString;
    mloTenantId: z.ZodString;
    ohhEventHostTenantId: z.ZodString;
    ohhAttendeeId: z.ZodString;
}, z.core.$strip>;
type OhhAttendeeData = z.infer<typeof ohhAttendeeDataSchema>;
type OhhAttendeeMarkedForPfpPreapprovalData = z.infer<typeof ohhAttendeeMarkedForPfpPreapprovalDataSchema>;
/** Mirror of OHH's prisma `enum ShowingStatus` (openhousehub schema). */
declare const ohhShowingStatusSchema: z.ZodEnum<{
    REQUESTED: "REQUESTED";
    CONFIRMED: "CONFIRMED";
    COMPLETED: "COMPLETED";
    CANCELED: "CANCELED";
    NO_SHOW: "NO_SHOW";
}>;
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
declare const ohhShowingLifecycleBaseDataSchema: z.ZodObject<{
    showingId: z.ZodString;
    propertyAddress: z.ZodString;
    scheduledAt: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        REQUESTED: "REQUESTED";
        CONFIRMED: "CONFIRMED";
        COMPLETED: "COMPLETED";
        CANCELED: "CANCELED";
        NO_SHOW: "NO_SHOW";
    }>;
    agentId: z.ZodString;
    relloMeetingId: z.ZodNullable<z.ZodString>;
    action: z.ZodString;
    actorUserId: z.ZodString;
}, z.core.$strip>;
/**
 * `open-house-hub.showing_requested` — POST /api/showings creates a
 * REQUESTED showing. extraData: `{ requestedSlots: requestedSlots ?? null }`
 * (route.ts:255; slots are zod `.datetime()`-validated ISO strings, max 20,
 * already filtered to future slots; null when none were proposed, e.g. the
 * direct-confirm slotStart path).
 */
declare const ohhShowingRequestedDataSchema: z.ZodObject<{
    showingId: z.ZodString;
    propertyAddress: z.ZodString;
    scheduledAt: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        REQUESTED: "REQUESTED";
        CONFIRMED: "CONFIRMED";
        COMPLETED: "COMPLETED";
        CANCELED: "CANCELED";
        NO_SHOW: "NO_SHOW";
    }>;
    agentId: z.ZodString;
    relloMeetingId: z.ZodNullable<z.ZodString>;
    action: z.ZodString;
    actorUserId: z.ZodString;
    requestedSlots: z.ZodNullable<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
/**
 * `open-house-hub.showing_confirmed` — shared confirm core (confirm.ts:246)
 * after the Rello meeting books. extraData:
 * `{ slotStart: params.slotStart, videoMeetingUrl: booked.videoMeetingUrl ?? null }`.
 */
declare const ohhShowingConfirmedDataSchema: z.ZodObject<{
    showingId: z.ZodString;
    propertyAddress: z.ZodString;
    scheduledAt: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        REQUESTED: "REQUESTED";
        CONFIRMED: "CONFIRMED";
        COMPLETED: "COMPLETED";
        CANCELED: "CANCELED";
        NO_SHOW: "NO_SHOW";
    }>;
    agentId: z.ZodString;
    relloMeetingId: z.ZodNullable<z.ZodString>;
    action: z.ZodString;
    actorUserId: z.ZodString;
    slotStart: z.ZodString;
    videoMeetingUrl: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * `open-house-hub.showing_canceled` — POST /api/showings/[id]/cancel.
 * extraData: `{ reason: reason ?? null, priorStatus: showing.status }`
 * (cancel/route.ts:154 — priorStatus is the pre-cancel status snapshot;
 * the base `status` field is CANCELED on this signal).
 */
declare const ohhShowingCanceledDataSchema: z.ZodObject<{
    showingId: z.ZodString;
    propertyAddress: z.ZodString;
    scheduledAt: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        REQUESTED: "REQUESTED";
        CONFIRMED: "CONFIRMED";
        COMPLETED: "COMPLETED";
        CANCELED: "CANCELED";
        NO_SHOW: "NO_SHOW";
    }>;
    agentId: z.ZodString;
    relloMeetingId: z.ZodNullable<z.ZodString>;
    action: z.ZodString;
    actorUserId: z.ZodString;
    reason: z.ZodNullable<z.ZodString>;
    priorStatus: z.ZodEnum<{
        REQUESTED: "REQUESTED";
        CONFIRMED: "CONFIRMED";
        COMPLETED: "COMPLETED";
        CANCELED: "CANCELED";
        NO_SHOW: "NO_SHOW";
    }>;
}, z.core.$strip>;
/**
 * `open-house-hub.showing_completed` — POST /api/showings/[id]/complete.
 * No extraData; base block only (complete/route.ts:83).
 */
declare const ohhShowingCompletedDataSchema: z.ZodObject<{
    showingId: z.ZodString;
    propertyAddress: z.ZodString;
    scheduledAt: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        REQUESTED: "REQUESTED";
        CONFIRMED: "CONFIRMED";
        COMPLETED: "COMPLETED";
        CANCELED: "CANCELED";
        NO_SHOW: "NO_SHOW";
    }>;
    agentId: z.ZodString;
    relloMeetingId: z.ZodNullable<z.ZodString>;
    action: z.ZodString;
    actorUserId: z.ZodString;
}, z.core.$strip>;
/**
 * `open-house-hub.showing_no_show` — POST /api/showings/[id]/no-show.
 * No extraData; base block only (no-show/route.ts:84).
 */
declare const ohhShowingNoShowDataSchema: z.ZodObject<{
    showingId: z.ZodString;
    propertyAddress: z.ZodString;
    scheduledAt: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        REQUESTED: "REQUESTED";
        CONFIRMED: "CONFIRMED";
        COMPLETED: "COMPLETED";
        CANCELED: "CANCELED";
        NO_SHOW: "NO_SHOW";
    }>;
    agentId: z.ZodString;
    relloMeetingId: z.ZodNullable<z.ZodString>;
    action: z.ZodString;
    actorUserId: z.ZodString;
}, z.core.$strip>;
/**
 * Consumer feedback vocabulary — EXACT three-option lock from
 * OHH src/lib/feedback/constants.ts (`FEEDBACK_RESPONSES`).
 */
declare const ohhShowingFeedbackResponseSchema: z.ZodEnum<{
    loved: "loved";
    interested: "interested";
    not_for_me: "not_for_me";
}>;
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
 */
declare const ohhShowingFeedbackDataSchema: z.ZodObject<{
    leadId: z.ZodNullable<z.ZodString>;
    eventId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    showingId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    propertyAddress: z.ZodString;
    response: z.ZodEnum<{
        loved: "loved";
        interested: "interested";
        not_for_me: "not_for_me";
    }>;
}, z.core.$strip>;
type OhhShowingStatus = z.infer<typeof ohhShowingStatusSchema>;
type OhhShowingLifecycleBaseData = z.infer<typeof ohhShowingLifecycleBaseDataSchema>;
type OhhShowingRequestedData = z.infer<typeof ohhShowingRequestedDataSchema>;
type OhhShowingConfirmedData = z.infer<typeof ohhShowingConfirmedDataSchema>;
type OhhShowingCanceledData = z.infer<typeof ohhShowingCanceledDataSchema>;
type OhhShowingCompletedData = z.infer<typeof ohhShowingCompletedDataSchema>;
type OhhShowingNoShowData = z.infer<typeof ohhShowingNoShowDataSchema>;
type OhhShowingFeedbackResponse = z.infer<typeof ohhShowingFeedbackResponseSchema>;
type OhhShowingFeedbackData = z.infer<typeof ohhShowingFeedbackDataSchema>;

export { type OhhAttendeeData, type OhhAttendeeMarkedForPfpPreapprovalData, type OhhShowingCanceledData, type OhhShowingCompletedData, type OhhShowingConfirmedData, type OhhShowingFeedbackData, type OhhShowingFeedbackResponse, type OhhShowingLifecycleBaseData, type OhhShowingNoShowData, type OhhShowingRequestedData, type OhhShowingStatus, ohhAttendeeDataSchema, ohhAttendeeMarkedForPfpPreapprovalDataSchema, ohhShowingCanceledDataSchema, ohhShowingCompletedDataSchema, ohhShowingConfirmedDataSchema, ohhShowingFeedbackDataSchema, ohhShowingFeedbackResponseSchema, ohhShowingLifecycleBaseDataSchema, ohhShowingNoShowDataSchema, ohhShowingRequestedDataSchema, ohhShowingStatusSchema };
