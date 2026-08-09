import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCompanyStatus, STATUS_LABEL, STATUS_BADGE_VARIANT } from "./company-status";

describe("getCompanyStatus", () => {
  it("active when the company is switched on", () => {
    assert.equal(getCompanyStatus({ isActive: true, deactivatedAt: null }), "active");
  });

  it("deactivated needs BOTH inactive and a deactivation stamp", () => {
    assert.equal(
      getCompanyStatus({ isActive: false, deactivatedAt: "2026-08-01T00:00:00Z" }),
      "deactivated",
    );
  });

  it("pending when inactive with no deactivation stamp", () => {
    // This is the distinction that matters: once `isActive` came to mean "currently
    // entitled", an EXPIRED company is also inactive — but it was never banned, so it
    // must not read as deactivated.
    assert.equal(getCompanyStatus({ isActive: false, deactivatedAt: null }), "pending");
  });

  it("isActive wins even if a stale deactivation stamp is present", () => {
    assert.equal(
      getCompanyStatus({ isActive: true, deactivatedAt: "2026-01-01T00:00:00Z" }),
      "active",
    );
  });
});

describe("status presentation", () => {
  it("every status has a label and a badge variant", () => {
    for (const s of ["pending", "active", "deactivated"] as const) {
      assert.ok(STATUS_LABEL[s], `${s} needs a label`);
      assert.ok(STATUS_BADGE_VARIANT[s], `${s} needs a badge variant`);
    }
  });
});
