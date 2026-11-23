# Changelog

Release notes before v0.41.0 live in the commit messages of each version's PR (`git log --oneline`); this file starts at the version below.

## v0.41.0 — 2026-11-23

PLATFORM TRACKING SYSTEM S7-S (Platform KA prompt 1746). Tagged v0.41.0.

- Registers `tracking.visit_summary` (exact key, active; weight 2, ENGAGEMENT, LOW, no goal shift) so Rello's receiver and classifier resolve it. Unregistered, Rello parks the signal as a failed inbound signal and dead-letters it.
- `tracking.` is added to the normalizer's global namespaces (`src/registry/normalize.ts`): `tracking` is not a `@rello-platform/slugs` slug, so without it the key cannot resolve.
- New `trackingVisitSummaryDataSchema` (`src/schemas/tracking.ts`), strict: `visitId`, `startedAt`, `endedAt`, `pageViews`, `topics` (at most 5 of `{ topic, score }`), `topicsComputedAt` (null when `topics` is `[]`). The whole payload is capped at 2048 bytes in the schema. No name, email, phone, address, path, query or IP field exists, and an extra key is refused.
- Exports: `TRACKING_VISIT_SUMMARY_SIGNAL_TYPE`, `TRACKING_VISIT_SUMMARY_MAX_TOPICS` (5), `TRACKING_VISIT_SUMMARY_MAX_BYTES` (2048), `TRACKING_TOPIC_PATTERN`, `trackingVisitSummaryDataSchema`, `TrackingVisitSummaryData`.
- Counts: exact registry 377 → 378, active keys and `dist/signal-registry-keyset.json` exactKeys 369 → 370; family prefixes unchanged at 25.
- Consumers: Rello re-pins to the tag once cut. Nothing else changes for them.
