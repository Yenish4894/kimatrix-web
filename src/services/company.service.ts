import api from "@/lib/api";
import type {
  Company,
  Customer,
  Purchase,
  CompanyStats,
  PaginatedResponse,
  UpdateCompanyProfilePayload,
} from "@/types";

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

interface PurchaseListParams extends ListParams {
  customerId?: string;
  from?: string;
  to?: string;
}

export const companyService = {
  // GET /api/company/profile
  getProfile: async () => {
    const { data } = await api.get<{ data: Company }>("/company/profile");
    return data.data;
  },

  // PUT /api/company/profile — partial update of editable fields
  updateProfile: async (payload: UpdateCompanyProfilePayload) => {
    const { data } = await api.put<{ data: Company }>("/company/profile", payload);
    return data.data;
  },

  // GET /api/company/stats
  getStats: async () => {
    const { data } = await api.get<{ data: CompanyStats }>("/company/stats");
    return data.data;
  },

  // GET /api/company/customers
  getCustomers: async (params: ListParams = {}) => {
    const { data } = await api.get<{ data: PaginatedResponse<Customer> }>(
      "/company/customers",
      { params }
    );
    return data.data;
  },

  // GET /api/company/customers/:id
  getCustomer: async (customerId: string) => {
    const { data } = await api.get<{ data: Customer }>(`/company/customers/${customerId}`);
    return data.data;
  },

  // GET /api/company/customers/export — CSV blob
  exportCustomers: async () => {
    const res = await api.get("/company/customers/export", { responseType: "blob" });
    return res.data as Blob;
  },

  // GET /api/company/purchases
  getPurchases: async (params: PurchaseListParams = {}) => {
    const { data } = await api.get<{ data: PaginatedResponse<Purchase> }>(
      "/company/purchases",
      { params }
    );
    return data.data;
  },

  // GET /api/company/purchases/:id
  getPurchase: async (purchaseId: string) => {
    const { data } = await api.get<{ data: Purchase }>(`/company/purchases/${purchaseId}`);
    return data.data;
  },

  // GET /api/company/purchases/export — CSV blob
  exportPurchases: async () => {
    const res = await api.get("/company/purchases/export", { responseType: "blob" });
    return res.data as Blob;
  },
};
