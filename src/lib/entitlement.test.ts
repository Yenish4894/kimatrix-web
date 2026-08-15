import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decideGate, formatCountdown, toEntitlement } from "./entitlement";
import type { CompanyProfile } from "@/types";

/**
 * The access-control logic, which decides what a paying customer can see.
 *
 * It lives in `lib/` rather than inside the hook precisely so it can be tested without
 * mounting a provider tree — the decisions here are the ones where a bug costs somebody
 * either their access or their money.
 */

const profile = (over: Record<string, unknown>): CompanyProfile =>
  ({ id: "c1", name: "Probe Co", ...over }) as unknown as CompanyProfile;

const DAY = 86_400_000;
const HOUR = 3_600_000;
const NOW = Date.parse("2026-08-07T12:00:00Z");
const future = new Date(NOW + 3 * DAY).toISOString();
const past = new Date(NOW - 3 * DAY).toISOString();

describe("decideGate — the status x route matrix", () => {
  const cases: {
    label: string;
    p: Record<string, unknown>;
    dashboard: string;
    exportRoute: string;
  }[] = [
    {
      label: "trialing",
      p: { subscriptionStatus: "trialing", hasAccess: true, isTrial: true, accessUntil: future },
      dashboard: "children",
      exportRoute: "children",
    },
    {
      label: "active (paid)",
      p: { subscriptionStatus: "active", hasAccess: true, accessUntil: future },
      dashboard: "children",
      exportRoute: "children",
    },
    {
      label: "active (comped, perpetual)",
      p: { subscriptionStatus: "active", hasAccess: true, isComped: true, accessUntil: null },
      dashboard: "children",
      exportRoute: "children",
    },
    {
      label: "trial_expired",
      p: { subscriptionStatus: "trial_expired", hasAccess: false, canExport: true },
      dashboard: "paywall",
      exportRoute: "children",
    },
    {
      label: "expired",
      p: { subscriptionStatus: "expired", hasAccess: false, canExport: true },
      dashboard: "paywall",
      exportRoute: "children",
    },
    {
      label: "pending",
      p: { subscriptionStatus: "pending", hasAccess: false, canExport: true },
      dashboard: "paywall",
      exportRoute: "children",
    },
    {
      label: "deactivated",
      p: { subscriptionStatus: "deactivated", hasAccess: false, canExport: false },
      dashboard: "deactivated-notice",
      exportRoute: "deactivated-notice",
    },
  ];

  for (const c of cases) {
    it(`${c.label} on a data route -> ${c.dashboard}`, () => {
      assert.equal(decideGate(toEntitlement(profile(c.p), NOW), "/company/dashboard"), c.dashboard);
    });
    it(`${c.label} on billing -> always through`, () => {
      // A customer who cannot reach the payment page cannot pay, and rendering a
      // paywall on top of the payment page is a loop.
      assert.equal(decideGate(toEntitlement(profile(c.p), NOW), "/company/billing"), "children");
    });
    it(`${c.label} on export -> ${c.exportRoute}`, () => {
      // "Download your data and leave" is the other half of the deal. This route was
      // NOT allowed through, so the paywall's own "Download my data" button landed
      // straight back on the paywall — the only exit it offered was a dead end.
      //
      // The one exception is a banned company: the backend refuses its download, so
      // the gate must not hand it a page of buttons that 403.
      assert.equal(
        decideGate(toEntitlement(profile(c.p), NOW), "/company/export"),
        c.exportRoute,
      );
    });
  }
});

describe("decideGate — billing route matching", () => {
  const expired = toEntitlement(
    profile({ subscriptionStatus: "expired", hasAccess: false }),
    NOW,
  );

  for (const path of ["/company/billing", "/company/billing/success", "/company/billing/cancel"]) {
    it(`${path} passes through (the PayPal return lands here)`, () => {
      assert.equal(decideGate(expired, path), "children");
    });
  }

  it("a path that merely starts with the same text does NOT pass", () => {
    assert.equal(decideGate(expired, "/company/billing-history"), "paywall");
  });
});

describe("decideGate — deactivated outranks everything", () => {
  it("a banned company with live paid time still gets the notice, not the page", () => {
    const e = toEntitlement(
      profile({ subscriptionStatus: "deactivated", hasAccess: false, accessUntil: future }),
      NOW,
    );
    assert.equal(decideGate(e, "/company/dashboard"), "deactivated-notice");
  });

  it("and is the only state that loses export", () => {
    assert.equal(
      toEntitlement(profile({ subscriptionStatus: "deactivated", canExport: false }), NOW)
        .canExport,
      false,
    );
    for (const status of ["trial_expired", "expired", "pending"]) {
      assert.equal(
        toEntitlement(profile({ subscriptionStatus: status, canExport: true }), NOW).canExport,
        true,
        `${status} must keep export — it is the "download and leave" path`,
      );
    }
  });
});

describe("toEntitlement — the server's answer always wins", () => {
  it("a live expiry with no new fields reads as active (legacy backend)", () => {
    const e = toEntitlement(profile({ subscriptionExpiresAt: future }), NOW);
    assert.equal(e.hasAccess, true);
    assert.equal(e.status, "active");
  });

  it("a lapsed expiry with no new fields has no access", () => {
    assert.equal(toEntitlement(profile({ subscriptionExpiresAt: past }), NOW).hasAccess, false);
  });

  it("hasAccess beats a null date — the comped-company bug this replaces", () => {
    // The old client-side check treated a null expiry as "locked out" and bounced
    // comped companies to billing forever while their API calls succeeded.
    assert.equal(
      toEntitlement(profile({ hasAccess: true, subscriptionExpiresAt: null }), NOW).hasAccess,
      true,
    );
  });

  it("hasAccess beats a future date too — in BOTH directions", () => {
    assert.equal(
      toEntitlement(profile({ hasAccess: false, subscriptionExpiresAt: future }), NOW).hasAccess,
      false,
    );
  });
});

describe("formatCountdown — units", () => {
  const label = (ms: number): string => formatCountdown(ms).label;

  it("reads in days while there are several", () => assert.equal(label(7 * DAY), "7 days"));
  it("switches to hours inside two days, never '1 day'", () =>
    // A "1 day left" label sitting unchanged for 24 hours tells nobody whether to act
    // now or tomorrow, and a 7-day trial spends its most important stretch there.
    assert.equal(label(47 * HOUR), "47 hours"));
  it("90 minutes reads as 1 hour", () => assert.equal(label(90 * 60_000), "1 hour"));
  it("45 minutes reads in minutes", () => assert.equal(label(45 * 60_000), "45 minutes"));
  it("30 seconds reads as under a minute", () => assert.equal(label(30_000), "under a minute"));
  it("does not pluralise incorrectly", () => assert.equal(label(2 * DAY), "2 days"));

  it("zero is expired", () => assert.equal(formatCountdown(0).expired, true));
  it("negative is expired, not a huge number", () => {
    const c = formatCountdown(-5 * DAY);
    assert.equal(c.expired, true);
    assert.equal(c.label, "expired");
  });
});

describe("formatCountdown — urgency", () => {
  it("3 days is calm", () => assert.equal(formatCountdown(3 * DAY).urgency, "calm"));
  it("36 hours is warning", () => assert.equal(formatCountdown(36 * HOUR).urgency, "warning"));
  it("2 hours is urgent", () => assert.equal(formatCountdown(2 * HOUR).urgency, "urgent"));
  it("the 6-hour boundary is urgent", () =>
    assert.equal(formatCountdown(6 * HOUR).urgency, "urgent"));
});
