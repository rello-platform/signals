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
export type SignalType =
  // OHH
  | "open-house-hub.attendee_marked_for_pfp_preapproval"
  // HS
  | "home-scout.lead_magnet_submitted"
  // HH
  | "harvest-home.lead_intake"
  // Report Engine
  | "report-engine.report_ready"
  // PFP export family (D3 2026-05-13)
  | "pathfinder-pro.export.queued"
  | "pathfinder-pro.export.in_flight"
  | "pathfinder-pro.export.success"
  | "pathfinder-pro.export.failed"
  | "pathfinder-pro.export.permanently_failed"
  // PFP compliance family (D3 2026-05-13)
  | "pathfinder-pro.compliance.gate_blocked"
  | "pathfinder-pro.compliance.config_changed"
  // Rello nurture escalate family (P1-5 2026-05-21)
  | "rello.nurture_escalate_injected"
  | "rello.nurture_escalate_deduped"
  | "rello.nurture_escalate_injection_failed";

// Per BPB §SLUG-AUTH §1: only canonical hyphen-slug form. New entries grow via PR.
