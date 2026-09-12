import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canDownloadInvoice,
  formatPaymentAmount,
  formatPaymentPeriod,
  paymentKindLabel,
  paymentStatusBadge,
} from "./payments";

describe("paymentStatusBadge", () => {
  it("captured reads as Paid, in green", () => {
    assert.deepEqual(paymentStatusBadge("captured"), { label: "Paid", variant: "success" });
  });
  it("refunded is neutral, not an error", () => {
    assert.deepEqual(paymentStatusBadge("refunded"), { label: "Refunded", variant: "neutral" });
  });
  it("admin-only states each have a distinct tone", () => {
    assert.equal(paymentStatusBadge("pending").variant, "warning");
    assert.equal(paymentStatusBadge("capturing").label, "Processing");
    assert.equal(paymentStatusBadge("failed").variant, "error");
  });
  it("an unknown status renders as itself rather than blank", () => {
    assert.deepEqual(paymentStatusBadge("disputed"), { label: "disputed", variant: "neutral" });
  });
});

describe("paymentKindLabel", () => {
  it("maps known kinds", () => {
    assert.equal(paymentKindLabel("subscription_cycle"), "Subscription renewal");
    assert.equal(paymentKindLabel("spin_addon"), "Lucky draw spins");
  });
  it("falls back to the raw value", () => assert.equal(paymentKindLabel("credit"), "credit"));
});

describe("canDownloadInvoice", () => {
  it("only settled payments have an invoice", () => {
    assert.equal(canDownloadInvoice("captured"), true);
    assert.equal(canDownloadInvoice("refunded"), true);
    for (const s of ["pending", "capturing", "failed"]) assert.equal(canDownloadInvoice(s), false, s);
  });
});

describe("formatPaymentAmount", () => {
  it("uses the ISO code with two decimals", () => assert.equal(formatPaymentAmount("29", "usd"), "USD 29.00"));
  it("groups thousands", () => assert.equal(formatPaymentAmount("1234.5", "USD"), "USD 1,234.50"));
  it("does not print NaN", () => assert.equal(formatPaymentAmount("", "USD"), "USD —"));
});

describe("formatPaymentPeriod", () => {
  const fmt = (iso: string) => iso.slice(0, 10);
  it("both ends", () =>
    assert.equal(formatPaymentPeriod("2026-09-01T00:00:00Z", "2026-09-30T00:00:00Z", fmt), "2026-09-01 – 2026-09-30"));
  it("start only", () => assert.equal(formatPaymentPeriod("2026-09-01T00:00:00Z", null, fmt), "From 2026-09-01"));
  it("none, e.g. a spin add-on", () => assert.equal(formatPaymentPeriod(null, null, fmt), "—"));
});
