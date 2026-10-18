// ─────────────────────────────────────────────────────────────────────────────
// Retired PathfinderPro compliance keys (v0.37.0; Nurture KA ruling 270,
// DISCOVERED #62 / #912, Kelly's per-signal walk 2026-06-10).
//
// `pathfinder-pro.compliance.gate_blocked` never had a platform emitter (PFP
// `gate.ts` writes `gate_blocked` as an audit-trail action, not a signal), and
// PFP's `compliance.config_changed` emit was removed at PFP 28ae17b. Neither
// type has a SignalLog / SignalLogArchive row or a SignalRule in production.
// The registry must stop advertising them, and the bare `compliance.` prefix
// alias that existed only to fold PFP's bare emit goes with them.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  EXACT_REGISTRY,
  DEPRECATED_SIGNALTYPE_PREFIX_ALIASES,
  normalizeSignalType,
  listActiveSignalTypes,
} from "../dist/index.js";

const RETIRED = [
  "pathfinder-pro.compliance.gate_blocked",
  "pathfinder-pro.compliance.config_changed",
];

const keyset = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "signal-registry-keyset.json"),
    "utf8",
  ),
);

describe("retired PFP compliance keys (v0.37.0)", () => {
  for (const key of RETIRED) {
    it(`${key} is not registered, not active, not in the keyset`, () => {
      assert.equal(Object.hasOwn(EXACT_REGISTRY, key), false);
      assert.equal(listActiveSignalTypes().includes(key), false);
      assert.equal(keyset.exactKeys.includes(key), false);
    });
    it(`${key} and its pfp. / bare compliance. spellings normalize to null`, () => {
      const verb = key.slice("pathfinder-pro.compliance.".length);
      assert.equal(normalizeSignalType(key), null);
      assert.equal(normalizeSignalType(`pfp.compliance.${verb}`), null);
      assert.equal(normalizeSignalType(`compliance.${verb}`), null);
    });
  }
  it("the bare compliance. prefix alias is gone; pfp. and mlo. stay", () => {
    assert.equal(Object.hasOwn(DEPRECATED_SIGNALTYPE_PREFIX_ALIASES, "compliance."), false);
    assert.deepEqual(Object.keys(DEPRECATED_SIGNALTYPE_PREFIX_ALIASES).sort(), ["mlo.", "pfp."]);
  });
  it("the five pathfinder-pro.export.* keys and exported_to_los are untouched", () => {
    const pfpKept = Object.keys(EXACT_REGISTRY).filter(
      (k) => k.startsWith("pathfinder-pro.export.") || k === "pathfinder-pro.exported_to_los",
    );
    assert.equal(pfpKept.length, 6);
    assert.equal(normalizeSignalType("pfp.export.queued"), "pathfinder-pro.export.queued");
  });
});
