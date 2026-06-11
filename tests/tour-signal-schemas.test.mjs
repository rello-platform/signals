// ─────────────────────────────────────────────────────────────────────────────
// OHH-SHOWINGS-AND-TOURS P4 tour payload schemas (v0.18.0) — regression block.
//
// The tour emitters are NOT yet landed (BPB 9.1: this minor ships with/before
// the emit PRs), so fixtures mirror the LOCKED contract
// (CONTRACT-TOUR-COMPANION-PAYLOAD-260611) rather than live emit sites.
// PRIVACY LOCK assertions: no accessInstructions field, hasNotes is a boolean
// only (notes text NEVER crosses the wire).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ohhTourLifecycleBaseDataSchema,
  ohhTourCreatedDataSchema,
  ohhTourCompletedDataSchema,
  hsTourStopRatedDataSchema,
} from "../dist/index.js";

const tourBase = {
  tourId: "ctur_0001",
  relloLeadId: "lead_0001",
  stopCount: 4,
  tourDate: "2026-06-14",
  action: "tour.create",
  actorUserId: "cusr_0001",
};

describe("open-house-hub.tour_* lifecycle schemas (v0.18.0)", () => {
  it("tour_created accepts the contract shape (relloLeadId present-but-null OK)", () => {
    assert.ok(ohhTourCreatedDataSchema.safeParse(tourBase).success);
    assert.ok(
      ohhTourCreatedDataSchema.safeParse({ ...tourBase, relloLeadId: null }).success,
    );
  });

  it("tourDate accepts both ISO date-only and full-datetime forms", () => {
    assert.ok(
      ohhTourLifecycleBaseDataSchema.safeParse({ ...tourBase, tourDate: "2026-06-14" }).success,
    );
    assert.ok(
      ohhTourLifecycleBaseDataSchema.safeParse({
        ...tourBase,
        tourDate: "2026-06-14T16:00:00.000Z",
      }).success,
    );
    assert.equal(
      ohhTourLifecycleBaseDataSchema.safeParse({ ...tourBase, tourDate: "June 14" }).success,
      false,
    );
  });

  it("rejects a missing audit-trail field (Rule-D mutation trail)", () => {
    const { actorUserId: _omit, ...noActor } = tourBase;
    assert.equal(ohhTourCreatedDataSchema.safeParse(noActor).success, false);
  });

  it("rejects non-integer / negative stopCount", () => {
    assert.equal(
      ohhTourCreatedDataSchema.safeParse({ ...tourBase, stopCount: 2.5 }).success,
      false,
    );
    assert.equal(
      ohhTourCreatedDataSchema.safeParse({ ...tourBase, stopCount: -1 }).success,
      false,
    );
  });

  it("tour_completed requires completedStops (int >= 0)", () => {
    assert.ok(
      ohhTourCompletedDataSchema.safeParse({
        ...tourBase,
        action: "tour.complete",
        completedStops: 3,
      }).success,
    );
    assert.equal(ohhTourCompletedDataSchema.safeParse(tourBase).success, false);
    assert.equal(
      ohhTourCompletedDataSchema.safeParse({
        ...tourBase,
        completedStops: -1,
      }).success,
      false,
    );
  });
});

describe("home-scout.tour_stop_rated schema (v0.18.0)", () => {
  const rated = {
    tourId: "ctur_0001",
    stopId: "cstp_0001",
    leadId: "lead_0001",
    rating: 4,
    hasNotes: true,
  };

  it("accepts the contract shape", () => {
    assert.ok(hsTourStopRatedDataSchema.safeParse(rated).success);
    assert.ok(hsTourStopRatedDataSchema.safeParse({ ...rated, hasNotes: false }).success);
  });

  it("rating is a 1-5 integer", () => {
    for (const r of [1, 2, 3, 4, 5]) {
      assert.ok(hsTourStopRatedDataSchema.safeParse({ ...rated, rating: r }).success);
    }
    for (const bad of [0, 6, 3.5, "4"]) {
      assert.equal(
        hsTourStopRatedDataSchema.safeParse({ ...rated, rating: bad }).success,
        false,
        `rating ${bad} should be rejected`,
      );
    }
  });

  it("hasNotes is boolean-only (PII floor — notes text never crosses)", () => {
    assert.equal(
      hsTourStopRatedDataSchema.safeParse({ ...rated, hasNotes: "loved the kitchen" }).success,
      false,
    );
  });

  it("leadId required (HS-local rating is lead-scoped)", () => {
    const { leadId: _omit, ...noLead } = rated;
    assert.equal(hsTourStopRatedDataSchema.safeParse(noLead).success, false);
  });
});
