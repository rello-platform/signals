// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM TRACKING SYSTEM S8-A (v0.42.0, PROPOSED) — the four `tracking.hot.*`
// signal types (plan §7).
//
// The tracking engine decides a hot moment (a pricing visit, a demo or book
// click, the 3rd session in 7 days, a trial that is ending with no use) and
// sends it over `POST /api/signals/batch`. Rello's router hands it to Growth's
// handler. Unlike `tracking.visit_summary` these ARE routed, so the category
// must not be SYSTEM (a SYSTEM key is a leadless audit key and never reaches the
// lead path) and must not feed `buying_surge` (READINESS / BEHAVIORAL, weight
// >= 7) or rebuild the narrative cache.
//
// Payload = plan §7 "Growth receives": { leadId, kind, app, topic?, path?,
// ctaId?, sessionCount?, at }, per type only the fields it uses, strict.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as pkg from "../dist/index.js";

const PRICING = "tracking.hot.pricing_visit";
const DEMO = "tracking.hot.demo_click";
const REPEAT = "tracking.hot.repeat_visits";
const TRIAL = "tracking.hot.trial_inactive";
const KEYS = [PRICING, DEMO, REPEAT, TRIAL];

const AT = "2026-11-24T04:10:00.000Z";
const valid = {
  [PRICING]: () => ({ leadId: "lead_1", kind: "pricing_visit", app: "rello", path: "/pricing", topic: "pricing", at: AT }),
  [DEMO]: () => ({ leadId: "lead_1", kind: "demo_click", app: "rello", ctaId: "demo", path: "/pricing", at: AT }),
  [REPEAT]: () => ({ leadId: "lead_1", kind: "repeat_visits", app: "rello", sessionCount: 3, at: AT }),
  [TRIAL]: () => ({ leadId: "lead_1", kind: "trial_inactive", app: "rello", at: AT }),
};
const schemaOf = (key) => pkg.trackingHotSignalSchemas?.[key];
const parse = (key, v) => schemaOf(key).safeParse(v);

describe("tracking.hot.* — registry (v0.42.0 proposed)", () => {
  for (const key of KEYS) {
    it(`${key} is a registered, active, exact canonical key that normalizes to itself`, () => {
      const entry = pkg.EXACT_REGISTRY[key];
      assert.ok(entry, `${key} is not in EXACT_REGISTRY`);
      assert.equal(entry.type, key);
      assert.equal(entry.lifecycle, "active");
      assert.equal(pkg.normalizeSignalType(key), key);
      assert.equal(pkg.normalizeSignalType(key.toUpperCase()), key);
    });

    it(`${key} is per-lead ENGAGEMENT: not SYSTEM, no goal shift, never narrative-material, never an Ably push`, () => {
      const e = pkg.EXACT_REGISTRY[key];
      assert.equal(e.category, "ENGAGEMENT");
      assert.notEqual(e.category, "SYSTEM");
      assert.equal(e.goalShiftSemantics, false);
      assert.equal(e.priority, "MEDIUM");
      assert.ok(e.weight >= 1 && e.weight <= 5, `weight ${e.weight}`);
      assert.equal(pkg.isNarrativeMaterial(e.category, e.weight), false);
      assert.equal(pkg.shouldAblyBroadcast(e.priority), false);
    });
  }

  it("the registry grew by exactly these four keys (378 → 382 exact, 370 → 374 active), families unchanged at 25; v0.43.0 then 383 / 375 / 26", () => {
    // v0.42.0: these four keys, so 378 → 382 exact, 370 → 374 active, families 25.
    // v0.43.0 (Home Insight HI-02, +1 exact, +1 family): home-scout.homeowner_loan_corrected
    // and the `rello.upsell.` family, so 382 → 383, 374 → 375, 25 → 26.
    assert.equal(Object.keys(pkg.EXACT_REGISTRY).length, 383);
    assert.equal(pkg.listActiveSignalTypes().length, 375);
    assert.equal(Object.keys(pkg.FAMILY_REGISTRY).length, 26);
  });

  it("exports the four names, the cta set and the repeat-visit floor", () => {
    assert.deepEqual([...pkg.TRACKING_HOT_SIGNAL_TYPES], KEYS);
    assert.deepEqual([...pkg.TRACKING_HOT_CTA_IDS], ["demo", "book", "trial", "contact"]);
    assert.equal(pkg.TRACKING_HOT_REPEAT_VISITS_MIN_SESSIONS, 3);
    assert.deepEqual(Object.keys(pkg.trackingHotSignalSchemas).sort(), [...KEYS].sort());
  });
});

describe("tracking.hot.* — payload schemas (plan §7 'Growth receives')", () => {
  for (const key of KEYS) {
    it(`${key}: a valid payload parses and the parsed value equals the input`, () => {
      const r = parse(key, valid[key]());
      assert.equal(r.success, true, JSON.stringify(r.error?.issues));
      assert.deepEqual(r.data, valid[key]());
    });

    it(`${key}: an extra field is refused (strict)`, () => {
      const r = parse(key, { ...valid[key](), email: "a@b.co" });
      assert.equal(r.success, false);
    });

    it(`${key}: a missing leadId, app or at is refused, and an empty leadId too`, () => {
      for (const f of ["leadId", "app", "at"]) {
        const v = valid[key](); delete v[f];
        assert.equal(parse(key, v).success, false, `${f} missing`);
      }
      assert.equal(parse(key, { ...valid[key](), leadId: "" }).success, false);
    });

    it(`${key}: kind must match the type, and another type's kind is refused`, () => {
      const own = valid[key]().kind;
      for (const k of ["pricing_visit", "demo_click", "repeat_visits", "trial_inactive"]) {
        const r = parse(key, { ...valid[key](), kind: k });
        assert.equal(r.success, k === own, `${key} with kind ${k}`);
      }
    });

    it(`${key}: at must be an ISO instant`, () => {
      for (const bad of ["yesterday", "2026-11-24", "", 1732421400000]) {
        assert.equal(parse(key, { ...valid[key](), at: bad }).success, false, String(bad));
      }
      assert.equal(parse(key, { ...valid[key](), at: "2026-11-24T04:10:00+00:00" }).success, true);
    });

    it(`${key}: app is a lowercase hyphenated slug`, () => {
      assert.equal(parse(key, { ...valid[key](), app: "pathfinder-pro" }).success, true);
      for (const bad of ["Rello", "has space", "", "a/b"]) {
        assert.equal(parse(key, { ...valid[key](), app: bad }).success, false, bad);
      }
    });
  }

  it("each type carries only the fields it uses: a field of another type is refused", () => {
    assert.equal(parse(PRICING, { ...valid[PRICING](), ctaId: "demo" }).success, false);
    assert.equal(parse(PRICING, { ...valid[PRICING](), sessionCount: 3 }).success, false);
    assert.equal(parse(DEMO, { ...valid[DEMO](), sessionCount: 3 }).success, false);
    assert.equal(parse(DEMO, { ...valid[DEMO](), topic: "pricing" }).success, false);
    assert.equal(parse(REPEAT, { ...valid[REPEAT](), ctaId: "demo" }).success, false);
    assert.equal(parse(REPEAT, { ...valid[REPEAT](), path: "/pricing" }).success, false);
    assert.equal(parse(TRIAL, { ...valid[TRIAL](), topic: "pricing" }).success, false);
    assert.equal(parse(TRIAL, { ...valid[TRIAL](), sessionCount: 3 }).success, false);
    assert.equal(parse(TRIAL, { ...valid[TRIAL](), path: "/x" }).success, false);
  });

  it("pricing_visit: topic and path are optional, and the minimal payload parses", () => {
    const v = valid[PRICING](); delete v.topic; delete v.path;
    assert.equal(parse(PRICING, v).success, true);
  });

  it("ctaId is exactly demo | book | trial | contact, and demo_click requires it", () => {
    for (const ok of ["demo", "book", "trial", "contact"]) {
      assert.equal(parse(DEMO, { ...valid[DEMO](), ctaId: ok }).success, true, ok);
    }
    for (const bad of ["signup", "DEMO", "", "demo ", "buy", 7, null]) {
      assert.equal(parse(DEMO, { ...valid[DEMO](), ctaId: bad }).success, false, String(bad));
    }
    const v = valid[DEMO](); delete v.ctaId;
    assert.equal(parse(DEMO, v).success, false);
  });

  it("sessionCount is an integer of at least 3, and repeat_visits requires it", () => {
    for (const ok of [3, 4, 50]) assert.equal(parse(REPEAT, { ...valid[REPEAT](), sessionCount: ok }).success, true, String(ok));
    for (const bad of [2, 1, 0, -3, 3.5, "3", null, Number.NaN]) {
      assert.equal(parse(REPEAT, { ...valid[REPEAT](), sessionCount: bad }).success, false, String(bad));
    }
    const v = valid[REPEAT](); delete v.sessionCount;
    assert.equal(parse(REPEAT, v).success, false);
  });

  it("path is a pathname: no query, no fragment, no host", () => {
    assert.equal(parse(PRICING, { ...valid[PRICING](), path: "/pricing" }).success, true);
    assert.equal(parse(PRICING, { ...valid[PRICING](), path: "/" }).success, true);
    for (const bad of ["/pricing?plan=pro", "/pricing#x", "https://hellorello.app/pricing", "pricing", ""]) {
      assert.equal(parse(PRICING, { ...valid[PRICING](), path: bad }).success, false, bad);
    }
  });

  it("topic uses the same shape as visit_summary topics", () => {
    for (const ok of ["pricing", "milo:smart-assistant"]) assert.equal(parse(PRICING, { ...valid[PRICING](), topic: ok }).success, true, ok);
    for (const bad of ["Pricing", "a b", "/pricing", "x?y", ""]) assert.equal(parse(PRICING, { ...valid[PRICING](), topic: bad }).success, false, bad);
  });
});
