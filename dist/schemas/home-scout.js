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
export {
  hsLeadMagnetSubmittedDataSchema
};
//# sourceMappingURL=home-scout.js.map