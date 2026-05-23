export { OhhAttendeeData, OhhAttendeeMarkedForPfpPreapprovalData, ohhAttendeeDataSchema, ohhAttendeeMarkedForPfpPreapprovalDataSchema } from './schemas/open-house-hub.js';
export { HsLeadMagnetSubmittedData, hsLeadMagnetSubmittedDataSchema } from './schemas/home-scout.js';
export { HhLeadIntakeData, hhLeadIntakeDataSchema } from './schemas/harvest-home.js';
export { ReportEngineReportReadyData, reportEngineReportReadyDataSchema } from './schemas/report-engine.js';
export { PfpComplianceConfigChangedData, PfpComplianceGateBlockedData, PfpExportFailedData, PfpExportInFlightData, PfpExportPermanentlyFailedData, PfpExportQueuedData, PfpExportSuccessData, pfpComplianceConfigChangedDataSchema, pfpComplianceGateBlockedDataSchema, pfpExportFailedDataSchema, pfpExportInFlightDataSchema, pfpExportPermanentlyFailedDataSchema, pfpExportQueuedDataSchema, pfpExportSuccessDataSchema } from './schemas/pathfinder-pro.js';
import 'zod';

/**
 * Canonical `SignalCategory` namespace for the Rello platform.
 *
 * 8-value union. Promoted into `@rello-platform/signals` v0.4.0 (Wave A of the
 * Signal-Type Registry workstream) because the registry types its own
 * `category` field (`SignalTypeEntry.category`) — the package can no longer
 * defer the vocabulary to a Rello-private declaration (SPEC §1.2 / §8
 * decision 10). `SignalPriority` already lives here (`signal-priority.ts`).
 *
 * Rello keeps a guarded local alias (`src/lib/signals/types.ts:7`) with a
 * mirror `_AssertSignalCategoryMatch` structural-equivalence drift-guard,
 * identical to the shipped `_AssertSignalPriorityMatch` at
 * `Rello/src/lib/signals/types.ts:11-25`. That Rello-side cross-package guard
 * is wired in Wave C; this file ships the canonical declaration plus a
 * package-internal self-consistency guard (below) so the literal union and the
 * runtime tuple can never silently diverge.
 */
/** Canonical 8-value signal category union. */
type SignalCategory = "ENGAGEMENT" | "READINESS" | "ANXIETY" | "FINANCIAL" | "BEHAVIORAL" | "NEGATIVE" | "SYSTEM" | "ESCALATION";
/**
 * Runtime tuple of every canonical `SignalCategory`. Useful for runtime
 * validation at trust-boundaries (spoke webhook decoders, admin form parsers)
 * and as the iteration source for completeness checks.
 *
 * Declared independently of the `SignalCategory` union (NOT derived from it) so
 * the drift-guard below is meaningful: editing one without the other is a
 * compile error.
 */
declare const SIGNAL_CATEGORIES: readonly ["ENGAGEMENT", "READINESS", "ANXIETY", "FINANCIAL", "BEHAVIORAL", "NEGATIVE", "SYSTEM", "ESCALATION"];
/** Type guard — narrows `unknown` to `SignalCategory`. */
declare function isSignalCategory(value: unknown): value is SignalCategory;

/**
 * Canonical SignalPriority namespace for the Rello platform.
 *
 * 4-value union, Signal-namespace, classifier-canonical. Matches what
 * `~/Rello/src/lib/signals/classifier.ts:42` emits, what
 * `~/Rello/src/lib/signals/ably-publisher.ts:23-25` consumes, and what every
 * spoke-boundary normalizer (`/api/signals/batch`, `/api/signals/openhousehub`)
 * outputs.
 *
 * Consumed by:
 * - `@rello-platform/precedence-authority` v0.1.0+ — `evaluatePrecedence()`
 *   compares signal priority against per-tenant `policy.minPreemptPriority`.
 * - Rello core — `SignalLog.priority` column + signal classifier + Ably
 *   downstream publisher.
 *
 * NOT this namespace:
 * - `'URGENT'` — Task-namespace (`~/Rello/src/app/api/admin/support/route.ts:13`
 *   + `milo/task-suggestions/route.ts:17` + `dashboard/tickets/route.ts:88`).
 *   Task.priority is a separate vocabulary; use a translator at the boundary.
 * - `'NORMAL'` — spoke-boundary form normalized to `'MEDIUM'` at
 *   `/api/signals/batch:43-54` before reaching the connector.
 * - lowercase 3-value — Milo framework-tones output namespace at
 *   `~/Milo-Engine/src/lib/blueprint-assembler.ts:76-90`.
 *
 * Promoted from Rello-private (`~/Rello/src/lib/signals/types.ts`) to shared
 * v0.2.0 per NURTURE-PRECEDENCE-AUTHORITY-SPEC-260520 Q7 lock + Vocabulary
 * Drift Resolution section (spec lines 700-733). Rello-side adds a
 * structural-equivalence drift guard mirroring `@rello-platform/enrollments`
 * Revision-C extraction precedent.
 */
type SignalPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
/**
 * Ordinal rank for SignalPriority comparison. Higher = more important.
 * Used by `meetsMinPriority()` for threshold checks.
 */
declare const SIGNAL_PRIORITY_RANK: Readonly<Record<SignalPriority, number>>;
/**
 * Returns true when `signalPriority` meets or exceeds the `minPolicy`
 * threshold per ordinal rank. Used by per-tenant precedence-authority
 * policy gates: `policy.minPreemptPriority='HIGH'` accepts HIGH + CRITICAL
 * signals; LOW/MEDIUM signals are blocked at the priority gate.
 *
 * @example
 *   meetsMinPriority('CRITICAL', 'HIGH') === true
 *   meetsMinPriority('MEDIUM', 'HIGH')   === false
 *   meetsMinPriority('HIGH', 'HIGH')     === true
 */
declare function meetsMinPriority(signalPriority: SignalPriority, minPolicy: SignalPriority): boolean;
/**
 * Set of canonical SignalPriority values. Useful for runtime validation at
 * trust-boundaries (spoke webhook decoders, admin form input parsers).
 */
declare const SIGNAL_PRIORITIES: readonly ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
/** Type guard — narrows unknown to SignalPriority. */
declare function isSignalPriority(value: unknown): value is SignalPriority;

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
type ExactCanonicalSignalType = "open-house-hub.attendee_marked_for_pfp_preapproval" | "home-scout.lead_magnet_submitted" | "harvest-home.lead_intake" | "report-engine.report_ready" | "pathfinder-pro.export.queued" | "pathfinder-pro.export.in_flight" | "pathfinder-pro.export.success" | "pathfinder-pro.export.failed" | "pathfinder-pro.export.permanently_failed" | "pathfinder-pro.compliance.gate_blocked" | "pathfinder-pro.compliance.config_changed" | "rello.nurture_escalate_injected" | "rello.nurture_escalate_deduped" | "rello.nurture_escalate_injection_failed" | "newsletter-studio.email_complained" | "newsletter-studio.email_unsubscribed" | "newsletter-studio.email_bounced";
declare const FAMILY_BRAND: unique symbol;
/**
 * A canonical signal type that matched a registered `SignalTypeFamily` prefix
 * rather than an exact key (e.g. `home-scout.cta_clicked.book_a_call` matching
 * the `home-scout.cta_clicked.` family). Branded so the type system can
 * distinguish "registered via family" from an arbitrary string while still
 * carrying the underlying string value at runtime.
 */
type FamilyCanonicalSignalType = string & {
    readonly [FAMILY_BRAND]: "family";
};
/**
 * The registry key type: a registered exact key OR a family-matched string.
 * Introduced in v0.4.0 as the canonical replacement for the deprecated
 * `SignalType` union (SPEC §8 decision 22). The `EXACT_REGISTRY` Record is
 * keyed by the exact-key component (`ExactCanonicalSignalType`) for strict
 * completeness; family keys resolve through `FAMILY_REGISTRY`.
 */
type CanonicalSignalType = ExactCanonicalSignalType | FamilyCanonicalSignalType;
/**
 * One canonical row per signal type. The single source of truth for a type's
 * classification axes + behavior flags.
 */
interface SignalTypeEntry {
    /** Canonical key: `<canonical-hyphen-slug>.<snake_verb>` OR a global key. */
    readonly type: ExactCanonicalSignalType;
    /** 1–10. */
    readonly weight: number;
    /** 8-value, package-owned (`categories.ts`). */
    readonly category: SignalCategory;
    /** Optional baseline; absent → weight-band derivation (SPEC §3, Q13). */
    readonly priority?: SignalPriority;
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
    /** Default DERIVED from `(category, weight)` via `isNarrativeMaterial()`. */
    readonly narrativeMaterialOverride?: boolean;
    /** Default DERIVED from `priority ∈ {CRITICAL,HIGH}` via `shouldAblyBroadcast()`. */
    readonly ablyBroadcastOverride?: boolean;
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
interface SignalTypeFamily {
    readonly prefix: `${string}.`;
    readonly weight: number;
    readonly category: SignalCategory;
    readonly priority?: SignalPriority;
    readonly goalShiftSemantics: boolean;
    readonly lifecycle: "active" | "forensic";
}

/**
 * Canonical signalType brand per BPB §SLUG-AUTH §1 namespace #3:
 * `<canonical-platform-slug>.<event_verb>` — lowercase-hyphen slug, single dot, snake_case verb.
 *
 * Examples:
 * - `open-house-hub.attendee_marked_for_pfp_preapproval` ✅
 * - `pathfinder-pro.export.queued` ✅ (two-segment verb after the dot is acceptable)
 * - `home_scout.lead_intake` ❌ (underscore-form slug — legacy drift class)
 * - `home-scout.lead-magnet.submitted` ❌ (kebab in verb segment — forbidden)
 *
 * @deprecated since v0.4.0 — use {@link CanonicalSignalType} from the registry
 * (`./registry/types.ts`). Retained UNCHANGED (NOT widened) for back-compat per
 * SPEC §8 decision 22: this alias still resolves to exactly the 13-key union it
 * always did (the registry's `ExactCanonicalSignalType`). `CanonicalSignalType`
 * additionally admits family-matched keys. Deleted no earlier than the second
 * coordinated breaking bump (Wave E).
 */
type SignalType = ExactCanonicalSignalType;

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

/**
 * Exact canonical signal-type keys → declarative entry. Keyed by the literal
 * union for `tsc`-time per-key completeness: a missing or stray key is a
 * compile error.
 */
declare const EXACT_REGISTRY: Record<ExactCanonicalSignalType, SignalTypeEntry>;
/**
 * Dynamic prefix-families. Completeness = "every emitted literal is an exact
 * registered key OR matches a registered family prefix" (SPEC §1).
 */
declare const FAMILY_REGISTRY: readonly SignalTypeFamily[];
/**
 * Look up an exact registry entry by canonical key. Returns `undefined` for
 * unregistered keys (the index type widens to `string` so the absence is
 * surfaced honestly rather than masked by the `Record` value type).
 */
declare function lookupExact(type: string): SignalTypeEntry | undefined;
/** Look up the first family whose prefix the canonical key starts with. */
declare function lookupFamily(type: string): SignalTypeFamily | undefined;

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
declare const DEPRECATED_SIGNALTYPE_PREFIX_ALIASES: Readonly<Record<string, {
    readonly to: string;
    readonly deprecated: true;
}>>;
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
declare function normalizeSignalType(raw: string | null | undefined): CanonicalSignalType | null;

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
declare function isGoalShiftSignal(rawType: string | null | undefined): boolean;
/**
 * The canonical coverage denominator: every `lifecycle:"active"` exact key.
 * Forensic entries (registered, no live emitter) are excluded per Q19.
 * Family prefixes are NOT enumerable types and are excluded here; the
 * cross-language keyset artifact (`dist/signal-registry-keyset.json`) carries
 * both active exact keys and family prefixes for the Report-Engine net.
 */
declare function listActiveSignalTypes(): ExactCanonicalSignalType[];
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
declare function isNarrativeMaterial(category: SignalCategory, weight: number): boolean;
/**
 * Derived default for `ablyBroadcast` — only CRITICAL/HIGH priority signals are
 * pushed to Ably. Mirrors `Rello/src/lib/signals/ably-publisher.ts:24`.
 * Consumers (Wave C) use `ablyBroadcastOverride` to escape this default (Q6).
 */
declare function shouldAblyBroadcast(priority: SignalPriority): boolean;

export { type CanonicalSignalType, DEPRECATED_SIGNALTYPE_PREFIX_ALIASES, EXACT_REGISTRY, type ExactCanonicalSignalType, FAMILY_REGISTRY, type FamilyCanonicalSignalType, SIGNAL_CATEGORIES, SIGNAL_PRIORITIES, SIGNAL_PRIORITY_RANK, type SignalCategory, type SignalPriority, type SignalType, type SignalTypeEntry, type SignalTypeFamily, isGoalShiftSignal, isNarrativeMaterial, isSignalCategory, isSignalPriority, listActiveSignalTypes, lookupExact, lookupFamily, meetsMinPriority, normalizeSignalType, shouldAblyBroadcast };
