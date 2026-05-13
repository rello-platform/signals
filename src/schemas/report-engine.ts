import { z } from "zod";

/**
 * Report Engine report_ready — emit on PDF generation completion.
 * Backfilled at package v0.1.0 init. Schema shape from
 * ~/Report-Engine/app/signal_emitter.py + ~/Report-Engine/app/main.py:237-246
 * (canonical references per BPB §SIGNAL-WEBHOOK provenance).
 *
 * Pre-launch permissive (`.passthrough()`); tighten post-launch.
 */
export const reportEngineReportReadyDataSchema = z.object({
  reportId: z.string(),
  reportUrl: z.string().url(),
  reportType: z.string(),
  tenantId: z.string(),
  leadId: z.string().nullable().optional(),
}).passthrough();

export type ReportEngineReportReadyData = z.infer<typeof reportEngineReportReadyDataSchema>;
