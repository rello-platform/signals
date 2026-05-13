import { z } from 'zod';

/**
 * HS lead-magnet attendee snapshot — scout_* namespaced keys per AOM line 588 (verify at compose-time).
 * Phase-1 scope: identity + magnet context. Tighten post-launch.
 *
 * Hooks SPEC-PFP-HS-REFERRAL-PATH (Wave 1 chain pos 7; D14 SPEC-AUTHOR will tighten field set
 * during joint PFP-KA + HS-KA Q&A walk).
 */
declare const hsLeadMagnetSubmittedDataSchema: z.ZodObject<{
    scout_lead_magnet_id: z.ZodString;
    scout_magnet_type: z.ZodString;
    scout_visitor_email: z.ZodString;
    scout_visitor_phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    scout_visitor_first_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    scout_visitor_last_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    scout_intent_signal: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
type HsLeadMagnetSubmittedData = z.infer<typeof hsLeadMagnetSubmittedDataSchema>;

export { type HsLeadMagnetSubmittedData, hsLeadMagnetSubmittedDataSchema };
