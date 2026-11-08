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
declare const hsTourStopRatedDataSchema: z.ZodObject<{
    tourId: z.ZodString;
    stopId: z.ZodString;
    leadId: z.ZodString;
    rating: z.ZodNumber;
    hasNotes: z.ZodBoolean;
}, z.core.$strip>;
type HsTourStopRatedData = z.infer<typeof hsTourStopRatedDataSchema>;
declare const hsPfpIntakeDeadDataSchema: z.ZodObject<{
    failedPfpIntakeId: z.ZodString;
    sendIdempotencyKey: z.ZodString;
    tenantId: z.ZodNullable<z.ZodString>;
    lastHttpStatus: z.ZodNullable<z.ZodNumber>;
    lastError: z.ZodString;
    attempt: z.ZodNumber;
}, z.core.$strict>;
type HsPfpIntakeDeadData = z.infer<typeof hsPfpIntakeDeadDataSchema>;
declare const HOME_SCOUT_REALTOR_PROSPECT_INTAKE_SIGNAL_TYPE: "home-scout.realtor_prospect.intake_received";
declare const HOME_SCOUT_REALTOR_INTAKE_INTENTS: readonly ["updates_signup", "scenario_request"];
type HomeScoutRealtorIntakeIntent = (typeof HOME_SCOUT_REALTOR_INTAKE_INTENTS)[number];
declare const HOME_SCOUT_REALTOR_WORK_FOCUSES: readonly ["buyer", "listing", "both"];
type HomeScoutRealtorWorkFocus = (typeof HOME_SCOUT_REALTOR_WORK_FOCUSES)[number];
/** The named errors a refused payload carries as `issues[i].message`. */
declare const HOME_SCOUT_REALTOR_INTAKE_ERRORS: {
    readonly EMAIL_REQUIRED: "EMAIL_REQUIRED";
    readonly EMAIL_INVALID: "EMAIL_INVALID";
    readonly UNKNOWN_INTENT: "UNKNOWN_INTENT";
    readonly FORBIDDEN_IDENTIFYING_FIELD: "FORBIDDEN_IDENTIFYING_FIELD";
    readonly SSN_IN_QUESTION: "SSN_IN_QUESTION";
    readonly QUESTION_REQUIRED: "QUESTION_REQUIRED";
    readonly NAME_REQUIRED: "NAME_REQUIRED";
    readonly CONSENT_REQUIRED: "CONSENT_REQUIRED";
    readonly MLO_REQUIRED: "MLO_REQUIRED";
    readonly IDEMPOTENCY_KEY_REQUIRED: "IDEMPOTENCY_KEY_REQUIRED";
    readonly SOURCE_PAGE_REQUIRED: "SOURCE_PAGE_REQUIRED";
    readonly SUBMITTED_AT_REQUIRED: "SUBMITTED_AT_REQUIRED";
};
type HomeScoutRealtorIntakeError = (typeof HOME_SCOUT_REALTOR_INTAKE_ERRORS)[keyof typeof HOME_SCOUT_REALTOR_INTAKE_ERRORS];
/**
 * Field names refused at any depth, compared lower-cased with every
 * non-alphanumeric removed (`client_first_name`, `clientFirstName` and
 * `Client-First-Name` are the same name).
 */
declare const HOME_SCOUT_REALTOR_INTAKE_FORBIDDEN_FIELDS: readonly string[];
declare const homeScoutRealtorUpdatesSignupSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodCatch<z.ZodString>;
    email: z.ZodString;
    brokerage: z.ZodPipe<z.ZodCatch<z.ZodOptional<z.ZodNullable<z.ZodString>>>, z.ZodTransform<string | null, string | null | undefined>>;
    markets: z.ZodPipe<z.ZodCatch<z.ZodOptional<z.ZodArray<z.ZodString>>>, z.ZodTransform<string[], string[] | undefined>>;
    workFocus: z.ZodPipe<z.ZodCatch<z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        buyer: "buyer";
        listing: "listing";
        both: "both";
    }>>>>, z.ZodTransform<"buyer" | "listing" | "both" | null, "buyer" | "listing" | "both" | null | undefined>>;
    topics: z.ZodPipe<z.ZodCatch<z.ZodOptional<z.ZodArray<z.ZodString>>>, z.ZodTransform<string[], string[] | undefined>>;
    phone: z.ZodPipe<z.ZodCatch<z.ZodOptional<z.ZodNullable<z.ZodString>>>, z.ZodTransform<string | null, string | null | undefined>>;
    consent: z.ZodObject<{
        emailUpdates: z.ZodBoolean;
        sms: z.ZodDefault<z.ZodBoolean>;
        textVersion: z.ZodString;
        capturedAt: z.ZodString;
    }, z.core.$strip>;
    mlo: z.ZodObject<{
        agentSlug: z.ZodString;
        relloAgentId: z.ZodCatch<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
    idempotencyKey: z.ZodString;
    sourcePage: z.ZodString;
    submittedAt: z.ZodString;
    intent: z.ZodLiteral<"updates_signup">;
}, z.core.$strip>;
/** Non-identifying, structured facts only. Each one is dropped, never refused, when it does not fit. */
declare const homeScoutRealtorScenarioFactsSchema: z.ZodObject<{
    loanPurpose: z.ZodCatch<z.ZodOptional<z.ZodEnum<{
        purchase: "purchase";
        refinance: "refinance";
        cash_out: "cash_out";
    }>>>;
    purchasePrice: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
    loanAmount: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
    downPaymentPercent: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
    creditScoreBand: z.ZodCatch<z.ZodOptional<z.ZodEnum<{
        unknown: "unknown";
        "760_plus": "760_plus";
        "720_759": "720_759";
        "680_719": "680_719";
        "640_679": "640_679";
        "600_639": "600_639";
        below_600: "below_600";
    }>>>;
    propertyType: z.ZodCatch<z.ZodOptional<z.ZodEnum<{
        single_family: "single_family";
        condo: "condo";
        townhome: "townhome";
        multi_unit: "multi_unit";
        manufactured: "manufactured";
        other: "other";
    }>>>;
    occupancy: z.ZodCatch<z.ZodOptional<z.ZodEnum<{
        primary: "primary";
        second_home: "second_home";
        investment: "investment";
    }>>>;
    firstTimeBuyer: z.ZodCatch<z.ZodOptional<z.ZodBoolean>>;
    veteran: z.ZodCatch<z.ZodOptional<z.ZodBoolean>>;
    sellerCreditOffered: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
    state: z.ZodCatch<z.ZodOptional<z.ZodString>>;
    zip: z.ZodCatch<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
type HomeScoutRealtorScenarioFacts = z.infer<typeof homeScoutRealtorScenarioFactsSchema>;
declare const homeScoutRealtorScenarioRequestSchema: z.ZodObject<{
    replyEmail: z.ZodString;
    question: z.ZodString;
    facts: z.ZodPipe<z.ZodCatch<z.ZodOptional<z.ZodNullable<z.ZodObject<{
        loanPurpose: z.ZodCatch<z.ZodOptional<z.ZodEnum<{
            purchase: "purchase";
            refinance: "refinance";
            cash_out: "cash_out";
        }>>>;
        purchasePrice: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
        loanAmount: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
        downPaymentPercent: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
        creditScoreBand: z.ZodCatch<z.ZodOptional<z.ZodEnum<{
            unknown: "unknown";
            "760_plus": "760_plus";
            "720_759": "720_759";
            "680_719": "680_719";
            "640_679": "640_679";
            "600_639": "600_639";
            below_600: "below_600";
        }>>>;
        propertyType: z.ZodCatch<z.ZodOptional<z.ZodEnum<{
            single_family: "single_family";
            condo: "condo";
            townhome: "townhome";
            multi_unit: "multi_unit";
            manufactured: "manufactured";
            other: "other";
        }>>>;
        occupancy: z.ZodCatch<z.ZodOptional<z.ZodEnum<{
            primary: "primary";
            second_home: "second_home";
            investment: "investment";
        }>>>;
        firstTimeBuyer: z.ZodCatch<z.ZodOptional<z.ZodBoolean>>;
        veteran: z.ZodCatch<z.ZodOptional<z.ZodBoolean>>;
        sellerCreditOffered: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
        state: z.ZodCatch<z.ZodOptional<z.ZodString>>;
        zip: z.ZodCatch<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>>>, z.ZodTransform<{
        loanPurpose?: "purchase" | "refinance" | "cash_out" | undefined;
        purchasePrice?: number | undefined;
        loanAmount?: number | undefined;
        downPaymentPercent?: number | undefined;
        creditScoreBand?: "unknown" | "760_plus" | "720_759" | "680_719" | "640_679" | "600_639" | "below_600" | undefined;
        propertyType?: "single_family" | "condo" | "townhome" | "multi_unit" | "manufactured" | "other" | undefined;
        occupancy?: "primary" | "second_home" | "investment" | undefined;
        firstTimeBuyer?: boolean | undefined;
        veteran?: boolean | undefined;
        sellerCreditOffered?: number | undefined;
        state?: string | undefined;
        zip?: string | undefined;
    } | null, {
        loanPurpose?: "purchase" | "refinance" | "cash_out" | undefined;
        purchasePrice?: number | undefined;
        loanAmount?: number | undefined;
        downPaymentPercent?: number | undefined;
        creditScoreBand?: "unknown" | "760_plus" | "720_759" | "680_719" | "640_679" | "600_639" | "below_600" | undefined;
        propertyType?: "single_family" | "condo" | "townhome" | "multi_unit" | "manufactured" | "other" | undefined;
        occupancy?: "primary" | "second_home" | "investment" | undefined;
        firstTimeBuyer?: boolean | undefined;
        veteran?: boolean | undefined;
        sellerCreditOffered?: number | undefined;
        state?: string | undefined;
        zip?: string | undefined;
    } | null | undefined>>;
    mlo: z.ZodObject<{
        agentSlug: z.ZodString;
        relloAgentId: z.ZodCatch<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
    idempotencyKey: z.ZodString;
    sourcePage: z.ZodString;
    submittedAt: z.ZodString;
    intent: z.ZodLiteral<"scenario_request">;
}, z.core.$strip>;
declare const homeScoutRealtorProspectIntakeReceivedDataSchema: z.ZodPipe<z.ZodUnknown, z.ZodDiscriminatedUnion<[z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodCatch<z.ZodString>;
    email: z.ZodString;
    brokerage: z.ZodPipe<z.ZodCatch<z.ZodOptional<z.ZodNullable<z.ZodString>>>, z.ZodTransform<string | null, string | null | undefined>>;
    markets: z.ZodPipe<z.ZodCatch<z.ZodOptional<z.ZodArray<z.ZodString>>>, z.ZodTransform<string[], string[] | undefined>>;
    workFocus: z.ZodPipe<z.ZodCatch<z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        buyer: "buyer";
        listing: "listing";
        both: "both";
    }>>>>, z.ZodTransform<"buyer" | "listing" | "both" | null, "buyer" | "listing" | "both" | null | undefined>>;
    topics: z.ZodPipe<z.ZodCatch<z.ZodOptional<z.ZodArray<z.ZodString>>>, z.ZodTransform<string[], string[] | undefined>>;
    phone: z.ZodPipe<z.ZodCatch<z.ZodOptional<z.ZodNullable<z.ZodString>>>, z.ZodTransform<string | null, string | null | undefined>>;
    consent: z.ZodObject<{
        emailUpdates: z.ZodBoolean;
        sms: z.ZodDefault<z.ZodBoolean>;
        textVersion: z.ZodString;
        capturedAt: z.ZodString;
    }, z.core.$strip>;
    mlo: z.ZodObject<{
        agentSlug: z.ZodString;
        relloAgentId: z.ZodCatch<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
    idempotencyKey: z.ZodString;
    sourcePage: z.ZodString;
    submittedAt: z.ZodString;
    intent: z.ZodLiteral<"updates_signup">;
}, z.core.$strip>, z.ZodObject<{
    replyEmail: z.ZodString;
    question: z.ZodString;
    facts: z.ZodPipe<z.ZodCatch<z.ZodOptional<z.ZodNullable<z.ZodObject<{
        loanPurpose: z.ZodCatch<z.ZodOptional<z.ZodEnum<{
            purchase: "purchase";
            refinance: "refinance";
            cash_out: "cash_out";
        }>>>;
        purchasePrice: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
        loanAmount: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
        downPaymentPercent: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
        creditScoreBand: z.ZodCatch<z.ZodOptional<z.ZodEnum<{
            unknown: "unknown";
            "760_plus": "760_plus";
            "720_759": "720_759";
            "680_719": "680_719";
            "640_679": "640_679";
            "600_639": "600_639";
            below_600: "below_600";
        }>>>;
        propertyType: z.ZodCatch<z.ZodOptional<z.ZodEnum<{
            single_family: "single_family";
            condo: "condo";
            townhome: "townhome";
            multi_unit: "multi_unit";
            manufactured: "manufactured";
            other: "other";
        }>>>;
        occupancy: z.ZodCatch<z.ZodOptional<z.ZodEnum<{
            primary: "primary";
            second_home: "second_home";
            investment: "investment";
        }>>>;
        firstTimeBuyer: z.ZodCatch<z.ZodOptional<z.ZodBoolean>>;
        veteran: z.ZodCatch<z.ZodOptional<z.ZodBoolean>>;
        sellerCreditOffered: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
        state: z.ZodCatch<z.ZodOptional<z.ZodString>>;
        zip: z.ZodCatch<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>>>, z.ZodTransform<{
        loanPurpose?: "purchase" | "refinance" | "cash_out" | undefined;
        purchasePrice?: number | undefined;
        loanAmount?: number | undefined;
        downPaymentPercent?: number | undefined;
        creditScoreBand?: "unknown" | "760_plus" | "720_759" | "680_719" | "640_679" | "600_639" | "below_600" | undefined;
        propertyType?: "single_family" | "condo" | "townhome" | "multi_unit" | "manufactured" | "other" | undefined;
        occupancy?: "primary" | "second_home" | "investment" | undefined;
        firstTimeBuyer?: boolean | undefined;
        veteran?: boolean | undefined;
        sellerCreditOffered?: number | undefined;
        state?: string | undefined;
        zip?: string | undefined;
    } | null, {
        loanPurpose?: "purchase" | "refinance" | "cash_out" | undefined;
        purchasePrice?: number | undefined;
        loanAmount?: number | undefined;
        downPaymentPercent?: number | undefined;
        creditScoreBand?: "unknown" | "760_plus" | "720_759" | "680_719" | "640_679" | "600_639" | "below_600" | undefined;
        propertyType?: "single_family" | "condo" | "townhome" | "multi_unit" | "manufactured" | "other" | undefined;
        occupancy?: "primary" | "second_home" | "investment" | undefined;
        firstTimeBuyer?: boolean | undefined;
        veteran?: boolean | undefined;
        sellerCreditOffered?: number | undefined;
        state?: string | undefined;
        zip?: string | undefined;
    } | null | undefined>>;
    mlo: z.ZodObject<{
        agentSlug: z.ZodString;
        relloAgentId: z.ZodCatch<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
    idempotencyKey: z.ZodString;
    sourcePage: z.ZodString;
    submittedAt: z.ZodString;
    intent: z.ZodLiteral<"scenario_request">;
}, z.core.$strip>], "intent">>;
type HomeScoutRealtorProspectIntakeReceivedData = z.infer<typeof homeScoutRealtorProspectIntakeReceivedDataSchema>;
type HomeScoutRealtorUpdatesSignup = z.infer<typeof homeScoutRealtorUpdatesSignupSchema>;
type HomeScoutRealtorScenarioRequest = z.infer<typeof homeScoutRealtorScenarioRequestSchema>;

export { HOME_SCOUT_REALTOR_INTAKE_ERRORS, HOME_SCOUT_REALTOR_INTAKE_FORBIDDEN_FIELDS, HOME_SCOUT_REALTOR_INTAKE_INTENTS, HOME_SCOUT_REALTOR_PROSPECT_INTAKE_SIGNAL_TYPE, HOME_SCOUT_REALTOR_WORK_FOCUSES, type HomeScoutRealtorIntakeError, type HomeScoutRealtorIntakeIntent, type HomeScoutRealtorProspectIntakeReceivedData, type HomeScoutRealtorScenarioFacts, type HomeScoutRealtorScenarioRequest, type HomeScoutRealtorUpdatesSignup, type HomeScoutRealtorWorkFocus, type HsLeadMagnetSubmittedData, type HsPfpIntakeDeadData, type HsTourStopRatedData, homeScoutRealtorProspectIntakeReceivedDataSchema, homeScoutRealtorScenarioFactsSchema, homeScoutRealtorScenarioRequestSchema, homeScoutRealtorUpdatesSignupSchema, hsLeadMagnetSubmittedDataSchema, hsPfpIntakeDeadDataSchema, hsTourStopRatedDataSchema };
