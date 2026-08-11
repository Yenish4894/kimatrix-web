import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAdminToggleAction,
  getCompanyStatus,
  STATUS_BADGE_VARIANT,
  STATUS_LABEL,
  TOGGLE_LABEL,
} from "./company-status";

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

describe("getAdminToggleAction", () => {
  it("offers to lift the ban only on a company that is actually banned", () => {
    assert.equal(
      getAdminToggleAction({ deactivatedAt: "2026-08-01T00:00:00Z" }),
      "activate",
    );
  });

  it("does not offer Activate to an expired company", () => {
    // The reported bug. An expired or trial-expired company is inactive but was never
    // banned, so it reads as "pending" — and the old menu offered Activate, which the
    // API can only refuse with "This company is not deactivated."
    assert.equal(getAdminToggleAction({ deactivatedAt: null }), "deactivate");
  });

  it("offers Deactivate on a healthy active company", () => {
    assert.equal(getAdminToggleAction({ deactivatedAt: null }), "deactivate");
  });

  it("every action has a label", () => {
    for (const a of ["activate", "deactivate"] as const) {
      assert.ok(TOGGLE_LABEL[a], `${a} needs a label`);
    }
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
