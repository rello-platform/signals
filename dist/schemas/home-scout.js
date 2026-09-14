// src/schemas/home-scout.ts
import { z } from "zod";
var hsLeadMagnetSubmittedDataSchema = z.object({
  scout_lead_magnet_id: z.string(),
  scout_magnet_type: z.string(),
  scout_visitor_email: z.string().email(),
  scout_visitor_phone: z.string().nullable().optional(),
  scout_visitor_first_name: z.string().nullable().optional(),
  scout_visitor_last_name: z.string().nullable().optional(),
  scout_intent_signal: z.string().nullable().optional()
});
var hsTourStopRatedDataSchema = z.object({
  tourId: z.string().min(1),
  stopId: z.string().min(1),
  /** HS-side lead id (TourStopRating.leadId — the rating buyer). */
  leadId: z.string().min(1),
  /** 1-5 integer star rating. */
  rating: z.number().int().min(1).max(5),
  /** Whether the buyer left notes — NEVER the notes text (PII floor). */
  hasNotes: z.boolean()
});
var hsPfpIntakeDeadDataSchema = z.object({
  /** Home Scout FailedPfpIntake row id. */
  failedPfpIntakeId: z.string().min(1),
  /** The intake's idempotency key (PFP caps it at 64 chars). */
  sendIdempotencyKey: z.string().min(1).max(64),
  /** Owner tenant; null when the row's agent could not be resolved. */
  tenantId: z.string().min(1).nullable(),
  /** PathfinderPro's last HTTP status; null when it never answered. */
  lastHttpStatus: z.number().int().min(100).max(599).nullable(),
  /** Last failure reason, PII-scrubbed and capped by the emitter. */
  lastError: z.string().max(500),
  /** Attempts recorded when the row went dead. */
  attempt: z.number().int().min(0)
}).strict();
export {
  hsLeadMagnetSubmittedDataSchema,
  hsPfpIntakeDeadDataSchema,
  hsTourStopRatedDataSchema
};
//# sourceMappingURL=home-scout.js.map