import api from "@/lib/api";
import type {
  AuthUser,
  AuthTokens,
  Company,
  BusinessType,
  LoginFormData,
  RegistrationFormData,
  PasswordChangePayload,
} from "@/types";

interface LoginResponse {
  user: AuthUser;
  companyId?: string;
  companyIsActive?: boolean;
  tokens: AuthTokens;
}

// Registration now auto-logs the user in (issues a session) so the subscription
// payment can begin immediately in the same flow. The company is still created
// in the pending state (companyIsActive=false) until payment is captured.
interface RegisterCompanyResponse {
  user: AuthUser;
  company: Company;
  companyId?: string;
  companyIsActive?: boolean;
  tokens: AuthTokens;
}

export const authService = {
  // POST /api/auth/register/company
  // Creates the company (pending) and returns a session (tokens) so the caller
  // can immediately start the subscription payment.
  registerCompany: async (
    payload: Omit<RegistrationFormData, "businessType"> & { businessType: BusinessType }
  ) => {
    const { data } = await api.post<{ data: RegisterCompanyResponse; message: string }>(
      "/auth/register/company",
      payload
    );
    return { ...data.data, message: data.message };
  },

  // POST /api/auth/login
  login: async (credentials: LoginFormData) => {
    const { data } = await api.post<{ data: LoginResponse }>("/auth/login", credentials);
    return data.data;
  },

  // POST /api/auth/logout
  logout: async (refreshToken: string) => {
    await api.post("/auth/logout", { refreshToken });
  },

  // POST /api/auth/refresh
  refresh: async (refreshToken: string) => {
    const { data } = await api.post<{ data: LoginResponse }>("/auth/refresh", { refreshToken });
    return data.data;
  },

  // POST /api/auth/password-reset/request
  requestPasswordReset: async (email: string) => {
    await api.post("/auth/password-reset/request", { email });
  },

  // POST /api/auth/password-reset/confirm
  confirmPasswordReset: async (payload: {
    token: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => {
    await api.post("/auth/password-reset/confirm", payload);
  },

  // POST /api/auth/password-change (authenticated, company OR super_admin)
  // Side effect: server revokes ALL refresh tokens — caller MUST clear
  // local tokens and redirect to /login on success.
  changePassword: async (payload: PasswordChangePayload) => {
    await api.post("/auth/password-change", payload);
  },
};
