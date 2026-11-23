// src/schemas/tracking.ts
import { z } from "zod";
var TRACKING_VISIT_SUMMARY_SIGNAL_TYPE = "tracking.visit_summary";
var TRACKING_VISIT_SUMMARY_MAX_TOPICS = 5;
var TRACKING_VISIT_SUMMARY_MAX_BYTES = 2048;
var TRACKING_TOPIC_PATTERN = /^[a-z0-9][a-z0-9_-]*(:[a-z0-9][a-z0-9_-]*)?$/;
var trackingTopicSchema = z.object({
  topic: z.string().max(256).regex(TRACKING_TOPIC_PATTERN, "a data-section style id, optionally <app>:<id>"),
  /** The person's interest score in this topic. Zero is a real score. */
  score: z.number().finite().min(0)
}).strict();
var trackingVisitSummaryDataSchema = z.object({
  /** The engine's visit id. Opaque; the idempotency key is derived from it. */
  visitId: z.string().min(1).max(512),
  /** ISO-8601 instant of the visit's first event. */
  startedAt: z.string().datetime({ offset: true }),
  /** ISO-8601 instant of the visit's last event. */
  endedAt: z.string().datetime({ offset: true }),
  /** Page views in the visit. */
  pageViews: z.number().int().min(0),
  /** The person's current top topics, highest first. `[]` when the person has none. */
  topics: z.array(trackingTopicSchema).max(TRACKING_VISIT_SUMMARY_MAX_TOPICS),
  /** When `topics` was computed (ISO-8601). `null` when `topics` is empty. */
  topicsComputedAt: z.string().datetime({ offset: true }).nullable()
}).strict().superRefine((d, ctx) => {
  const size = new TextEncoder().encode(JSON.stringify(d)).length;
  if (size > TRACKING_VISIT_SUMMARY_MAX_BYTES) {
    ctx.addIssue({
      code: "custom",
      message: `payload is ${size} bytes; the cap is ${TRACKING_VISIT_SUMMARY_MAX_BYTES} bytes (2 KB)`
    });
  }
});
export {
  TRACKING_TOPIC_PATTERN,
  TRACKING_VISIT_SUMMARY_MAX_BYTES,
  TRACKING_VISIT_SUMMARY_MAX_TOPICS,
  TRACKING_VISIT_SUMMARY_SIGNAL_TYPE,
  trackingVisitSummaryDataSchema
};
//# sourceMappingURL=tracking.js.map