# Changelog

Release notes before v0.41.0 live in the commit messages of each version's PR (`git log --oneline`); this file starts at the version below.

## v0.43.0

Home Insight HI-02 (spec `RELLO TO BE BUILT/BUILD-|-WORKSTREAM/RELLO-HOME-INSIGHT/_SPEC-FEATURE.md` §9 HI-02, §14). Not tagged: the Platform KA reviews before the tag.

- **The upsell source roster grows from 8 standalone emitters to 9 sources:** `"rello"` joins `UPSELL_SOURCE_APPS`, so `rello.upsell.` is a registered family (weight 2, `ENGAGEMENT`, `LOW`, no goal shift, the shape every upsell family has). Rello itself emits `rello.upsell.<surface>.<shown|clicked|dismissed>` from its own locked cards, banners, tabs and dialogs on the Home Insight plan (Rello `Plan.access` GRANTS_ONLY): Rello unit HI-45 locks the surfaces, HI-49 emits the events, with surface = the locked surface key without its `rello-` prefix. Rello's Growth reader builds its pattern from this list (Rello `src/lib/growth/upgrades-account.ts:242`), so a reach count over `public."AuditLog"` (`entityType = 'PlatformSignal'`, `"entityName" LIKE '%.upsell.%'`) reads against 9 sources from this release on, not 8.
- `tests/upsell-families.test.mjs` now pins the list to upgrade-content's standalone products **plus the one hub slug `rello`**, named once in the test with its reason; `rello.upsell.x.converted` left the "stays unregistered" list.
- Registers `home-scout.homeowner_loan_corrected` (exact, active; `BEHAVIORAL`, weight 5, `MEDIUM`, goal-shifting). Rello emits it with `{ fields[], refinancedElsewhere }` when a homeowner corrects their loan (spec §6 X-10, Rello HI-30). Weight 5 is what makes it narrative-material: Rello derives `narrativeMaterial` from (category, weight) and reads no per-entry override. Part A's `home-scout.loan_info_updated` is deliberately **not** registered (spec H-2, one loan signal).
- New strict payload schema `homeScoutHomeownerLoanCorrectedDataSchema` (`src/schemas/home-scout.ts`), spec §6 X-10 `{ fields, refinancedElsewhere }`: `fields` is a non-empty, duplicate-free array of the correction field names (`balance`, `rate`, `monthlyPayment`, `lender`, `newLender`, `newRate`, `refinancedMonth`; at most those 7), and `refinancedElsewhere` is a boolean. An unknown key (a loan value, a tenant, a lead id) is refused: the loan values live only in Property Engine's lien overrides (spec L-5). Exports: `HOME_SCOUT_HOMEOWNER_LOAN_CORRECTED_SIGNAL_TYPE`, `HOME_SCOUT_HOMEOWNER_LOAN_CORRECTION_FIELDS`, `homeScoutHomeownerLoanCorrectedDataSchema`, `HomeScoutHomeownerLoanCorrectionField`, `HomeScoutHomeownerLoanCorrectedData`.
- Counts: exact registry 382 → 383, active keys and `dist/signal-registry-keyset.json` exactKeys 374 → 375, family prefixes 25 → 26.
- Consumers: Rello re-pins in HI-06. No Growth code changes.

## v0.42.0

PLATFORM TRACKING SYSTEM S8, part A (Platform KA prompt 1824). Nothing here is published or tagged; `package.json` still says 0.41.0.

- Registers the four hot-moment types the tracking engine sends to Rello (plan §7): `tracking.hot.pricing_visit`, `tracking.hot.demo_click`, `tracking.hot.repeat_visits`, `tracking.hot.trial_inactive`. All four: exact, active, `ENGAGEMENT`, priority `MEDIUM`, no goal shift; weights 4, 5, 3, 2. Unlike `tracking.visit_summary` these are routed (Rello's router hands them to Growth's handler), so the category is not `SYSTEM` (Rello's `check:signal-handlers` sends a SYSTEM key down the leadless-audit path, never the lead path). `ENGAGEMENT` is never narrative-material, is outside `buying_surge`'s READINESS / BEHAVIORAL list, and `MEDIUM` is not pushed to Ably. The plan names no weight, category or priority: the KA may change them before the tag.
- New strict payload schemas in `src/schemas/tracking.ts`, plan §7 "Growth receives" `{ leadId, kind, app, topic?, path?, ctaId?, sessionCount?, at }`, per type only the fields it uses: `pricing_visit` (`topic?`, `path?`), `demo_click` (`ctaId` required, one of `demo | book | trial | contact`; `path?`), `repeat_visits` (`sessionCount` required, an integer of at least 3), `trial_inactive` (none). `kind` must equal the type's suffix, `at` is an ISO instant, `path` is a pathname with no query or fragment, `app` is a lowercase hyphenated slug.
- Exports: `TRACKING_HOT_SIGNAL_TYPES`, `TRACKING_HOT_CTA_IDS`, `TRACKING_HOT_REPEAT_VISITS_MIN_SESSIONS` (3), the four `TRACKING_HOT_*_SIGNAL_TYPE` constants, `trackingHotPricingVisitDataSchema`, `trackingHotDemoClickDataSchema`, `trackingHotRepeatVisitsDataSchema`, `trackingHotTrialInactiveDataSchema`, `trackingHotSignalSchemas` (keyed by type) and the matching types.
- Counts: exact registry 378 → 382, active keys and `dist/signal-registry-keyset.json` exactKeys 370 → 374; family prefixes unchanged at 25. All 378 earlier entries compare deep-equal before and after.
- Consumers: Rello re-pins once the tag is cut and then needs a router route to Growth's handler (the four keys are not baseline entries; `check:signal-handlers` will ask for a type-keyed guard).

## v0.41.0 — 2026-11-23

PLATFORM TRACKING SYSTEM S7-S (Platform KA prompt 1746). Tagged v0.41.0.

- Registers `tracking.visit_summary` (exact key, active; weight 2, ENGAGEMENT, LOW, no goal shift) so Rello's receiver and classifier resolve it. Unregistered, Rello parks the signal as a failed inbound signal and dead-letters it.
- `tracking.` is added to the normalizer's global namespaces (`src/registry/normalize.ts`): `tracking` is not a `@rello-platform/slugs` slug, so without it the key cannot resolve.
- New `trackingVisitSummaryDataSchema` (`src/schemas/tracking.ts`), strict: `visitId`, `startedAt`, `endedAt`, `pageViews`, `topics` (at most 5 of `{ topic, score }`), `topicsComputedAt` (null when `topics` is `[]`). The whole payload is capped at 2048 bytes in the schema. No name, email, phone, address, path, query or IP field exists, and an extra key is refused.
- Exports: `TRACKING_VISIT_SUMMARY_SIGNAL_TYPE`, `TRACKING_VISIT_SUMMARY_MAX_TOPICS` (5), `TRACKING_VISIT_SUMMARY_MAX_BYTES` (2048), `TRACKING_TOPIC_PATTERN`, `trackingVisitSummaryDataSchema`, `TrackingVisitSummaryData`.
- Counts: exact registry 377 → 378, active keys and `dist/signal-registry-keyset.json` exactKeys 369 → 370; family prefixes unchanged at 25.
- Consumers: Rello re-pins to the tag once cut. Nothing else changes for them.
