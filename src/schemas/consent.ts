import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// D-245 / R-73 (v0.36.0) — `consent.captured`.
//
// A person ticked a worded consent box on a named surface. Home Scout emits it;
// Rello processes it IN-REQUEST at `POST /api/signals/batch` (Rello #1538):
// one append-only ConsentCapture row per (tenant, idempotencyKey), then CALL +
// CONSENT_SMS GRANTED bound to the lead's phone. Rello answers each signal with
// an outcome in the response's `consentCaptures` array — see
// CONSENT_CAPTURE_OUTCOMES below.
//
// The signal envelope also needs, OUTSIDE this payload: `tenantId` (Rello
// tenant), `leadId` (Rello lead) and `idempotencyKey` (one per submit, 1–255
// chars, identical on every retry).
//
// This schema states the payload contract Rello enforces. Two checks it cannot
// make are Rello's alone: `sentenceSha256` must equal the SHA-256 of
// `sentence` (Rello recomputes it — `refused_hash_mismatch`), and `phoneE164`
// must be one of the lead's numbers (`refused_phone_not_leads`).
// `.strict()`: no other field rides along.
// ─────────────────────────────────────────────────────────────────────────────

/** Surfaces Rello accepts, and the channels each one grants. */
export const CONSENT_CAPTURE_SURFACE_CHANNELS = {
  "check-your-rate:text-quote": ["CALL", "CONSENT_SMS"],
} as const;

export type ConsentCaptureSurface = keyof typeof CONSENT_CAPTURE_SURFACE_CHANNELS;

const SURFACES = Object.keys(CONSENT_CAPTURE_SURFACE_CHANNELS) as [ConsentCaptureSurface, ...ConsentCaptureSurface[]];
const SHA256_HEX = /^[0-9a-f]{64}$/;
const E164 = /^\+[1-9][0-9]{7,14}$/;

export const consentCapturedDataSchema = z
  .object({
    /** The checkbox sentence EXACTLY as rendered. Stored verbatim — never trim or normalise it. */
    sentence: z
      .string()
      .max(4000)
      .refine((s) => s.trim() !== "", { message: "sentence is empty or whitespace" }),
    /** Lowercase hex SHA-256 of `sentence`'s UTF-8 bytes, as sent. */
    sentenceSha256: z.string().regex(SHA256_HEX, "lowercase hex SHA-256"),
    /** The wording's version label. */
    sentenceVersion: z.string().min(1).max(64).refine((s) => s.trim() !== "", { message: "sentenceVersion is blank" }),
    surface: z.enum(SURFACES),
    /** The number the person typed, E.164 (`+18015550101`). */
    phoneE164: z.string().regex(E164, "E.164, e.g. +18015550101"),
    /** Exactly the surface's channels, any order, no duplicates. */
    channels: z.array(z.enum(["CALL", "CONSENT_SMS"])).min(1),
    /** ISO-8601 instant of the submit (Rello refuses > 5 min ahead or > 30 days old). */
    capturedAt: z.string().datetime({ offset: true }),
    /** Optional lowercase hex SHA-256 of the submitter's IP — never the raw IP. */
    ipHash: z.string().regex(SHA256_HEX, "lowercase hex SHA-256").nullable().optional(),
    userAgent: z.string().max(512).nullable().optional(),
  })
  .strict()
  .superRefine((d, ctx) => {
    const want: readonly string[] = CONSENT_CAPTURE_SURFACE_CHANNELS[d.surface];
    const ok = d.channels.length === want.length && new Set(d.channels).size === d.channels.length && want.every((c) => d.channels.includes(c as never));
    if (!ok) ctx.addIssue({ code: "custom", path: ["channels"], message: `channels must be exactly ${want.join(" + ")} for ${d.surface}` });
  });

export type ConsentCapturedData = z.infer<typeof consentCapturedDataSchema>;

/**
 * Every `consentCaptures[i].outcome` Rello returns for a `consent.captured`.
 * `captured` / `replayed` are done. Every `refused_*` wrote NOTHING and is
 * deterministic — do not retry it. Only an HTTP 5xx / 503 means "retry".
 */
export const CONSENT_CAPTURE_OUTCOMES = [
  "captured",
  "replayed",
  "refused_empty_sentence",
  "refused_hash_mismatch",
  "refused_phone_not_e164",
  "refused_invalid_payload",
  "refused_unknown_surface",
  "refused_source_not_allowed",
  "refused_tenant_not_authorized",
  "refused_lead_not_in_tenant",
  "refused_phone_not_leads",
  "refused_idempotency_conflict",
] as const;

export type ConsentCaptureOutcome = (typeof CONSENT_CAPTURE_OUTCOMES)[number];
