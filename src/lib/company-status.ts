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
