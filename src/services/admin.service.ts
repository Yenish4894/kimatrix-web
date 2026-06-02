import api from "@/lib/api";
import type { AdminStats, Company, PaginatedResponse } from "@/types";

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
};
