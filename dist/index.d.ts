export { OhhAttendeeData, OhhAttendeeMarkedForPfpPreapprovalData, ohhAttendeeDataSchema, ohhAttendeeMarkedForPfpPreapprovalDataSchema } from './schemas/open-house-hub.js';
export { HsLeadMagnetSubmittedData, hsLeadMagnetSubmittedDataSchema } from './schemas/home-scout.js';
export { HhLeadIntakeData, hhLeadIntakeDataSchema } from './schemas/harvest-home.js';
export { ReportEngineReportReadyData, reportEngineReportReadyDataSchema } from './schemas/report-engine.js';
export { PfpComplianceConfigChangedData, PfpComplianceGateBlockedData, PfpExportFailedData, PfpExportInFlightData, PfpExportPermanentlyFailedData, PfpExportQueuedData, PfpExportSuccessData, pfpComplianceConfigChangedDataSchema, pfpComplianceGateBlockedDataSchema, pfpExportFailedDataSchema, pfpExportInFlightDataSchema, pfpExportPermanentlyFailedDataSchema, pfpExportQueuedDataSchema, pfpExportSuccessDataSchema } from './schemas/pathfinder-pro.js';
import 'zod';

/**
 * Canonical signalType brand per BPB §SLUG-AUTH §1 namespace #3:
 * `<canonical-platform-slug>.<event_verb>` — lowercase-hyphen slug, single dot, snake_case verb.
 *
 * Examples:
 * - `open-house-hub.attendee_marked_for_pfp_preapproval` ✅
 * - `pathfinder-pro.export.queued` ✅ (two-segment verb after the dot is acceptable)
 * - `home_scout.lead_intake` ❌ (underscore-form slug — legacy drift class)
 * - `home-scout.lead-magnet.submitted` ❌ (kebab in verb segment — forbidden)
 */
type SignalType = "open-house-hub.attendee_marked_for_pfp_preapproval" | "home-scout.lead_magnet_submitted" | "harvest-home.lead_intake" | "report-engine.report_ready" | "pathfinder-pro.export.queued" | "pathfinder-pro.export.in_flight" | "pathfinder-pro.export.success" | "pathfinder-pro.export.failed" | "pathfinder-pro.export.permanently_failed" | "pathfinder-pro.compliance.gate_blocked" | "pathfinder-pro.compliance.config_changed";

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

export { SIGNAL_PRIORITIES, SIGNAL_PRIORITY_RANK, type SignalPriority, type SignalType, isSignalPriority, meetsMinPriority };
