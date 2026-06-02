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

// Registration no longer returns tokens — company is created in pending state
// and login is blocked until super admin activates it.
interface RegisterCompanyResponse {
  user: AuthUser;
  company: Company;
}

export const authService = {
  // POST /api/auth/register/company
  // Creates the company in PENDING state. No tokens issued.
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
