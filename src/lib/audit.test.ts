import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  auditChangeRows,
  formatAuditValue,
  hasAuditDetails,
  humanizeAuditAction,
  humanizeFieldKey,
} from "./audit";

describe("humanizeAuditAction", () => {
  it("turns dotted snake_case into a sentence", () => {
    assert.equal(humanizeAuditAction("company.trial_extended"), "Company trial extended");
  });

  it("keeps acronyms and brand names cased", () => {
    assert.equal(humanizeAuditAction("qr.regenerated"), "QR regenerated");
    assert.equal(humanizeAuditAction("paypal_webhook.received"), "PayPal webhook received");
  });

  it("handles camelCase, kebab-case and colons", () => {
    assert.equal(humanizeAuditAction("purchaseVoided"), "Purchase voided");
    assert.equal(humanizeAuditAction("email-change:confirmed"), "Email change confirmed");
  });

  it("never returns an empty label", () => {
    assert.equal(humanizeAuditAction(""), "Unknown action");
    assert.equal(humanizeAuditAction(null), "Unknown action");
    assert.equal(humanizeAuditAction("..."), "...");
  });
});

describe("humanizeFieldKey", () => {
  it("humanizes camelCase and nested keys", () => {
    assert.equal(humanizeFieldKey("subscriptionStatus"), "Subscription status");
    assert.equal(humanizeFieldKey("owner.emailVerifiedAt"), "Owner › Email verified at");
    assert.equal(humanizeFieldKey("qrToken"), "QR token");
  });
});

describe("formatAuditValue", () => {
  it("renders empties, booleans and numbers readably", () => {
    assert.equal(formatAuditValue(null), "—");
    assert.equal(formatAuditValue(undefined), "—");
    assert.equal(formatAuditValue(""), "—");
    assert.equal(formatAuditValue(true), "Yes");
    assert.equal(formatAuditValue(false), "No");
    assert.equal(formatAuditValue(7), "7");
  });

  it("leaves plain strings and bare dates alone", () => {
    assert.equal(formatAuditValue("active"), "active");
    assert.equal(formatAuditValue("2027-03-15"), "2027-03-15");
  });

  it("formats ISO instants instead of printing them raw", () => {
    const out = formatAuditValue("2026-09-13T10:00:00.000Z");
    assert.notEqual(out, "2026-09-13T10:00:00.000Z");
    assert.match(out, /2026/);
  });

  it("never prints JSON braces for arrays or objects", () => {
    assert.equal(formatAuditValue(["a", "b"]), "a, b");
    assert.equal(formatAuditValue([]), "—");
    const nested = formatAuditValue({ planName: "30 Day Plan", isComped: false });
    assert.equal(nested, "Plan name: 30 Day Plan; Is comped: No");
    assert.doesNotMatch(nested, /[{}]/);
  });
});

describe("auditChangeRows", () => {
  it("pairs before and after by key and flags changes", () => {
    const rows = auditChangeRows(
      { isActive: true, name: "Probe Co" },
      { isActive: false, name: "Probe Co" },
    );
    assert.deepEqual(
      rows.map((r) => [r.label, r.before, r.after, r.changed]),
      [
        ["Is active", "Yes", "No", true],
        ["Name", "Probe Co", "Probe Co", false],
      ],
    );
  });

  it("shows a dash for the missing side of a creation or deletion", () => {
    const created = auditChangeRows(null, { status: "trialing" });
    assert.deepEqual(created[0], {
      key: "status",
      label: "Status",
      before: "—",
      after: "trialing",
      changed: true,
    });
    const deleted = auditChangeRows({ status: "trialing" }, null);
    assert.equal(deleted[0]!.after, "—");
  });

  it("includes keys that only exist after, in order of first appearance", () => {
    const rows = auditChangeRows({ a: 1 }, { a: 1, b: 2 });
    assert.deepEqual(rows.map((r) => r.key), ["a", "b"]);
  });

  it("flattens one level of nesting into readable labels", () => {
    const rows = auditChangeRows({ plan: { name: "A" } }, { plan: { name: "B" } });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.label, "Plan › Name");
    assert.equal(rows[0]!.before, "A");
    assert.equal(rows[0]!.after, "B");
  });

  it("wraps a non-object snapshot instead of dropping it", () => {
    const rows = auditChangeRows("old", "new");
    assert.deepEqual(rows.map((r) => [r.label, r.before, r.after]), [["Value", "old", "new"]]);
  });

  it("returns nothing when both sides are empty", () => {
    assert.deepEqual(auditChangeRows(null, null), []);
    assert.equal(hasAuditDetails({ before: null, after: null }), false);
    assert.equal(hasAuditDetails({ before: null, after: { a: 1 } }), true);
  });
});
