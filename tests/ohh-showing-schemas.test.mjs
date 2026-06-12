// ─────────────────────────────────────────────────────────────────────────────
// OHH-SHOWINGS-AND-TOURS payload schemas (v0.17.0) — regression block.
//
// Fixtures mirror the LIVE emit sites @ OHH origin/main af0b718
// (src/lib/showings/lifecycle.ts data block + per-route extraData spreads +
// src/lib/feedback/record.ts:87 locked feedback shape). If a schema here
// starts rejecting one of these fixtures, the package has drifted from the
// emitter — fix the schema, not the fixture, unless the OHH emit site
// actually changed.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ohhShowingStatusSchema,
  ohhShowingLifecycleBaseDataSchema,
  ohhShowingRequestedDataSchema,
  ohhShowingConfirmedDataSchema,
  ohhShowingCanceledDataSchema,
  ohhShowingCompletedDataSchema,
  ohhShowingNoShowDataSchema,
  ohhShowingFeedbackResponseSchema,
  ohhShowingFeedbackDataSchema,
} from "../dist/index.js";

// Shared lifecycle data block exactly as lifecycle.ts builds it (every key
// always present; null-bearing fields null when unresolved).
const lifecycleBase = {
  showingId: "cshw_0001",
  propertyAddress: "123 Main St",
  scheduledAt: "2026-06-12T17:00:00.000Z",
  status: "REQUESTED",
  agentId: "cagt_0001",
  relloMeetingId: null,
  action: "showing.create",
  actorUserId: "cusr_0001",
};

describe("open-house-hub.showing_* lifecycle schemas (v0.17.0)", () => {
  it("status enum mirrors OHH prisma ShowingStatus exactly", () => {
    for (const s of ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELED", "NO_SHOW"]) {
      assert.equal(ohhShowingStatusSchema.parse(s), s);
    }
    assert.equal(ohhShowingStatusSchema.safeParse("PENDING").success, false);
  });

  it("base block accepts the lifecycle.ts shape (nullable fields present-but-null)", () => {
    assert.ok(ohhShowingLifecycleBaseDataSchema.safeParse(lifecycleBase).success);
    assert.ok(
      ohhShowingLifecycleBaseDataSchema.safeParse({
        ...lifecycleBase,
        scheduledAt: null,
        relloMeetingId: "meet_123",
      }).success,
    );
  });

  it("base block rejects a missing audit-trail field (Rule-D mutation trail)", () => {
    const { actorUserId: _omit, ...noActor } = lifecycleBase;
    assert.equal(ohhShowingLifecycleBaseDataSchema.safeParse(noActor).success, false);
  });

  it("showing_requested: requestedSlots ISO array or null (route.ts:255)", () => {
    assert.ok(
      ohhShowingRequestedDataSchema.safeParse({
        ...lifecycleBase,
        requestedSlots: ["2026-06-12T17:00:00.000Z", "2026-06-13T18:00:00.000Z"],
      }).success,
    );
    // Direct-confirm slotStart path: no proposed slots → null.
    assert.ok(
      ohhShowingRequestedDataSchema.safeParse({ ...lifecycleBase, requestedSlots: null })
        .success,
    );
    assert.equal(
      ohhShowingRequestedDataSchema.safeParse({
        ...lifecycleBase,
        requestedSlots: ["not-a-datetime"],
      }).success,
      false,
    );
  });

  it("showing_confirmed: slotStart required ISO + nullable videoMeetingUrl (confirm.ts:246)", () => {
    const confirmed = {
      ...lifecycleBase,
      status: "CONFIRMED",
      action: "showing.confirm",
      relloMeetingId: "meet_123",
      slotStart: "2026-06-12T17:00:00.000Z",
      videoMeetingUrl: null,
    };
    assert.ok(ohhShowingConfirmedDataSchema.safeParse(confirmed).success);
    const { slotStart: _omit, ...noSlot } = confirmed;
    assert.equal(ohhShowingConfirmedDataSchema.safeParse(noSlot).success, false);
  });

  it("showing_canceled: nullable reason + priorStatus snapshot (cancel/route.ts:154)", () => {
    assert.ok(
      ohhShowingCanceledDataSchema.safeParse({
        ...lifecycleBase,
        status: "CANCELED",
        action: "showing.cancel",
        reason: null,
        priorStatus: "CONFIRMED",
      }).success,
    );
    assert.equal(
      ohhShowingCanceledDataSchema.safeParse({
        ...lifecycleBase,
        status: "CANCELED",
        action: "showing.cancel",
        reason: "buyer rescheduled",
        priorStatus: "ARCHIVED", // not a ShowingStatus
      }).success,
      false,
    );
  });

  it("showing_completed / showing_no_show: base block only (no extraData)", () => {
    assert.ok(
      ohhShowingCompletedDataSchema.safeParse({
        ...lifecycleBase,
        status: "COMPLETED",
        action: "showing.complete",
      }).success,
    );
    assert.ok(
      ohhShowingNoShowDataSchema.safeParse({
        ...lifecycleBase,
        status: "NO_SHOW",
        action: "showing.no_show",
      }).success,
    );
  });
});

describe("open-house-hub.showing_feedback schema (v0.17.0)", () => {
  it("vocabulary is the EXACT three-option lock: loved | interested | not_for_me", () => {
    for (const r of ["loved", "interested", "not_for_me"]) {
      assert.equal(ohhShowingFeedbackResponseSchema.parse(r), r);
    }
    assert.equal(ohhShowingFeedbackResponseSchema.safeParse("hated").success, false);
  });

  it("accepts the live emitter shape (all keys present, nulls for unresolved)", () => {
    assert.ok(
      ohhShowingFeedbackDataSchema.safeParse({
        leadId: "lead_123",
        eventId: null,
        showingId: "cshw_0001",
        propertyAddress: "123 Main St, Provo, UT",
        response: "loved",
      }).success,
    );
  });

  it("accepts the lock-comment optional form (eventId?/showingId? absent) and empty propertyAddress", () => {
    assert.ok(
      ohhShowingFeedbackDataSchema.safeParse({
        leadId: null,
        propertyAddress: "",
        response: "not_for_me",
      }).success,
    );
  });

  it("rejects a payload missing the response", () => {
    assert.equal(
      ohhShowingFeedbackDataSchema.safeParse({
        leadId: "lead_123",
        propertyAddress: "123 Main St",
      }).success,
      false,
    );
  });

  // ── P5 (v0.19.0) additive extension: submitterRole ──
  it("P5: accepts submitterRole buyer | coop_agent, stays optional (pre-P5 emits omit it)", () => {
    for (const role of ["buyer", "coop_agent"]) {
      assert.ok(
        ohhShowingFeedbackDataSchema.safeParse({
          leadId: "lead_123",
          propertyAddress: "123 Main St",
          response: "interested",
          submitterRole: role,
        }).success,
        `submitterRole ${role} must parse`,
      );
    }
    // back-compat: absent key (the pre-P5 live emitter shape) still parses
    assert.ok(
      ohhShowingFeedbackDataSchema.safeParse({
        leadId: "lead_123",
        propertyAddress: "123 Main St",
        response: "interested",
      }).success,
    );
  });

  it("P5: rejects an unknown submitterRole and null (optional, NOT nullable)", () => {
    assert.equal(
      ohhShowingFeedbackDataSchema.safeParse({
        leadId: "lead_123",
        propertyAddress: "123 Main St",
        response: "interested",
        submitterRole: "listing_agent",
      }).success,
      false,
    );
    assert.equal(
      ohhShowingFeedbackDataSchema.safeParse({
        leadId: "lead_123",
        propertyAddress: "123 Main St",
        response: "interested",
        submitterRole: null,
      }).success,
      false,
    );
  });
});
