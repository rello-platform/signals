import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM TRACKING SYSTEM S7-S (v0.41.0, PROPOSED) — `tracking.visit_summary`.
//
// The tracking engine sends one signal per IDENTIFIED visit, 30 minutes after
// the visit's last event (plan §6, Rev 2 GD-2693), over `POST /api/signals/batch`.
// Rello stores it as a `SignalLog` row on the lead; nurture compose reads the
// newest one's `topics` inside the `SignalLog` query it already runs (plan §6
// Rev 4, GD-2714: no engine call on the compose path).
//
// The signal envelope also needs, OUTSIDE this payload: `tenantId`, `leadId`
// (Rello's batch route reads both from the envelope, so the payload carries no
// person or lead id), `signalType: "tracking.visit_summary"` (already dotted,
// so the receiver stores it as sent) and an `idempotencyKey` that is identical
// on every retry of one visit and distinct per visit.
//
// What this payload never carries: a name, email, phone, address, raw path,
// query string or IP. `.strict()` makes that a refusal, not a convention.
//
// Not a gate on the visit: `topics` may be `[]` and `topicsComputedAt` may then
// be `null`, so a visit with no topics still sends. The 2 KB cap (plan §6) is
// on the whole serialized payload, UTF-8 bytes.
// ─────────────────────────────────────────────────────────────────────────────

export const TRACKING_VISIT_SUMMARY_SIGNAL_TYPE = "tracking.visit_summary" as const;

/** The plan's cap on topics per summary (§6 Rev 4). */
export const TRACKING_VISIT_SUMMARY_MAX_TOPICS = 5;

/** The plan's cap on the whole serialized payload (§6 Rev 4: "the S1 schema caps the payload at 2 KB"). */
export const TRACKING_VISIT_SUMMARY_MAX_BYTES = 2048;

/**
 * A topic is `<app>:<featureId>` (marketing sites, plan §6) or a bare page type
 * (`pricing`, `compare`). Each part is a `data-section`-style id. Lowercase, no
 * spaces, no slash, no `?`, so a raw path or query string cannot ride in a topic.
 */
export const TRACKING_TOPIC_PATTERN = /^[a-z0-9][a-z0-9_-]*(:[a-z0-9][a-z0-9_-]*)?$/;

const trackingTopicSchema = z
  .object({
    topic: z.string().max(256).regex(TRACKING_TOPIC_PATTERN, "a data-section style id, optionally <app>:<id>"),
    /** The person's interest score in this topic. Zero is a real score. */
    score: z.number().finite().min(0),
  })
  .strict();

export const trackingVisitSummaryDataSchema = z
  .object({
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
    topicsComputedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict()
  .superRefine((d, ctx) => {
    const size = new TextEncoder().encode(JSON.stringify(d)).length;
    if (size > TRACKING_VISIT_SUMMARY_MAX_BYTES) {
      ctx.addIssue({
        code: "custom",
        message: `payload is ${size} bytes; the cap is ${TRACKING_VISIT_SUMMARY_MAX_BYTES} bytes (2 KB)`,
      });
    }
  });

export type TrackingVisitSummaryData = z.infer<typeof trackingVisitSummaryDataSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM TRACKING SYSTEM S8-A (v0.42.0, PROPOSED) — the four `tracking.hot.*`
// signal types (plan §7, "Hot moments: to Growth within minutes").
//
// The engine DECIDES a hot moment (once per person, kind and day, in its own
// `hot_moment` table) and sends it over `POST /api/signals/batch`; Rello's router
// hands it to Growth's handler. Unlike `tracking.visit_summary` these are ROUTED.
//
// The payload is plan §7's "Growth receives" shape, per type only the fields
// that type uses, and `.strict()`: { leadId, kind, app, topic?, path?, ctaId?,
// sessionCount?, at }. `leadId` is the house-tenant lead. No name, email, phone,
// address, query string or IP can ride along: an extra key is a refusal.
//
// Not a gate (§23): the engine decides these from events it holds. A moment whose
// data is missing is simply not decided; nothing here holds or blocks anything
// else, and the optional fields (`topic`, `path`) may be absent.
// ─────────────────────────────────────────────────────────────────────────────

export const TRACKING_HOT_PRICING_VISIT_SIGNAL_TYPE = "tracking.hot.pricing_visit" as const;
export const TRACKING_HOT_DEMO_CLICK_SIGNAL_TYPE = "tracking.hot.demo_click" as const;
export const TRACKING_HOT_REPEAT_VISITS_SIGNAL_TYPE = "tracking.hot.repeat_visits" as const;
export const TRACKING_HOT_TRIAL_INACTIVE_SIGNAL_TYPE = "tracking.hot.trial_inactive" as const;

/** The four hot-moment signal types, in plan §7's order. */
export const TRACKING_HOT_SIGNAL_TYPES = [
  TRACKING_HOT_PRICING_VISIT_SIGNAL_TYPE,
  TRACKING_HOT_DEMO_CLICK_SIGNAL_TYPE,
  TRACKING_HOT_REPEAT_VISITS_SIGNAL_TYPE,
  TRACKING_HOT_TRIAL_INACTIVE_SIGNAL_TYPE,
] as const;

/** `cta.click` ids that make a demo-or-book moment (plan §7: `ctaId ∈ {demo, book, trial, contact}`). */
export const TRACKING_HOT_CTA_IDS = ["demo", "book", "trial", "contact"] as const;

/** A repeat-visit moment is the 3rd distinct session in 7 days (plan §7), so a count below 3 is never one. */
export const TRACKING_HOT_REPEAT_VISITS_MIN_SESSIONS = 3;

/** An app slug as the platform spells them: lowercase, hyphenated. */
const hotAppSchema = z.string().max(64).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "a lowercase hyphenated app slug");

/** A pathname only: starts with `/`, no query, no fragment, no host (the engine strips paths the same way). */
const hotPathSchema = z.string().min(1).max(512).regex(/^\/[^?#\s]*$/, "a pathname: no query, no fragment, no host");

const hotTopicSchema = z.string().max(256).regex(TRACKING_TOPIC_PATTERN, "a data-section style id, optionally <app>:<id>");

const hotAtSchema = z.string().datetime({ offset: true });

const hotLeadIdSchema = z.string().min(1).max(256);

/** `tracking.hot.pricing_visit` — an identified person's pricing-page `page.view`. */
export const trackingHotPricingVisitDataSchema = z
  .object({
    leadId: hotLeadIdSchema,
    kind: z.literal("pricing_visit"),
    app: hotAppSchema,
    topic: hotTopicSchema.optional(),
    path: hotPathSchema.optional(),
    at: hotAtSchema,
  })
  .strict();

/** `tracking.hot.demo_click` — a `cta.click` whose `ctaId` is in the set. */
export const trackingHotDemoClickDataSchema = z
  .object({
    leadId: hotLeadIdSchema,
    kind: z.literal("demo_click"),
    app: hotAppSchema,
    ctaId: z.enum(TRACKING_HOT_CTA_IDS),
    path: hotPathSchema.optional(),
    at: hotAtSchema,
  })
  .strict();

/** `tracking.hot.repeat_visits` — the 3rd (or later) distinct session in 7 days for one person. */
export const trackingHotRepeatVisitsDataSchema = z
  .object({
    leadId: hotLeadIdSchema,
    kind: z.literal("repeat_visits"),
    app: hotAppSchema,
    sessionCount: z.number().int().min(TRACKING_HOT_REPEAT_VISITS_MIN_SESSIONS).max(10_000),
    at: hotAtSchema,
  })
  .strict();

/** `tracking.hot.trial_inactive` — a trial ending in 3 days with no use in 5 (decided by Rello's Rail-1 run). */
export const trackingHotTrialInactiveDataSchema = z
  .object({
    leadId: hotLeadIdSchema,
    kind: z.literal("trial_inactive"),
    app: hotAppSchema,
    at: hotAtSchema,
  })
  .strict();

/** The payload schema for each signal type, keyed by the type. */
export const trackingHotSignalSchemas = {
  [TRACKING_HOT_PRICING_VISIT_SIGNAL_TYPE]: trackingHotPricingVisitDataSchema,
  [TRACKING_HOT_DEMO_CLICK_SIGNAL_TYPE]: trackingHotDemoClickDataSchema,
  [TRACKING_HOT_REPEAT_VISITS_SIGNAL_TYPE]: trackingHotRepeatVisitsDataSchema,
  [TRACKING_HOT_TRIAL_INACTIVE_SIGNAL_TYPE]: trackingHotTrialInactiveDataSchema,
} as const;

export type TrackingHotSignalType = (typeof TRACKING_HOT_SIGNAL_TYPES)[number];
export type TrackingHotCtaId = (typeof TRACKING_HOT_CTA_IDS)[number];
export type TrackingHotPricingVisitData = z.infer<typeof trackingHotPricingVisitDataSchema>;
export type TrackingHotDemoClickData = z.infer<typeof trackingHotDemoClickDataSchema>;
export type TrackingHotRepeatVisitsData = z.infer<typeof trackingHotRepeatVisitsDataSchema>;
export type TrackingHotTrialInactiveData = z.infer<typeof trackingHotTrialInactiveDataSchema>;
