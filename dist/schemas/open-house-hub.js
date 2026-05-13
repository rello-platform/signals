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
export {
  ohhAttendeeDataSchema,
  ohhAttendeeMarkedForPfpPreapprovalDataSchema
};
//# sourceMappingURL=open-house-hub.js.map