import { z } from 'zod';

/**
 * HomeReady-emitted signal payload schemas.
 *
 * Each schema is keyed by the emitting app (HomeReady, the canonical
 * home-readiness coaching app per APP-OWNERSHIP-MATRIX). Sender side validates
 * before emit; the Rello `/api/signals/batch` receiver validates per signalType.
 */
/**
 * `home-ready.intent_target_crossed` — emitted when the borrower's
 * home-readiness metric crosses the "ready" threshold UPWARD (move-up-buy
 * intent). Live emitter: HomeReady @ b0e4269 (source: home-ready, priority
 * HIGH). Consumed Rello-side by the today-intent classifier
 * (`src/lib/daily-plan/lead-today-intent-classifier.ts` → "MOVE_UP_BUY").
 *
 * `score` is the new (post-cross) readiness metric; `previousScore` the prior
 * value; `threshold` the "ready" boundary that was crossed. All four fields are
 * required (the cross is meaningless without the before/after pair + boundary).
 */
declare const homeReadyIntentTargetCrossedDataSchema: z.ZodObject<{
    leadId: z.ZodString;
    score: z.ZodNumber;
    previousScore: z.ZodNumber;
    threshold: z.ZodNumber;
}, z.core.$strip>;
type HomeReadyIntentTargetCrossedData = z.infer<typeof homeReadyIntentTargetCrossedDataSchema>;

export { type HomeReadyIntentTargetCrossedData, homeReadyIntentTargetCrossedDataSchema };
