export type { SignalType } from "./signal-type.js";

export {
  SIGNAL_PRIORITIES,
  SIGNAL_PRIORITY_RANK,
  isSignalPriority,
  meetsMinPriority,
} from "./signal-priority.js";
export type { SignalPriority } from "./signal-priority.js";

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
