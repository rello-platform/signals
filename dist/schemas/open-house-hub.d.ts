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

export { type OhhAttendeeData, type OhhAttendeeMarkedForPfpPreapprovalData, ohhAttendeeDataSchema, ohhAttendeeMarkedForPfpPreapprovalDataSchema };
