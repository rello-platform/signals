/**
 * Spoke-side signal-emit core — extracted from the Harvest-Home gold-standard
 * implementation (`Harvest-Home/src/lib/signal-router.ts` @ origin/main) per
 * DISCOVERED-PLATFORM-RELLO-PLATFORM-SIGNALS-PACKAGE-EXTRACTION-HH-GOLD-STANDARD-2026-05-18
 * Phase A.
 *
 * CONFIG INJECTION: the six spoke implementations diverge on (a) env-var
 * names for the Rello base URL + API key and (b) the name/shape of their
 * failed-signal outbox model. This module therefore hardcodes NEITHER:
 * each spoke calls `createSignalEmitter(config)` supplying its own resolved
 * `relloBaseUrl` / `apiKey` / `sourceApp`, and owns the outbox write via the
 * `persistFailure` callback (so divergent FailedSignal prisma models keep
 * working untouched).
 *
 * Wire contract (unchanged from HH):
 *   POST `${relloBaseUrl}/api/signals/batch`
 *   Authorization: Bearer <apiKey>          (ApiKey-table key — see
 *                                            ~API-KEY-LIFECYCLE-README; never
 *                                            a shared-secret env compare)
 *   X-App-Source: <sourceApp>               (canonical @rello-platform/slugs
 *                                            APP_SLUG value)
 *
 * NAMESPACE NOTE: this module's `SignalPriority` is the lowercase 4-value
 * SPOKE-EMIT namespace ('critical' | 'high' | 'normal' | 'low') used by every
 * spoke emitter. It is intentionally DISTINCT from the package root's
 * uppercase classifier-canonical `SignalPriority`
 * ('CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') — Rello's `/api/signals/batch`
 * boundary normalizes lowercase → uppercase ('normal' → 'MEDIUM') and
 * `dispatchSignals` performs that mapping on the wire. The root index
 * re-exports this type as `EmitSignalPriority` to avoid colliding with the
 * existing root export (pure-addition guarantee for v0.14.0); import from
 * `@rello-platform/signals/emit` to get it under its canonical local name.
 */
/** Spoke-emit priority namespace (lowercase). See module doc — NOT the root
 *  uppercase classifier namespace. 'normal' maps to 'MEDIUM' on the wire. */
type SignalPriority = "critical" | "high" | "normal" | "low";
interface Signal {
    type: string;
    leadId?: string;
    priority: SignalPriority;
    data?: Record<string, unknown>;
    /**
     * Lead-level enrichment fields (spoke-prefixed keys, e.g. `hh_*`) that
     * Rello's signal router merges into `lead.customFields` on receipt.
     *
     * Per SPOKE-APP-INTEGRATION-STANDARD.md "Operation 4 — Emit Signals":
     * every lead-level signal SHOULD carry customFields. The signal router
     * merges them atomically (race-free with concurrent writes) into the
     * lead's customFields jsonb column.
     *
     * Wire format: customFields are nested INSIDE `data.customFields` before
     * dispatch / outbox persistence (see `mergeCustomFieldsIntoData`). The
     * merge happens once at the public-API entry point so the dispatched
     * payload and any drainer-replay payload are identical — the spoke's
     * drainer needs no customFields awareness.
     */
    customFields?: Record<string, unknown>;
    /**
     * Per-signal idempotency key (UUID). Generated once at the `emitSignals`
     * entry point and included in every dispatch (initial and retry) so
     * Rello's SignalLog dedup on `(tenantId, idempotencyKey)` fires — drainer
     * retries after partial success (Rello got the signal but the HTTP
     * response was lost) no longer write duplicate journal rows. If a caller
     * already supplied a key (uncommon), it is preserved — supports callers
     * that want their own idempotency scope. (HH SHAPE-04-D3-T2 Part B.)
     */
    idempotencyKey?: string;
}
/** Dispatch outcome for `dispatchSignals`. */
type DispatchResult = {
    ok: true;
} | {
    ok: false;
    error: string;
};
interface SignalEmitterConfig {
    /**
     * Rello CRM domain root (RELLO_API_URL convention — no trailing `/api`,
     * no trailing slash). Defensively normalized: a trailing slash and/or a
     * trailing `/api` segment are stripped, mirroring `getRelloBaseUrl()` in
     * `@rello-platform/api-client`, so a mis-set env var cannot produce
     * `/api/api/signals/batch`.
     */
    relloBaseUrl: string;
    /**
     * Spoke→Rello ApiKey-table Bearer key (e.g. HH's
     * `HARVEST_HOME_TO_RELLO_API_KEY`). May be `undefined` at factory time
     * (env not yet provisioned): dispatch then fails loudly per call with a
     * context-rich error naming `apiKeyEnvHint`, and `emitSignals` routes the
     * failure into `persistFailure` instead of throwing at the caller.
     */
    apiKey: string | undefined;
    /** Canonical APP_SLUG of the emitting spoke — sent as `X-App-Source` and
     *  as each signal's `sourceApp`. */
    sourceApp: string;
    /**
     * Spoke-owned outbox write, invoked by `emitSignals` once per signal when
     * dispatch fails (HTTP non-2xx, network error, timeout, or missing
     * apiKey). The spoke writes its OWN FailedSignal/outbox model here —
     * model name + column divergence across spokes stays the spoke's
     * business. The signal passed is the MERGED wire-shape signal
     * (customFields already folded into `data.customFields`, idempotencyKey
     * stamped) so a drainer replaying the persisted payload dispatches a
     * byte-identical body.
     *
     * `tenantId` is passed as the third argument (the Signal itself does not
     * carry it) so the outbox row can be tenant-scoped.
     *
     * Errors thrown by this callback are caught + logged at CRITICAL level
     * (signal is lost at that point) — they never propagate to the emit
     * caller, keeping `emitSignals` fire-and-forget-safe.
     */
    persistFailure: (signal: Signal, error: string, tenantId: string) => Promise<void>;
    /** Optional env-var name to cite in missing-apiKey errors (operator
     *  breadcrumb, e.g. "HARVEST_HOME_TO_RELLO_API_KEY"). */
    apiKeyEnvHint?: string;
    /** Dispatch timeout in ms. Default 10_000 (HH gold standard). */
    timeoutMs?: number;
    /** Injectable fetch (tests). Defaults to globalThis.fetch. */
    fetchImpl?: typeof fetch;
}
interface SignalEmitter {
    emitSignal(type: string, priority: SignalPriority, tenantId: string, data?: Record<string, unknown>, leadId?: string, customFields?: Record<string, unknown>): Promise<boolean>;
    emitSignals(tenantId: string, signals: Signal[]): Promise<boolean>;
    dispatchSignals(tenantId: string, signals: Signal[]): Promise<DispatchResult>;
}
/**
 * Merge `customFields` into `data.customFields` for the wire format. Called
 * once at the public-API entry point in `emitSignals` so the merged shape
 * is what gets dispatched, persisted via `persistFailure`, and replayed on
 * retry.
 *
 * If `signal.customFields` is undefined, returns the signal unchanged.
 * If `signal.data` is undefined, creates a new data object containing only
 * the customFields. Otherwise spreads existing data and adds customFields.
 *
 * Per HH CRON-CLAIM-AUDIT-2026-04-08 audit principle: minimize asymmetry
 * between the dispatch path and the retry path. By merging once at entry,
 * both paths see the same shape and the retry path needs no awareness of
 * customFields at all.
 */
declare function mergeCustomFieldsIntoData(signal: Signal): Signal;
/**
 * Create a spoke-bound signal emitter. Pure factory — no module-level env
 * reads, no prisma import: the spoke resolves its own env vars and owns its
 * own outbox model via `config.persistFailure`.
 */
declare function createSignalEmitter(config: SignalEmitterConfig): SignalEmitter;

export { type DispatchResult, type Signal, type SignalEmitter, type SignalEmitterConfig, type SignalPriority, createSignalEmitter, mergeCustomFieldsIntoData };
