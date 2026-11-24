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
var TRACKING_HOT_PRICING_VISIT_SIGNAL_TYPE = "tracking.hot.pricing_visit";
var TRACKING_HOT_DEMO_CLICK_SIGNAL_TYPE = "tracking.hot.demo_click";
var TRACKING_HOT_REPEAT_VISITS_SIGNAL_TYPE = "tracking.hot.repeat_visits";
var TRACKING_HOT_TRIAL_INACTIVE_SIGNAL_TYPE = "tracking.hot.trial_inactive";
var TRACKING_HOT_SIGNAL_TYPES = [
  TRACKING_HOT_PRICING_VISIT_SIGNAL_TYPE,
  TRACKING_HOT_DEMO_CLICK_SIGNAL_TYPE,
  TRACKING_HOT_REPEAT_VISITS_SIGNAL_TYPE,
  TRACKING_HOT_TRIAL_INACTIVE_SIGNAL_TYPE
];
var TRACKING_HOT_CTA_IDS = ["demo", "book", "trial", "contact"];
var TRACKING_HOT_REPEAT_VISITS_MIN_SESSIONS = 3;
var hotAppSchema = z.string().max(64).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "a lowercase hyphenated app slug");
var hotPathSchema = z.string().min(1).max(512).regex(/^\/[^?#\s]*$/, "a pathname: no query, no fragment, no host");
var hotTopicSchema = z.string().max(256).regex(TRACKING_TOPIC_PATTERN, "a data-section style id, optionally <app>:<id>");
var hotAtSchema = z.string().datetime({ offset: true });
var hotLeadIdSchema = z.string().min(1).max(256);
var trackingHotPricingVisitDataSchema = z.object({
  leadId: hotLeadIdSchema,
  kind: z.literal("pricing_visit"),
  app: hotAppSchema,
  topic: hotTopicSchema.optional(),
  path: hotPathSchema.optional(),
  at: hotAtSchema
}).strict();
var trackingHotDemoClickDataSchema = z.object({
  leadId: hotLeadIdSchema,
  kind: z.literal("demo_click"),
  app: hotAppSchema,
  ctaId: z.enum(TRACKING_HOT_CTA_IDS),
  path: hotPathSchema.optional(),
  at: hotAtSchema
}).strict();
var trackingHotRepeatVisitsDataSchema = z.object({
  leadId: hotLeadIdSchema,
  kind: z.literal("repeat_visits"),
  app: hotAppSchema,
  sessionCount: z.number().int().min(TRACKING_HOT_REPEAT_VISITS_MIN_SESSIONS).max(1e4),
  at: hotAtSchema
}).strict();
var trackingHotTrialInactiveDataSchema = z.object({
  leadId: hotLeadIdSchema,
  kind: z.literal("trial_inactive"),
  app: hotAppSchema,
  at: hotAtSchema
}).strict();
var trackingHotSignalSchemas = {
  [TRACKING_HOT_PRICING_VISIT_SIGNAL_TYPE]: trackingHotPricingVisitDataSchema,
  [TRACKING_HOT_DEMO_CLICK_SIGNAL_TYPE]: trackingHotDemoClickDataSchema,
  [TRACKING_HOT_REPEAT_VISITS_SIGNAL_TYPE]: trackingHotRepeatVisitsDataSchema,
  [TRACKING_HOT_TRIAL_INACTIVE_SIGNAL_TYPE]: trackingHotTrialInactiveDataSchema
};
export {
  TRACKING_HOT_CTA_IDS,
  TRACKING_HOT_DEMO_CLICK_SIGNAL_TYPE,
  TRACKING_HOT_PRICING_VISIT_SIGNAL_TYPE,
  TRACKING_HOT_REPEAT_VISITS_MIN_SESSIONS,
  TRACKING_HOT_REPEAT_VISITS_SIGNAL_TYPE,
  TRACKING_HOT_SIGNAL_TYPES,
  TRACKING_HOT_TRIAL_INACTIVE_SIGNAL_TYPE,
  TRACKING_TOPIC_PATTERN,
  TRACKING_VISIT_SUMMARY_MAX_BYTES,
  TRACKING_VISIT_SUMMARY_MAX_TOPICS,
  TRACKING_VISIT_SUMMARY_SIGNAL_TYPE,
  trackingHotDemoClickDataSchema,
  trackingHotPricingVisitDataSchema,
  trackingHotRepeatVisitsDataSchema,
  trackingHotSignalSchemas,
  trackingHotTrialInactiveDataSchema,
  trackingVisitSummaryDataSchema
};
//# sourceMappingURL=tracking.js.map