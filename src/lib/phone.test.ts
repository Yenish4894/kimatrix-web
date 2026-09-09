import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toE164, toLocalDigits } from "@/lib/phone";

const SA = "27";
const IN = "91";

describe("toLocalDigits", () => {
  it("keeps a plain local number unchanged", () => {
    assert.equal(toLocalDigits("821234567", SA), "821234567");
  });

  it("drops the national trunk zero", () => {
    // How South Africans actually write it. Keeping the 0 produced +270821234567,
    // which is not dialable — one company and three customers are stored that way.
    assert.equal(toLocalDigits("0821234567", SA), "821234567");
    assert.equal(toE164("082 123 4567", SA), "+27821234567");
  });

  it("accepts a pasted international number", () => {
    // Previously became +2727821234567 and was rejected as invalid.
    assert.equal(toE164("+27821234567", SA), "+27821234567");
    assert.equal(toE164("+27 82 123 4567", SA), "+27821234567");
  });

  it("repairs an already-broken number that kept its trunk zero", () => {
    assert.equal(toE164("+270821234567", SA), "+27821234567");
  });

  it("does NOT strip a dial code that is really part of the number", () => {
    // The reason this keys off "+" rather than a prefix match. 9155512345 is a real
    // Indian mobile; treating the leading 91 as a country code would mangle it.
    assert.equal(toLocalDigits("9155512345", IN), "9155512345");
    assert.equal(toE164("9155512345", IN), "+919155512345");
  });

  it("still strips the dial code when the user was explicit about it", () => {
    assert.equal(toE164("+919155512345", IN), "+919155512345");
  });

  it("discards punctuation and spacing", () => {
    assert.equal(toLocalDigits("(082) 123-4567", SA), "821234567");
  });

  it("returns nothing usable for empty or junk input", () => {
    assert.equal(toE164("", SA), "");
    assert.equal(toE164("abc", SA), "");
    assert.equal(toE164("082", null), "");
  });

  it("extracts digits when no country is selected yet", () => {
    assert.equal(toLocalDigits("+27 82 123 4567", null), "27821234567");
  });
});
