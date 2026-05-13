// src/schemas/report-engine.ts
import { z } from "zod";
var reportEngineReportReadyDataSchema = z.object({
  reportId: z.string(),
  reportUrl: z.string().url(),
  reportType: z.string(),
  tenantId: z.string(),
  leadId: z.string().nullable().optional()
}).passthrough();
export {
  reportEngineReportReadyDataSchema
};
//# sourceMappingURL=report-engine.js.map