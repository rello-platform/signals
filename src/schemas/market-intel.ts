import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// MARKET INTEL INGEST R-1 (v0.38.0) — `market-intel.realtor_prospect.intake_received`.
//
// A real estate agent signed up for Market Intel (public /subscribe, an
// inactive resubscribe, /request-access, or an admin invite). MarketIntel
// emits it from a RelloSyncQueue outbox row written in the same transaction as
// the Subscriber; Rello processes it IN-REQUEST at `POST /api/signals/batch`
// (the realtor-prospect intake carve-out) and writes one RealtorProspect +
// Activity + AuditLog + intake receipt.
//
// The signal envelope also needs, OUTSIDE this payload: `tenantId` (the Rello
// tenant), `sourceApp: "market-intel"`, no `leadId`, and `idempotencyKey`
// `mi-rpi-<outbox row id>` (≤ 64 chars), identical on every retry of one
// intake event and distinct per event.
//
// Rello answers each intake signal with an entry in the response's `results`
// array — see REALTOR_PROSPECT_INTAKE_OUTCOMES below.
//
// Not `.strict()`: an unknown extra field is dropped, never a reason to refuse
// a signup. Missing optional data is sent as `null` (nullable, present).
// There is no phone and no SMS opt-in: MI forms collect neither.
// ─────────────────────────────────────────────────────────────────────────────

export const MARKET_INTEL_REALTOR_PROSPECT_INTAKE_SIGNAL_TYPE =
  "market-intel.realtor_prospect.intake_received" as const;

/** Which MI path produced the signup (R-2). */
export const MARKET_INTEL_INTAKE_ACTIONS = [
  "public_signup",
  "resubscribe",
  "access_request",
  "admin_invite",
] as const;
export type MarketIntelIntakeAction = (typeof MARKET_INTEL_INTAKE_ACTIONS)[number];

/** The source-accurate consent fact at the time of the event (MII-06). */
export const MARKET_INTEL_CONSENT_BASES = [
  "form_submitted",
  "admin_invited",
  "access_requested",
] as const;
export type MarketIntelConsentBasis = (typeof MARKET_INTEL_CONSENT_BASES)[number];

export const marketIntelRealtorProspectIntakeReceivedDataSchema = z.object({
  /** MI Subscriber.id. */
  subscriberId: z.string().min(1),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  brokerage: z.string().nullable(),
  publicationId: z.string().nullable(),
  publicationName: z.string().nullable(),
  intakeAction: z.enum(MARKET_INTEL_INTAKE_ACTIONS),
  consentBasis: z.enum(MARKET_INTEL_CONSENT_BASES),
  /** ISO-8601 instant the signup was submitted. */
  submittedAt: z.string().datetime({ offset: true }),
  /** Rello Agent.id of a named MLO. MI has none today and always sends null. */
  assignedMloAgentId: z.string().min(1).nullable(),
});

export type MarketIntelRealtorProspectIntakeReceivedData = z.infer<
  typeof marketIntelRealtorProspectIntakeReceivedDataSchema
>;

/**
 * Every `results[i].outcome` Rello returns for a realtor-prospect intake
 * signal (either source). `created` and `repeat` carry `realtorProspectId` and
 * are delivered; a replay of the same `(tenantId, idempotencyKey)` returns
 * `repeat` with the SAME id and writes nothing. `rejected` wrote nothing and
 * carries a `reason`; it is NOT delivered. An HTTP 5xx / 503 means "retry the
 * batch".
 */
export const REALTOR_PROSPECT_INTAKE_OUTCOMES = ["created", "repeat", "rejected"] as const;
export type RealtorProspectIntakeOutcome = (typeof REALTOR_PROSPECT_INTAKE_OUTCOMES)[number];
