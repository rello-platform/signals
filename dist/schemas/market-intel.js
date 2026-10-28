// src/schemas/market-intel.ts
import { z } from "zod";
var MARKET_INTEL_REALTOR_PROSPECT_INTAKE_SIGNAL_TYPE = "market-intel.realtor_prospect.intake_received";
var MARKET_INTEL_INTAKE_ACTIONS = [
  "public_signup",
  "resubscribe",
  "access_request",
  "admin_invite"
];
var MARKET_INTEL_CONSENT_BASES = [
  "form_submitted",
  "admin_invited",
  "access_requested"
];
var marketIntelRealtorProspectIntakeReceivedDataSchema = z.object({
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
  assignedMloAgentId: z.string().min(1).nullable()
});
var REALTOR_PROSPECT_INTAKE_OUTCOMES = ["created", "repeat", "rejected"];
export {
  MARKET_INTEL_CONSENT_BASES,
  MARKET_INTEL_INTAKE_ACTIONS,
  MARKET_INTEL_REALTOR_PROSPECT_INTAKE_SIGNAL_TYPE,
  REALTOR_PROSPECT_INTAKE_OUTCOMES,
  marketIntelRealtorProspectIntakeReceivedDataSchema
};
//# sourceMappingURL=market-intel.js.map