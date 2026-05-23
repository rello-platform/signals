// @deprecated alias — see ./signal-type.ts. Kept for back-compat (SPEC §8 d22).
export type { SignalType } from "./signal-type.js";

export {
  SIGNAL_PRIORITIES,
  SIGNAL_PRIORITY_RANK,
  isSignalPriority,
  meetsMinPriority,
} from "./signal-priority.js";
export type { SignalPriority } from "./signal-priority.js";

// ── Signal-Type Registry (v0.4.0, Wave A) ──
export type {
  CanonicalSignalType,
  ExactCanonicalSignalType,
  FamilyCanonicalSignalType,
  SignalTypeEntry,
  SignalTypeFamily,
} from "./registry/types.js";
export { SIGNAL_CATEGORIES, isSignalCategory } from "./registry/categories.js";
export type { SignalCategory } from "./registry/categories.js";
export {
  EXACT_REGISTRY,
  FAMILY_REGISTRY,
  lookupExact,
  lookupFamily,
} from "./registry/registry.js";
export {
  DEPRECATED_SIGNALTYPE_PREFIX_ALIASES,
  normalizeSignalType,
} from "./registry/normalize.js";
export {
  isGoalShiftSignal,
  isNarrativeMaterial,
  listActiveSignalTypes,
  shouldAblyBroadcast,
} from "./registry/helpers.js";

// OHH
export * from "./schemas/open-house-hub.js";
// HS
export * from "./schemas/home-scout.js";
// HH
export * from "./schemas/harvest-home.js";
// Report Engine
export * from "./schemas/report-engine.js";
// PFP
export * from "./schemas/pathfinder-pro.js";

// Future: a discriminator-style schema map for runtime signalType-keyed validation.
// Not in v0.1.0; consumers import the specific schema they expect at receiver.
