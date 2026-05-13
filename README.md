# @rello-platform/signals

Cross-app signal zod schemas + signalType taxonomy for the Rello platform.

This package is the **canonical home** for cross-app signal type definitions and their zod validation schemas, per `~SIGNAL-AND-WEBHOOK-PATTERNS-README.md` §9.1:

> ### 9.1 Layer 2 escalation signals
>
> Rello-canonical cross-app signal types live in
> `@rello-platform/signals` (zod schemas). Examples:
>
> - `journey_step_stalled` — Journey Engine emits when a step gates on
>   external state
> - `harvest-home.lead_intake` — HH owns the universal intake gateway; emits
>   on every new lead
>
> Each Layer 2 signal MUST cite its canonical owner per APP-OWNERSHIP-MATRIX.
> Adding a new cross-app signal requires:
>
> 1. Decide canonical owner (per APP-OWNERSHIP-MATRIX one-engine-per-class
>    discipline)
> 2. Define zod schema in `@rello-platform/signals` package
> 3. Publish package bump (`v0.X.Y`); push tag
> 4. Bump consumers in lockstep

## signalType naming discipline

Per `~SLUG-AUTH-DRIFT-PREVENTION-README.md` §1 namespace #3, every signalType is `<canonical-platform-slug>.<event_verb>` form:

- **slug segment**: lowercase-hyphen form from `@rello-platform/slugs` (`open-house-hub`, `home-scout`, `harvest-home`, `report-engine`, `pathfinder-pro`, etc.)
- **separator**: single `.`
- **verb segment**: snake_case (or dot-separated multi-segment for sub-families like `pathfinder-pro.export.queued`)

**Allowed examples:**

- `open-house-hub.attendee_marked_for_pfp_preapproval` ✅
- `pathfinder-pro.export.queued` ✅ (two-segment verb after the dot is acceptable for event families)
- `harvest-home.lead_intake` ✅

**Forbidden:**

- `home_scout.lead_intake` ❌ (underscore-form slug — legacy drift class)
- `home-scout.lead-magnet.submitted` ❌ (kebab in verb segment — forbidden)

## Installation

Consumers pin via explicit-ref SHA form:

```jsonc
{
  "dependencies": {
    "@rello-platform/signals": "github:rello-platform/signals#<full-sha>"
  }
}
```

GH Packages registry is also published (`https://github.com/rello-platform/signals/packages`); for nixpacks/Railway compatibility (per `feedback-rello-platform-packages-must-commit-dist-AND-be-public`), the `dist/` directory is committed and the repo is public, so unauthenticated `git+https` clones resolve cleanly.

## Usage

```ts
import {
  ohhAttendeeMarkedForPfpPreapprovalDataSchema,
  type SignalType,
} from "@rello-platform/signals";

// Sender side — validate before emit
const data = ohhAttendeeMarkedForPfpPreapprovalDataSchema.parse(payload);

// Receiver side (Rello /api/signals/batch) — validate per signalType
```

## Catalog growth discipline

Per BPB §9.1 step 2, every new cross-app signal type lands here as a zod schema before consumer code emits or receives it. Open a PR; bump `v0.X.Y`; tag; bump consumers.

Each schema file is keyed by the **emitting app** (the canonical owner per APP-OWNERSHIP-MATRIX one-engine-per-class lock):

- `src/schemas/open-house-hub.ts` — OHH-emitted signals
- `src/schemas/home-scout.ts` — HS-emitted signals
- `src/schemas/harvest-home.ts` — HH-emitted signals
- `src/schemas/report-engine.ts` — Report-Engine-emitted signals
- `src/schemas/pathfinder-pro.ts` — PFP-emitted signals

## Build

`tsup` build, ESM only, `dist/` committed.

```bash
npm install
npm run build
npm run typecheck
```

## License

UNLICENSED — internal Rello platform package.
