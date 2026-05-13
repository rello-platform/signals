import { z } from "zod";

/**
 * HH lead_intake — universal intake gateway signal per AOM (HH = canonical lead intake home).
 * Backfilled at package v0.1.0 init for catalog completeness; canonical example cited in BPB §9.1.
 *
 * Pre-launch permissive (`.passthrough()`); tighten post-launch as HH outbound contract solidifies.
 */
export const hhLeadIntakeDataSchema = z.object({
  hh_lead_id: z.string().cuid(),
  hh_tenant_id: z.string().cuid(),
  hh_source: z.string(),
  hh_first_name: z.string().nullable().optional(),
  hh_last_name: z.string().nullable().optional(),
  hh_email: z.string().email().nullable().optional(),
  hh_phone: z.string().nullable().optional(),
}).passthrough();

export type HhLeadIntakeData = z.infer<typeof hhLeadIntakeDataSchema>;
