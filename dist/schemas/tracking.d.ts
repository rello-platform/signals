import { z } from 'zod';

declare const TRACKING_VISIT_SUMMARY_SIGNAL_TYPE: "tracking.visit_summary";
/** The plan's cap on topics per summary (§6 Rev 4). */
declare const TRACKING_VISIT_SUMMARY_MAX_TOPICS = 5;
/** The plan's cap on the whole serialized payload (§6 Rev 4: "the S1 schema caps the payload at 2 KB"). */
declare const TRACKING_VISIT_SUMMARY_MAX_BYTES = 2048;
/**
 * A topic is `<app>:<featureId>` (marketing sites, plan §6) or a bare page type
 * (`pricing`, `compare`). Each part is a `data-section`-style id. Lowercase, no
 * spaces, no slash, no `?`, so a raw path or query string cannot ride in a topic.
 */
declare const TRACKING_TOPIC_PATTERN: RegExp;
declare const trackingVisitSummaryDataSchema: z.ZodObject<{
    visitId: z.ZodString;
    startedAt: z.ZodString;
    endedAt: z.ZodString;
    pageViews: z.ZodNumber;
    topics: z.ZodArray<z.ZodObject<{
        topic: z.ZodString;
        score: z.ZodNumber;
    }, z.core.$strict>>;
    topicsComputedAt: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
type TrackingVisitSummaryData = z.infer<typeof trackingVisitSummaryDataSchema>;

export { TRACKING_TOPIC_PATTERN, TRACKING_VISIT_SUMMARY_MAX_BYTES, TRACKING_VISIT_SUMMARY_MAX_TOPICS, TRACKING_VISIT_SUMMARY_SIGNAL_TYPE, type TrackingVisitSummaryData, trackingVisitSummaryDataSchema };
