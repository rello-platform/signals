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
import type {
  CanonicalSignalType,
  ExactCanonicalSignalType,
} from "./types.js";
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
  // PHASE-B1: spoke-less namespaces for the registered build-guard violation
  // types. `agent.`/`rate.`/`data.` carry bucket-4 global first-class keys
  // (`agent.action_completed`, `rate.alert_triggered`, `data.stale`);
  // `daily_plan.` carries the bucket-3 `daily_plan.item_injected` monitoring
  // signal (Kelly: already-namespaced ops forms keep their namespace folded
  // canonical). None of these segments is a `@rello-platform/slugs` slug, so —
  // like `signal.`/`score.`/`consent.` — they cannot be slug-folded and must
  // match directly here.
  "agent.",
  "rate.",
  "data.",
  "daily_plan.",
  // PHASE-B1B: `email.received` is a real inbound-email engagement signal
  // emitted bare-dotted (`Rello email-sync.ts:626,893`). `email` is not a
  // `@rello-platform/slugs` slug (normalizeSlug returns null), so — like
  // `agent.`/`rate.`/`data.` — it cannot be slug-folded and must match here as
  // a global first-class namespace. The receiver leaves already-dotted forms
  // un-prefixed, so the live emit resolves directly (no emit-flip owed).
  "email.",
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

/**
 * Exact (whole-string) legacy → canonical aliases — HH legacy `signal.*`
 * namespace migration (v0.15.0; CROSS-REPO-WALK-DECISIONS-260609 Q6 step 1).
 *
 * Harvest-Home's 24 LIVE legacy `signal.*` emit types (per grep of HH
 * origin/main @ a40e4db — includes the `signal.byol.*` / `signal.intake.*`
 * types the manifest never declared; EXCLUDES manifest-only never-emitted
 * types such as `signal.lead.purchased`'s dead sibling `signal.lead.enriched`)
 * fold to canonical `harvest-home.<snake_verb>` single-dot form (registry doc
 * §2): strip the `signal.` namespace, join the remaining segments with `_`.
 * One exception: `signal.hh.idg_retry_synced` drops the redundant `hh`
 * segment (HH's own slug abbreviation, not a domain) → `idg_retry_synced`.
 *
 * Matching is exact + case-insensitive (keys are lowercase; the lookup uses
 * the lowercased working string), checked BEFORE the GLOBAL_PREFIXES branch so
 * the legacy forms fold instead of resolving to their legacy registry rows.
 * The legacy `signal.*` EXACT_REGISTRY rows are KEPT as a read-bridge
 * (historical SignalLog classification; Phase-3 retirement per registry doc
 * §9). The dynamic `signal.tool.*` family is NOT aliased (Home-Scout global
 * tool namespace — different owner, unchanged).
 */
export const LEGACY_SIGNALTYPE_EXACT_ALIASES: Readonly<
  Record<string, ExactCanonicalSignalType>
> = {
  "signal.byol.leads_imported": "harvest-home.byol_leads_imported",
  "signal.byol.leads_reactivated": "harvest-home.byol_leads_reactivated",
  "signal.byol.monitoring_started": "harvest-home.byol_monitoring_started",
  "signal.byol.parked_lead_signal_detected":
    "harvest-home.byol_parked_lead_signal_detected",
  "signal.byol.parked_leads_resurfaced":
    "harvest-home.byol_parked_leads_resurfaced",
  "signal.byol.push_calls_completed": "harvest-home.byol_push_calls_completed",
  "signal.byol.scoring_completed": "harvest-home.byol_scoring_completed",
  "signal.byol.upload_completed": "harvest-home.byol_upload_completed",
  "signal.credits.purchased": "harvest-home.credits_purchased",
  "signal.discovery.search": "harvest-home.discovery_search",
  "signal.discovery.unlock": "harvest-home.discovery_unlock",
  "signal.hh.idg_retry_synced": "harvest-home.idg_retry_synced",
  "signal.intake.lead_created": "harvest-home.intake_lead_created",
  "signal.intake.lead_enriched": "harvest-home.intake_lead_enriched",
  "signal.intake.lead_merged": "harvest-home.intake_lead_merged",
  "signal.intake.lead_rescored": "harvest-home.intake_lead_rescored",
  "signal.lead.contacted": "harvest-home.lead_contacted",
  "signal.lead.converted": "harvest-home.lead_converted",
  "signal.lead.delivered": "harvest-home.lead_delivered",
  "signal.lead.purchased": "harvest-home.lead_purchased",
  "signal.lead.scored": "harvest-home.lead_scored",
  "signal.pipeline.call_outcome": "harvest-home.pipeline_call_outcome",
  "signal.pipeline.session_completed":
    "harvest-home.pipeline_session_completed",
  "signal.pipeline.session_started": "harvest-home.pipeline_session_started",
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
 *   2b. exact legacy-alias substitution (HH signal.* → harvest-home.*; v0.15.0 Q6)
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

  // 2b. exact legacy-alias substitution (HH `signal.*` → `harvest-home.*`,
  //     v0.15.0 Q6). Checked BEFORE the global-namespace branch: these legacy
  //     forms start with the `signal.` global prefix and would otherwise
  //     resolve to their kept-as-read-bridge legacy registry rows. Exact,
  //     case-insensitive, whole-string match — the dynamic `signal.tool.*`
  //     family and any non-aliased `signal.*` key are untouched.
  const workingLower = working.toLowerCase();
  const exactAlias = LEGACY_SIGNALTYPE_EXACT_ALIASES[workingLower];
  if (exactAlias !== undefined) {
    return resolve(exactAlias) ?? warnUnrecognized(raw);
  }

  // 3. global namespace — match directly, lowercased (no slug to fold).
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
