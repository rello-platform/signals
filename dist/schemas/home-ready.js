// src/schemas/home-ready.ts
import { z } from "zod";
var homeReadyIntentTargetCrossedDataSchema = z.object({
  leadId: z.string(),
  score: z.number(),
  previousScore: z.number(),
  threshold: z.number()
});
export {
  homeReadyIntentTargetCrossedDataSchema
};
//# sourceMappingURL=home-ready.js.map