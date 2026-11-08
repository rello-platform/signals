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
var HOME_SCOUT_REALTOR_PROSPECT_INTAKE_SIGNAL_TYPE = "home-scout.realtor_prospect.intake_received";
var HOME_SCOUT_REALTOR_INTAKE_INTENTS = ["updates_signup", "scenario_request"];
var HOME_SCOUT_REALTOR_WORK_FOCUSES = ["buyer", "listing", "both"];
var HOME_SCOUT_REALTOR_INTAKE_ERRORS = {
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
  SUBMITTED_AT_REQUIRED: "SUBMITTED_AT_REQUIRED"
};
var E = HOME_SCOUT_REALTOR_INTAKE_ERRORS;
var HOME_SCOUT_REALTOR_INTAKE_FORBIDDEN_FIELDS = [
  "clientname",
  "clientfirstname",
  "clientlastname",
  "clientfullname",
  "borrowername",
  "borrowerfirstname",
  "borrowerlastname",
  "borrowerfullname",
  "buyername",
  "buyerfirstname",
  "buyerlastname",
  "buyerfullname",
  "ssn",
  "ssnlast4",
  "socialsecurity",
  "socialsecuritynumber",
  "taxid",
  "tin",
  "itin",
  "dob",
  "dateofbirth",
  "birthdate",
  "birthday",
  "accountnumber",
  "bankaccount",
  "bankaccountnumber",
  "routingnumber",
  "loannumber",
  "creditcardnumber",
  "cardnumber",
  "document",
  "documents",
  "attachment",
  "attachments",
  "file",
  "files",
  "upload",
  "uploads"
];
var FORBIDDEN = new Set(HOME_SCOUT_REALTOR_INTAKE_FORBIDDEN_FIELDS);
var SSN_SHAPED = /(?<!\d)(?:\d{3}[-. ]\d{2}[-. ]\d{4}|\d{9})(?!\d)/;
function findForbiddenField(value, path, depth) {
  if (depth > 8 || value === null || typeof value !== "object") return null;
  const entries = Array.isArray(value) ? value.map((v, i) => [i, v]) : Object.entries(value);
  for (const [key, child] of entries) {
    if (typeof key === "string" && FORBIDDEN.has(key.toLowerCase().replace(/[^a-z0-9]/g, ""))) {
      return [...path, key];
    }
    const nested = findForbiddenField(child, [...path, key], depth + 1);
    if (nested) return nested;
  }
  return null;
}
var emailField = z.string({ error: (iss) => iss.input === void 0 ? E.EMAIL_REQUIRED : E.EMAIL_INVALID }).trim().email({ error: E.EMAIL_INVALID });
var isoInstant = (missing) => z.string({ error: missing }).datetime({ offset: true, error: missing });
var optionalOrDropped = (schema) => schema.optional().catch(void 0);
var commonFields = {
  /** The MLO Home Scout resolved on its server from the page's agent slug. */
  mlo: z.object(
    {
      agentSlug: z.string({ error: E.MLO_REQUIRED }).trim().min(1, { error: E.MLO_REQUIRED }),
      /** That agent's Rello Agent.id; null when Home Scout holds none (Rello creates the prospect unassigned). */
      relloAgentId: z.string().min(1).nullable().catch(null)
    },
    { error: E.MLO_REQUIRED }
  ),
  /** Stable across every retry of one form submission, distinct per submission (≤ 64 chars). */
  idempotencyKey: z.string({ error: E.IDEMPOTENCY_KEY_REQUIRED }).min(1, { error: E.IDEMPOTENCY_KEY_REQUIRED }).max(64, { error: E.IDEMPOTENCY_KEY_REQUIRED }),
  /** The page the person used (URL or path). */
  sourcePage: z.string({ error: E.SOURCE_PAGE_REQUIRED }).min(1, { error: E.SOURCE_PAGE_REQUIRED }).max(2048, { error: E.SOURCE_PAGE_REQUIRED }),
  /** ISO-8601 instant the form was submitted. */
  submittedAt: isoInstant(E.SUBMITTED_AT_REQUIRED)
};
var homeScoutRealtorUpdatesSignupSchema = z.object({
  intent: z.literal("updates_signup"),
  ...commonFields,
  firstName: z.string({ error: E.NAME_REQUIRED }).trim().min(1, { error: E.NAME_REQUIRED }),
  /** May be empty: the form may collect one name field. */
  lastName: z.string().trim().catch(""),
  email: emailField,
  brokerage: z.string().trim().min(1).nullable().optional().catch(null).transform((v) => v ?? null),
  markets: z.array(z.string().trim().min(1).max(120)).max(25).optional().catch(void 0).transform((v) => v ?? []),
  workFocus: z.enum(HOME_SCOUT_REALTOR_WORK_FOCUSES).nullable().optional().catch(null).transform((v) => v ?? null),
  topics: z.array(z.string().trim().min(1).max(80)).max(25).optional().catch(void 0).transform((v) => v ?? []),
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
      capturedAt: isoInstant(E.CONSENT_REQUIRED)
    },
    { error: E.CONSENT_REQUIRED }
  )
});
var homeScoutRealtorScenarioFactsSchema = z.object({
  loanPurpose: optionalOrDropped(z.enum(["purchase", "refinance", "cash_out"])),
  purchasePrice: optionalOrDropped(z.number().finite().nonnegative()),
  loanAmount: optionalOrDropped(z.number().finite().nonnegative()),
  downPaymentPercent: optionalOrDropped(z.number().finite().min(0).max(100)),
  creditScoreBand: optionalOrDropped(
    z.enum(["760_plus", "720_759", "680_719", "640_679", "600_639", "below_600", "unknown"])
  ),
  propertyType: optionalOrDropped(
    z.enum(["single_family", "condo", "townhome", "multi_unit", "manufactured", "other"])
  ),
  occupancy: optionalOrDropped(z.enum(["primary", "second_home", "investment"])),
  firstTimeBuyer: optionalOrDropped(z.boolean()),
  veteran: optionalOrDropped(z.boolean()),
  sellerCreditOffered: optionalOrDropped(z.number().finite().nonnegative()),
  state: optionalOrDropped(z.string().regex(/^[A-Z]{2}$/)),
  zip: optionalOrDropped(z.string().regex(/^\d{5}$/))
});
var homeScoutRealtorScenarioRequestSchema = z.object({
  intent: z.literal("scenario_request"),
  ...commonFields,
  replyEmail: emailField,
  question: z.string({ error: E.QUESTION_REQUIRED }).trim().min(1, { error: E.QUESTION_REQUIRED }).max(4e3, { error: E.QUESTION_REQUIRED }).refine((q) => !SSN_SHAPED.test(q), { error: E.SSN_IN_QUESTION }),
  facts: homeScoutRealtorScenarioFactsSchema.nullable().optional().catch(null).transform((v) => v ?? null)
});
var homeScoutRealtorProspectIntakeReceivedDataSchema = z.unknown().superRefine((raw, ctx) => {
  const path = findForbiddenField(raw, [], 0);
  if (path) {
    ctx.addIssue({ code: "custom", message: E.FORBIDDEN_IDENTIFYING_FIELD, path });
  }
}).pipe(
  z.discriminatedUnion("intent", [homeScoutRealtorUpdatesSignupSchema, homeScoutRealtorScenarioRequestSchema], {
    error: E.UNKNOWN_INTENT
  })
);
export {
  HOME_SCOUT_REALTOR_INTAKE_ERRORS,
  HOME_SCOUT_REALTOR_INTAKE_FORBIDDEN_FIELDS,
  HOME_SCOUT_REALTOR_INTAKE_INTENTS,
  HOME_SCOUT_REALTOR_PROSPECT_INTAKE_SIGNAL_TYPE,
  HOME_SCOUT_REALTOR_WORK_FOCUSES,
  homeScoutRealtorProspectIntakeReceivedDataSchema,
  homeScoutRealtorScenarioFactsSchema,
  homeScoutRealtorScenarioRequestSchema,
  homeScoutRealtorUpdatesSignupSchema,
  hsLeadMagnetSubmittedDataSchema,
  hsPfpIntakeDeadDataSchema,
  hsTourStopRatedDataSchema
};
//# sourceMappingURL=home-scout.js.map