import { z } from 'zod';

/** Surfaces Rello accepts, and the channels each one grants. */
declare const CONSENT_CAPTURE_SURFACE_CHANNELS: {
    readonly "check-your-rate:text-quote": readonly ["CALL", "CONSENT_SMS"];
};
type ConsentCaptureSurface = keyof typeof CONSENT_CAPTURE_SURFACE_CHANNELS;
declare const consentCapturedDataSchema: z.ZodObject<{
    sentence: z.ZodString;
    sentenceSha256: z.ZodString;
    sentenceVersion: z.ZodString;
    surface: z.ZodEnum<{
        "check-your-rate:text-quote": "check-your-rate:text-quote";
    }>;
    phoneE164: z.ZodString;
    channels: z.ZodArray<z.ZodEnum<{
        CALL: "CALL";
        CONSENT_SMS: "CONSENT_SMS";
    }>>;
    capturedAt: z.ZodString;
    ipHash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    userAgent: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
type ConsentCapturedData = z.infer<typeof consentCapturedDataSchema>;
/**
 * Every `consentCaptures[i].outcome` Rello returns for a `consent.captured`.
 * `captured` / `replayed` are done. Every `refused_*` wrote NOTHING and is
 * deterministic — do not retry it. Only an HTTP 5xx / 503 means "retry".
 */
declare const CONSENT_CAPTURE_OUTCOMES: readonly ["captured", "replayed", "refused_empty_sentence", "refused_hash_mismatch", "refused_phone_not_e164", "refused_invalid_payload", "refused_unknown_surface", "refused_source_not_allowed", "refused_tenant_not_authorized", "refused_lead_not_in_tenant", "refused_phone_not_leads", "refused_idempotency_conflict"];
type ConsentCaptureOutcome = (typeof CONSENT_CAPTURE_OUTCOMES)[number];

export { CONSENT_CAPTURE_OUTCOMES, CONSENT_CAPTURE_SURFACE_CHANNELS, type ConsentCaptureOutcome, type ConsentCaptureSurface, type ConsentCapturedData, consentCapturedDataSchema };
