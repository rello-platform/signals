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
declare const TRACKING_HOT_PRICING_VISIT_SIGNAL_TYPE: "tracking.hot.pricing_visit";
declare const TRACKING_HOT_DEMO_CLICK_SIGNAL_TYPE: "tracking.hot.demo_click";
declare const TRACKING_HOT_REPEAT_VISITS_SIGNAL_TYPE: "tracking.hot.repeat_visits";
declare const TRACKING_HOT_TRIAL_INACTIVE_SIGNAL_TYPE: "tracking.hot.trial_inactive";
/** The four hot-moment signal types, in plan §7's order. */
declare const TRACKING_HOT_SIGNAL_TYPES: readonly ["tracking.hot.pricing_visit", "tracking.hot.demo_click", "tracking.hot.repeat_visits", "tracking.hot.trial_inactive"];
/** `cta.click` ids that make a demo-or-book moment (plan §7: `ctaId ∈ {demo, book, trial, contact}`). */
declare const TRACKING_HOT_CTA_IDS: readonly ["demo", "book", "trial", "contact"];
/** A repeat-visit moment is the 3rd distinct session in 7 days (plan §7), so a count below 3 is never one. */
declare const TRACKING_HOT_REPEAT_VISITS_MIN_SESSIONS = 3;
/** `tracking.hot.pricing_visit` — an identified person's pricing-page `page.view`. */
declare const trackingHotPricingVisitDataSchema: z.ZodObject<{
    leadId: z.ZodString;
    kind: z.ZodLiteral<"pricing_visit">;
    app: z.ZodString;
    topic: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
    at: z.ZodString;
}, z.core.$strict>;
/** `tracking.hot.demo_click` — a `cta.click` whose `ctaId` is in the set. */
declare const trackingHotDemoClickDataSchema: z.ZodObject<{
    leadId: z.ZodString;
    kind: z.ZodLiteral<"demo_click">;
    app: z.ZodString;
    ctaId: z.ZodEnum<{
        demo: "demo";
        book: "book";
        trial: "trial";
        contact: "contact";
    }>;
    path: z.ZodOptional<z.ZodString>;
    at: z.ZodString;
}, z.core.$strict>;
/** `tracking.hot.repeat_visits` — the 3rd (or later) distinct session in 7 days for one person. */
declare const trackingHotRepeatVisitsDataSchema: z.ZodObject<{
    leadId: z.ZodString;
    kind: z.ZodLiteral<"repeat_visits">;
    app: z.ZodString;
    sessionCount: z.ZodNumber;
    at: z.ZodString;
}, z.core.$strict>;
/** `tracking.hot.trial_inactive` — a trial ending in 3 days with no use in 5 (decided by Rello's Rail-1 run). */
declare const trackingHotTrialInactiveDataSchema: z.ZodObject<{
    leadId: z.ZodString;
    kind: z.ZodLiteral<"trial_inactive">;
    app: z.ZodString;
    at: z.ZodString;
}, z.core.$strict>;
/** The payload schema for each signal type, keyed by the type. */
declare const trackingHotSignalSchemas: {
    readonly "tracking.hot.pricing_visit": z.ZodObject<{
        leadId: z.ZodString;
        kind: z.ZodLiteral<"pricing_visit">;
        app: z.ZodString;
        topic: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
        at: z.ZodString;
    }, z.core.$strict>;
    readonly "tracking.hot.demo_click": z.ZodObject<{
        leadId: z.ZodString;
        kind: z.ZodLiteral<"demo_click">;
        app: z.ZodString;
        ctaId: z.ZodEnum<{
            demo: "demo";
            book: "book";
            trial: "trial";
            contact: "contact";
        }>;
        path: z.ZodOptional<z.ZodString>;
        at: z.ZodString;
    }, z.core.$strict>;
    readonly "tracking.hot.repeat_visits": z.ZodObject<{
        leadId: z.ZodString;
        kind: z.ZodLiteral<"repeat_visits">;
        app: z.ZodString;
        sessionCount: z.ZodNumber;
        at: z.ZodString;
    }, z.core.$strict>;
    readonly "tracking.hot.trial_inactive": z.ZodObject<{
        leadId: z.ZodString;
        kind: z.ZodLiteral<"trial_inactive">;
        app: z.ZodString;
        at: z.ZodString;
    }, z.core.$strict>;
};
type TrackingHotSignalType = (typeof TRACKING_HOT_SIGNAL_TYPES)[number];
type TrackingHotCtaId = (typeof TRACKING_HOT_CTA_IDS)[number];
type TrackingHotPricingVisitData = z.infer<typeof trackingHotPricingVisitDataSchema>;
type TrackingHotDemoClickData = z.infer<typeof trackingHotDemoClickDataSchema>;
type TrackingHotRepeatVisitsData = z.infer<typeof trackingHotRepeatVisitsDataSchema>;
type TrackingHotTrialInactiveData = z.infer<typeof trackingHotTrialInactiveDataSchema>;

export { TRACKING_HOT_CTA_IDS, TRACKING_HOT_DEMO_CLICK_SIGNAL_TYPE, TRACKING_HOT_PRICING_VISIT_SIGNAL_TYPE, TRACKING_HOT_REPEAT_VISITS_MIN_SESSIONS, TRACKING_HOT_REPEAT_VISITS_SIGNAL_TYPE, TRACKING_HOT_SIGNAL_TYPES, TRACKING_HOT_TRIAL_INACTIVE_SIGNAL_TYPE, TRACKING_TOPIC_PATTERN, TRACKING_VISIT_SUMMARY_MAX_BYTES, TRACKING_VISIT_SUMMARY_MAX_TOPICS, TRACKING_VISIT_SUMMARY_SIGNAL_TYPE, type TrackingHotCtaId, type TrackingHotDemoClickData, type TrackingHotPricingVisitData, type TrackingHotRepeatVisitsData, type TrackingHotSignalType, type TrackingHotTrialInactiveData, type TrackingVisitSummaryData, trackingHotDemoClickDataSchema, trackingHotPricingVisitDataSchema, trackingHotRepeatVisitsDataSchema, trackingHotSignalSchemas, trackingHotTrialInactiveDataSchema, trackingVisitSummaryDataSchema };
