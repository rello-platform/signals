// src/signal-priority.ts
var SIGNAL_PRIORITY_RANK = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};
function meetsMinPriority(signalPriority, minPolicy) {
  return SIGNAL_PRIORITY_RANK[signalPriority] >= SIGNAL_PRIORITY_RANK[minPolicy];
}
var SIGNAL_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
var SIGNAL_PRIORITY_SET = new Set(
  SIGNAL_PRIORITIES
);
function isSignalPriority(value) {
  return typeof value === "string" && SIGNAL_PRIORITY_SET.has(value);
}

// src/registry/categories.ts
var SIGNAL_CATEGORIES = [
  "ENGAGEMENT",
  "READINESS",
  "ANXIETY",
  "FINANCIAL",
  "BEHAVIORAL",
  "NEGATIVE",
  "SYSTEM",
  "ESCALATION"
];
var SIGNAL_CATEGORY_SET = new Set(
  SIGNAL_CATEGORIES
);
function isSignalCategory(value) {
  return typeof value === "string" && SIGNAL_CATEGORY_SET.has(value);
}

// src/registry/registry.ts
import { APP_SLUGS } from "@rello-platform/slugs";
var EXACT_REGISTRY = {
  // ── Open House Hub ──
  "open-house-hub.attendee_marked_for_pfp_preapproval": {
    type: "open-house-hub.attendee_marked_for_pfp_preapproval",
    weight: 6,
    // constants.ts:250
    category: "BEHAVIORAL",
    // constants.ts:571
    priority: "HIGH",
    // constants.ts:785
    goalShiftSemantics: true,
    lifecycle: "active"
  },
  // ── Home Scout ──
  "home-scout.lead_magnet_submitted": {
    type: "home-scout.lead_magnet_submitted",
    weight: 6,
    // constants.ts:267
    category: "BEHAVIORAL",
    // constants.ts:574
    priority: "HIGH",
    // constants.ts:789
    goalShiftSemantics: true,
    // RELLO-FIX-D2 forensic-preserve: registry entry KEPT with no live
    // emitter (constants.ts:255–267). lifecycle:"forensic" per SPEC §6 / Q19
    // — excluded from the emit-site requirement + admin coverage denominator.
    lifecycle: "forensic"
  },
  // ── Harvest Home ──
  "harvest-home.lead_intake": {
    type: "harvest-home.lead_intake",
    // NO constants.ts row → currently resolves to the silent DEFAULT
    // (DEFAULT_WEIGHT=3 / DEFAULT_CATEGORY="BEHAVIORAL", constants.ts:839–840).
    // Seeded at that effective production value (not invented); flagged in the
    // close companion for explicit reclassification in Wave C. HH is the
    // canonical lead-intake home (AOM); this is the universal intake gateway
    // signal (see src/schemas/harvest-home.ts).
    weight: 3,
    category: "BEHAVIORAL",
    goalShiftSemantics: true,
    lifecycle: "active"
  },
  // ── Report Engine ──
  "report-engine.report_ready": {
    type: "report-engine.report_ready",
    weight: 5,
    // constants.ts:107
    category: "BEHAVIORAL",
    // constants.ts:429
    // no PRIORITY_OVERRIDES row → weight-band (5 → MEDIUM) at classify time
    goalShiftSemantics: true,
    lifecycle: "active"
  },
  // ── Pathfinder Pro — export family ──
  "pathfinder-pro.export.queued": {
    type: "pathfinder-pro.export.queued",
    weight: 1,
    // constants.ts:223
    category: "ENGAGEMENT",
    // constants.ts:545
    goalShiftSemantics: true,
    lifecycle: "active"
  },
  "pathfinder-pro.export.in_flight": {
    type: "pathfinder-pro.export.in_flight",
    weight: 1,
    // constants.ts:224
    category: "ENGAGEMENT",
    // constants.ts:546
    goalShiftSemantics: true,
    lifecycle: "active"
  },
  "pathfinder-pro.export.success": {
    type: "pathfinder-pro.export.success",
    weight: 3,
    // constants.ts:225
    category: "ENGAGEMENT",
    // constants.ts:547
    priority: "MEDIUM",
    // constants.ts:766
    goalShiftSemantics: true,
    lifecycle: "active"
  },
  "pathfinder-pro.export.failed": {
    type: "pathfinder-pro.export.failed",
    weight: 5,
    // constants.ts:226
    category: "BEHAVIORAL",
    // constants.ts:548
    priority: "HIGH",
    // constants.ts:767
    goalShiftSemantics: true,
    lifecycle: "active"
  },
  "pathfinder-pro.export.permanently_failed": {
    type: "pathfinder-pro.export.permanently_failed",
    weight: 7,
    // constants.ts:227
    category: "BEHAVIORAL",
    // constants.ts:549
    priority: "CRITICAL",
    // constants.ts:768
    goalShiftSemantics: true,
    lifecycle: "active"
  },
  // ── Pathfinder Pro — compliance family ──
  "pathfinder-pro.compliance.gate_blocked": {
    type: "pathfinder-pro.compliance.gate_blocked",
    weight: 5,
    // constants.ts:240
    category: "BEHAVIORAL",
    // constants.ts:562
    priority: "HIGH",
    // constants.ts:780
    // compliance.* is a NON_GOAL_SHIFT prefix in nurture-goals
    // (`infer.ts:96`) — honest goalShiftSemantics:false. Wave B wires
    // isGoalShiftSignal() into inferNurtureGoal.
    goalShiftSemantics: false,
    lifecycle: "active"
  },
  "pathfinder-pro.compliance.config_changed": {
    type: "pathfinder-pro.compliance.config_changed",
    weight: 2,
    // constants.ts:241
    category: "ENGAGEMENT",
    // constants.ts:563
    goalShiftSemantics: false,
    // NON_GOAL_SHIFT compliance.* (infer.ts:96)
    lifecycle: "active"
  },
  // ── Rello — nurture escalate family ──
  // weight + priority from the emit-site caller-hints
  // (`src/lib/nurture/escalate.ts`); these types have NO constants.ts row so
  // category falls to the current DEFAULT "BEHAVIORAL" (flagged in the close
  // companion; Wave C may reclassify to ESCALATION). goalShiftSemantics:false
  // — system audit emissions about the nurture pipeline, not lead-goal shifts.
  "rello.nurture_escalate_injected": {
    type: "rello.nurture_escalate_injected",
    weight: 8,
    // escalate.ts:~304 caller-hint
    category: "BEHAVIORAL",
    priority: "HIGH",
    // escalate.ts:~303 caller-hint
    goalShiftSemantics: false,
    lifecycle: "active"
  },
  "rello.nurture_escalate_deduped": {
    type: "rello.nurture_escalate_deduped",
    weight: 4,
    // escalate.ts:~135 caller-hint
    category: "BEHAVIORAL",
    priority: "MEDIUM",
    // escalate.ts:~134 caller-hint
    goalShiftSemantics: false,
    lifecycle: "active"
  },
  "rello.nurture_escalate_injection_failed": {
    type: "rello.nurture_escalate_injection_failed",
    weight: 10,
    // escalate.ts:~321 caller-hint
    category: "BEHAVIORAL",
    priority: "CRITICAL",
    // escalate.ts:~320 caller-hint
    goalShiftSemantics: false,
    lifecycle: "active"
  }
};
var AUDIT_FAMILIES = APP_SLUGS.map((slug) => ({
  prefix: `${slug}.audit.`,
  weight: 1,
  category: "SYSTEM",
  goalShiftSemantics: false,
  lifecycle: "active"
}));
var FAMILY_REGISTRY = [
  // Home Scout dynamic CTA variants (45+). Canonical prefix is
  // `home-scout.cta_clicked.` — `normalizeSlug` folds the legacy `scout`
  // prefix (`classifier.ts:36` `scout.cta_clicked.`) to `home-scout`.
  // weight 4 BEHAVIORAL baseline per classifier.ts:36 (high-intent variants
  // like book-a-call are individually registered in Wave C).
  {
    prefix: "home-scout.cta_clicked.",
    weight: 4,
    category: "BEHAVIORAL",
    goalShiftSemantics: true,
    lifecycle: "active"
  },
  // The-Drumbeat upsell-nudge clicks: `the-drumbeat.upsell.<seam>.clicked`
  // (the-drumbeat `src/app/api/upsell/track-click/route.ts:58`, emitted "low"
  // priority). MLO-facing product telemetry, not lead-nurture.
  {
    prefix: "the-drumbeat.upsell.",
    weight: 2,
    category: "ENGAGEMENT",
    priority: "LOW",
    goalShiftSemantics: false,
    lifecycle: "active"
  },
  // Cross-app audit families (`<slug>.audit.<entity>.<action>`).
  ...AUDIT_FAMILIES
];
function lookupExact(type) {
  return EXACT_REGISTRY[type];
}
function lookupFamily(type) {
  return FAMILY_REGISTRY.find((family) => type.startsWith(family.prefix));
}

// src/registry/normalize.ts
import { normalizeSlug } from "@rello-platform/slugs";
var GLOBAL_PREFIXES = [
  "signal.",
  "score.",
  "system.",
  "consent.",
  "checkpoint."
];
var DEPRECATED_SIGNALTYPE_PREFIX_ALIASES = {
  "pfp.": { to: "pathfinder-pro.", deprecated: true },
  "mlo.": { to: "the-drumbeat.mlo.", deprecated: true }
  // `drumbeat.` is handled by normalizeSlug (drumbeat→the-drumbeat); no entry.
};
function warnUnrecognized(raw) {
  console.warn(
    `[@rello-platform/signals] Unrecognized signalType "${raw}" \u2014 not in the canonical registry (returning null).`
  );
  return null;
}
function resolve(canonical) {
  if (lookupExact(canonical)) return canonical;
  if (lookupFamily(canonical)) return canonical;
  return null;
}
function normalizeSignalType(raw) {
  if (raw === null || raw === void 0) return null;
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) return null;
  let working = trimmed;
  const lowered = trimmed.toLowerCase();
  for (const [legacyPrefix, mapping] of Object.entries(
    DEPRECATED_SIGNALTYPE_PREFIX_ALIASES
  )) {
    if (lowered.startsWith(legacyPrefix)) {
      working = mapping.to + working.slice(legacyPrefix.length);
      break;
    }
  }
  const workingLower = working.toLowerCase();
  if (GLOBAL_PREFIXES.some((prefix) => workingLower.startsWith(prefix))) {
    return resolve(workingLower) ?? warnUnrecognized(raw);
  }
  const dotIndex = working.indexOf(".");
  if (dotIndex === -1) {
    return warnUnrecognized(raw);
  }
  const slugPart = working.slice(0, dotIndex);
  const verbPart = working.slice(dotIndex + 1);
  const canonicalSlug = normalizeSlug(slugPart);
  if (canonicalSlug === null) {
    return null;
  }
  const canonicalVerb = verbPart.replace(/-/g, "_");
  const recomposed = `${canonicalSlug}.${canonicalVerb}`;
  return resolve(recomposed) ?? warnUnrecognized(raw);
}

// src/registry/helpers.ts
function isGoalShiftSignal(rawType) {
  const canonical = normalizeSignalType(rawType);
  if (canonical === null) return true;
  const exact = lookupExact(canonical);
  if (exact) return exact.goalShiftSemantics;
  const family = lookupFamily(canonical);
  if (family) return family.goalShiftSemantics;
  return true;
}
function listActiveSignalTypes() {
  return Object.keys(EXACT_REGISTRY).filter(
    (key) => EXACT_REGISTRY[key].lifecycle === "active"
  );
}
function isNarrativeMaterial(category, weight) {
  if (category === "ANXIETY") return true;
  if (category === "NEGATIVE") return true;
  if (category === "ESCALATION") return true;
  if (category === "FINANCIAL" || category === "READINESS" || category === "BEHAVIORAL") {
    return weight >= 5;
  }
  return false;
}
function shouldAblyBroadcast(priority) {
  return priority === "CRITICAL" || priority === "HIGH";
}

// src/schemas/open-house-hub.ts
import { z } from "zod";
var ohhAttendeeDataSchema = z.object({
  ohh_attendee_id: z.string().cuid(),
  ohh_first_name: z.string().min(1),
  ohh_last_name: z.string().min(1),
  ohh_email: z.string().email(),
  ohh_phone: z.string().nullable().optional(),
  ohh_visitor_type: z.string().nullable().optional(),
  ohh_is_pre_approved: z.boolean().nullable().optional(),
  ohh_is_hot_lead: z.boolean().nullable().optional(),
  ohh_wants_cma: z.boolean().nullable().optional(),
  ohh_needs_agent: z.boolean().nullable().optional(),
  ohh_mini_hr_completed: z.boolean().nullable().optional(),
  ohh_mini_hr_score: z.number().nullable().optional(),
  ohh_buying_timeframe: z.string().nullable().optional(),
  ohh_budget_range: z.string().nullable().optional(),
  ohh_financing_status: z.string().nullable().optional(),
  ohh_property_type_preference: z.string().nullable().optional(),
  ohh_event_id: z.string().cuid(),
  ohh_event_host_tenant_id: z.string().cuid(),
  ohh_event_date: z.string().datetime().nullable().optional()
});
var ohhAttendeeMarkedForPfpPreapprovalDataSchema = z.object({
  attendeeData: ohhAttendeeDataSchema,
  ohhEventId: z.string().cuid(),
  mloTenantId: z.string(),
  ohhEventHostTenantId: z.string().cuid(),
  ohhAttendeeId: z.string().cuid()
});

// src/schemas/home-scout.ts
import { z as z2 } from "zod";
var hsLeadMagnetSubmittedDataSchema = z2.object({
  scout_lead_magnet_id: z2.string(),
  scout_magnet_type: z2.string(),
  scout_visitor_email: z2.string().email(),
  scout_visitor_phone: z2.string().nullable().optional(),
  scout_visitor_first_name: z2.string().nullable().optional(),
  scout_visitor_last_name: z2.string().nullable().optional(),
  scout_intent_signal: z2.string().nullable().optional()
});

// src/schemas/harvest-home.ts
import { z as z3 } from "zod";
var hhLeadIntakeDataSchema = z3.object({
  hh_lead_id: z3.string().cuid(),
  hh_tenant_id: z3.string().cuid(),
  hh_source: z3.string(),
  hh_first_name: z3.string().nullable().optional(),
  hh_last_name: z3.string().nullable().optional(),
  hh_email: z3.string().email().nullable().optional(),
  hh_phone: z3.string().nullable().optional()
}).passthrough();

// src/schemas/report-engine.ts
import { z as z4 } from "zod";
var reportEngineReportReadyDataSchema = z4.object({
  reportId: z4.string(),
  reportUrl: z4.string().url(),
  reportType: z4.string(),
  tenantId: z4.string(),
  leadId: z4.string().nullable().optional()
}).passthrough();

// src/schemas/pathfinder-pro.ts
import { z as z5 } from "zod";
var pfpExportQueuedDataSchema = z5.object({
  pfp_export_id: z5.string(),
  pfp_export_kind: z5.enum(["rate-sheet", "scenario-summary", "los-package", "letter"]),
  pfp_target: z5.string().nullable().optional()
});
var pfpExportInFlightDataSchema = pfpExportQueuedDataSchema.extend({
  pfp_export_started_at: z5.string().datetime()
});
var pfpExportSuccessDataSchema = pfpExportQueuedDataSchema.extend({
  pfp_export_url: z5.string().url().nullable().optional(),
  pfp_export_completed_at: z5.string().datetime()
});
var pfpExportFailedDataSchema = pfpExportQueuedDataSchema.extend({
  pfp_export_error: z5.string(),
  pfp_export_attempt: z5.number().int().positive()
});
var pfpExportPermanentlyFailedDataSchema = pfpExportFailedDataSchema.extend({
  pfp_export_failed_permanently_at: z5.string().datetime()
});
var pfpComplianceGateBlockedDataSchema = z5.object({
  pfp_scenario_id: z5.string(),
  pfp_gate_kind: z5.string(),
  pfp_violation_reason: z5.string()
});
var pfpComplianceConfigChangedDataSchema = z5.object({
  pfp_config_kind: z5.string(),
  pfp_changed_by_user_id: z5.string(),
  pfp_change_summary: z5.string().nullable().optional()
});
export {
  DEPRECATED_SIGNALTYPE_PREFIX_ALIASES,
  EXACT_REGISTRY,
  FAMILY_REGISTRY,
  SIGNAL_CATEGORIES,
  SIGNAL_PRIORITIES,
  SIGNAL_PRIORITY_RANK,
  hhLeadIntakeDataSchema,
  hsLeadMagnetSubmittedDataSchema,
  isGoalShiftSignal,
  isNarrativeMaterial,
  isSignalCategory,
  isSignalPriority,
  listActiveSignalTypes,
  lookupExact,
  lookupFamily,
  meetsMinPriority,
  normalizeSignalType,
  ohhAttendeeDataSchema,
  ohhAttendeeMarkedForPfpPreapprovalDataSchema,
  pfpComplianceConfigChangedDataSchema,
  pfpComplianceGateBlockedDataSchema,
  pfpExportFailedDataSchema,
  pfpExportInFlightDataSchema,
  pfpExportPermanentlyFailedDataSchema,
  pfpExportQueuedDataSchema,
  pfpExportSuccessDataSchema,
  reportEngineReportReadyDataSchema,
  shouldAblyBroadcast
};
//# sourceMappingURL=index.js.map