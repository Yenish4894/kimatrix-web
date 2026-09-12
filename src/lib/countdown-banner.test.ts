import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DAY,
  HOUR,
  countdownBannerKind,
  countdownCopy,
  formatCountdown,
  planDisplayName,
  type Entitlement,
} from "./entitlement";

const ent = (over: Partial<Entitlement>): Entitlement => ({
  status: "active",
  hasAccess: true,
  isTrial: false,
  isComped: false,
  canExport: true,
  accessUntil: new Date("2026-09-20T00:00:00Z"),
  ...over,
});

const text = (c: ReturnType<typeof countdownCopy>) => `${c.before}${c.emphasis}${c.after}`;

describe("countdownBannerKind", () => {
  it("shows the trial banner during a trial", () => {
    assert.equal(countdownBannerKind(ent({ isTrial: true, status: "trialing" })), "trial");
  });

  it("shows the paid banner on a paid plan", () => {
    assert.equal(countdownBannerKind(ent({})), "paid");
  });

  it("shows nothing when comped, with or without an end date", () => {
    assert.equal(countdownBannerKind(ent({ isComped: true, accessUntil: null })), null);
    assert.equal(countdownBannerKind(ent({ isComped: true })), null);
  });

  it("shows nothing without a deadline, without access, or without a profile", () => {
    assert.equal(countdownBannerKind(ent({ accessUntil: null })), null);
    assert.equal(countdownBannerKind(ent({ hasAccess: false, status: "expired" })), null);
    assert.equal(countdownBannerKind(null), null);
  });
});

describe("planDisplayName", () => {
  it("does not double the word plan", () => {
    assert.equal(planDisplayName("30 Day Plan"), "30 Day Plan");
    assert.equal(planDisplayName("Starter"), "Starter plan");
    assert.equal(planDisplayName("  "), "plan");
    assert.equal(planDisplayName(null), "plan");
  });
});

describe("countdownCopy", () => {
  it("keeps the existing trial wording", () => {
    assert.equal(text(countdownCopy("trial", formatCountdown(5 * DAY))), "Free trial — 5 days remaining.");
    assert.equal(text(countdownCopy("trial", formatCountdown(3 * HOUR))), "Your free trial ends in 3 hours.");
    assert.equal(countdownCopy("trial", formatCountdown(5 * DAY)).cta, "Choose a plan");
  });

  it("names the paid plan and offers Renew", () => {
    const c = countdownCopy("paid", formatCountdown(3 * DAY), { planName: "30 Day Plan" });
    assert.equal(text(c), "Your 30 Day Plan ends in 3 days.");
    assert.equal(c.cta, "Renew");
    assert.equal(c.href, "/company/billing");
  });

  it("falls back to 'plan' when the name is unknown", () => {
    assert.equal(text(countdownCopy("paid", formatCountdown(30 * HOUR))), "Your plan ends in 30 hours.");
  });

  it("says renews, and does not push Renew, for an active recurring subscription", () => {
    const c = countdownCopy("paid", formatCountdown(3 * DAY), { planName: "Monthly", renews: true });
    assert.equal(text(c), "Your Monthly plan renews in 3 days.");
    assert.equal(c.cta, "Manage billing");
  });
});
