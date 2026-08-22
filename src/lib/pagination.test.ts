import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PAGE_SIZE, formatPageRange } from "./pagination";

const COMPANY = { one: "company", many: "companies" };

describe("PAGE_SIZE", () => {
  it("matches what the API will accept", () => {
    // The API defaults to 10 and caps at 100. The client used to send 20, overriding
    // a sensible server default with a worse one.
    assert.equal(PAGE_SIZE, 10);
    assert.ok(PAGE_SIZE <= 100);
  });
});

describe("formatPageRange", () => {
  it("describes a middle page", () => {
    assert.equal(formatPageRange(2, 10, 34, COMPANY), "Showing 11–20 of 34 companies");
  });

  it("stops at the total on a partial last page", () => {
    // The real case: 11 companies, page 2 holds exactly one.
    assert.equal(formatPageRange(2, 10, 11, COMPANY), "Showing 11–11 of 11 companies");
  });

  it("says 'all' when one page holds everything", () => {
    // A range is noise when there is nothing to page through.
    assert.equal(formatPageRange(1, 10, 7, COMPANY), "Showing all 7 companies");
  });

  it("singularises a lone item", () => {
    assert.equal(formatPageRange(1, 10, 1, COMPANY), "Showing all 1 company");
  });

  it("renders nothing when there is nothing to show", () => {
    // Better than "Showing 0–0 of 0" under an empty table that already says so.
    assert.equal(formatPageRange(1, 10, 0, COMPANY), null);
  });

  it("clamps a stale page instead of inventing rows", () => {
    // Filtering down to 11 results while sitting on page 3 would otherwise read
    // "Showing 21–30 of 11".
    assert.equal(formatPageRange(3, 10, 11, COMPANY), "Showing 11 of 11 companies");
  });

  it("defaults the noun rather than forcing every caller to pass one", () => {
    assert.equal(formatPageRange(1, 10, 3), "Showing all 3 items");
  });
});
