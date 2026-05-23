/**
 * The canonical signal-type registry — seed (Wave A).
 *
 * `EXACT_REGISTRY` holds the 14 hand-curated canonical types shipped through
 * v0.3.0 (`src/signal-type.ts`) as full `SignalTypeEntry` rows (the SPEC/
 * surface-map label this "13" — a known pre-existing miscount; the actual
 * union has 14 distinct members). `FAMILY_REGISTRY` holds the known dynamic
 * prefix-families.
 *
 * SEED BOUNDARY (SPEC §7-A): Wave A ships the machinery + a correct seed, NOT
 * the full ~250-key keyspace. The `SIGNAL_WEIGHTS`/`SIGNAL_CATEGORIES`/
 * `PRIORITY_OVERRIDES` absorption is Wave C.
 *
 * Value provenance (verified against Rello `constants.ts @ origin/main`
 * `2a94659f` family, and `src/lib/nurture/escalate.ts` for the nurture-escalate
 * caller-hints):
 *   - weight  ← `SIGNAL_WEIGHTS`        (`constants.ts:8–349`)
 *   - category← `SIGNAL_CATEGORIES`     (`constants.ts:352–660`)
 *   - priority← `PRIORITY_OVERRIDES`    (`constants.ts:663–821`); omitted →
 *               weight-band derivation at classify time
 * Two entries have NO `constants.ts` row and are sourced/noted in the Wave A
 * close companion: `harvest-home.lead_intake` (effective silent-DEFAULT today)
 * and the three `rello.nurture_escalate_*` (weight+priority from the emit-site
 * caller-hints; category falls to the current DEFAULT `BEHAVIORAL`).
 */

import { APP_SLUGS } from "@rello-platform/slugs";
import type {
  ExactCanonicalSignalType,
  SignalTypeEntry,
  SignalTypeFamily,
} from "./types.js";

/**
 * Exact canonical signal-type keys → declarative entry. Keyed by the literal
 * union for `tsc`-time per-key completeness: a missing or stray key is a
 * compile error.
 */
export const EXACT_REGISTRY: Record<ExactCanonicalSignalType, SignalTypeEntry> =
  {
    // ── Open House Hub ──
    "open-house-hub.attendee_marked_for_pfp_preapproval": {
      type: "open-house-hub.attendee_marked_for_pfp_preapproval",
      weight: 6, // constants.ts:250
      category: "BEHAVIORAL", // constants.ts:571
      priority: "HIGH", // constants.ts:785
      goalShiftSemantics: true,
      lifecycle: "active",
    },

    // ── Home Scout ──
    "home-scout.lead_magnet_submitted": {
      type: "home-scout.lead_magnet_submitted",
      weight: 6, // constants.ts:267
      category: "BEHAVIORAL", // constants.ts:574
      priority: "HIGH", // constants.ts:789
      goalShiftSemantics: true,
      // RELLO-FIX-D2 forensic-preserve: registry entry KEPT with no live
      // emitter (constants.ts:255–267). lifecycle:"forensic" per SPEC §6 / Q19
      // — excluded from the emit-site requirement + admin coverage denominator.
      lifecycle: "forensic",
    },

    // ── Harvest Home ──
    "harvest-home.lead_intake": {
      type: "harvest-home.lead_intake",
      // NO constants.ts row → currently resolves to the silent DEFAULT
      // (DEFAULT_WEIGHT=3 / DEFAULT_CATEGORY="BEHAVIORAL", constants.ts:839–840).
      // Seeded at that effective production value (not invented); flagged in the
      // close companion for explicit reclassification in Wave C. HH is the
      // canonical lead-intake home (AOM); this is the universal intake gateway
      // signal (see src/schemas/harvest-home.ts).
      weight: 3,
      category: "BEHAVIORAL",
      goalShiftSemantics: true,
      lifecycle: "active",
    },

    // ── Report Engine ──
    "report-engine.report_ready": {
      type: "report-engine.report_ready",
      weight: 5, // constants.ts:107
      category: "BEHAVIORAL", // constants.ts:429
      // no PRIORITY_OVERRIDES row → weight-band (5 → MEDIUM) at classify time
      goalShiftSemantics: true,
      lifecycle: "active",
    },

    // ── Pathfinder Pro — export family ──
    "pathfinder-pro.export.queued": {
      type: "pathfinder-pro.export.queued",
      weight: 1, // constants.ts:223
      category: "ENGAGEMENT", // constants.ts:545
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.export.in_flight": {
      type: "pathfinder-pro.export.in_flight",
      weight: 1, // constants.ts:224
      category: "ENGAGEMENT", // constants.ts:546
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.export.success": {
      type: "pathfinder-pro.export.success",
      weight: 3, // constants.ts:225
      category: "ENGAGEMENT", // constants.ts:547
      priority: "MEDIUM", // constants.ts:766
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.export.failed": {
      type: "pathfinder-pro.export.failed",
      weight: 5, // constants.ts:226
      category: "BEHAVIORAL", // constants.ts:548
      priority: "HIGH", // constants.ts:767
      goalShiftSemantics: true,
      lifecycle: "active",
    },
    "pathfinder-pro.export.permanently_failed": {
      type: "pathfinder-pro.export.permanently_failed",
      weight: 7, // constants.ts:227
      category: "BEHAVIORAL", // constants.ts:549
      priority: "CRITICAL", // constants.ts:768
      goalShiftSemantics: true,
      lifecycle: "active",
    },

    // ── Pathfinder Pro — compliance family ──
    "pathfinder-pro.compliance.gate_blocked": {
      type: "pathfinder-pro.compliance.gate_blocked",
      weight: 5, // constants.ts:240
      category: "BEHAVIORAL", // constants.ts:562
      priority: "HIGH", // constants.ts:780
      // compliance.* is a NON_GOAL_SHIFT prefix in nurture-goals
      // (`infer.ts:96`) — honest goalShiftSemantics:false. Wave B wires
      // isGoalShiftSignal() into inferNurtureGoal.
      goalShiftSemantics: false,
      lifecycle: "active",
    },
    "pathfinder-pro.compliance.config_changed": {
      type: "pathfinder-pro.compliance.config_changed",
      weight: 2, // constants.ts:241
      category: "ENGAGEMENT", // constants.ts:563
      goalShiftSemantics: false, // NON_GOAL_SHIFT compliance.* (infer.ts:96)
      lifecycle: "active",
    },

    // ── Rello — nurture escalate family ──
    // weight + priority from the emit-site caller-hints
    // (`src/lib/nurture/escalate.ts`); these types have NO constants.ts row so
    // category falls to the current DEFAULT "BEHAVIORAL" (flagged in the close
    // companion; Wave C may reclassify to ESCALATION). goalShiftSemantics:false
    // — system audit emissions about the nurture pipeline, not lead-goal shifts.
    "rello.nurture_escalate_injected": {
      type: "rello.nurture_escalate_injected",
      weight: 8, // escalate.ts:~304 caller-hint
      category: "BEHAVIORAL",
      priority: "HIGH", // escalate.ts:~303 caller-hint
      goalShiftSemantics: false,
      lifecycle: "active",
    },
    "rello.nurture_escalate_deduped": {
      type: "rello.nurture_escalate_deduped",
      weight: 4, // escalate.ts:~135 caller-hint
      category: "BEHAVIORAL",
      priority: "MEDIUM", // escalate.ts:~134 caller-hint
      goalShiftSemantics: false,
      lifecycle: "active",
    },
    "rello.nurture_escalate_injection_failed": {
      type: "rello.nurture_escalate_injection_failed",
      weight: 10, // escalate.ts:~321 caller-hint
      category: "BEHAVIORAL",
      priority: "CRITICAL", // escalate.ts:~320 caller-hint
      goalShiftSemantics: false,
      lifecycle: "active",
    },
  };

/**
 * Audit-family prefixes — one canonical `<slug>.audit.` per canonical app slug,
 * generated from `APP_SLUGS`. Mirrors the shipped `isAuditSignal` matcher
 * (`Rello/src/lib/signals/handlers/auditSignal.ts`), which membership-checks
 * `parts[0]` against the `APP_SLUGS` catalog. `normalizeSlug` folds any legacy
 * slug form (underscore/concat) to canonical hyphen before family resolution,
 * so only the canonical-hyphen prefix needs registering.
 *
 * Audit signals are operational/observability rows (routed to `AuditLog`), not
 * lead-nurture signals: weight 1, SYSTEM, non-goal-shift.
 */
const AUDIT_FAMILIES: readonly SignalTypeFamily[] = APP_SLUGS.map((slug) => ({
  prefix: `${slug}.audit.` as `${string}.`,
  weight: 1,
  category: "SYSTEM" as const,
  goalShiftSemantics: false,
  lifecycle: "active" as const,
}));

/**
 * Dynamic prefix-families. Completeness = "every emitted literal is an exact
 * registered key OR matches a registered family prefix" (SPEC §1).
 */
export const FAMILY_REGISTRY: readonly SignalTypeFamily[] = [
  // Home Scout dynamic CTA variants (45+). Canonical prefix is
  // `home-scout.cta_clicked.` — `normalizeSlug` folds the legacy `scout`
  // prefix (`classifier.ts:36` `scout.cta_clicked.`) to `home-scout`.
  // weight 4 BEHAVIORAL baseline per classifier.ts:36 (high-intent variants
  // like book-a-call are individually registered in Wave C).
  {
    prefix: "home-scout.cta_clicked.",
    weight: 4,
    category: "BEHAVIORAL",
    goalShiftSemantics: true,
    lifecycle: "active",
  },
  // The-Drumbeat upsell-nudge clicks: `the-drumbeat.upsell.<seam>.clicked`
  // (the-drumbeat `src/app/api/upsell/track-click/route.ts:58`, emitted "low"
  // priority). MLO-facing product telemetry, not lead-nurture.
  {
    prefix: "the-drumbeat.upsell.",
    weight: 2,
    category: "ENGAGEMENT",
    priority: "LOW",
    goalShiftSemantics: false,
    lifecycle: "active",
  },
  // Cross-app audit families (`<slug>.audit.<entity>.<action>`).
  ...AUDIT_FAMILIES,
];

/**
 * Look up an exact registry entry by canonical key. Returns `undefined` for
 * unregistered keys (the index type widens to `string` so the absence is
 * surfaced honestly rather than masked by the `Record` value type).
 */
export function lookupExact(type: string): SignalTypeEntry | undefined {
  return (EXACT_REGISTRY as Record<string, SignalTypeEntry | undefined>)[type];
}

/** Look up the first family whose prefix the canonical key starts with. */
export function lookupFamily(type: string): SignalTypeFamily | undefined {
  return FAMILY_REGISTRY.find((family) => type.startsWith(family.prefix));
}
