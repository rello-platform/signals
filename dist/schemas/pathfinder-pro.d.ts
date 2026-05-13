import { z } from 'zod';

/**
 * PFP export family — emit on rate-sheet / scenario / LOS export queue lifecycle.
 * Five canonical events: queued / in_flight / success / failed / permanently_failed.
 * Registered Rello-side at constants.ts via D3 dispatch 2026-05-13.
 */
declare const pfpExportQueuedDataSchema: z.ZodObject<{
    pfp_export_id: z.ZodString;
    pfp_export_kind: z.ZodEnum<{
        "rate-sheet": "rate-sheet";
        "scenario-summary": "scenario-summary";
        "los-package": "los-package";
        letter: "letter";
    }>;
    pfp_target: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
declare const pfpExportInFlightDataSchema: z.ZodObject<{
    pfp_export_id: z.ZodString;
    pfp_export_kind: z.ZodEnum<{
        "rate-sheet": "rate-sheet";
        "scenario-summary": "scenario-summary";
        "los-package": "los-package";
        letter: "letter";
    }>;
    pfp_target: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    pfp_export_started_at: z.ZodString;
}, z.core.$strip>;
declare const pfpExportSuccessDataSchema: z.ZodObject<{
    pfp_export_id: z.ZodString;
    pfp_export_kind: z.ZodEnum<{
        "rate-sheet": "rate-sheet";
        "scenario-summary": "scenario-summary";
        "los-package": "los-package";
        letter: "letter";
    }>;
    pfp_target: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    pfp_export_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    pfp_export_completed_at: z.ZodString;
}, z.core.$strip>;
declare const pfpExportFailedDataSchema: z.ZodObject<{
    pfp_export_id: z.ZodString;
    pfp_export_kind: z.ZodEnum<{
        "rate-sheet": "rate-sheet";
        "scenario-summary": "scenario-summary";
        "los-package": "los-package";
        letter: "letter";
    }>;
    pfp_target: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    pfp_export_error: z.ZodString;
    pfp_export_attempt: z.ZodNumber;
}, z.core.$strip>;
declare const pfpExportPermanentlyFailedDataSchema: z.ZodObject<{
    pfp_export_id: z.ZodString;
    pfp_export_kind: z.ZodEnum<{
        "rate-sheet": "rate-sheet";
        "scenario-summary": "scenario-summary";
        "los-package": "los-package";
        letter: "letter";
    }>;
    pfp_target: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    pfp_export_error: z.ZodString;
    pfp_export_attempt: z.ZodNumber;
    pfp_export_failed_permanently_at: z.ZodString;
}, z.core.$strip>;
/**
 * PFP compliance family — MLO LO Comp scanner orchestration signals.
 * Registered Rello-side at constants.ts via D3 dispatch 2026-05-13.
 */
declare const pfpComplianceGateBlockedDataSchema: z.ZodObject<{
    pfp_scenario_id: z.ZodString;
    pfp_gate_kind: z.ZodString;
    pfp_violation_reason: z.ZodString;
}, z.core.$strip>;
declare const pfpComplianceConfigChangedDataSchema: z.ZodObject<{
    pfp_config_kind: z.ZodString;
    pfp_changed_by_user_id: z.ZodString;
    pfp_change_summary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
type PfpExportQueuedData = z.infer<typeof pfpExportQueuedDataSchema>;
type PfpExportInFlightData = z.infer<typeof pfpExportInFlightDataSchema>;
type PfpExportSuccessData = z.infer<typeof pfpExportSuccessDataSchema>;
type PfpExportFailedData = z.infer<typeof pfpExportFailedDataSchema>;
type PfpExportPermanentlyFailedData = z.infer<typeof pfpExportPermanentlyFailedDataSchema>;
type PfpComplianceGateBlockedData = z.infer<typeof pfpComplianceGateBlockedDataSchema>;
type PfpComplianceConfigChangedData = z.infer<typeof pfpComplianceConfigChangedDataSchema>;

export { type PfpComplianceConfigChangedData, type PfpComplianceGateBlockedData, type PfpExportFailedData, type PfpExportInFlightData, type PfpExportPermanentlyFailedData, type PfpExportQueuedData, type PfpExportSuccessData, pfpComplianceConfigChangedDataSchema, pfpComplianceGateBlockedDataSchema, pfpExportFailedDataSchema, pfpExportInFlightDataSchema, pfpExportPermanentlyFailedDataSchema, pfpExportQueuedDataSchema, pfpExportSuccessDataSchema };
