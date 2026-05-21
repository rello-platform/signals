// src/signal-priority.ts
var SIGNAL_PRIORITY_RANK = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};
function meetsMinPriority(signalPriority, minPolicy) {
  return SIGNAL_PRIORITY_RANK[signalPriority] >= SIGNAL_PRIORITY_RANK[minPolicy];
}
var SIGNAL_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
var SIGNAL_PRIORITY_SET = new Set(
  SIGNAL_PRIORITIES
);
function isSignalPriority(value) {
  return typeof value === "string" && SIGNAL_PRIORITY_SET.has(value);
}

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

// src/schemas/home-scout.ts
import { z as z2 } from "zod";
var hsLeadMagnetSubmittedDataSchema = z2.object({
  scout_lead_magnet_id: z2.string(),
  scout_magnet_type: z2.string(),
  scout_visitor_email: z2.string().email(),
  scout_visitor_phone: z2.string().nullable().optional(),
  scout_visitor_first_name: z2.string().nullable().optional(),
  scout_visitor_last_name: z2.string().nullable().optional(),
  scout_intent_signal: z2.string().nullable().optional()
});

// src/schemas/harvest-home.ts
import { z as z3 } from "zod";
var hhLeadIntakeDataSchema = z3.object({
  hh_lead_id: z3.string().cuid(),
  hh_tenant_id: z3.string().cuid(),
  hh_source: z3.string(),
  hh_first_name: z3.string().nullable().optional(),
  hh_last_name: z3.string().nullable().optional(),
  hh_email: z3.string().email().nullable().optional(),
  hh_phone: z3.string().nullable().optional()
}).passthrough();

// src/schemas/report-engine.ts
import { z as z4 } from "zod";
var reportEngineReportReadyDataSchema = z4.object({
  reportId: z4.string(),
  reportUrl: z4.string().url(),
  reportType: z4.string(),
  tenantId: z4.string(),
  leadId: z4.string().nullable().optional()
}).passthrough();

// src/schemas/pathfinder-pro.ts
import { z as z5 } from "zod";
var pfpExportQueuedDataSchema = z5.object({
  pfp_export_id: z5.string(),
  pfp_export_kind: z5.enum(["rate-sheet", "scenario-summary", "los-package", "letter"]),
  pfp_target: z5.string().nullable().optional()
});
var pfpExportInFlightDataSchema = pfpExportQueuedDataSchema.extend({
  pfp_export_started_at: z5.string().datetime()
});
var pfpExportSuccessDataSchema = pfpExportQueuedDataSchema.extend({
  pfp_export_url: z5.string().url().nullable().optional(),
  pfp_export_completed_at: z5.string().datetime()
});
var pfpExportFailedDataSchema = pfpExportQueuedDataSchema.extend({
  pfp_export_error: z5.string(),
  pfp_export_attempt: z5.number().int().positive()
});
var pfpExportPermanentlyFailedDataSchema = pfpExportFailedDataSchema.extend({
  pfp_export_failed_permanently_at: z5.string().datetime()
});
var pfpComplianceGateBlockedDataSchema = z5.object({
  pfp_scenario_id: z5.string(),
  pfp_gate_kind: z5.string(),
  pfp_violation_reason: z5.string()
});
var pfpComplianceConfigChangedDataSchema = z5.object({
  pfp_config_kind: z5.string(),
  pfp_changed_by_user_id: z5.string(),
  pfp_change_summary: z5.string().nullable().optional()
});
export {
  SIGNAL_PRIORITIES,
  SIGNAL_PRIORITY_RANK,
  hhLeadIntakeDataSchema,
  hsLeadMagnetSubmittedDataSchema,
  isSignalPriority,
  meetsMinPriority,
  ohhAttendeeDataSchema,
  ohhAttendeeMarkedForPfpPreapprovalDataSchema,
  pfpComplianceConfigChangedDataSchema,
  pfpComplianceGateBlockedDataSchema,
  pfpExportFailedDataSchema,
  pfpExportInFlightDataSchema,
  pfpExportPermanentlyFailedDataSchema,
  pfpExportQueuedDataSchema,
  pfpExportSuccessDataSchema,
  reportEngineReportReadyDataSchema
};
//# sourceMappingURL=index.js.map