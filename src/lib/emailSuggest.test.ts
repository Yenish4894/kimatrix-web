import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { editDistance, suggestEmail, suggestionFromMessage } from "@/lib/emailSuggest";

describe("suggestEmail — known typos", () => {
  const cases: Array<[string, string]> = [
    // The address that got the mailbox suspended.
    ["isorathiya21@gmai.com", "isorathiya21@gmail.com"],
    ["a@gmial.com", "a@gmail.com"],
    ["a@gamil.com", "a@gmail.com"],
    ["a@gmail.co", "a@gmail.com"],
    ["a@gmail.con", "a@gmail.com"],
    ["a@gmaill.com", "a@gmail.com"],
    ["a@hotmial.com", "a@hotmail.com"],
    ["a@yaho.com", "a@yahoo.com"],
    ["a@outlok.com", "a@outlook.com"],
    ["a@iclod.com", "a@icloud.com"],
    ["a@redifmail.com", "a@rediffmail.com"],
    ["a@rediffmal.com", "a@rediffmail.com"],
    ["a@rediffmial.com", "a@rediffmail.com"],
    ["a@rediffmail.con", "a@rediffmail.com"],
    ["a@rediffmail.co", "a@rediffmail.com"],
  ];
  for (const [input, expected] of cases) {
    it(`${input} → ${expected}`, () => assert.equal(suggestEmail(input), expected));
  }
});

describe("suggestEmail — edit distance", () => {
  const cases: Array<[string, string]> = [
    ["a@gmaik.com", "a@gmail.com"],
    ["a@gmail.cim", "a@gmail.com"],
    ["a@yahho.com", "a@yahoo.com"],
    ["a@outlook.cm", "a@outlook.com"],
    ["a@otlook.com", "a@outlook.com"],
    ["a@hotmaul.com", "a@hotmail.com"],
    ["a@icluod.com", "a@icloud.com"],
    ["a@live.cmo", "a@live.com"],
    ["a@live.co", "a@live.com"],
    ["a@rediffmaill.com", "a@rediffmail.com"],
  ];
  for (const [input, expected] of cases) {
    it(`${input} → ${expected}`, () => assert.equal(suggestEmail(input), expected));
  }
});

describe("suggestEmail — stays quiet", () => {
  const correct = [
    "a@gmail.com",
    "a@yahoo.com",
    "a@outlook.com",
    "a@hotmail.com",
    "a@live.com",
    "a@icloud.com",
    "a@rediffmail.com",
  ];
  for (const input of correct) {
    it(`already correct: ${input}`, () => assert.equal(suggestEmail(input), null));
  }

  const legitimateNeighbours = [
    "a@mail.com",
    "a@email.com",
    "a@ymail.com",
    "a@googlemail.com",
    "a@gmx.com",
    "a@me.com",
    "a@yahoo.co.in",
    "a@yahoo.co.za",
    "a@hotmail.co.za",
    "a@outlook.in",
    "a@live.co.za",
    "a@rediff.com",
  ];
  for (const input of legitimateNeighbours) {
    it(`real provider: ${input}`, () => assert.equal(suggestEmail(input), null));
  }

  const companyDomains = [
    "owner@sahelfuel.co.za",
    "info@kimates.com",
    "accounts@techeniac.com",
    "sales@shell.co.za",
    "manager@reliancepetro.in",
    "a@gail.co.in",
    "a@lime.com",
    "a@love.com",
    "a@livr.com",
    "a@gmx.de",
  ];
  for (const input of companyDomains) {
    it(`company domain: ${input}`, () => assert.equal(suggestEmail(input), null));
  }

  it("rejects malformed input", () => {
    for (const input of ["", "   ", "no-at-sign", "@gmai.com", "a@", "a b@gmai.com", "a@@gmai.com"]) {
      assert.equal(suggestEmail(input), null, input);
    }
  });

  it("ignores a dotless domain that is not a known typo", () => {
    assert.equal(suggestEmail("a@localhost"), null);
  });
});

describe("suggestEmail — formatting", () => {
  it("preserves the local part exactly", () => {
    assert.equal(suggestEmail("Isorathiya.21+shop@gmai.com"), "Isorathiya.21+shop@gmail.com");
  });
  it("is case-insensitive on the domain", () => {
    assert.equal(suggestEmail("a@GMAI.COM"), "a@gmail.com");
    assert.equal(suggestEmail("a@Gmail.Com"), null);
  });
  it("trims surrounding whitespace", () => {
    assert.equal(suggestEmail("  a@gmai.com  "), "a@gmail.com");
  });
  it("tolerates a trailing dot", () => {
    assert.equal(suggestEmail("a@gmai.com."), "a@gmail.com");
  });
});

describe("editDistance", () => {
  it("counts an adjacent transposition as one edit", () => {
    assert.equal(editDistance("gmial", "gmail"), 1);
  });
  it("handles insertions, deletions and substitutions", () => {
    assert.equal(editDistance("", "abc"), 3);
    assert.equal(editDistance("kitten", "sitting"), 3);
    assert.equal(editDistance("same", "same"), 0);
  });
});

describe("suggestionFromMessage", () => {
  it("extracts the address from a server message", () => {
    assert.equal(
      suggestionFromMessage("This email domain looks mistyped. Did you mean name@gmail.com?"),
      "name@gmail.com"
    );
  });
  it("handles quotes and odd spacing", () => {
    assert.equal(suggestionFromMessage('Did you mean "a.b@yahoo.com" ?'), "a.b@yahoo.com");
  });
  it("returns null when there is no suggestion", () => {
    assert.equal(suggestionFromMessage("Enter a valid email address"), null);
    assert.equal(suggestionFromMessage(undefined), null);
    assert.equal(suggestionFromMessage(""), null);
  });
});
