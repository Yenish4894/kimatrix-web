import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { safeReturnPath, returnPathFor, loginUrlWithReturn } from "./return-url";

describe("safeReturnPath", () => {
  it("keeps plain relative paths with query and hash", () => {
    assert.equal(safeReturnPath("/company/customers?page=2#top"), "/company/customers?page=2#top");
  });

  for (const bad of [
    "https://evil.example/x",
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "javascript:alert(1)",
    "company/dashboard",
    "",
    null,
    undefined,
    "/login",
    "/login?next=/company",
    "/reset-password?token=x",
  ]) {
    it(`rejects ${JSON.stringify(bad)}`, () => assert.equal(safeReturnPath(bad), null));
  }
});

describe("returnPathFor", () => {
  it("honours a path inside the user's own area", () => {
    assert.equal(returnPathFor("/company/purchases?from=2026-09-01", "company"), "/company/purchases?from=2026-09-01");
    assert.equal(returnPathFor("/admin/companies/abc", "super_admin"), "/admin/companies/abc");
  });

  it("falls back to the dashboard for another role's area or junk", () => {
    assert.equal(returnPathFor("/admin/companies", "company"), "/company/dashboard");
    assert.equal(returnPathFor("/companyx", "company"), "/company/dashboard");
    assert.equal(returnPathFor("//evil.example", "super_admin"), "/admin/dashboard");
    assert.equal(returnPathFor(null, "company"), "/company/dashboard");
  });
});

describe("loginUrlWithReturn", () => {
  it("encodes the return path", () => {
    assert.equal(loginUrlWithReturn("/company/customers?page=2"), "/login?next=%2Fcompany%2Fcustomers%3Fpage%3D2");
  });
  it("drops an unsafe path", () => assert.equal(loginUrlWithReturn("//evil"), "/login"));
});
