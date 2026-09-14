import { z } from "zod";

/**
 * HS lead-magnet attendee snapshot — scout_* namespaced keys per AOM line 588 (verify at compose-time).
 * Phase-1 scope: identity + magnet context. Tighten post-launch.
 *
 * Hooks SPEC-PFP-HS-REFERRAL-PATH (Wave 1 chain pos 7; D14 SPEC-AUTHOR will tighten field set
 * during joint PFP-KA + HS-KA Q&A walk).
 */
export const hsLeadMagnetSubmittedDataSchema = z.object({
  scout_lead_magnet_id: z.string(),
  scout_magnet_type: z.string(),
  scout_visitor_email: z.string().email(),
  scout_visitor_phone: z.string().nullable().optional(),
  scout_visitor_first_name: z.string().nullable().optional(),
  scout_visitor_last_name: z.string().nullable().optional(),
  scout_intent_signal: z.string().nullable().optional(),
});

export type HsLeadMagnetSubmittedData = z.infer<typeof hsLeadMagnetSubmittedDataSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// OHH-SHOWINGS-AND-TOURS P4 (v0.18.0) — `home-scout.tour_stop_rated`.
// Buyer rates a tour stop in the HS companion; the write is HS-LOCAL
// (DL4: TourStopRating model, no cross-app round-trip — OHH is never called
// on rating writes). Emitted via HS's existing signals:write key so Milo's
// preference read can ride it (goalShiftSemantics:true in the registry).
//
// PII floor: `hasNotes` is a boolean ONLY — the buyer's notes text NEVER
// crosses this wire (CONTRACT-TOUR-COMPANION-PAYLOAD-260611 §Ratings).
// ─────────────────────────────────────────────────────────────────────────────
export const hsTourStopRatedDataSchema = z.object({
  tourId: z.string().min(1),
  stopId: z.string().min(1),
  /** HS-side lead id (TourStopRating.leadId — the rating buyer). */
  leadId: z.string().min(1),
  /** 1-5 integer star rating. */
  rating: z.number().int().min(1).max(5),
  /** Whether the buyer left notes — NEVER the notes text (PII floor). */
  hasNotes: z.boolean(),
});

export type HsTourStopRatedData = z.infer<typeof hsTourStopRatedDataSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// C-23 (a) (v0.32.0) — `home-scout.pfp_intake_dead`.
// Emitted by Home Scout ONCE, leadless, when a Home Scout → PathfinderPro
// loan-application handoff exhausts its retries (FailedPfpIntake.dead = true).
// Identifiers and failure evidence only. `.strict()` refuses any other field,
// so borrower PII (name, email, phone, the intake payload) can never ride it.
// ─────────────────────────────────────────────────────────────────────────────
export const hsPfpIntakeDeadDataSchema = z
  .object({
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
    attempt: z.number().int().min(0),
  })
  .strict();

export type HsPfpIntakeDeadData = z.infer<typeof hsPfpIntakeDeadDataSchema>;
