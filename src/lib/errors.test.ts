import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveRetryAfterSeconds } from "./errors";

describe("resolveRetryAfterSeconds", () => {
  const cooldown =
    "You've already submitted a receipt at this business recently. Please wait about 14 more minutes before submitting another one.";

  it("prefers the body field, which CORS cannot hide", () => {
    assert.equal(resolveRetryAfterSeconds(832, 60, cooldown), 832);
  });

  it("falls back to the header", () => {
    assert.equal(resolveRetryAfterSeconds(undefined, 45, "Too many requests"), 45);
  });

  it("falls back to the minutes in the cooldown copy, so the button matches the sentence", () => {
    assert.equal(resolveRetryAfterSeconds(undefined, undefined, cooldown), 14 * 60);
    assert.equal(resolveRetryAfterSeconds(undefined, undefined, "Please wait about 1 more minute."), 60);
  });

  it("ignores junk and knows nothing otherwise", () => {
    assert.equal(resolveRetryAfterSeconds("soon", Number.NaN, "Too many requests"), undefined);
    assert.equal(resolveRetryAfterSeconds(0, undefined, "x"), undefined);
  });
});
