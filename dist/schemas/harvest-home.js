// src/schemas/harvest-home.ts
import { z } from "zod";
var hhLeadIntakeDataSchema = z.object({
  hh_lead_id: z.string().cuid(),
  hh_tenant_id: z.string().cuid(),
  hh_source: z.string(),
  hh_first_name: z.string().nullable().optional(),
  hh_last_name: z.string().nullable().optional(),
  hh_email: z.string().email().nullable().optional(),
  hh_phone: z.string().nullable().optional()
}).passthrough();
export {
  hhLeadIntakeDataSchema
};
//# sourceMappingURL=harvest-home.js.map