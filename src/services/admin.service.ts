import api from "@/lib/api";
import type { AdminPlan, AdminStats, Company, PaginatedResponse, PlatformSettings } from "@/types";

interface AdminCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "active" | "inactive";
  businessType?: "all" | "fuel_station" | "shop";
}

export const adminService = {
  // GET /api/admin/stats
  getStats: async () => {
    const { data } = await api.get<{ data: AdminStats }>("/admin/stats");
    return data.data;
  },

  // GET /api/admin/companies
  getCompanies: async (params: AdminCompaniesParams = {}) => {
    const { data } = await api.get<{ data: PaginatedResponse<Company> }>(
      "/admin/companies",
      { params }
    );
    return data.data;
  },

  // GET /api/admin/companies/:id
  getCompany: async (companyId: string) => {
    const { data } = await api.get<{ data: Company }>(`/admin/companies/${companyId}`);
    return data.data;
  },

  // PATCH /api/admin/companies/:id/deactivate
  deactivateCompany: async (companyId: string) => {
    await api.patch(`/admin/companies/${companyId}/deactivate`);
  },

  // PATCH /api/admin/companies/:id/activate
  activateCompany: async (companyId: string) => {
    await api.patch(`/admin/companies/${companyId}/activate`);
  },

  // ─── Subscription / trial administration ─────────────────────

  // POST /api/admin/companies/:id/trial/extend
  // Stacks onto any remaining trial time rather than replacing it.
  extendTrial: async (companyId: string, days: number) => {
    const { data } = await api.post<{ data: { trialEndsAt: string; status: string } }>(
      `/admin/companies/${companyId}/trial/extend`,
      { days },
    );
    return data.data;
  },

  // PATCH /api/admin/companies/:id/comp
  // `reason` is REQUIRED when granting — the API rejects a grant without one.
  // `compedUntil: null` means perpetual.
  setComp: async (
    companyId: string,
    payload: { isComped: boolean; reason?: string; compedUntil?: string | null },
  ) => {
    const { data } = await api.patch<{ data: { status: string; hasAccess: boolean } }>(
      `/admin/companies/${companyId}/comp`,
      payload,
    );
    return data.data;
  },

  // GET /api/admin/companies/:id/trial-identities
  getTrialIdentities: async (companyId: string) => {
    const { data } = await api.get<{ data: AdminTrialIdentity[] }>(
      `/admin/companies/${companyId}/trial-identities`,
    );
    return data.data;
  },

  // POST /api/admin/trial-identities/:id/release
  releaseTrialIdentity: async (identityId: string, reason: string) => {
    await api.post(`/admin/trial-identities/${identityId}/release`, { reason });
  },

  // ─── Account deletion on a customer's behalf ─────────────────
  //
  // The privacy policy tells customers to request deletion by emailing support, so the
  // person who reads that mailbox needs a way to carry it out. The customer-facing
  // endpoints require the customer to be logged in, which the emailing customer is not.

  getDeletionStatus: async (companyId: string) => {
    const { data } = await api.get<{ data: AdminDeletionStatus }>(
      `/admin/companies/${companyId}/deletion-request`,
    );
    return data.data;
  },

  requestDeletion: async (companyId: string, reason: string) => {
    const { data } = await api.post<{ data: AdminDeletionStatus }>(
      `/admin/companies/${companyId}/deletion-request`,
      { reason },
    );
    return data.data;
  },

  cancelDeletion: async (companyId: string, reason: string) => {
    // DELETE with a body — the reason is required, and it belongs in the audit row.
    await api.delete(`/admin/companies/${companyId}/deletion-request`, { data: { reason } });
  },

  // ─── Plans ───────────────────────────────────────────────────

  // GET /api/admin/plans — includes disabled and archived plans
  getPlans: async () => {
    const { data } = await api.get<{ data: AdminPlan[] }>("/admin/plans");
    return data.data;
  },

  // POST /api/admin/plans
  createPlan: async (payload: PlanFormPayload) => {
    const { data } = await api.post<{ data: AdminPlan; message: string }>("/admin/plans", payload);
    return data;
  },

  // PATCH /api/admin/plans/:id
  // If price or duration changed on a plan that already has billing history, the
  // server archives it and returns a NEW plan with a different id.
  updatePlan: async (planId: string, payload: Partial<PlanFormPayload>) => {
    const { data } = await api.patch<{ data: AdminPlan; message: string }>(
      `/admin/plans/${planId}`,
      payload,
    );
    return data;
  },

  // PATCH /api/admin/plans/:id/availability
  setPlanActive: async (planId: string, isActive: boolean) => {
    const { data } = await api.patch<{ data: AdminPlan; message: string }>(
      `/admin/plans/${planId}/availability`,
      { isActive },
    );
    return data;
  },

  // ─── Platform settings ───────────────────────────────────────

  getSettings: async () => {
    const { data } = await api.get<{ data: PlatformSettings }>("/admin/settings");
    return data.data;
  },

  updateSettings: async (payload: Partial<PlatformSettings>) => {
    const { data } = await api.patch<{ data: PlatformSettings; message: string }>(
      "/admin/settings",
      payload,
    );
    return data;
  },
};

export interface PlanFormPayload {
  name: string;
  description?: string | null;
  durationDays: number;
  price: string;
  isPopular?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * A burned trial identifier, as the admin screen sees it.
 *
 * `preview` is a masked form (`j••••h@gmail.com`). The server never returns the real
 * value — it only stores an HMAC, which is not reversible — and the preview is what
 * support actually needs to confirm they have the right record.
 */
export interface AdminTrialIdentity {
  id: string;
  type: "email" | "phone";
  preview: string;
  claimedAt: string;
  releasedAt: string | null;
  releaseReason: string | null;
}

export interface AdminDeletionStatus {
  requested: boolean;
  requestedAt: string | null;
  /** When the data is actually erased. Null when nothing is pending. */
  purgeAt: string | null;
  daysRemaining: number | null;
}
