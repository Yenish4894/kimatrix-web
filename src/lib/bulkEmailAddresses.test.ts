import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidEmailAddress, parseExtraEmails } from "./bulkEmailAddresses";

describe("parseExtraEmails", () => {
  it("splits on commas, semicolons, spaces and newlines, lower-cases and de-duplicates", () => {
    assert.deepEqual(parseExtraEmails("A@x.com, b@y.co.za;\nc@z.in  a@X.com"), [
      "a@x.com",
      "b@y.co.za",
      "c@z.in",
    ]);
  });

  it("unwraps addresses pasted from a mail client and drops the names", () => {
    assert.deepEqual(parseExtraEmails('John Smith <john@x.com>, "Ann" <ann@y.com>'), [
      "john@x.com",
      "ann@y.com",
    ]);
  });

  it("drops a trailing full stop or quote", () => {
    assert.deepEqual(parseExtraEmails("send to sales@kimates.com. and 'ops@kimates.com'"), [
      "sales@kimates.com",
      "ops@kimates.com",
    ]);
  });

  it("returns nothing for an empty box", () => {
    assert.deepEqual(parseExtraEmails("  \n "), []);
  });
});

describe("isValidEmailAddress", () => {
  it("accepts ordinary addresses", () => {
    for (const a of ["a@x.com", "first.last+tag@sub.example.co.za", "x_y-z@my-shop.in"]) {
      assert.equal(isValidEmailAddress(a), true, a);
    }
  });

  it("rejects what the server rejects but the old check let through", () => {
    for (const a of ["x@gmail.com.", "x..y@gmail.com", ".x@gmail.com", "x.@gmail.com", "x@-gmail.com", "x@gmail", "x@gmail..com"]) {
      assert.equal(isValidEmailAddress(a), false, a);
    }
  });
});
