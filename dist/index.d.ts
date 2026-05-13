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

export type { SignalType };
