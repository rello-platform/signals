import { z } from 'zod';

declare const MARKET_INTEL_REALTOR_PROSPECT_INTAKE_SIGNAL_TYPE: "market-intel.realtor_prospect.intake_received";
/** Which MI path produced the signup (R-2). */
declare const MARKET_INTEL_INTAKE_ACTIONS: readonly ["public_signup", "resubscribe", "access_request", "admin_invite"];
type MarketIntelIntakeAction = (typeof MARKET_INTEL_INTAKE_ACTIONS)[number];
/** The source-accurate consent fact at the time of the event (MII-06). */
declare const MARKET_INTEL_CONSENT_BASES: readonly ["form_submitted", "admin_invited", "access_requested"];
type MarketIntelConsentBasis = (typeof MARKET_INTEL_CONSENT_BASES)[number];
declare const marketIntelRealtorProspectIntakeReceivedDataSchema: z.ZodObject<{
    subscriberId: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    brokerage: z.ZodNullable<z.ZodString>;
    publicationId: z.ZodNullable<z.ZodString>;
    publicationName: z.ZodNullable<z.ZodString>;
    intakeAction: z.ZodEnum<{
        public_signup: "public_signup";
        resubscribe: "resubscribe";
        access_request: "access_request";
        admin_invite: "admin_invite";
    }>;
    consentBasis: z.ZodEnum<{
        form_submitted: "form_submitted";
        admin_invited: "admin_invited";
        access_requested: "access_requested";
    }>;
    submittedAt: z.ZodString;
    assignedMloAgentId: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
type MarketIntelRealtorProspectIntakeReceivedData = z.infer<typeof marketIntelRealtorProspectIntakeReceivedDataSchema>;
/**
 * Every `results[i].outcome` Rello returns for a realtor-prospect intake
 * signal (either source). `created` and `repeat` carry `realtorProspectId` and
 * are delivered; a replay of the same `(tenantId, idempotencyKey)` returns
 * `repeat` with the SAME id and writes nothing. `rejected` wrote nothing and
 * carries a `reason`; it is NOT delivered. An HTTP 5xx / 503 means "retry the
 * batch".
 */
declare const REALTOR_PROSPECT_INTAKE_OUTCOMES: readonly ["created", "repeat", "rejected"];
type RealtorProspectIntakeOutcome = (typeof REALTOR_PROSPECT_INTAKE_OUTCOMES)[number];

export { MARKET_INTEL_CONSENT_BASES, MARKET_INTEL_INTAKE_ACTIONS, MARKET_INTEL_REALTOR_PROSPECT_INTAKE_SIGNAL_TYPE, type MarketIntelConsentBasis, type MarketIntelIntakeAction, type MarketIntelRealtorProspectIntakeReceivedData, REALTOR_PROSPECT_INTAKE_OUTCOMES, type RealtorProspectIntakeOutcome, marketIntelRealtorProspectIntakeReceivedDataSchema };
