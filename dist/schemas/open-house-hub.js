// src/schemas/open-house-hub.ts
import { z } from "zod";
var ohhAttendeeDataSchema = z.object({
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
  ohh_event_date: z.string().datetime().nullable().optional()
});
var ohhAttendeeMarkedForPfpPreapprovalDataSchema = z.object({
  attendeeData: ohhAttendeeDataSchema,
  ohhEventId: z.string().cuid(),
  mloTenantId: z.string(),
  ohhEventHostTenantId: z.string().cuid(),
  ohhAttendeeId: z.string().cuid()
});
var ohhShowingStatusSchema = z.enum([
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELED",
  "NO_SHOW"
]);
var ohhShowingLifecycleBaseDataSchema = z.object({
  showingId: z.string().min(1),
  propertyAddress: z.string(),
  /** `showing.scheduledAt?.toISOString() ?? null` — ISO datetime or null. */
  scheduledAt: z.string().datetime().nullable(),
  status: ohhShowingStatusSchema,
  agentId: z.string().min(1),
  relloMeetingId: z.string().nullable(),
  action: z.string().min(1),
  actorUserId: z.string().min(1)
});
var ohhShowingRequestedDataSchema = ohhShowingLifecycleBaseDataSchema.extend({
  requestedSlots: z.array(z.string().datetime()).nullable()
});
var ohhShowingConfirmedDataSchema = ohhShowingLifecycleBaseDataSchema.extend({
  slotStart: z.string().datetime(),
  videoMeetingUrl: z.string().nullable()
});
var ohhShowingCanceledDataSchema = ohhShowingLifecycleBaseDataSchema.extend({
  reason: z.string().nullable(),
  priorStatus: ohhShowingStatusSchema
});
var ohhShowingCompletedDataSchema = ohhShowingLifecycleBaseDataSchema;
var ohhShowingNoShowDataSchema = ohhShowingLifecycleBaseDataSchema;
var ohhShowingFeedbackResponseSchema = z.enum([
  "loved",
  "interested",
  "not_for_me"
]);
var ohhShowingFeedbackDataSchema = z.object({
  leadId: z.string().nullable(),
  eventId: z.string().nullable().optional(),
  showingId: z.string().nullable().optional(),
  propertyAddress: z.string(),
  response: ohhShowingFeedbackResponseSchema
});
export {
  ohhAttendeeDataSchema,
  ohhAttendeeMarkedForPfpPreapprovalDataSchema,
  ohhShowingCanceledDataSchema,
  ohhShowingCompletedDataSchema,
  ohhShowingConfirmedDataSchema,
  ohhShowingFeedbackDataSchema,
  ohhShowingFeedbackResponseSchema,
  ohhShowingLifecycleBaseDataSchema,
  ohhShowingNoShowDataSchema,
  ohhShowingRequestedDataSchema,
  ohhShowingStatusSchema
};
//# sourceMappingURL=open-house-hub.js.map