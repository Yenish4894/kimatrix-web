import api from "@/lib/api";
import type {
  CompanyProfile,
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
    const { data } = await api.get<{ data: CompanyProfile }>("/company/profile");
    return data.data;
  },

  // PUT /api/company/profile — partial update of editable fields
  updateProfile: async (payload: UpdateCompanyProfilePayload) => {
    const { data } = await api.put<{ data: CompanyProfile }>("/company/profile", payload);
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


  // GET /api/company/reports/monthly?year=&month=
  //
  // Aggregated server-side. Takes year+month as numbers rather than an ISO date range
  // on purpose: the previous code built `new Date(year, month, 1)` in LOCAL time and
  // then called .toISOString(), so in any timezone behind UTC the "1st of the month"
  // became the last day of the previous month and the report silently covered the
  // wrong window.
  getMonthlyReport: async (year: number, month: number) => {
    const { data } = await api.get<{ data: MonthlyReport }>("/company/reports/monthly", {
      params: { year, month },
    });
    return data.data;
  },
}

export interface MonthlyReport {
  from: string;
  to: string;
  totals: {
    purchaseCount: number;
    /** String, not number: numeric(14,2) through a JS float loses cents. */
    totalAmount: string;
    uniqueCustomers: number;
  };
  topCustomers: {
    customerId: string;
    fullName: string;
    mobile: string;
    vehicleNumber: string | null;
    totalSpend: string;
    purchaseCount: number;
    lastActivity: string;
  }[];
}
