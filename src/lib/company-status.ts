import type { Company, CompanyStatus } from "@/types";

// Derive the three-state status from `isActive` + `deactivatedAt` per BE spec:
//   Pending       → isActive=false, deactivatedAt=null   (registered, not yet subscribed via PayPal)
//   Active        → isActive=true                        (subscribed and operational)
//   Deactivated   → isActive=false, deactivatedAt!=null  (admin-disabled after prior activation)
export function getCompanyStatus(company: Pick<Company, "isActive" | "deactivatedAt">): CompanyStatus {
  if (company.isActive) return "active";
  if (company.deactivatedAt) return "deactivated";
  return "pending";
}

/**
 * Which admin toggle a company should be offered.
 *
 * The two admin endpoints are a ban and the lifting of that ban — nothing else.
 * `activateCompany` only clears `deactivatedAt`; it cannot grant access to a company
 * that simply hasn't paid, and the API rejects it outright with "This company is not
 * deactivated."
 *
 * The menu used to derive this from the status badge — anything not "active" was
 * offered "Activate". But an expired or trial-expired company reads as *pending*
 * (inactive, never banned), so the admin was shown a button that could only ever
 * fail. That is what "it says the company should be deactivated first" was.
 *
 * So the choice hangs on one thing: is this company banned right now?
 */
export function getAdminToggleAction(
  company: Pick<Company, "deactivatedAt">,
): "activate" | "deactivate" {
  return company.deactivatedAt ? "activate" : "deactivate";
}

/** Says what the action does, rather than naming an internal flag. */
export const TOGGLE_LABEL: Record<"activate" | "deactivate", string> = {
  activate: "Lift ban",
  deactivate: "Deactivate",
};

export const STATUS_LABEL: Record<CompanyStatus, string> = {
  pending: "Pending",
  active: "Active",
  deactivated: "Deactivated",
};

export const STATUS_BADGE_VARIANT: Record<CompanyStatus, "warning" | "success" | "error"> = {
  pending: "warning",
  active: "success",
  deactivated: "error",
};
