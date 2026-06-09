// src/emit.ts
import { randomUUID } from "crypto";
function mergeCustomFieldsIntoData(signal) {
  if (!signal.customFields) return signal;
  return {
    ...signal,
    data: {
      ...signal.data ?? {},
      customFields: signal.customFields
    },
    customFields: void 0
  };
}
var PRIORITY_WIRE_MAP = {
  critical: "CRITICAL",
  high: "HIGH",
  normal: "MEDIUM",
  low: "LOW"
};
function normalizeRelloBaseUrl(raw) {
  let url = raw.trim().replace(/\/+$/, "");
  if (url.toLowerCase().endsWith("/api")) {
    url = url.slice(0, -4).replace(/\/+$/, "");
  }
  return url;
}
function createSignalEmitter(config) {
  if (!config || typeof config !== "object") {
    throw new Error("[SignalEmitter] createSignalEmitter: config object is required");
  }
  if (!config.relloBaseUrl || typeof config.relloBaseUrl !== "string") {
    throw new Error(
      "[SignalEmitter] createSignalEmitter: config.relloBaseUrl is required (Rello domain root, no trailing /api)"
    );
  }
  if (!config.sourceApp || typeof config.sourceApp !== "string") {
    throw new Error(
      "[SignalEmitter] createSignalEmitter: config.sourceApp is required (canonical APP_SLUG)"
    );
  }
  if (typeof config.persistFailure !== "function") {
    throw new Error(
      "[SignalEmitter] createSignalEmitter: config.persistFailure callback is required (spoke-owned outbox write)"
    );
  }
  const baseUrl = normalizeRelloBaseUrl(config.relloBaseUrl);
  const timeoutMs = config.timeoutMs ?? 1e4;
  const sourceApp = config.sourceApp;
  async function dispatchSignals(tenantId, signals) {
    if (signals.length === 0) return { ok: true };
    if (!config.apiKey) {
      const hint = config.apiKeyEnvHint ? `${config.apiKeyEnvHint} missing` : "Rello API key missing";
      const error = `${hint} \u2014 spoke\u2192Rello ApiKey not configured for sourceApp=${sourceApp}; mint via Platform Admin \u2192 Apps \u2192 Settings and set it on the runtime env (Railway + Trigger.dev if applicable)`;
      console.error(
        `[SignalEmitter] dispatchSignals failed for tenant=${tenantId} sourceApp=${sourceApp} count=${signals.length}: ${error}`
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
          "X-App-Source": sourceApp
        },
        body: JSON.stringify({
          signals: signals.map((s) => ({
            tenantId,
            // HH AUDIT-11 fix 1.9-F5: omit the field entirely (never send
            // an empty string) when no leadId — an empty string makes
            // Rello's signal router attempt a lead lookup with id="" which
            // always fails.
            ...s.leadId ? { leadId: s.leadId } : {},
            signalType: s.type,
            priority: PRIORITY_WIRE_MAP[s.priority],
            sourceApp,
            data: s.data,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            // Include the idempotency key in every dispatch (initial and
            // retry) so Rello's SignalLog dedup fires when a key is present.
            ...s.idempotencyKey ? { idempotencyKey: s.idempotencyKey } : {}
          }))
        }),
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (res.ok) return { ok: true };
      return { ok: false, error: `HTTP ${res.status}` };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }
  async function emitSignals(tenantId, signals) {
    try {
      if (!Array.isArray(signals) || signals.length === 0) return true;
      if (!tenantId) {
        console.error(
          `[SignalEmitter] emitSignals called without tenantId (sourceApp=${sourceApp}, count=${signals.length}) \u2014 refusing to dispatch unscoped signals`
        );
        return false;
      }
      const merged = signals.map((s) => {
        const withKey = s.idempotencyKey ? s : { ...s, idempotencyKey: randomUUID() };
        return mergeCustomFieldsIntoData(withKey);
      });
      const result = await dispatchSignals(tenantId, merged);
      if (result.ok) return true;
      console.error(
        `[SignalEmitter] dispatch failed for tenant=${tenantId} sourceApp=${sourceApp} count=${merged.length} (${result.error}) \u2014 persisting to spoke outbox for retry`
      );
      let allPersisted = true;
      for (const signal of merged) {
        try {
          await config.persistFailure(signal, result.error, tenantId);
        } catch (persistErr) {
          allPersisted = false;
          console.error(
            `[SignalEmitter] CRITICAL: persistFailure callback threw \u2014 signal lost (tenant=${tenantId} type=${signal.type} leadId=${signal.leadId ?? "-"} idempotencyKey=${signal.idempotencyKey ?? "-"}):`,
            persistErr instanceof Error ? persistErr.message : String(persistErr)
          );
        }
      }
      void allPersisted;
      return false;
    } catch (err) {
      console.error(
        `[SignalEmitter] CRITICAL: unexpected emitSignals failure (tenant=${tenantId} sourceApp=${sourceApp} count=${signals?.length ?? 0}):`,
        err instanceof Error ? err.message : String(err)
      );
      return false;
    }
  }
  function emitSignal(type, priority, tenantId, data, leadId, customFields) {
    return emitSignals(tenantId, [
      { type, priority, data, leadId, customFields }
    ]);
  }
  return { emitSignal, emitSignals, dispatchSignals };
}
export {
  createSignalEmitter,
  mergeCustomFieldsIntoData
};
//# sourceMappingURL=emit.js.map