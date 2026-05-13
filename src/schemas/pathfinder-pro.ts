import { z } from "zod";

/**
 * PFP export family — emit on rate-sheet / scenario / LOS export queue lifecycle.
 * Five canonical events: queued / in_flight / success / failed / permanently_failed.
 * Registered Rello-side at constants.ts via D3 dispatch 2026-05-13.
 */
export const pfpExportQueuedDataSchema = z.object({
  pfp_export_id: z.string(),
  pfp_export_kind: z.enum(["rate-sheet", "scenario-summary", "los-package", "letter"]),
  pfp_target: z.string().nullable().optional(),
});

export const pfpExportInFlightDataSchema = pfpExportQueuedDataSchema.extend({
  pfp_export_started_at: z.string().datetime(),
});

export const pfpExportSuccessDataSchema = pfpExportQueuedDataSchema.extend({
  pfp_export_url: z.string().url().nullable().optional(),
  pfp_export_completed_at: z.string().datetime(),
});

export const pfpExportFailedDataSchema = pfpExportQueuedDataSchema.extend({
  pfp_export_error: z.string(),
  pfp_export_attempt: z.number().int().positive(),
});

export const pfpExportPermanentlyFailedDataSchema = pfpExportFailedDataSchema.extend({
  pfp_export_failed_permanently_at: z.string().datetime(),
});

/**
 * PFP compliance family — MLO LO Comp scanner orchestration signals.
 * Registered Rello-side at constants.ts via D3 dispatch 2026-05-13.
 */
export const pfpComplianceGateBlockedDataSchema = z.object({
  pfp_scenario_id: z.string(),
  pfp_gate_kind: z.string(),
  pfp_violation_reason: z.string(),
});

export const pfpComplianceConfigChangedDataSchema = z.object({
  pfp_config_kind: z.string(),
  pfp_changed_by_user_id: z.string(),
  pfp_change_summary: z.string().nullable().optional(),
});

export type PfpExportQueuedData = z.infer<typeof pfpExportQueuedDataSchema>;
export type PfpExportInFlightData = z.infer<typeof pfpExportInFlightDataSchema>;
export type PfpExportSuccessData = z.infer<typeof pfpExportSuccessDataSchema>;
export type PfpExportFailedData = z.infer<typeof pfpExportFailedDataSchema>;
export type PfpExportPermanentlyFailedData = z.infer<typeof pfpExportPermanentlyFailedDataSchema>;
export type PfpComplianceGateBlockedData = z.infer<typeof pfpComplianceGateBlockedDataSchema>;
export type PfpComplianceConfigChangedData = z.infer<typeof pfpComplianceConfigChangedDataSchema>;
