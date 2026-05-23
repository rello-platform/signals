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
export type SignalCategory =
  | "ENGAGEMENT"
  | "READINESS"
  | "ANXIETY"
  | "FINANCIAL"
  | "BEHAVIORAL"
  | "NEGATIVE"
  | "SYSTEM"
  | "ESCALATION";

/**
 * Runtime tuple of every canonical `SignalCategory`. Useful for runtime
 * validation at trust-boundaries (spoke webhook decoders, admin form parsers)
 * and as the iteration source for completeness checks.
 *
 * Declared independently of the `SignalCategory` union (NOT derived from it) so
 * the drift-guard below is meaningful: editing one without the other is a
 * compile error.
 */
export const SIGNAL_CATEGORIES = [
  "ENGAGEMENT",
  "READINESS",
  "ANXIETY",
  "FINANCIAL",
  "BEHAVIORAL",
  "NEGATIVE",
  "SYSTEM",
  "ESCALATION",
] as const;

// ── Structural-equivalence drift guard (package-internal) ───────────────────
// Mirrors the shipped `_AssertSignalPriorityMatch` precedent
// (`Rello/src/lib/signals/types.ts:11-25`). If this fails to compile, the
// `SignalCategory` literal union and the `SIGNAL_CATEGORIES` runtime tuple have
// diverged (a value was added/removed from one but not the other). Keep both in
// lockstep. The Rello-side cross-package guard (local alias ⇔ this type) lands
// in Wave C.
type _CategoryTupleMember = (typeof SIGNAL_CATEGORIES)[number];
type _AssertSignalCategoryMatch = SignalCategory extends _CategoryTupleMember
  ? _CategoryTupleMember extends SignalCategory
    ? true
    : false
  : false;
const _assertSignalCategoryMatch: _AssertSignalCategoryMatch = true;
void _assertSignalCategoryMatch; // reference the guard so it is never tree-shaken

const SIGNAL_CATEGORY_SET: ReadonlySet<SignalCategory> = new Set<SignalCategory>(
  SIGNAL_CATEGORIES,
);

/** Type guard — narrows `unknown` to `SignalCategory`. */
export function isSignalCategory(value: unknown): value is SignalCategory {
  return (
    typeof value === "string" &&
    SIGNAL_CATEGORY_SET.has(value as SignalCategory)
  );
}
