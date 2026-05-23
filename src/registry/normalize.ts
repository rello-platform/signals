/**
 * `normalizeSignalType()` — fold any legacy signal-type form to its canonical
 * key, gated on registry membership.
 *
 * Mirrors the shipped `normalizeSlug()` pattern (`@rello-platform/slugs`
 * `src/index.ts:167`: trim → lower → canonical-set → legacy-alias → warn/null)
 * and reuses `normalizeSlug` for the slug segment. Replaces the receiver's
 * manufacture line (`Rello batch/route.ts:337,350`) in Wave D (SPEC §2, Q2).
 *
 * Wave A note: the registry holds only the 14 seed exact keys + 3 prefix-family
 * groups. A well-formed type whose canonical key is NOT yet seeded resolves to
 * `null` (+ a warn) — this is the documented, correct Wave-A behavior (SPEC §2
 * step 7; dispatch §2). The full keyspace migrates in Wave C, after which the
 * receiver (Wave D) routes through this function and every emitted type
 * resolves.
 */

import { normalizeSlug } from "@rello-platform/slugs";
import type { CanonicalSignalType } from "./types.js";
import { lookupExact, lookupFamily } from "./registry.js";

/**
 * Global, spoke-less namespaces (SPEC §1.1 / Q1 / Q5). These are first-class
 * registered keys, never spoke-prefixed; the normalizer matches them directly
 * and bypasses slug-folding (there is no slug to fold). No global keys are
 * seeded in Wave A — they arrive with the Wave C keyspace absorption.
 */
const GLOBAL_PREFIXES = [
  "signal.",
  "score.",
  "system.",
  "consent.",
  "checkpoint.",
] as const;

/**
 * Signal-type-namespace-only short/domain prefixes that `normalizeSlug` cannot
 * fold (SPEC §2.1). `deprecated:true` read-bridge ONLY — recognized solely to
 * classify historical rows; retired in Wave E, after which the completeness
 * test forbids them.
 *
 * - `pfp.` is NOT a `@rello-platform/slugs` alias (only
 *   `pathfinder`/`pathfinder_pro`/`pathfinderpro`) and was never a real
 *   `sourceApp` — it exists only as a signalType prefix in `constants.ts`, so
 *   it lives here, not in the slugs package (Q4).
 * - `mlo.` is a Drumbeat engine/domain prefix; the slug position held a domain,
 *   not a slug. Canonicalizes to `the-drumbeat.mlo.<verb>` (slug-owns-prefix,
 *   domain as sub-segment — the shipped `pathfinder-pro.export.*`/`compliance.*`
 *   precedent). Q-mlo / decision 24.
 *
 * Ordered longest-prefix-first is unnecessary here (prefixes are disjoint), but
 * matching is first-hit.
 */
export const DEPRECATED_SIGNALTYPE_PREFIX_ALIASES: Readonly<
  Record<string, { readonly to: string; readonly deprecated: true }>
> = {
  "pfp.": { to: "pathfinder-pro.", deprecated: true },
  "mlo.": { to: "the-drumbeat.mlo.", deprecated: true },
  // `compliance.` is a bare PFP domain prefix (the `mlo.` precedent): PFP emits
  // `compliance.config_changed` BARE (`PathfinderPro admin/compliance/config/
  // route.ts:323`, SURFACE-MAP §1.6) and — since it already contains a dot —
  // the receiver does NOT namespace-prefix it, so it persists as the bare
  // domain form, which `normalizeSlug` can't fold (`compliance` is not a slug).
  // Per §2.1 a bare domain prefix is never first-class; it canonicalizes under
  // its emitting spoke's slug → `pathfinder-pro.compliance.<verb>` (the
  // registered `goalShiftSemantics:false` family). This preserves the
  // pre-Wave-B `NON_GOAL_SHIFT_SIGNAL_PREFIXES = ['compliance.']` exclusion that
  // Wave B removes from `nurture-goals` (no-regression read-bridge; retired
  // Wave E once the receiver canonicalizes at ingest in Wave D).
  "compliance.": { to: "pathfinder-pro.compliance.", deprecated: true },
  // `drumbeat.` is handled by normalizeSlug (drumbeat→the-drumbeat); no entry.
};

function warnUnrecognized(raw: string): null {
  console.warn(
    `[@rello-platform/signals] Unrecognized signalType "${raw}" — not in the canonical registry (returning null).`,
  );
  return null;
}

/**
 * Resolve an already-canonicalized string against the registry: exact first,
 * then family prefixes. Returns the branded `CanonicalSignalType` or `null`.
 */
function resolve(canonical: string): CanonicalSignalType | null {
  if (lookupExact(canonical)) return canonical as CanonicalSignalType;
  if (lookupFamily(canonical)) return canonical as CanonicalSignalType;
  return null;
}

/**
 * Normalize any raw signal-type string to its canonical registered key, or
 * `null` if it is empty, malformed, or not (yet) registered.
 *
 * Algorithm (SPEC §2):
 *   1. null/empty → null
 *   2. §2.1 deprecated prefix-alias substitution (pfp./mlo.)
 *   3. global-namespace bypass (signal./score./system./consent./checkpoint.)
 *   4. split on the FIRST dot → [slugPart, verbPart]
 *   5. canonicalSlug = normalizeSlug(slugPart)  (reuses shipped slug machinery)
 *   6. canonicalVerb = verbPart with hyphens → underscores (verb segment only)
 *   7. recompose + resolve against EXACT then FAMILY; warn + null on miss
 */
export function normalizeSignalType(
  raw: string | null | undefined,
): CanonicalSignalType | null {
  // 1. null / empty (silent — matches normalizeSlug)
  if (raw === null || raw === undefined) return null;
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) return null;

  // 2. deprecated prefix-alias substitution (case-insensitive on the prefix;
  //    the remainder's case is preserved for the verb-fold below).
  let working = trimmed;
  const lowered = trimmed.toLowerCase();
  for (const [legacyPrefix, mapping] of Object.entries(
    DEPRECATED_SIGNALTYPE_PREFIX_ALIASES,
  )) {
    if (lowered.startsWith(legacyPrefix)) {
      working = mapping.to + working.slice(legacyPrefix.length);
      break;
    }
  }

  // 3. global namespace — match directly, lowercased (no slug to fold).
  const workingLower = working.toLowerCase();
  if (GLOBAL_PREFIXES.some((prefix) => workingLower.startsWith(prefix))) {
    return resolve(workingLower) ?? warnUnrecognized(raw);
  }

  // 4. split on the first dot.
  const dotIndex = working.indexOf(".");
  if (dotIndex === -1) {
    // Bare name, no namespace — the receiver supplies the slug at ingest
    // (Wave D, SPEC §2.2). Unresolvable here.
    return warnUnrecognized(raw);
  }
  const slugPart = working.slice(0, dotIndex);
  const verbPart = working.slice(dotIndex + 1);

  // 5. canonicalize the slug segment via the shipped slug machinery.
  const canonicalSlug = normalizeSlug(slugPart);
  if (canonicalSlug === null) {
    // normalizeSlug already warned about the unrecognized slug.
    return null;
  }

  // 6. hyphen → underscore in the verb segment only (folds CE hyphen-verbs;
  //    Q10). Case is otherwise preserved (e.g. audit `<entity>.<ACTION>`).
  const canonicalVerb = verbPart.replace(/-/g, "_");

  // 7. recompose + resolve.
  const recomposed = `${canonicalSlug}.${canonicalVerb}`;
  return resolve(recomposed) ?? warnUnrecognized(raw);
}
