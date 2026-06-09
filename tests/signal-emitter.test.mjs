import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSignalEmitter,
  mergeCustomFieldsIntoData,
} from '../dist/emit.js';
import {
  createSignalEmitter as rootCreateSignalEmitter,
  mergeCustomFieldsIntoData as rootMergeCustomFieldsIntoData,
  SIGNAL_PRIORITIES,
  EXACT_REGISTRY,
  normalizeSignalType,
} from '../dist/index.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Build a mock fetch that records calls and returns a canned response. */
function mockFetch({ status = 200, throwError } = {}) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    if (throwError) throw throwError;
    return { ok: status >= 200 && status < 300, status };
  };
  return { calls, impl };
}

function makeEmitter(overrides = {}) {
  const fetch = mockFetch(overrides.fetch ?? {});
  const persisted = [];
  const emitter = createSignalEmitter({
    relloBaseUrl: overrides.relloBaseUrl ?? 'https://hellorello.app',
    apiKey: 'apiKey' in overrides ? overrides.apiKey : 'rello_test_key_123',
    sourceApp: overrides.sourceApp ?? 'harvest-home',
    persistFailure: overrides.persistFailure ??
      (async (signal, error, tenantId) => {
        persisted.push({ signal, error, tenantId });
      }),
    apiKeyEnvHint: overrides.apiKeyEnvHint,
    fetchImpl: fetch.impl,
  });
  return { emitter, fetchCalls: fetch.calls, persisted };
}

describe('mergeCustomFieldsIntoData — wire-shape merge', () => {
  it('returns signal unchanged when customFields is undefined', () => {
    const signal = { type: 't.x', priority: 'normal', data: { a: 1 } };
    assert.equal(mergeCustomFieldsIntoData(signal), signal);
  });

  it('nests customFields inside data.customFields and clears the top-level field', () => {
    const merged = mergeCustomFieldsIntoData({
      type: 'harvest-home.data_enriched',
      priority: 'high',
      leadId: 'lead_1',
      data: { source: 'county' },
      customFields: { hh_equity: 120000 },
    });
    assert.deepEqual(merged.data, {
      source: 'county',
      customFields: { hh_equity: 120000 },
    });
    assert.equal(merged.customFields, undefined);
    assert.equal(merged.leadId, 'lead_1');
  });

  it('creates data when absent, containing only customFields', () => {
    const merged = mergeCustomFieldsIntoData({
      type: 't.x',
      priority: 'low',
      customFields: { hh_score: 9 },
    });
    assert.deepEqual(merged.data, { customFields: { hh_score: 9 } });
  });
});

describe('dispatchSignals — URL + auth header construction', () => {
  it('POSTs to <base>/api/signals/batch with Bearer auth and X-App-Source', async () => {
    const { emitter, fetchCalls } = makeEmitter();
    const res = await emitter.dispatchSignals('tenant_1', [
      { type: 'signal.lead.scored', priority: 'high', leadId: 'lead_1' },
    ]);
    assert.deepEqual(res, { ok: true });
    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0].url, 'https://hellorello.app/api/signals/batch');
    assert.equal(fetchCalls[0].init.method, 'POST');
    assert.equal(
      fetchCalls[0].init.headers['Authorization'],
      'Bearer rello_test_key_123',
    );
    assert.equal(fetchCalls[0].init.headers['X-App-Source'], 'harvest-home');
    assert.equal(fetchCalls[0].init.headers['Content-Type'], 'application/json');
  });

  it('normalizes a trailing /api and trailing slash off relloBaseUrl (RELLO_API_URL convention)', async () => {
    const { emitter, fetchCalls } = makeEmitter({
      relloBaseUrl: 'https://hellorello.app/api/',
    });
    await emitter.dispatchSignals('tenant_1', [
      { type: 't.x', priority: 'normal' },
    ]);
    assert.equal(fetchCalls[0].url, 'https://hellorello.app/api/signals/batch');
  });

  it('maps lowercase emit priorities to the uppercase wire enum (normal → MEDIUM)', async () => {
    const { emitter, fetchCalls } = makeEmitter();
    await emitter.dispatchSignals('tenant_1', [
      { type: 'a', priority: 'critical' },
      { type: 'b', priority: 'high' },
      { type: 'c', priority: 'normal' },
      { type: 'd', priority: 'low' },
    ]);
    const body = JSON.parse(fetchCalls[0].init.body);
    assert.deepEqual(
      body.signals.map((s) => s.priority),
      ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    );
    assert.equal(body.signals[0].sourceApp, 'harvest-home');
    assert.equal(body.signals[0].tenantId, 'tenant_1');
  });

  it('omits leadId entirely when absent (AUDIT-11 1.9-F5 — never an empty string)', async () => {
    const { emitter, fetchCalls } = makeEmitter();
    await emitter.dispatchSignals('tenant_1', [
      { type: 'a', priority: 'normal' },
      { type: 'b', priority: 'normal', leadId: 'lead_2' },
    ]);
    const body = JSON.parse(fetchCalls[0].init.body);
    assert.equal('leadId' in body.signals[0], false);
    assert.equal(body.signals[1].leadId, 'lead_2');
  });

  it('returns {ok:false, error:"HTTP <status>"} on non-2xx without throwing', async () => {
    const { emitter } = makeEmitter({ fetch: { status: 500 } });
    const res = await emitter.dispatchSignals('tenant_1', [
      { type: 't.x', priority: 'normal' },
    ]);
    assert.deepEqual(res, { ok: false, error: 'HTTP 500' });
  });

  it('fails loudly (no throw) when apiKey is missing, citing the env hint', async () => {
    const { emitter, fetchCalls } = makeEmitter({
      apiKey: undefined,
      apiKeyEnvHint: 'HARVEST_HOME_TO_RELLO_API_KEY',
    });
    const res = await emitter.dispatchSignals('tenant_1', [
      { type: 't.x', priority: 'normal' },
    ]);
    assert.equal(res.ok, false);
    assert.match(res.error, /HARVEST_HOME_TO_RELLO_API_KEY missing/);
    assert.equal(fetchCalls.length, 0);
  });

  it('no-ops to {ok:true} on an empty batch', async () => {
    const { emitter, fetchCalls } = makeEmitter();
    assert.deepEqual(await emitter.dispatchSignals('tenant_1', []), { ok: true });
    assert.equal(fetchCalls.length, 0);
  });
});

describe('emitSignals — idempotency-key pass-through', () => {
  it('stamps a fresh UUID idempotencyKey per signal when absent', async () => {
    const { emitter, fetchCalls } = makeEmitter();
    const ok = await emitter.emitSignals('tenant_1', [
      { type: 'a', priority: 'normal' },
      { type: 'b', priority: 'high' },
    ]);
    assert.equal(ok, true);
    const body = JSON.parse(fetchCalls[0].init.body);
    assert.match(body.signals[0].idempotencyKey, UUID_RE);
    assert.match(body.signals[1].idempotencyKey, UUID_RE);
    assert.notEqual(
      body.signals[0].idempotencyKey,
      body.signals[1].idempotencyKey,
    );
  });

  it('preserves a caller-supplied idempotencyKey verbatim onto the wire', async () => {
    const { emitter, fetchCalls } = makeEmitter();
    await emitter.emitSignals('tenant_1', [
      {
        type: 'a',
        priority: 'normal',
        idempotencyKey: '11111111-2222-3333-4444-555555555555',
      },
    ]);
    const body = JSON.parse(fetchCalls[0].init.body);
    assert.equal(
      body.signals[0].idempotencyKey,
      '11111111-2222-3333-4444-555555555555',
    );
  });

  it('persists the SAME idempotencyKey to the outbox on failure (drainer-replay dedup)', async () => {
    const { emitter, persisted } = makeEmitter({ fetch: { status: 503 } });
    await emitter.emitSignals('tenant_1', [
      { type: 'a', priority: 'normal' },
    ]);
    assert.equal(persisted.length, 1);
    assert.match(persisted[0].signal.idempotencyKey, UUID_RE);
  });
});

describe('emitSignals — customFields merge at the entry point', () => {
  it('folds customFields into data.customFields on the wire body', async () => {
    const { emitter, fetchCalls } = makeEmitter();
    await emitter.emitSignals('tenant_1', [
      {
        type: 'harvest-home.data_enriched',
        priority: 'high',
        leadId: 'lead_1',
        data: { source: 'county' },
        customFields: { hh_equity: 120000 },
      },
    ]);
    const body = JSON.parse(fetchCalls[0].init.body);
    assert.deepEqual(body.signals[0].data, {
      source: 'county',
      customFields: { hh_equity: 120000 },
    });
    assert.equal('customFields' in body.signals[0], false);
  });

  it('emitSignal(...) convenience arity forwards customFields through the merge', async () => {
    const { emitter, fetchCalls } = makeEmitter();
    const ok = await emitter.emitSignal(
      'signal.intake.lead_enriched',
      'high',
      'tenant_1',
      { enrichedFields: ['phone'], source: 'skip-trace' },
      'lead_9',
      { hh_phone_found: true },
    );
    assert.equal(ok, true);
    const body = JSON.parse(fetchCalls[0].init.body);
    assert.equal(body.signals[0].leadId, 'lead_9');
    assert.deepEqual(body.signals[0].data.customFields, {
      hh_phone_found: true,
    });
  });
});

describe('emitSignals — persistFailure outbox callback', () => {
  it('invokes persistFailure per signal with merged shape + error + tenantId on HTTP failure', async () => {
    const { emitter, persisted } = makeEmitter({ fetch: { status: 500 } });
    const ok = await emitter.emitSignals('tenant_7', [
      {
        type: 'a',
        priority: 'high',
        leadId: 'lead_1',
        customFields: { hh_x: 1 },
      },
      { type: 'b', priority: 'low' },
    ]);
    assert.equal(ok, false);
    assert.equal(persisted.length, 2);
    assert.equal(persisted[0].error, 'HTTP 500');
    assert.equal(persisted[0].tenantId, 'tenant_7');
    // merged wire shape persisted — customFields already inside data
    assert.deepEqual(persisted[0].signal.data, { customFields: { hh_x: 1 } });
    assert.equal(persisted[0].signal.customFields, undefined);
    assert.equal(persisted[1].signal.type, 'b');
  });

  it('invokes persistFailure on network error (fetch throws) with the error message', async () => {
    const { emitter, persisted } = makeEmitter({
      fetch: { throwError: new Error('ECONNREFUSED rello') },
    });
    const ok = await emitter.emitSignals('tenant_1', [
      { type: 'a', priority: 'normal' },
    ]);
    assert.equal(ok, false);
    assert.equal(persisted.length, 1);
    assert.equal(persisted[0].error, 'ECONNREFUSED rello');
  });

  it('does NOT invoke persistFailure on success', async () => {
    const { emitter, persisted } = makeEmitter();
    const ok = await emitter.emitSignals('tenant_1', [
      { type: 'a', priority: 'normal' },
    ]);
    assert.equal(ok, true);
    assert.equal(persisted.length, 0);
  });

  it('a throwing persistFailure is contained — emitSignals resolves false, never rejects', async () => {
    const { emitter } = makeEmitter({
      fetch: { status: 500 },
      persistFailure: async () => {
        throw new Error('outbox table missing');
      },
    });
    const ok = await emitter.emitSignals('tenant_1', [
      { type: 'a', priority: 'normal' },
      { type: 'b', priority: 'normal' },
    ]);
    assert.equal(ok, false);
  });

  it('one throwing persistFailure row does not strand its siblings', async () => {
    const persisted = [];
    let first = true;
    const { emitter } = makeEmitter({
      fetch: { status: 500 },
      persistFailure: async (signal) => {
        if (first) {
          first = false;
          throw new Error('row 1 boom');
        }
        persisted.push(signal.type);
      },
    });
    await emitter.emitSignals('tenant_1', [
      { type: 'a', priority: 'normal' },
      { type: 'b', priority: 'normal' },
    ]);
    assert.deepEqual(persisted, ['b']);
  });
});

describe('createSignalEmitter — config validation', () => {
  it('requires relloBaseUrl, sourceApp, and persistFailure', () => {
    assert.throws(
      () =>
        createSignalEmitter({
          relloBaseUrl: '',
          apiKey: 'k',
          sourceApp: 'harvest-home',
          persistFailure: async () => {},
        }),
      /relloBaseUrl/,
    );
    assert.throws(
      () =>
        createSignalEmitter({
          relloBaseUrl: 'https://hellorello.app',
          apiKey: 'k',
          sourceApp: '',
          persistFailure: async () => {},
        }),
      /sourceApp/,
    );
    assert.throws(
      () =>
        createSignalEmitter({
          relloBaseUrl: 'https://hellorello.app',
          apiKey: 'k',
          sourceApp: 'harvest-home',
        }),
      /persistFailure/,
    );
  });
});

describe('v0.14.0 pure-addition guarantee — root exports intact + emit re-exported', () => {
  it('root index still exports the uppercase priority namespace + registry', () => {
    assert.deepEqual([...SIGNAL_PRIORITIES], ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
    assert.equal(typeof EXACT_REGISTRY, 'object');
    assert.equal(typeof normalizeSignalType, 'function');
  });

  it('root index re-exports the emit core (tsup bundles per-entry, so compare behavior not reference)', () => {
    assert.equal(typeof rootCreateSignalEmitter, 'function');
    assert.equal(typeof rootMergeCustomFieldsIntoData, 'function');
    // identical behavior: root copy performs the same wire-shape merge
    const merged = rootMergeCustomFieldsIntoData({
      type: 't.x',
      priority: 'normal',
      customFields: { hh_a: 1 },
    });
    assert.deepEqual(merged.data, { customFields: { hh_a: 1 } });
    // root factory builds a working emitter too
    const emitter = rootCreateSignalEmitter({
      relloBaseUrl: 'https://hellorello.app',
      apiKey: 'k',
      sourceApp: 'harvest-home',
      persistFailure: async () => {},
    });
    assert.equal(typeof emitter.emitSignals, 'function');
    assert.equal(typeof emitter.dispatchSignals, 'function');
  });
});
