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
