import { z } from 'zod';

/**
 * HH lead_intake — universal intake gateway signal per AOM (HH = canonical lead intake home).
 * Backfilled at package v0.1.0 init for catalog completeness; canonical example cited in BPB §9.1.
 *
 * Pre-launch permissive (`.passthrough()`); tighten post-launch as HH outbound contract solidifies.
 */
declare const hhLeadIntakeDataSchema: z.ZodObject<{
    hh_lead_id: z.ZodString;
    hh_tenant_id: z.ZodString;
    hh_source: z.ZodString;
    hh_first_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    hh_last_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    hh_email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    hh_phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$loose>;
type HhLeadIntakeData = z.infer<typeof hhLeadIntakeDataSchema>;

export { type HhLeadIntakeData, hhLeadIntakeDataSchema };
