import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasLiveSubscription, isAwaitingFirstPayment } from "./billing";

describe("isAwaitingFirstPayment", () => {
  it("is true for a trial subscriber whose billing is deferred", () => {
    // The exact production record that surfaced this: subscribed mid-trial, PayPal
    // billing scheduled for the trial end date, nothing charged yet.
    assert.equal(
      isAwaitingFirstPayment({
        currentPeriodEnd: null,
        nextBillingTime: "2026-08-17T10:00:00.000Z",
      }),
      true,
    );
  });

  it("is false once a cycle has actually been charged", () => {
    assert.equal(
      isAwaitingFirstPayment({
        currentPeriodEnd: "2026-09-16T10:00:00.000Z",
        nextBillingTime: "2026-09-16T10:00:00.000Z",
      }),
      false,
    );
  });

  it("is false when there is no billing date at all", () => {
    // A cancelled subscription has neither — it must not claim a first payment is due.
    assert.equal(
      isAwaitingFirstPayment({ currentPeriodEnd: null, nextBillingTime: null }),
      false,
    );
  });
});

describe("hasLiveSubscription", () => {
  for (const status of ["pending", "active", "past_due", "pending_cancel"] as const) {
    it(`${status} counts as live — the plan picker must be hidden`, () => {
      assert.equal(hasLiveSubscription({ status }), true);
    });
  }

  for (const status of ["none", "cancelled", "expired", "suspended"] as const) {
    it(`${status} does not — the customer needs to be able to buy`, () => {
      assert.equal(hasLiveSubscription({ status }), false);
    });
  }

  it("treats a missing status as not-live, so the picker still renders", () => {
    // Fail open: hiding the only way to pay would be worse than showing it twice.
    assert.equal(hasLiveSubscription(null), false);
    assert.equal(hasLiveSubscription(undefined), false);
  });

  it("pending_cancel stays live — they keep access to the end of the paid period", () => {
    // They must not be able to start a second subscription on top of one that is
    // still running out.
    assert.equal(hasLiveSubscription({ status: "pending_cancel" }), true);
  });
});
