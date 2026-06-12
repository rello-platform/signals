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
var ohhFeedbackSubmitterRoleSchema = z.enum(["buyer", "coop_agent"]);
var ohhShowingFeedbackDataSchema = z.object({
  leadId: z.string().nullable(),
  eventId: z.string().nullable().optional(),
  showingId: z.string().nullable().optional(),
  propertyAddress: z.string(),
  response: ohhShowingFeedbackResponseSchema,
  submitterRole: ohhFeedbackSubmitterRoleSchema.optional()
});
var ohhCoopInviteSentDataSchema = z.object({
  showingId: z.string().min(1),
  /** ShowingParticipant row id for the invited co-op agent (NOT a contact value). */
  participantId: z.string().min(1),
  /** Whether the invite had an email channel — capability flag, never the address. */
  hasEmail: z.boolean(),
  /** Whether the invite had a phone channel — capability flag, never the number. */
  hasPhone: z.boolean(),
  action: z.string().min(1),
  actorUserId: z.string().min(1)
});
var ohhTourLifecycleBaseDataSchema = z.object({
  tourId: z.string().min(1),
  /** Resolved Rello lead id of the buyer; null when unresolved. */
  relloLeadId: z.string().nullable(),
  /** Number of stops on the tour (TourStop rows). */
  stopCount: z.number().int().nonnegative(),
  /** ISO 8601 — date of the tour day (date-only or datetime form). */
  tourDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "ISO 8601 date expected"),
  action: z.string().min(1),
  actorUserId: z.string().min(1)
});
var ohhTourCreatedDataSchema = ohhTourLifecycleBaseDataSchema;
var ohhTourCompletedDataSchema = ohhTourLifecycleBaseDataSchema.extend({
  completedStops: z.number().int().nonnegative()
});
export {
  ohhAttendeeDataSchema,
  ohhAttendeeMarkedForPfpPreapprovalDataSchema,
  ohhCoopInviteSentDataSchema,
  ohhFeedbackSubmitterRoleSchema,
  ohhShowingCanceledDataSchema,
  ohhShowingCompletedDataSchema,
  ohhShowingConfirmedDataSchema,
  ohhShowingFeedbackDataSchema,
  ohhShowingFeedbackResponseSchema,
  ohhShowingLifecycleBaseDataSchema,
  ohhShowingNoShowDataSchema,
  ohhShowingRequestedDataSchema,
  ohhShowingStatusSchema,
  ohhTourCompletedDataSchema,
  ohhTourCreatedDataSchema,
  ohhTourLifecycleBaseDataSchema
};
//# sourceMappingURL=open-house-hub.js.map