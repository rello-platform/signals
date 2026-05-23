import type { ExactCanonicalSignalType } from "./registry/types.js";

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
export type SignalType = ExactCanonicalSignalType;
