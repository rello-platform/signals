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
  // v0.15.0 (CROSS-REPO-WALK Q6): HH legacy `signal.*` → canonical
  // `harvest-home.*` exact-alias map (additive export).
  LEGACY_SIGNALTYPE_EXACT_ALIASES,
  normalizeSignalType,
} from "./registry/normalize.js";
export {
  isGoalShiftSignal,
  isNarrativeMaterial,
  listActiveSignalTypes,
  shouldAblyBroadcast,
} from "./registry/helpers.js";

// ── Spoke-side signal-emit core (v0.14.0, Phase A — HH gold-standard
//    extraction; PURE ADDITION, no existing export changed) ──
// The emit module's lowercase SignalPriority ('critical'|'high'|'normal'|'low')
// is re-exported here as `EmitSignalPriority` so it cannot collide with the
// root's uppercase classifier-canonical `SignalPriority` above. Import from
// "@rello-platform/signals/emit" to get it under its canonical local name.
export { createSignalEmitter, mergeCustomFieldsIntoData } from "./emit.js";
export type {
  DispatchResult,
  Signal,
  SignalEmitter,
  SignalEmitterConfig,
  SignalPriority as EmitSignalPriority,
} from "./emit.js";

// OHH
export * from "./schemas/open-house-hub.js";
// HS
export * from "./schemas/home-scout.js";
// HH
export * from "./schemas/harvest-home.js";
// HomeReady
export * from "./schemas/home-ready.js";
// Report Engine
export * from "./schemas/report-engine.js";
// PFP
export * from "./schemas/pathfinder-pro.js";

// Future: a discriminator-style schema map for runtime signalType-keyed validation.
// Not in v0.1.0; consumers import the specific schema they expect at receiver.
