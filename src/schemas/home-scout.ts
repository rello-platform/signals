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

// ─────────────────────────────────────────────────────────────────────────────
// REALTOR REFERRAL NURTURE P2 (v0.39.0) — `home-scout.realtor_prospect.intake_received`.
//
// A real estate agent used one of the two forms on an MLO's Home Scout
// `/realtors` page. ONE signal, an `intent` per form:
//
//   updates_signup    — "Get updates": name, email, optional brokerage, markets,
//                       work focus, topics, optional phone, and the two consents
//                       AS CAPTURED (email updates; SMS in its own box,
//                       unchecked by default, so false unless ticked), with the
//                       consent text version and the capture time.
//   scenario_request  — "Ask a financing question": a reply email, the question,
//                       optional NON-IDENTIFYING facts.
//
// ⚑ A scenario_request ALONE IS NOT MARKETING CONSENT. Asking a question gives
// no permission to market to that person: its payload carries no consent
// object (any `consent` sent with it is dropped), and the receiver records the
// prospect with marketing consent FALSE. That prospect gets no marketing email
// until it opts in through an updates_signup. Pinned by
// tests/home-scout-realtor-prospect-intake-signal.test.mjs.
//
// ⚑ NO CLIENT IDENTITY. The scenario desk is anonymous: no client name, SSN,
// DOB, account numbers or documents. A payload carrying a field with one of
// those names, at any depth, is refused (FORBIDDEN_IDENTIFYING_FIELD), and a
// question carrying an SSN-shaped number is refused (SSN_IN_QUESTION). The
// facts are structured values only: the question is the one free-text field
// that crosses this wire, and the receiver stores nothing else free-text.
//
// Both intents carry the MLO as Home Scout resolved it ON ITS SERVER (agent
// slug + that agent's Rello Agent.id), an idempotency key, and the page the
// person used. They never carry a tenant: Rello takes the tenant from the
// ApiKey (a `tenantId` field here is dropped), and accepts the MLO only when
// that agent belongs to the key's tenant.
//
// Not `.strict()`: an unknown extra field is dropped, never a refusal. A bad
// OPTIONAL value is dropped too (no-gates rule): only identity, the question,
// the consent as captured and the routing fields can refuse a payload.
// ─────────────────────────────────────────────────────────────────────────────

export const HOME_SCOUT_REALTOR_PROSPECT_INTAKE_SIGNAL_TYPE =
  "home-scout.realtor_prospect.intake_received" as const;

export const HOME_SCOUT_REALTOR_INTAKE_INTENTS = ["updates_signup", "scenario_request"] as const;
export type HomeScoutRealtorIntakeIntent = (typeof HOME_SCOUT_REALTOR_INTAKE_INTENTS)[number];

export const HOME_SCOUT_REALTOR_WORK_FOCUSES = ["buyer", "listing", "both"] as const;
export type HomeScoutRealtorWorkFocus = (typeof HOME_SCOUT_REALTOR_WORK_FOCUSES)[number];

/** The named errors a refused payload carries as `issues[i].message`. */
export const HOME_SCOUT_REALTOR_INTAKE_ERRORS = {
  EMAIL_REQUIRED: "EMAIL_REQUIRED",
  EMAIL_INVALID: "EMAIL_INVALID",
  UNKNOWN_INTENT: "UNKNOWN_INTENT",
  FORBIDDEN_IDENTIFYING_FIELD: "FORBIDDEN_IDENTIFYING_FIELD",
  SSN_IN_QUESTION: "SSN_IN_QUESTION",
  QUESTION_REQUIRED: "QUESTION_REQUIRED",
  NAME_REQUIRED: "NAME_REQUIRED",
  CONSENT_REQUIRED: "CONSENT_REQUIRED",
  MLO_REQUIRED: "MLO_REQUIRED",
  IDEMPOTENCY_KEY_REQUIRED: "IDEMPOTENCY_KEY_REQUIRED",
  SOURCE_PAGE_REQUIRED: "SOURCE_PAGE_REQUIRED",
  SUBMITTED_AT_REQUIRED: "SUBMITTED_AT_REQUIRED",
} as const;
export type HomeScoutRealtorIntakeError =
  (typeof HOME_SCOUT_REALTOR_INTAKE_ERRORS)[keyof typeof HOME_SCOUT_REALTOR_INTAKE_ERRORS];

const E = HOME_SCOUT_REALTOR_INTAKE_ERRORS;

/**
 * Field names refused at any depth, compared lower-cased with every
 * non-alphanumeric removed (`client_first_name`, `clientFirstName` and
 * `Client-First-Name` are the same name).
 */
export const HOME_SCOUT_REALTOR_INTAKE_FORBIDDEN_FIELDS: readonly string[] = [
  "clientname", "clientfirstname", "clientlastname", "clientfullname",
  "borrowername", "borrowerfirstname", "borrowerlastname", "borrowerfullname",
  "buyername", "buyerfirstname", "buyerlastname", "buyerfullname",
  "ssn", "ssnlast4", "socialsecurity", "socialsecuritynumber", "taxid", "tin", "itin",
  "dob", "dateofbirth", "birthdate", "birthday",
  "accountnumber", "bankaccount", "bankaccountnumber", "routingnumber", "loannumber",
  "creditcardnumber", "cardnumber",
  "document", "documents", "attachment", "attachments", "file", "files", "upload", "uploads",
];
const FORBIDDEN = new Set(HOME_SCOUT_REALTOR_INTAKE_FORBIDDEN_FIELDS);

/** 3-2-4 digits (space, dash or dot between) or nine bare digits, not inside a longer number. */
const SSN_SHAPED = /(?<!\d)(?:\d{3}[-. ]\d{2}[-. ]\d{4}|\d{9})(?!\d)/;

function findForbiddenField(value: unknown, path: (string | number)[], depth: number): (string | number)[] | null {
  if (depth > 8 || value === null || typeof value !== "object") return null;
  const entries: [string | number, unknown][] = Array.isArray(value)
    ? value.map((v, i) => [i, v])
    : Object.entries(value as Record<string, unknown>);
  for (const [key, child] of entries) {
    if (typeof key === "string" && FORBIDDEN.has(key.toLowerCase().replace(/[^a-z0-9]/g, ""))) {
      return [...path, key];
    }
    const nested = findForbiddenField(child, [...path, key], depth + 1);
    if (nested) return nested;
  }
  return null;
}

const emailField = z
  .string({ error: (iss) => (iss.input === undefined ? E.EMAIL_REQUIRED : E.EMAIL_INVALID) })
  .trim()
  .email({ error: E.EMAIL_INVALID });

const isoInstant = (missing: string) =>
  z.string({ error: missing }).datetime({ offset: true, error: missing });

/** An optional value that is dropped, never refused, when it does not fit. */
const optionalOrDropped = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined);

const commonFields = {
  /** The MLO Home Scout resolved on its server from the page's agent slug. */
  mlo: z.object(
    {
      agentSlug: z.string({ error: E.MLO_REQUIRED }).trim().min(1, { error: E.MLO_REQUIRED }),
      /** That agent's Rello Agent.id; null when Home Scout holds none (Rello creates the prospect unassigned). */
      relloAgentId: z.string().min(1).nullable().catch(null),
    },
    { error: E.MLO_REQUIRED },
  ),
  /** Stable across every retry of one form submission, distinct per submission (≤ 64 chars). */
  idempotencyKey: z
    .string({ error: E.IDEMPOTENCY_KEY_REQUIRED })
    .min(1, { error: E.IDEMPOTENCY_KEY_REQUIRED })
    .max(64, { error: E.IDEMPOTENCY_KEY_REQUIRED }),
  /** The page the person used (URL or path). */
  sourcePage: z
    .string({ error: E.SOURCE_PAGE_REQUIRED })
    .min(1, { error: E.SOURCE_PAGE_REQUIRED })
    .max(2048, { error: E.SOURCE_PAGE_REQUIRED }),
  /** ISO-8601 instant the form was submitted. */
  submittedAt: isoInstant(E.SUBMITTED_AT_REQUIRED),
};

export const homeScoutRealtorUpdatesSignupSchema = z.object({
  intent: z.literal("updates_signup"),
  ...commonFields,
  firstName: z.string({ error: E.NAME_REQUIRED }).trim().min(1, { error: E.NAME_REQUIRED }),
  /** May be empty: the form may collect one name field. */
  lastName: z.string().trim().catch(""),
  email: emailField,
  brokerage: z.string().trim().min(1).nullable().optional().catch(null).transform((v) => v ?? null),
  markets: z.array(z.string().trim().min(1).max(120)).max(25).optional().catch(undefined).transform((v) => v ?? []),
  workFocus: z.enum(HOME_SCOUT_REALTOR_WORK_FOCUSES).nullable().optional().catch(null).transform((v) => v ?? null),
  topics: z.array(z.string().trim().min(1).max(80)).max(25).optional().catch(undefined).transform((v) => v ?? []),
  /** Optional; carried as entered. SMS consent is only usable with a phone. */
  phone: z.string().trim().min(1).max(40).nullable().optional().catch(null).transform((v) => v ?? null),
  /** The two consents EXACTLY as captured on the form. */
  consent: z.object(
    {
      /** The person asked for email updates. */
      emailUpdates: z.boolean({ error: E.CONSENT_REQUIRED }),
      /** Its own box, unchecked by default: false unless ticked. */
      sms: z.boolean().default(false),
      /** Version id of the consent wording the person saw. */
      textVersion: z.string({ error: E.CONSENT_REQUIRED }).trim().min(1, { error: E.CONSENT_REQUIRED }),
      /** ISO-8601 instant the boxes were captured. */
      capturedAt: isoInstant(E.CONSENT_REQUIRED),
    },
    { error: E.CONSENT_REQUIRED },
  ),
});

/** Non-identifying, structured facts only. Each one is dropped, never refused, when it does not fit. */
export const homeScoutRealtorScenarioFactsSchema = z.object({
  loanPurpose: optionalOrDropped(z.enum(["purchase", "refinance", "cash_out"])),
  purchasePrice: optionalOrDropped(z.number().finite().nonnegative()),
  loanAmount: optionalOrDropped(z.number().finite().nonnegative()),
  downPaymentPercent: optionalOrDropped(z.number().finite().min(0).max(100)),
  creditScoreBand: optionalOrDropped(
    z.enum(["760_plus", "720_759", "680_719", "640_679", "600_639", "below_600", "unknown"]),
  ),
  propertyType: optionalOrDropped(
    z.enum(["single_family", "condo", "townhome", "multi_unit", "manufactured", "other"]),
  ),
  occupancy: optionalOrDropped(z.enum(["primary", "second_home", "investment"])),
  firstTimeBuyer: optionalOrDropped(z.boolean()),
  veteran: optionalOrDropped(z.boolean()),
  sellerCreditOffered: optionalOrDropped(z.number().finite().nonnegative()),
  state: optionalOrDropped(z.string().regex(/^[A-Z]{2}$/)),
  zip: optionalOrDropped(z.string().regex(/^\d{5}$/)),
});
export type HomeScoutRealtorScenarioFacts = z.infer<typeof homeScoutRealtorScenarioFactsSchema>;

export const homeScoutRealtorScenarioRequestSchema = z.object({
  intent: z.literal("scenario_request"),
  ...commonFields,
  replyEmail: emailField,
  question: z
    .string({ error: E.QUESTION_REQUIRED })
    .trim()
    .min(1, { error: E.QUESTION_REQUIRED })
    .max(4000, { error: E.QUESTION_REQUIRED })
    .refine((q) => !SSN_SHAPED.test(q), { error: E.SSN_IN_QUESTION }),
  facts: homeScoutRealtorScenarioFactsSchema.nullable().optional().catch(null).transform((v) => v ?? null),
});

export const homeScoutRealtorProspectIntakeReceivedDataSchema = z
  .unknown()
  .superRefine((raw, ctx) => {
    const path = findForbiddenField(raw, [], 0);
    if (path) {
      ctx.addIssue({ code: "custom", message: E.FORBIDDEN_IDENTIFYING_FIELD, path });
    }
  })
  .pipe(
    z.discriminatedUnion("intent", [homeScoutRealtorUpdatesSignupSchema, homeScoutRealtorScenarioRequestSchema], {
      error: E.UNKNOWN_INTENT,
    }),
  );

export type HomeScoutRealtorProspectIntakeReceivedData = z.infer<
  typeof homeScoutRealtorProspectIntakeReceivedDataSchema
>;
export type HomeScoutRealtorUpdatesSignup = z.infer<typeof homeScoutRealtorUpdatesSignupSchema>;
export type HomeScoutRealtorScenarioRequest = z.infer<typeof homeScoutRealtorScenarioRequestSchema>;
