import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { maskMobile } from "./mask-mobile";

describe("maskMobile", () => {
  it("keeps only the last 4 digits of a normal number", () => {
    assert.equal(maskMobile("0825554567"), "••••4567");
    assert.equal(maskMobile("9876544567"), "••••4567");
  });

  it("ignores spaces, dashes, brackets and a + prefix", () => {
    assert.equal(maskMobile("+27 82 555 4567"), "••••4567");
    assert.equal(maskMobile("+91-98765-44567"), "••••4567");
    assert.equal(maskMobile("(082) 555-4567"), "••••4567");
    assert.equal(maskMobile("  +27825554567  "), "••••4567");
  });

  it("never reveals more than half of a short number", () => {
    assert.equal(maskMobile("12345"), "••••45");
    assert.equal(maskMobile("1234"), "••••34");
    assert.equal(maskMobile("123"), "••••3");
    assert.equal(maskMobile("12"), "••••2");
    assert.equal(maskMobile("1"), "••••");
  });

  it("returns an empty string when there are no digits", () => {
    assert.equal(maskMobile(""), "");
    assert.equal(maskMobile("   "), "");
    assert.equal(maskMobile("+"), "");
    assert.equal(maskMobile(null), "");
    assert.equal(maskMobile(undefined), "");
  });

  it("never contains the full number", () => {
    for (const n of ["+27825554567", "9876543210", "4567", "12"]) {
      const digits = n.replace(/\D/g, "");
      assert.ok(!maskMobile(n).includes(digits), `${n} leaked`);
    }
  });
});
