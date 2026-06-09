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

import { randomUUID } from "node:crypto";

/** Spoke-emit priority namespace (lowercase). See module doc — NOT the root
 *  uppercase classifier namespace. 'normal' maps to 'MEDIUM' on the wire. */
export type SignalPriority = "critical" | "high" | "normal" | "low";

export interface Signal {
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
export type DispatchResult = { ok: true } | { ok: false; error: string };

export interface SignalEmitterConfig {
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
  persistFailure: (
    signal: Signal,
    error: string,
    tenantId: string,
  ) => Promise<void>;
  /** Optional env-var name to cite in missing-apiKey errors (operator
   *  breadcrumb, e.g. "HARVEST_HOME_TO_RELLO_API_KEY"). */
  apiKeyEnvHint?: string;
  /** Dispatch timeout in ms. Default 10_000 (HH gold standard). */
  timeoutMs?: number;
  /** Injectable fetch (tests). Defaults to globalThis.fetch. */
  fetchImpl?: typeof fetch;
}

export interface SignalEmitter {
  emitSignal(
    type: string,
    priority: SignalPriority,
    tenantId: string,
    data?: Record<string, unknown>,
    leadId?: string,
    customFields?: Record<string, unknown>,
  ): Promise<boolean>;
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
export function mergeCustomFieldsIntoData(signal: Signal): Signal {
  if (!signal.customFields) return signal;
  return {
    ...signal,
    data: {
      ...(signal.data ?? {}),
      customFields: signal.customFields,
    },
    customFields: undefined,
  };
}

/**
 * Map the spoke-emit lowercase priority namespace to the uppercase enum the
 * Rello `/api/signals/batch` Zod schema expects. 'normal' → 'MEDIUM' (Rello
 * has no NORMAL; the batch boundary canonicalizes it to MEDIUM).
 */
const PRIORITY_WIRE_MAP: Readonly<Record<SignalPriority, string>> = {
  critical: "CRITICAL",
  high: "HIGH",
  normal: "MEDIUM",
  low: "LOW",
};

/** Strip trailing slashes and a trailing `/api` segment (RELLO_API_URL is
 *  the domain root; mirrors `getRelloBaseUrl()` normalization). */
function normalizeRelloBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, "");
  if (url.toLowerCase().endsWith("/api")) {
    url = url.slice(0, -4).replace(/\/+$/, "");
  }
  return url;
}

/**
 * Create a spoke-bound signal emitter. Pure factory — no module-level env
 * reads, no prisma import: the spoke resolves its own env vars and owns its
 * own outbox model via `config.persistFailure`.
 */
export function createSignalEmitter(config: SignalEmitterConfig): SignalEmitter {
  if (!config || typeof config !== "object") {
    throw new Error("[SignalEmitter] createSignalEmitter: config object is required");
  }
  if (!config.relloBaseUrl || typeof config.relloBaseUrl !== "string") {
    throw new Error(
      "[SignalEmitter] createSignalEmitter: config.relloBaseUrl is required (Rello domain root, no trailing /api)",
    );
  }
  if (!config.sourceApp || typeof config.sourceApp !== "string") {
    throw new Error(
      "[SignalEmitter] createSignalEmitter: config.sourceApp is required (canonical APP_SLUG)",
    );
  }
  if (typeof config.persistFailure !== "function") {
    throw new Error(
      "[SignalEmitter] createSignalEmitter: config.persistFailure callback is required (spoke-owned outbox write)",
    );
  }

  const baseUrl = normalizeRelloBaseUrl(config.relloBaseUrl);
  const timeoutMs = config.timeoutMs ?? 10_000;
  const sourceApp = config.sourceApp;

  /**
   * Pure dispatch — sends signals to Rello's batch endpoint and returns the
   * outcome. Does NOT queue on failure: spoke drainers call this directly
   * for retries and manage their own retry tracking (retryCount etc.).
   * Never rejects on HTTP/network failure — failures come back as
   * `{ ok: false, error }`.
   */
  async function dispatchSignals(
    tenantId: string,
    signals: Signal[],
  ): Promise<DispatchResult> {
    if (signals.length === 0) return { ok: true };

    if (!config.apiKey) {
      // Faithful to HH semantics (loud, names the env var) but returned as
      // a DispatchResult instead of a throw so drainer callers get a
      // uniform failure surface.
      const hint = config.apiKeyEnvHint
        ? `${config.apiKeyEnvHint} missing`
        : "Rello API key missing";
      const error = `${hint} — spoke→Rello ApiKey not configured for sourceApp=${sourceApp}; mint via Platform Admin → Apps → Settings and set it on the runtime env (Railway + Trigger.dev if applicable)`;
      console.error(
        `[SignalEmitter] dispatchSignals failed for tenant=${tenantId} sourceApp=${sourceApp} count=${signals.length}: ${error}`,
      );
      return { ok: false, error };
    }

    const fetchImpl = config.fetchImpl ?? globalThis.fetch;

    try {
      const res = await fetchImpl(`${baseUrl}/api/signals/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          "X-App-Source": sourceApp,
        },
        body: JSON.stringify({
          signals: signals.map((s) => ({
            tenantId,
            // HH AUDIT-11 fix 1.9-F5: omit the field entirely (never send
            // an empty string) when no leadId — an empty string makes
            // Rello's signal router attempt a lead lookup with id="" which
            // always fails.
            ...(s.leadId ? { leadId: s.leadId } : {}),
            signalType: s.type,
            priority: PRIORITY_WIRE_MAP[s.priority],
            sourceApp,
            data: s.data,
            timestamp: new Date().toISOString(),
            // Include the idempotency key in every dispatch (initial and
            // retry) so Rello's SignalLog dedup fires when a key is present.
            ...(s.idempotencyKey ? { idempotencyKey: s.idempotencyKey } : {}),
          })),
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.ok) return { ok: true };
      return { ok: false, error: `HTTP ${res.status}` };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Public emission API. Merges customFields + stamps idempotencyKeys ONCE
   * at entry (so dispatch, outbox persistence, and any drainer replay all
   * see the identical wire shape), dispatches to Rello, and on failure
   * hands each merged signal to the spoke-owned `persistFailure` outbox
   * callback for guaranteed-eventual delivery by the spoke's drainer.
   *
   * Returns:
   *   true  — Rello accepted the batch.
   *   false — dispatch failed; signals were handed to `persistFailure`
   *           (or, if that ALSO threw, lost + logged at CRITICAL).
   *
   * Never rejects — safe for fire-and-forget callers.
   */
  async function emitSignals(
    tenantId: string,
    signals: Signal[],
  ): Promise<boolean> {
    try {
      if (!Array.isArray(signals) || signals.length === 0) return true;
      if (!tenantId) {
        console.error(
          `[SignalEmitter] emitSignals called without tenantId (sourceApp=${sourceApp}, count=${signals.length}) — refusing to dispatch unscoped signals`,
        );
        return false;
      }

      const merged = signals.map((s) => {
        const withKey = s.idempotencyKey
          ? s
          : { ...s, idempotencyKey: randomUUID() };
        return mergeCustomFieldsIntoData(withKey);
      });

      const result = await dispatchSignals(tenantId, merged);
      if (result.ok) return true;

      console.error(
        `[SignalEmitter] dispatch failed for tenant=${tenantId} sourceApp=${sourceApp} count=${merged.length} (${result.error}) — persisting to spoke outbox for retry`,
      );

      // Hand each merged signal to the spoke's outbox. Per-signal try/catch:
      // one bad row must not strand its siblings.
      let allPersisted = true;
      for (const signal of merged) {
        try {
          await config.persistFailure(signal, result.error, tenantId);
        } catch (persistErr) {
          allPersisted = false;
          console.error(
            `[SignalEmitter] CRITICAL: persistFailure callback threw — signal lost (tenant=${tenantId} type=${signal.type} leadId=${signal.leadId ?? "-"} idempotencyKey=${signal.idempotencyKey ?? "-"}):`,
            persistErr instanceof Error ? persistErr.message : String(persistErr),
          );
        }
      }
      // false either way — the caller's "emitted" flag should reflect that
      // Rello has NOT yet accepted the signal. allPersisted only modulates
      // the log severity above.
      void allPersisted;
      return false;
    } catch (err) {
      // Belt-and-suspenders: emitSignals is fire-and-forget-safe by
      // contract; nothing above should throw, but if it does, log with
      // context and swallow into `false`.
      console.error(
        `[SignalEmitter] CRITICAL: unexpected emitSignals failure (tenant=${tenantId} sourceApp=${sourceApp} count=${signals?.length ?? 0}):`,
        err instanceof Error ? err.message : String(err),
      );
      return false;
    }
  }

  /** Emit a single typed behavioral signal. See `emitSignals`. */
  function emitSignal(
    type: string,
    priority: SignalPriority,
    tenantId: string,
    data?: Record<string, unknown>,
    leadId?: string,
    customFields?: Record<string, unknown>,
  ): Promise<boolean> {
    return emitSignals(tenantId, [
      { type, priority, data, leadId, customFields },
    ]);
  }

  return { emitSignal, emitSignals, dispatchSignals };
}
