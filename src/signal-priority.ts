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

export type SignalPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

/**
 * Ordinal rank for SignalPriority comparison. Higher = more important.
 * Used by `meetsMinPriority()` for threshold checks.
 */
export const SIGNAL_PRIORITY_RANK: Readonly<Record<SignalPriority, number>> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

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
export function meetsMinPriority(
  signalPriority: SignalPriority,
  minPolicy: SignalPriority,
): boolean {
  return SIGNAL_PRIORITY_RANK[signalPriority] >= SIGNAL_PRIORITY_RANK[minPolicy];
}

/**
 * Set of canonical SignalPriority values. Useful for runtime validation at
 * trust-boundaries (spoke webhook decoders, admin form input parsers).
 */
export const SIGNAL_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

const SIGNAL_PRIORITY_SET: ReadonlySet<SignalPriority> = new Set<SignalPriority>(
  SIGNAL_PRIORITIES,
);

/** Type guard — narrows unknown to SignalPriority. */
export function isSignalPriority(value: unknown): value is SignalPriority {
  return typeof value === "string" && SIGNAL_PRIORITY_SET.has(value as SignalPriority);
}
