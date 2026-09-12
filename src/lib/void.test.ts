import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { VOID_REASON_MAX, VOID_REASON_MIN, isVoided, validateVoidReason } from "./void";

describe("validateVoidReason", () => {
  it("requires a reason", () => {
    assert.match(validateVoidReason("") ?? "", /enter a reason/i);
    assert.match(validateVoidReason("   ") ?? "", /enter a reason/i);
  });

  it("measures the trimmed text against the minimum", () => {
    assert.match(validateVoidReason("ab") ?? "", /at least 3/);
    assert.match(validateVoidReason("  ab  ") ?? "", /at least 3/);
    assert.equal(validateVoidReason("a".repeat(VOID_REASON_MIN)), null);
  });

  it("accepts exactly the maximum and rejects one more", () => {
    assert.equal(validateVoidReason("a".repeat(VOID_REASON_MAX)), null);
    assert.match(validateVoidReason("a".repeat(VOID_REASON_MAX + 1)) ?? "", /500 characters or fewer/);
  });

  it("does not count surrounding whitespace toward the maximum", () => {
    assert.equal(validateVoidReason(`  ${"a".repeat(VOID_REASON_MAX)}  `), null);
  });
});

describe("isVoided", () => {
  it("reads voidedAt and tolerates an older backend", () => {
    assert.equal(isVoided({ voidedAt: "2026-09-13T10:00:00Z" }), true);
    assert.equal(isVoided({ voidedAt: null }), false);
    assert.equal(isVoided({}), false);
    assert.equal(isVoided(undefined), false);
  });
});
