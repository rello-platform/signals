import { z } from 'zod';

/**
 * Report Engine report_ready — emit on PDF generation completion.
 * Backfilled at package v0.1.0 init. Schema shape from
 * ~/Report-Engine/app/signal_emitter.py + ~/Report-Engine/app/main.py:237-246
 * (canonical references per BPB §SIGNAL-WEBHOOK provenance).
 *
 * Pre-launch permissive (`.passthrough()`); tighten post-launch.
 */
declare const reportEngineReportReadyDataSchema: z.ZodObject<{
    reportId: z.ZodString;
    reportUrl: z.ZodString;
    reportType: z.ZodString;
    tenantId: z.ZodString;
    leadId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$loose>;
type ReportEngineReportReadyData = z.infer<typeof reportEngineReportReadyDataSchema>;

export { type ReportEngineReportReadyData, reportEngineReportReadyDataSchema };
