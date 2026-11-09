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
// locked product map, and the package's UPSELL_SOURCE_APPS must equal it.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GROWTH_PRODUCTS } from "@rello-platform/upgrade-content";
import { FAMILY_REGISTRY, normalizeSignalType, UPSELL_SOURCE_APPS } from "../dist/index.js";

const STANDALONE = Object.entries(GROWTH_PRODUCTS)
  .filter(([, product]) => product.kind === "standalone")
  .map(([slug]) => slug)
  .sort();

/** The family a canonical key resolves through (first match, as lookupFamily). */
function familyOf(canonical) {
  return FAMILY_REGISTRY.find((family) => canonical.startsWith(family.prefix));
}

describe("upsell families · one per standalone app", () => {
  it("the roster is real: eight standalone apps in the locked product map", () => {
    assert.equal(STANDALONE.length, 8);
    assert.ok(STANDALONE.includes("the-drumbeat"));
  });

  it("🔴 UPSELL_SOURCE_APPS is exactly the product map's standalone apps", () => {
    assert.deepEqual([...UPSELL_SOURCE_APPS].sort(), STANDALONE);
  });

  for (const app of STANDALONE) {
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

  it("exactly one upsell family per standalone app, and no other upsell family", () => {
    const upsell = FAMILY_REGISTRY.filter((f) => /^[a-z-]+\.upsell\.$/.test(f.prefix)).map((f) => f.prefix).sort();
    assert.deepEqual(upsell, STANDALONE.map((s) => `${s}.upsell.`));
  });
});

describe("upsell families · sources that are not standalone apps stay unregistered", () => {
  for (const raw of [
    "rello.upsell.x.converted", // the bundle: nothing to upsell to
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
