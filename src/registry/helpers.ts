/**
 * Registry-derived helper primitives.
 *
 * - `isGoalShiftSignal` — the Wave-B fix primitive (SPEC §8 decision 9). Wave B
 *   wires `inferNurtureGoal` to consult `isGoalShiftSignal(type)` so the
 *   prefixed-form bug (`harvest_home.email_complained` slipping past the bare
 *   `email_complained` exclusion) is closed at the source.
 * - `listActiveSignalTypes` — the admin source-of-truth coverage primitive
 *   (SPEC §8 decision 23). Returns the `lifecycle:"active"` exact keys; the
 *   Platform-Admin workstream builds the coverage UI on top of it.
 * - `isNarrativeMaterial` / `shouldAblyBroadcast` — the derived-default helpers
 *   that consumers (Wave C) use to compute `narrativeMaterial` / `ablyBroadcast`
 *   when no explicit override is declared. Mirror `classifier.ts:75-97` and
 *   `ably-publisher.ts:24`.
 */

import type { SignalCategory } from "./categories.js";
import type { SignalPriority } from "../signal-priority.js";
import type { ExactCanonicalSignalType } from "./types.js";
import { EXACT_REGISTRY, lookupExact, lookupFamily } from "./registry.js";
import { normalizeSignalType } from "./normalize.js";

/**
 * Does this signal type shift the lead's nurture goal?
 *
 * Returns `false` ONLY when the (normalized) type is registered AND its
 * `goalShiftSemantics` is `false`. Unregistered or unrecognized types
 * **fail open** (return `true`) — preserving the current fall-through-to-
 * inference behavior and ensuring the Wave-B gate never silently suppresses an
 * unknown signal (SPEC §8 decision 9).
 *
 * Accepts any raw form; normalizes internally so callers do not have to.
 */
export function isGoalShiftSignal(
  rawType: string | null | undefined,
): boolean {
  const canonical = normalizeSignalType(rawType);
  if (canonical === null) return true; // fail-open: unknown types shift goal

  const exact = lookupExact(canonical);
  if (exact) return exact.goalShiftSemantics;

  const family = lookupFamily(canonical);
  if (family) return family.goalShiftSemantics;

  return true; // resolved-but-unfound (defensive) — fail-open
}

/**
 * The canonical coverage denominator: every `lifecycle:"active"` exact key.
 * Forensic entries (registered, no live emitter) are excluded per Q19.
 * Family prefixes are NOT enumerable types and are excluded here; the
 * cross-language keyset artifact (`dist/signal-registry-keyset.json`) carries
 * both active exact keys and family prefixes for the Report-Engine net.
 */
export function listActiveSignalTypes(): ExactCanonicalSignalType[] {
  return (Object.keys(EXACT_REGISTRY) as ExactCanonicalSignalType[]).filter(
    (key) => EXACT_REGISTRY[key].lifecycle === "active",
  );
}

/**
 * Derived default for `narrativeMaterial` — does this signal change the lead's
 * story enough to warrant a Context Cache rebuild? Mirrors
 * `Rello/src/lib/signals/classifier.ts:75-97` exactly:
 *   - ANXIETY / NEGATIVE / ESCALATION → always material
 *   - FINANCIAL / READINESS / BEHAVIORAL → material iff weight ≥ 5
 *   - ENGAGEMENT / anything else → never material
 *
 * Consumers (Wave C) use the `narrativeMaterialOverride` entry field to escape
 * this default; there is no free-floating boolean (Q6).
 */
export function isNarrativeMaterial(
  category: SignalCategory,
  weight: number,
): boolean {
  if (category === "ANXIETY") return true;
  if (category === "NEGATIVE") return true;
  if (category === "ESCALATION") return true;
  if (
    category === "FINANCIAL" ||
    category === "READINESS" ||
    category === "BEHAVIORAL"
  ) {
    return weight >= 5;
  }
  return false;
}

/**
 * Derived default for `ablyBroadcast` — only CRITICAL/HIGH priority signals are
 * pushed to Ably. Mirrors `Rello/src/lib/signals/ably-publisher.ts:24`.
 * Consumers (Wave C) use `ablyBroadcastOverride` to escape this default (Q6).
 */
export function shouldAblyBroadcast(priority: SignalPriority): boolean {
  return priority === "CRITICAL" || priority === "HIGH";
}
