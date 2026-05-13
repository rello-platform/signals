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
