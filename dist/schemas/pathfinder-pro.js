// src/schemas/pathfinder-pro.ts
import { z } from "zod";
var pfpExportQueuedDataSchema = z.object({
  pfp_export_id: z.string(),
  pfp_export_kind: z.enum(["rate-sheet", "scenario-summary", "los-package", "letter"]),
  pfp_target: z.string().nullable().optional()
});
var pfpExportInFlightDataSchema = pfpExportQueuedDataSchema.extend({
  pfp_export_started_at: z.string().datetime()
});
var pfpExportSuccessDataSchema = pfpExportQueuedDataSchema.extend({
  pfp_export_url: z.string().url().nullable().optional(),
  pfp_export_completed_at: z.string().datetime()
});
var pfpExportFailedDataSchema = pfpExportQueuedDataSchema.extend({
  pfp_export_error: z.string(),
  pfp_export_attempt: z.number().int().positive()
});
var pfpExportPermanentlyFailedDataSchema = pfpExportFailedDataSchema.extend({
  pfp_export_failed_permanently_at: z.string().datetime()
});
var pfpComplianceGateBlockedDataSchema = z.object({
  pfp_scenario_id: z.string(),
  pfp_gate_kind: z.string(),
  pfp_violation_reason: z.string()
});
var pfpComplianceConfigChangedDataSchema = z.object({
  pfp_config_kind: z.string(),
  pfp_changed_by_user_id: z.string(),
  pfp_change_summary: z.string().nullable().optional()
});
export {
  pfpComplianceConfigChangedDataSchema,
  pfpComplianceGateBlockedDataSchema,
  pfpExportFailedDataSchema,
  pfpExportInFlightDataSchema,
  pfpExportPermanentlyFailedDataSchema,
  pfpExportQueuedDataSchema,
  pfpExportSuccessDataSchema
};
//# sourceMappingURL=pathfinder-pro.js.map