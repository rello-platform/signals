// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM TRACKING SYSTEM S7-S (v0.41.0, PROPOSED) — `tracking.visit_summary`.
//
// The tracking engine sends one of these per identified visit, 30 minutes after
// the visit's last event (plan §6). Rello stores it as a SignalLog row on the
// lead, and compose reads the newest one's `topics` (plan §6 Rev 4, GD-2714).
//
// The cases below pin the payload contract the plan names: topics <= 5 as
// { topic, score }, `topicsComputedAt`, the whole payload <= 2 KB, strict (no
// field rides along), and a visit with no topics still sends.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as pkg from "../dist/index.js";

const KEY = "tracking.visit_summary";
const schema = pkg.trackingVisitSummaryDataSchema;

const valid = () => ({
  visitId: "v_01JD8Z3K4M5N6P7Q8R9S0T1V2W",
  startedAt: "2026-11-23T17:00:00.000Z",
  endedAt: "2026-11-23T17:12:41.000Z",
  pageViews: 4,
  topics: [
    { topic: "milo:smart-assistant", score: 12.5 },
    { topic: "pricing", score: 3 },
  ],
  topicsComputedAt: "2026-11-23T17:12:42.000Z",
});

const bytes = (o) => new TextEncoder().encode(JSON.stringify(o)).length;

describe(`${KEY} (v0.41.0 proposed)`, () => {
  it("is a registered, active, exact canonical key that normalizes to itself", () => {
    const entry = pkg.EXACT_REGISTRY[KEY];
    assert.ok(entry, `${KEY} is not in EXACT_REGISTRY`);
    assert.equal(entry.type, KEY);
    assert.equal(entry.lifecycle, "active");
    assert.equal(pkg.normalizeSignalType(KEY), KEY);
    assert.equal(pkg.normalizeSignalType("Tracking.Visit_Summary"), KEY);
  });

  it("is not lead-intent scoring input beyond engagement, and never shifts a nurture goal", () => {
    const entry = pkg.EXACT_REGISTRY[KEY];
    assert.equal(entry.category, "ENGAGEMENT");
    assert.equal(entry.goalShiftSemantics, false);
    assert.ok(entry.weight >= 1 && entry.weight <= 3, `weight ${entry.weight}`);
  });

  it("exports the signal-type constant and the two limits the plan names", () => {
    assert.equal(pkg.TRACKING_VISIT_SUMMARY_SIGNAL_TYPE, KEY);
    assert.equal(pkg.TRACKING_VISIT_SUMMARY_MAX_TOPICS, 5);
    assert.equal(pkg.TRACKING_VISIT_SUMMARY_MAX_BYTES, 2048);
  });

  it("a valid summary parses, and the parsed value equals the input", () => {
    const r = schema.safeParse(valid());
    assert.equal(r.success, true, JSON.stringify(r.error?.issues));
    assert.deepEqual(r.data, valid());
  });

  it("topics [] is accepted: a visit with no topics still sends (topicsComputedAt may be null)", () => {
    const a = schema.safeParse({ ...valid(), topics: [] });
    assert.equal(a.success, true, JSON.stringify(a.error?.issues));
    const b = schema.safeParse({ ...valid(), topics: [], topicsComputedAt: null });
    assert.equal(b.success, true, JSON.stringify(b.error?.issues));
  });

  it("exactly 5 topics are accepted (the boundary's good side)", () => {
    const topics = ["a", "b", "c", "d", "e"].map((t, i) => ({ topic: `site:${t}`, score: i }));
    const r = schema.safeParse({ ...valid(), topics });
    assert.equal(r.success, true, JSON.stringify(r.error?.issues));
  });

  it("6 topics are refused", () => {
    const topics = ["a", "b", "c", "d", "e", "f"].map((t, i) => ({ topic: `site:${t}`, score: i }));
    const r = schema.safeParse({ ...valid(), topics });
    assert.equal(r.success, false);
    assert.ok(r.error.issues.some((i) => i.path[0] === "topics"), "the refusal names topics");
  });

  it("a payload over 2 KB is refused even when every field is within its own limit", () => {
    const topics = Array.from({ length: 5 }, (_, i) => ({ topic: `${"a".repeat(125)}${i}:${"b".repeat(125)}`, score: 123456.789 + i }));
    const big = { ...valid(), visitId: "v".repeat(512), topics };
    assert.ok(bytes(big) > 2048, `fixture is ${bytes(big)} bytes, must exceed 2048`);
    // The control: the same shape, one field shorter, is under the cap and parses.
    const under = { ...big, visitId: "v".repeat(40) };
    assert.ok(bytes(under) <= 2048, `control is ${bytes(under)} bytes`);
    assert.equal(schema.safeParse(under).success, true, "the control parses");
    const r = schema.safeParse(big);
    assert.equal(r.success, false);
    assert.ok(r.error.issues.some((i) => /2048|2 KB/.test(i.message)), JSON.stringify(r.error.issues));
  });

  it("the cap is 2048 bytes: 2048 parses, 2049 is refused", () => {
    // Five 252-character topics leave ~470 bytes for visitId (limit 512), so the
    // 2048 boundary is reachable with every field inside its own limit.
    const topics = Array.from({ length: 5 }, (_, i) => ({ topic: `${"a".repeat(125)}${i}:${"b".repeat(125)}`, score: 1 }));
    const base = { ...valid(), topics };
    const pad = (n) => ({ ...base, visitId: "x".repeat(n) });
    const fixed = bytes(pad(1)) - 1;
    const at = pad(2048 - fixed);
    const over = pad(2049 - fixed);
    assert.ok(2048 - fixed <= 512, `visitId padding ${2048 - fixed} must fit its 512 limit`);
    assert.equal(bytes(at), 2048);
    assert.equal(bytes(over), 2049);
    assert.equal(schema.safeParse(at).success, true);
    assert.equal(schema.safeParse(over).success, false);
  });

  it("an extra key is refused, whatever it is called", () => {
    for (const k of ["name", "email", "phone", "address", "path", "query", "url", "ip", "leadId", "extra"]) {
      const r = schema.safeParse({ ...valid(), [k]: "x" });
      assert.equal(r.success, false, `extra key ${k} was accepted`);
    }
    const nested = schema.safeParse({ ...valid(), topics: [{ topic: "pricing", score: 1, path: "/pricing?x=1" }] });
    assert.equal(nested.success, false, "an extra key inside a topic was accepted");
  });

  it("a negative, NaN or infinite score is refused; 0 is accepted", () => {
    for (const score of [-1, -0.0001, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const r = schema.safeParse({ ...valid(), topics: [{ topic: "pricing", score }] });
      assert.equal(r.success, false, `score ${score} was accepted`);
    }
    for (const score of [0, 0.5, 1e6]) {
      const r = schema.safeParse({ ...valid(), topics: [{ topic: "pricing", score }] });
      assert.equal(r.success, true, `score ${score} was refused`);
    }
    const asString = schema.safeParse({ ...valid(), topics: [{ topic: "pricing", score: "3" }] });
    assert.equal(asString.success, false, "a string score was accepted");
  });

  it("a topic must be a data-section style id, optionally <app>:<id>: no spaces, case, paths or queries", () => {
    for (const topic of ["", "Pricing", "has space", "/pricing", "pricing?utm=1", "a:b:c", ":x", "x:", "x#frag", "é", "milo:smart assistant"]) {
      const r = schema.safeParse({ ...valid(), topics: [{ topic, score: 1 }] });
      assert.equal(r.success, false, `topic ${JSON.stringify(topic)} was accepted`);
    }
    for (const topic of ["pricing", "compare", "milo:smart-assistant", "the-drumbeat:video_messages", "a1"]) {
      const r = schema.safeParse({ ...valid(), topics: [{ topic, score: 1 }] });
      assert.equal(r.success, true, `topic ${JSON.stringify(topic)} was refused`);
    }
  });

  it("every required field is required", () => {
    for (const k of ["visitId", "startedAt", "endedAt", "pageViews", "topics", "topicsComputedAt"]) {
      const v = valid();
      delete v[k];
      assert.equal(schema.safeParse(v).success, false, `a summary without ${k} was accepted`);
    }
  });

  it("pageViews is a non-negative integer; the three times are ISO-8601 instants with an offset", () => {
    for (const pageViews of [-1, 1.5, Number.NaN, "4"]) {
      assert.equal(schema.safeParse({ ...valid(), pageViews }).success, false, `pageViews ${pageViews}`);
    }
    assert.equal(schema.safeParse({ ...valid(), pageViews: 0 }).success, true);
    for (const k of ["startedAt", "endedAt", "topicsComputedAt"]) {
      for (const bad of ["2026-11-23", "yesterday", "2026-11-23 17:00:00", 1764000000]) {
        assert.equal(schema.safeParse({ ...valid(), [k]: bad }).success, false, `${k} ${bad}`);
      }
    }
    assert.equal(schema.safeParse({ ...valid(), startedAt: "2026-11-23T10:00:00-07:00" }).success, true);
  });

  it("an empty visitId is refused", () => {
    assert.equal(schema.safeParse({ ...valid(), visitId: "" }).success, false);
  });
});
