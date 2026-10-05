// ─────────────────────────────────────────────────────────────────────────────
// D-245 / R-73 — `consent.captured` (v0.36.0).
//
// Home Scout emits it when a person ticks the worded consent box on
// clearpathutah.com/check-your-rate/ ("Text me a link to this quote"). Rello
// processes it in-request at /api/signals/batch (Rello #1538) and answers with
// one of CONSENT_CAPTURE_OUTCOMES. Registered here so Home Scout's emitter
// passes its signal-type gate, and so both sides read one payload contract.
//
// The schema must never accept a payload Rello refuses on its shape (it may be
// stricter — never looser). Cases below mirror Rello's refusals one for one.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as pkg from "../dist/index.js";

const KEY = "consent.captured";
const schema = pkg.consentCapturedDataSchema;
const sha = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const SENTENCE =
  "By checking this box, I agree that ClearPath Utah Mortgage may call and text me at the number above, including automated texts.";

const valid = {
  sentence: SENTENCE,
  sentenceSha256: sha(SENTENCE),
  sentenceVersion: "text-quote-v1",
  surface: "check-your-rate:text-quote",
  phoneE164: "+18015550101",
  channels: ["CALL", "CONSENT_SMS"],
  capturedAt: "2026-10-05T01:00:00.000Z",
  ipHash: sha("203.0.113.7"),
  userAgent: "Mozilla/5.0 (fixture)",
};

describe(`${KEY} (v0.36.0)`, () => {
  it("is a registered, active, exact canonical key that normalizes to itself", () => {
    const entry = pkg.EXACT_REGISTRY[KEY];
    assert.ok(entry, `${KEY} is not in EXACT_REGISTRY`);
    assert.equal(entry.type, KEY);
    assert.equal(entry.lifecycle, "active");
    assert.equal(pkg.normalizeSignalType(KEY), KEY);
    assert.ok(pkg.listActiveSignalTypes().includes(KEY));
  });

  it("is BEHAVIORAL / weight 3 like the other consent.* keys — below buying_surge's floor (7)", () => {
    const entry = pkg.EXACT_REGISTRY[KEY];
    assert.equal(entry.category, "BEHAVIORAL");
    assert.equal(entry.weight, 3);
    assert.ok(entry.weight < 7);
  });

  it("does not shift the nurture goal (agreeing to be contacted is not a goal)", () => {
    assert.equal(pkg.EXACT_REGISTRY[KEY].goalShiftSemantics, false);
    assert.equal(pkg.isGoalShiftSignal(KEY), false);
  });

  it("is in the cross-language keyset (dist/signal-registry-keyset.json)", async () => {
    const { readFile } = await import("node:fs/promises");
    const keyset = JSON.parse(await readFile(new URL("../dist/signal-registry-keyset.json", import.meta.url), "utf8"));
    assert.ok(keyset.exactKeys.includes(KEY));
  });

  it("the payload schema is exported and accepts the contract shape (with and without the optional fields)", () => {
    assert.ok(schema, "consentCapturedDataSchema is not exported");
    assert.ok(schema.safeParse(valid).success);
    const { ipHash: _i, userAgent: _u, ...required } = valid;
    assert.ok(schema.safeParse(required).success);
    assert.ok(schema.safeParse({ ...valid, ipHash: null, userAgent: null }).success);
    assert.ok(schema.safeParse({ ...valid, channels: ["CONSENT_SMS", "CALL"] }).success, "channel order is free");
  });

  it("keeps the sentence verbatim — surrounding whitespace is part of the wording", () => {
    const padded = `  ${SENTENCE}\n`;
    const r = schema.safeParse({ ...valid, sentence: padded, sentenceSha256: sha(padded) });
    assert.ok(r.success);
    assert.equal(r.data.sentence, padded);
  });

  // Each mirrors a Rello #1538 payload refusal (outcome in the comment).
  const refused = [
    ["empty sentence (refused_empty_sentence)", { sentence: "" }],
    ["whitespace sentence (refused_empty_sentence)", { sentence: " \n\t " }],
    ["missing sentence (refused_empty_sentence)", { sentence: undefined }],
    ["sentence over 4000 chars (refused_invalid_payload)", { sentence: "x".repeat(4001) }],
    ["hash not hex (refused_hash_mismatch)", { sentenceSha256: "not-a-hash" }],
    ["missing hash (refused_hash_mismatch)", { sentenceSha256: undefined }],
    ["number not E.164 (refused_phone_not_e164)", { phoneE164: "801-555-0101" }],
    ["number without + (refused_phone_not_e164)", { phoneE164: "18015550101" }],
    ["unknown surface (refused_unknown_surface)", { surface: "somewhere-else" }],
    ["blank version (refused_invalid_payload)", { sentenceVersion: "  " }],
    ["version over 64 chars (refused_invalid_payload)", { sentenceVersion: "v".repeat(65) }],
    ["only one channel (refused_invalid_payload)", { channels: ["CONSENT_SMS"] }],
    ["duplicated channel (refused_invalid_payload)", { channels: ["CALL", "CALL"] }],
    ["a channel the surface does not grant (refused_invalid_payload)", { channels: ["CALL", "CONSENT_EMAIL"] }],
    ["capturedAt not an instant (refused_invalid_payload)", { capturedAt: "yesterday" }],
    ["raw IP instead of a hash (refused_invalid_payload)", { ipHash: "203.0.113.7" }],
    ["userAgent over 512 chars (refused_invalid_payload)", { userAgent: "u".repeat(513) }],
  ];
  for (const [name, over] of refused) {
    it(`refuses ${name}`, () => {
      const candidate = { ...valid, ...over };
      for (const [k, v] of Object.entries(over)) if (v === undefined) delete candidate[k];
      assert.equal(schema.safeParse(candidate).success, false);
    });
  }

  it("refuses any field outside the contract (.strict) — e.g. a raw IP, a name, an email", () => {
    for (const extra of [{ ipAddress: "203.0.113.7" }, { firstName: "Pat" }, { email: "pat@example.test" }]) {
      assert.equal(schema.safeParse({ ...valid, ...extra }).success, false, `accepted ${JSON.stringify(extra)}`);
    }
  });

  it("exports every outcome value Rello returns, each distinct", () => {
    const o = pkg.CONSENT_CAPTURE_OUTCOMES;
    assert.ok(Array.isArray(o));
    assert.equal(new Set(o).size, o.length);
    assert.deepEqual([...o].sort(), [
      "captured",
      "refused_empty_sentence",
      "refused_hash_mismatch",
      "refused_idempotency_conflict",
      "refused_invalid_payload",
      "refused_lead_not_in_tenant",
      "refused_phone_not_e164",
      "refused_phone_not_leads",
      "refused_source_not_allowed",
      "refused_tenant_not_authorized",
      "refused_unknown_surface",
      "replayed",
    ]);
  });

  it("exports the surface → channels map", () => {
    assert.deepEqual(pkg.CONSENT_CAPTURE_SURFACE_CHANNELS, { "check-your-rate:text-quote": ["CALL", "CONSENT_SMS"] });
  });
});
