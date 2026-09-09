import api from "@/lib/api";
import type { AdminPlan, AdminStats, BulkEmailLog, Company, CreateCompanyPayload, CreateCompanyResult, PaginatedResponse, PlatformSettings } from "@/types";

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

  // POST /api/admin/companies — onboard a company on someone's behalf.
  // No password is sent: the owner sets their own from an emailed invite link.
  createCompany: async (payload: CreateCompanyPayload) => {
    const { data } = await api.post<{ data: CreateCompanyResult }>("/admin/companies", payload);
    return data.data;
  },

  // PATCH /api/admin/companies/:id/deactivate
  // The reason is required by the API, stored on the company, and written to the
  // admin audit log. A ban used to record nothing but a timestamp and an actor id -
  // and lifting it erased the actor id too - so establishing why one had happened
  // meant reading three days of server logs.
  deactivateCompany: async (companyId: string, reason: string) => {
    await api.patch(`/admin/companies/${companyId}/deactivate`, { reason });
  },

  // PATCH /api/admin/companies/:id/activate
  activateCompany: async (companyId: string) => {
    await api.patch(`/admin/companies/${companyId}/activate`);
  },

  // ─── Subscription / trial administration ─────────────────────

  // POST /api/admin/companies/:id/trial/extend
  // Stacks onto any remaining trial time rather than replacing it.
  extendTrial: async (companyId: string, days: number) => {
    const { data } = await api.post<{
      data: { trialEndsAt: string; status: string; ownerEmailVerified?: boolean };
    }>(
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

  // ─── Bulk email ───────────────────────────────────────────────

  // POST /api/admin/bulk-email
  sendBulkEmail: async (payload: {
    subject: string;
    body: string;
    companyIds: string[];
    /** Addresses typed in by hand, belonging to no registered company. */
    extraEmails?: string[];
    /** Optional single attachment, 10 MB cap enforced on both sides. */
    attachment?: File | null;
    onUploadProgress?: (percent: number) => void;
  }) => {
    // Always multipart, attachment or not, so there is one request shape rather than
    // two paths that can drift apart. The arrays go as JSON strings because a form
    // field cannot carry an array; the server parses them back.
    const form = new FormData();
    form.append("subject", payload.subject);
    form.append("body", payload.body);
    form.append("companyIds", JSON.stringify(payload.companyIds));
    form.append("extraEmails", JSON.stringify(payload.extraEmails ?? []));
    if (payload.attachment) form.append("file", payload.attachment);

    const { data } = await api.post<{ data: { recipientCount: number; logId: string }; message: string }>(
      "/admin/bulk-email",
      form,
      {
        // Content-Type is deliberately unset: the browser has to add the multipart
        // boundary itself, and setting it by hand produces a body the server cannot parse.
        onUploadProgress: (e) => {
          if (!payload.onUploadProgress || !e.total) return;
          payload.onUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      },
    );
    return data;
  },

  // GET /api/admin/bulk-email/logs
  getBulkEmailLogs: async (page = 1, limit = 10) => {
    const { data } = await api.get<{ data: PaginatedResponse<BulkEmailLog> }>(
      "/admin/bulk-email/logs",
      { params: { page, limit } },
    );
    return data.data;
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
