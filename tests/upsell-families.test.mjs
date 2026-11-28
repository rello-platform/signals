// `<source>.upsell.<seam>.<event>` — one family per standalone app (Platform KA
// prompt 784, RELLO UPSELL before Phase 4).
//
// Rello's trial-start emits `<source>.upsell.<seam>.converted`; Phase 4's spoke
// emitters send `<spoke>.upsell.<seam>.<event>` from all eight standalone apps.
// v0.39.0 registered only `the-drumbeat.upsell.`, so the other seven threw
// UnregisteredSignalTypeError at Rello and parked in FailedInboundSignal.
//
// The roster is NOT a hand list here: it is read from
// @rello-platform/upgrade-content's GROWTH_PRODUCTS (kind "standalone"), the
// locked product map, and the package's UPSELL_SOURCE_APPS must equal it plus
// the one hub source named below (HUB_UPSELL_SOURCE).
//
// v0.43.0 (Home Insight HI-02): the roster grows from 8 standalone emitters to
// 9. Rello itself becomes an upsell source, because a Home Insight account
// (Rello Plan.access GRANTS_ONLY) sees Rello's own surfaces locked and Rello
// emits `rello.upsell.<surface>.<shown|clicked|dismissed>` from those locked
// cards, banners, tabs and dialogs (spec RELLO-HOME-INSIGHT §14; Rello units
// HI-45 locks, HI-49 emits). Rello's Growth reader builds its pattern from this
// list (Rello src/lib/growth/upgrades-account.ts:242), so without `rello` here
// every one of those events is unreadable to Growth.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GROWTH_PRODUCTS } from "@rello-platform/upgrade-content";
import { FAMILY_REGISTRY, normalizeSignalType, UPSELL_SOURCE_APPS } from "../dist/index.js";

const STANDALONE = Object.entries(GROWTH_PRODUCTS)
  .filter(([, product]) => product.kind === "standalone")
  .map(([slug]) => slug)
  .sort();

/**
 * The one upsell source that is not a standalone app. Reason: Rello (the
 * bundle) has locked surfaces of its own on the Home Insight plan, and its
 * upsell events must reach the Growth reader (spec RELLO-HOME-INSIGHT §14,
 * HI-02). Named once, here; no other non-standalone slug is a source.
 */
const HUB_UPSELL_SOURCE = "rello";

/** Every upsell source: the standalone apps ∪ {rello}. */
const SOURCES = [...STANDALONE, HUB_UPSELL_SOURCE].sort();

/** The family a canonical key resolves through (first match, as lookupFamily). */
function familyOf(canonical) {
  return FAMILY_REGISTRY.find((family) => canonical.startsWith(family.prefix));
}

describe("upsell families · one per standalone app, plus rello", () => {
  it("the roster is real: eight standalone apps in the locked product map", () => {
    assert.equal(STANDALONE.length, 8);
    assert.ok(STANDALONE.includes("the-drumbeat"));
  });

  it("the hub source is real: `rello` is the product map's bundle, not a standalone app", () => {
    assert.equal(GROWTH_PRODUCTS[HUB_UPSELL_SOURCE]?.kind, "bundle");
    assert.ok(!STANDALONE.includes(HUB_UPSELL_SOURCE));
  });

  it("🔴 UPSELL_SOURCE_APPS is exactly the product map's standalone apps ∪ {rello} (8 → 9)", () => {
    assert.deepEqual([...UPSELL_SOURCE_APPS].sort(), SOURCES);
    assert.equal(UPSELL_SOURCE_APPS.length, 9);
  });

  it("🔴 rello.upsell.leads-pools.clicked resolves to the rello.upsell. family (weight 2, ENGAGEMENT, LOW)", () => {
    const canonical = normalizeSignalType("rello.upsell.leads-pools.clicked");
    assert.equal(canonical, "rello.upsell.leads_pools.clicked");
    const family = familyOf(canonical);
    assert.ok(family, `no family for ${canonical}`);
    assert.equal(family.prefix, "rello.upsell.");
    assert.equal(family.weight, 2);
    assert.equal(family.category, "ENGAGEMENT");
    assert.equal(family.priority, "LOW");
    assert.equal(family.goalShiftSemantics, false);
  });

  it("🔴 a Growth-reader pattern built from UPSELL_SOURCE_APPS reads Rello's three verbs (mirror of Rello upgrades-account.ts:242 @ 7737c3d5)", () => {
    // A COPY of the reader's construction, so this package can see what its
    // list does to it. Rello's own HI-49 test imports the real one.
    const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `^(${UPSELL_SOURCE_APPS.map(escapeRe).join("|")})\\.upsell\\.([a-z0-9-]+)\\.(shown|clicked|dismissed)$`,
    );
    for (const verb of ["shown", "clicked", "dismissed"]) {
      assert.match(`rello.upsell.leads-pools.${verb}`, re);
    }
    assert.doesNotMatch("home-scout.upsell.leads-pools.shown", re);
  });

  for (const app of SOURCES) {
    for (const event of ["converted", "clicked", "shown", "dismissed", "engaged"]) {
      it(`🔴 ${app}.upsell.<seam>.${event} resolves to the ${app}.upsell. family (weight 2, ENGAGEMENT, LOW, no goal shift, active)`, () => {
        const canonical = normalizeSignalType(`${app}.upsell.auto-task-hot-lead.${event}`);
        assert.equal(canonical, `${app}.upsell.auto_task_hot_lead.${event}`);
        const family = familyOf(canonical);
        assert.ok(family, `no family for ${canonical}`);
        assert.equal(family.prefix, `${app}.upsell.`);
        assert.equal(family.weight, 2);
        assert.equal(family.category, "ENGAGEMENT");
        assert.equal(family.priority, "LOW");
        assert.equal(family.goalShiftSemantics, false);
        assert.equal(family.lifecycle, "active");
      });
    }
  }

  it("exactly one upsell family per source (standalone ∪ {rello}), and no other upsell family", () => {
    const upsell = FAMILY_REGISTRY.filter((f) => /^[a-z-]+\.upsell\.$/.test(f.prefix)).map((f) => f.prefix).sort();
    assert.deepEqual(upsell, SOURCES.map((s) => `${s}.upsell.`));
  });
});

describe("upsell families · sources that are not upsell sources stay unregistered", () => {
  // `rello.upsell.*` left this list in v0.43.0 (HI-02): Rello is now a source.
  for (const raw of [
    "home-scout.upsell.x.converted", // a Rello feature, never sold alone
    "the-oven.upsell.x.converted", // a Rello feature, never sold alone
    "arive.upsell.x.converted",
    "home-readyy.upsell.x.converted", // misspelled slug
    "homeredy.upsell.x.converted", // misspelled slug
    "home-ready.upsells.x.converted", // not the upsell segment
    "home-ready.upsell", // no seam
  ]) {
    it(`🔴 ${raw} → null`, () => {
      assert.equal(normalizeSignalType(raw), null);
    });
  }

  it("a LEGACY slug spelling folds to the canonical slug, as for every family (drumbeat. → the-drumbeat. already did)", () => {
    // normalizeSlug folds `homeready` → `home-ready` (@rello-platform/slugs
    // LEGACY_ALIASES) before family resolution, so the canonical key is what
    // resolves; the raw legacy prefix is never itself a registered prefix.
    assert.equal(normalizeSignalType("homeready.upsell.x.converted"), "home-ready.upsell.x.converted");
    assert.equal(normalizeSignalType("drumbeat.upsell.x.clicked"), "the-drumbeat.upsell.x.clicked");
    assert.ok(!FAMILY_REGISTRY.some((f) => f.prefix === "homeready.upsell."));
  });
});
