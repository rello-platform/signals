/**
 * Canonical signal-type registry schema — the per-type declarative entry.
 *
 * One canonical row per signal type. Collapses the three parallel
 * `Record<string, …>` maps that live in Rello today
 * (`SIGNAL_WEIGHTS`/`SIGNAL_CATEGORIES`/`PRIORITY_OVERRIDES`,
 * `constants.ts:8/352/663`) into a single row, making a weighted-but-
 * uncategorized type structurally unrepresentable (SPEC §1, Q12).
 *
 * Wave A ships the schema + a correct seed (the 14 existing canonical types +
 * the known prefix-families). The full ~250-key absorption is Wave C.
 */

import type { SignalCategory } from "./categories.js";
import type { SignalPriority } from "../signal-priority.js";

/**
 * The exact canonical signal-type keys that have a registered `EXACT_REGISTRY`
 * row. Declared as an explicit literal union (NOT derived from the registry
 * object) so `EXACT_REGISTRY: Record<ExactCanonicalSignalType, SignalTypeEntry>`
 * enforces per-key completeness at `tsc` time: a missing key or a stray
 * non-canonical key is a compile error.
 *
 * Seed = the 14 hand-curated canonical types shipped through v0.3.0
 * (`src/signal-type.ts` — the SPEC/surface-map label this "13", a known
 * pre-existing miscount; the actual union has 14 distinct members). The full
 * keyspace migrates in Wave C; this union grows additively as the registry
 * absorbs it.
 *
 * Canonical key form: `<canonical-hyphen-slug>.<snake_verb>` OR a registered
 * global-namespace key (`signal.*`/`score.*`/`system.*`/`consent.*`/
 * `checkpoint.*`). No global keys are seeded in Wave A (they arrive with the
 * Wave C keyspace absorption).
 */
export type ExactCanonicalSignalType =
  // OHH
  | "open-house-hub.attendee_marked_for_pfp_preapproval"
  // HS
  | "home-scout.lead_magnet_submitted"
  // HH
  | "harvest-home.lead_intake"
  // Report Engine
  | "report-engine.report_ready"
  // PFP export family
  | "pathfinder-pro.export.queued"
  | "pathfinder-pro.export.in_flight"
  | "pathfinder-pro.export.success"
  | "pathfinder-pro.export.failed"
  | "pathfinder-pro.export.permanently_failed"
  // PFP compliance family
  | "pathfinder-pro.compliance.gate_blocked"
  | "pathfinder-pro.compliance.config_changed"
  // Rello nurture escalate family
  | "rello.nurture_escalate_injected"
  | "rello.nurture_escalate_deduped"
  | "rello.nurture_escalate_injection_failed";

declare const FAMILY_BRAND: unique symbol;

/**
 * A canonical signal type that matched a registered `SignalTypeFamily` prefix
 * rather than an exact key (e.g. `home-scout.cta_clicked.book_a_call` matching
 * the `home-scout.cta_clicked.` family). Branded so the type system can
 * distinguish "registered via family" from an arbitrary string while still
 * carrying the underlying string value at runtime.
 */
export type FamilyCanonicalSignalType = string & {
  readonly [FAMILY_BRAND]: "family";
};

/**
 * The registry key type: a registered exact key OR a family-matched string.
 * Introduced in v0.4.0 as the canonical replacement for the deprecated
 * `SignalType` union (SPEC §8 decision 22). The `EXACT_REGISTRY` Record is
 * keyed by the exact-key component (`ExactCanonicalSignalType`) for strict
 * completeness; family keys resolve through `FAMILY_REGISTRY`.
 */
export type CanonicalSignalType =
  | ExactCanonicalSignalType
  | FamilyCanonicalSignalType;

/**
 * One canonical row per signal type. The single source of truth for a type's
 * classification axes + behavior flags.
 */
export interface SignalTypeEntry {
  /** Canonical key: `<canonical-hyphen-slug>.<snake_verb>` OR a global key. */
  readonly type: ExactCanonicalSignalType;

  // ── Declared classification axes (source of truth; not derivable) ──
  /** 1–10. */
  readonly weight: number;
  /** 8-value, package-owned (`categories.ts`). */
  readonly category: SignalCategory;
  /** Optional baseline; absent → weight-band derivation (SPEC §3, Q13). */
  readonly priority?: SignalPriority;

  // ── Declared behavior flags (absorb scattered consumer logic — Q6) ──
  /** Absorbs nurture-goals `NON_GOAL_SHIFT` set (`infer.ts:84`). Wave B reads this. */
  readonly goalShiftSemantics: boolean;
  /** Absorbs `NURTURE_EXCLUDE_SIGNAL_PREFIXES` (`exclude-registry.ts:33`). Wave C. */
  readonly auditTrailOnly?: boolean;
  /** Forces `narrativeMaterial=false` upstream of nurture re-eval. Wave C. */
  readonly nurtureExclude?: boolean;
  /** Rule-engine task-creation default. Wave C. */
  readonly taskCreationDefault?: boolean;
  /** Explicit low-value marker (NOT a silent default — Q11). */
  readonly tier?: "telemetry";
  /** Declarative special routing (Q18). */
  readonly routing?: "rate-alert-dispatch";

  // ── Derived-with-override (no free-floating boolean — Q6) ──
  /** Default DERIVED from `(category, weight)` via `isNarrativeMaterial()`. */
  readonly narrativeMaterialOverride?: boolean;
  /** Default DERIVED from `priority ∈ {CRITICAL,HIGH}` via `shouldAblyBroadcast()`. */
  readonly ablyBroadcastOverride?: boolean;

  // ── Lifecycle (Q19) ──
  /** `forensic` = registered, no live emitter (kept to classify historical rows). */
  readonly lifecycle: "active" | "forensic";
}

/**
 * A typed dynamic prefix-family — for helper-built types that cannot be static
 * literals (Oven/PFP/Scout dynamic types, audit families, upsell families).
 * Mirrors the existing `scout.cta_clicked.` prefix-match (`classifier.ts:36`).
 *
 * `prefix` is the **canonical** prefix (post-slug-fold), always ending in `.`
 * — e.g. `home-scout.cta_clicked.` (NOT the legacy `scout.cta_clicked.`, which
 * `normalizeSlug` folds `scout`→`home-scout` before family resolution).
 */
export interface SignalTypeFamily {
  readonly prefix: `${string}.`;
  readonly weight: number;
  readonly category: SignalCategory;
  readonly priority?: SignalPriority;
  readonly goalShiftSemantics: boolean;
  readonly lifecycle: "active" | "forensic";
}
