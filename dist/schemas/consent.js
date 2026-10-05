// src/schemas/consent.ts
import { z } from "zod";
var CONSENT_CAPTURE_SURFACE_CHANNELS = {
  "check-your-rate:text-quote": ["CALL", "CONSENT_SMS"]
};
var SURFACES = Object.keys(CONSENT_CAPTURE_SURFACE_CHANNELS);
var SHA256_HEX = /^[0-9a-f]{64}$/;
var E164 = /^\+[1-9][0-9]{7,14}$/;
var consentCapturedDataSchema = z.object({
  /** The checkbox sentence EXACTLY as rendered. Stored verbatim — never trim or normalise it. */
  sentence: z.string().max(4e3).refine((s) => s.trim() !== "", { message: "sentence is empty or whitespace" }),
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
  userAgent: z.string().max(512).nullable().optional()
}).strict().superRefine((d, ctx) => {
  const want = CONSENT_CAPTURE_SURFACE_CHANNELS[d.surface];
  const ok = d.channels.length === want.length && new Set(d.channels).size === d.channels.length && want.every((c) => d.channels.includes(c));
  if (!ok) ctx.addIssue({ code: "custom", path: ["channels"], message: `channels must be exactly ${want.join(" + ")} for ${d.surface}` });
});
var CONSENT_CAPTURE_OUTCOMES = [
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
  "refused_idempotency_conflict"
];
export {
  CONSENT_CAPTURE_OUTCOMES,
  CONSENT_CAPTURE_SURFACE_CHANNELS,
  consentCapturedDataSchema
};
//# sourceMappingURL=consent.js.map